// Motor 3D do ArchRay: roda no computador do Estúdio, pega as capturas da fila, processa com o
// OpenDroneMap e devolve modelo 3D e nuvem de pontos à plataforma.  Uso: npm run motor
//   MOTOR_UMA_VEZ=1   processa o que houver na fila e encerra (para testes)
import { spawn, spawnSync } from "node:child_process";
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { neon } from "@neondatabase/serverless";
import { put as blobPut } from "@vercel/blob";
import { AwsClient } from "aws4fetch";
import sharp from "sharp";
import { loadEnv } from "./treino-comum.mjs";
import { detectMarkers, scaleFromDetections } from "./escala.mjs";
import { levelFromShots, odmArgs, odmCommand, photosUsed, qualityOf, readLasCount, repairLasBounds, stageFromLine, stepDetail } from "./motor-comum.mjs";

const env = loadEnv();
const sql = neon(env.DATABASE_URL);
const token = env.BLOB_READ_WRITE_TOKEN;
const ODM_DIR = env.MOTOR_ODM_DIR || "A:\\Ferramentas\\ODM";
const PROJECTS = env.MOTOR_PROJETOS || "A:\\Ferramentas\\odm-projetos";
const CONVERTER = env.MOTOR_POTREE || "A:\\Ferramentas\\PotreeConverter\\PotreeConverter_2.1.5_x64_windows\\PotreeConverter.exe";
const ONCE = process.env.MOTOR_UMA_VEZ === "1";
// arquivos vão para a Cloudflare R2 quando ela está configurada; senão, para o Vercel Blob
const R2 = env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET && env.R2_PUBLIC_URL
  ? { c: new AwsClient({ accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY, service: "s3", region: "auto" }), base: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}`, pub: env.R2_PUBLIC_URL.replace(/\/+$/, "") }
  : null;
const encodeKey = (k) => k.split("/").map(encodeURIComponent).join("/");

/** Envia um arquivo local e devolve { url, pathname }. random = sufixo aleatório no nome. */
async function upload(path, file, { random = false } = {}) {
  if (R2) {
    let key = path;
    if (random) {
      const dot = key.lastIndexOf(".");
      const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
      key = dot > key.lastIndexOf("/") ? `${key.slice(0, dot)}-${rand}${key.slice(dot)}` : `${key}-${rand}`;
    }
    const res = await R2.c.fetch(`${R2.base}/${encodeKey(key)}`, { method: "PUT", body: readFileSync(file), headers: { "content-type": "application/octet-stream" } });
    if (!res.ok) throw new Error(`Falha ao enviar ${key} (${res.status}).`);
    return { url: `${R2.pub}/${encodeKey(key)}`, pathname: key };
  }
  const blob = await blobPut(path, createReadStream(file), { access: "public", token, multipart: true, addRandomSuffix: random, allowOverwrite: !random, contentType: "application/octet-stream" });
  return { url: blob.url, pathname: blob.pathname };
}
const POLL_MS = 30_000;

const log = (...a) => console.log(new Date().toLocaleTimeString("pt-BR"), ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let child = null;

async function heartbeat() {
  await sql`insert into motor_heartbeat (id, last_seen) values ('pc', now()) on conflict (id) do update set last_seen = now()`;
}

async function claim() {
  const rows = await sql`
    update processing_jobs set status = 'rodando', stage = 'triagem', progress = 1, error = null, started_at = coalesce(started_at, now())
    where id = (select id from processing_jobs where status = 'na_fila' order by created_at limit 1 for update skip locked)
    returning *`;
  return rows[0] ?? null;
}

/** Baixa os quadros na ordem da gravação: o nome do arquivo é o que diz ao ODM quais são vizinhos. */
async function download(captureId, dir, maxSide) {
  mkdirSync(dir, { recursive: true });
  const files = await sql`select id, url from capture_files where capture_id = ${captureId} and url is not null order by coalesce(taken_at, created_at), created_at, id`;
  let done = 0;
  for (let i = 0; i < files.length; i += 4) {
    await Promise.all(
      files.slice(i, i + 4).map(async (f, k) => {
        const dest = join(dir, `${String(i + k + 1).padStart(5, "0")}.jpg`);
        if (existsSync(dest) && statSync(dest).size > 0) return;
        const res = await fetch(f.url);
        if (!res.ok) throw new Error(`Falha ao baixar um quadro (${res.status}).`);
        const buf = Buffer.from(await res.arrayBuffer());
        const img = sharp(buf).withMetadata();
        await (maxSide ? img.resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true }) : img).jpeg({ quality: 90 }).toFile(dest);
      }),
    );
    done += Math.min(4, files.length - i);
    log(`quadros ${done}/${files.length}`);
  }
  return files.length;
}

const countFiles = (dir, re) => {
  try {
    return readdirSync(dir).filter((f) => re.test(f)).length;
  } catch {
    return 0;
  }
};

function runOdm(job, project, total) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(join(PROJECTS, `${project}.log`), { flags: "a" });
    const cmd = odmCommand(ODM_DIR, odmArgs(project, PROJECTS, job.quality));
    let odmStage = null;
    let shown = "";
    const sfm = join(PROJECTS, project, "opensfm");
    const ticker = setInterval(() => {
      const d = stepDetail(odmStage, {
        features: countFiles(join(sfm, "features"), /\.npz$/),
        matches: countFiles(join(sfm, "matches"), /\.pkl\.gz$/),
        depths: countFiles(join(sfm, "undistorted", "openmvs", "depthmaps"), /^depth\d+\.dmap$/),
        total,
      });
      if (!d || d.text === shown) return;
      shown = d.text;
      sql`update processing_jobs set progress = ${d.progress}, log = ${d.text} where id = ${job.id}`.catch((e) => log("aviso:", e.message));
    }, 20_000);
    child = spawn("cmd.exe", ["/d", "/s", "/c", cmd], { windowsVerbatimArguments: true, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    const tail = [];
    let buffer = "";
    const onData = (d) => {
      file.write(d);
      buffer += d.toString();
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop();
      for (const line of lines) {
        if (line.trim()) tail.push(line.trim());
        if (tail.length > 12) tail.shift();
        const s = stageFromLine(line);
        if (s) {
          log(line.trim());
          odmStage = s.odm;
          sql`update processing_jobs set stage = ${s.stage}, progress = ${s.progress}, log = null where id = ${job.id}`.catch((e) => log("aviso:", e.message));
        }
      }
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("error", reject);
    child.on("close", (code) => {
      clearInterval(ticker);
      child = null;
      file.end();
      if (code === 0) resolve();
      else reject(new Error(`ODM parou (código ${code}): ${tail.slice(-3).join(" | ")}`.slice(0, 500)));
    });
  });
}

/** Prepara a nuvem em níveis de detalhe: o visualizador baixa só o que aparece na tela. */
async function publishOctree(job, capture, las, dir) {
  if (!existsSync(CONVERTER)) return null;
  const out = join(dir, "potree");
  try {
    if (repairLasBounds(las)) log("limites do arquivo corrigidos");
  } catch (e) {
    log("aviso: não foi possível conferir os limites:", e.message);
  }
  const run = spawnSync(CONVERTER, [las, "-o", out, "--overwrite", "--encoding", "BROTLI"], { windowsHide: true });
  if (run.status !== 0) {
    const why = (String(run.stdout) + String(run.stderr)).match(/ERROR[^\n]*\n?[^\n]*/)?.[0] ?? String(run.stderr).slice(0, 200);
    log("aviso: conversão da nuvem falhou:", why);
    return null;
  }
  const prefix = `orgs/${capture.org_id}/sites/${capture.site_id}/capturas/${capture.id}/resultado/potree-${job.id.slice(0, 8)}`;
  let base = null;
  for (const name of ["metadata.json", "hierarchy.bin", "octree.bin"]) {
    const blob = await upload(`${prefix}/${name}`, join(out, name));
    base = blob.url.slice(0, blob.url.lastIndexOf("/") + 1);
  }
  return base;
}

function levelOf(dir) {
  try {
    const rec = JSON.parse(readFileSync(join(dir, "opensfm", "reconstruction.json"), "utf8"));
    const biggest = rec.reduce((a, b) => (Object.keys(b.shots).length > Object.keys(a.shots).length ? b : a));
    return levelFromShots(Object.values(biggest.shots));
  } catch (e) {
    log("aviso: sem nivelamento:", e.message);
    return null;
  }
}

/** Escala real pelo marcador ArchRay, se ele aparecer nos quadros. */
async function autoScale(dir) {
  try {
    const rec = JSON.parse(readFileSync(join(dir, "opensfm", "reconstruction.json"), "utf8"));
    const biggest = rec.reduce((a, b) => (Object.keys(b.shots).length > Object.keys(a.shots).length ? b : a));
    const names = Object.keys(biggest.shots).sort();
    const detections = [];
    let seen = 0;
    for (const name of names) {
      const file = join(dir, "images", name);
      if (!existsSync(file)) continue;
      const raw = await sharp(file).metadata();
      // dimensões já com a orientação da foto aplicada (como a fotogrametria enxerga)
      const meta = (raw.orientation ?? 1) >= 5 ? { width: raw.height, height: raw.width } : raw;
      // marcador pequeno de longe precisa de resolução: detecta em até 3200 px e devolve na escala da imagem
      const k = Math.min(1, 3200 / Math.max(meta.width, meta.height));
      const { data, info } = await sharp(file).rotate().resize({ width: Math.round(meta.width * k), withoutEnlargement: true }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const markers = detectMarkers(info.width, info.height, new Uint8ClampedArray(data.buffer, data.byteOffset, data.length)).map((m) => ({
        id: m.id,
        corners: m.corners.map(([x, y]) => [x / k, y / k]),
      }));
      if (markers.length) seen++;
      detections.push({ image: name, width: meta.width, height: meta.height, markers });
    }
    const s = scaleFromDetections(detections, biggest);
    if (!s) {
      log(`escala: marcador não encontrado (${seen} quadros com marcador)`);
      return null;
    }
    log(`escala: 1 unidade = ${s.factor.toFixed(4)} m · ${s.markers} marcadores em ${s.images} quadros · divergência ${s.spread == null ? "—" : (s.spread * 100).toFixed(1) + "%"}${s.doubtful ? " (duvidosa)" : ""}`);
    return s;
  } catch (e) {
    log("aviso: escala automática falhou:", e.message);
    return null;
  }
}

async function publish(job, capture, dir) {
  const suffix = qualityOf(job.quality).suffix;
  const results = [
    { file: join(dir, "odm_georeferencing", "odm_georeferenced_model.las"), name: `nuvem-de-pontos${suffix}.las`, kind: "nuvem", format: "las", upAxis: "z" },
    { file: join(dir, "odm_texturing", "odm_textured_model_geo.glb"), name: `modelo-3d${suffix}.glb`, kind: "malha", format: "glb", upAxis: "z" },
  ].filter((r) => existsSync(r.file));
  if (!results.some((r) => r.kind === "nuvem")) throw new Error("O motor terminou sem gerar a nuvem de pontos. Grave de novo mais devagar, com mais sobreposição.");
  const level = levelOf(dir);
  if (level) log(`nivelamento: modelo inclinado ${level.tilt}°`);
  log("procurando o marcador de escala");
  await sql`update processing_jobs set stage = 'escala' where id = ${job.id}`;
  const auto = await autoScale(dir);
  const scale = auto
    ? { factor: auto.factor, meters: auto.meters, a: auto.a, b: auto.b, at: new Date().toISOString(), source: "marcador", spread: auto.spread, markers: auto.markers, images: auto.images, doubtful: auto.doubtful }
    : null;
  const cloud = results.find((r) => r.kind === "nuvem");
  log("preparando a nuvem em níveis de detalhe");
  const potree = await publishOctree(job, capture, cloud.file, dir);
  for (const r of results) {
    const bytes = statSync(r.file).size;
    log(`enviando ${r.name} (${Math.round(bytes / 1e6)} MB)`);
    const path = `orgs/${capture.org_id}/sites/${capture.site_id}/capturas/${capture.id}/resultado/${r.name}`;
    const blob = await upload(path, r.file, { random: true });
    const points = r.format === "las" ? readLasCount(r.file) : null;
    const meta = { viewable: true, upAxis: r.upAxis, source: "motor", level: level?.quaternion ?? null, ...(scale ? { scale } : {}), ...(r.kind === "nuvem" && potree ? { potree, points } : {}) };
    await sql`insert into outputs (site_id, capture_id, kind, format, name, storage_key, url, bytes, point_count, meta)
      values (${capture.site_id}, ${capture.id}, ${r.kind}, ${r.format}, ${r.name}, ${blob.pathname}, ${blob.url}, ${bytes}, ${points}, ${JSON.stringify(meta)}::jsonb)`;
  }
}

async function quality(job, captureId, dir, total) {
  try {
    const rec = JSON.parse(readFileSync(join(dir, "opensfm", "reconstruction.json"), "utf8"));
    const used = photosUsed(rec);
    await sql`delete from quality_reports where capture_id = ${captureId}`;
    await sql`insert into quality_reports (capture_id, photos_used, photos_discarded) values (${captureId}, ${used}, ${Math.max(0, total - used)})`;
    log(`quadros aproveitados: ${used}/${total}`);
  } catch (e) {
    log("aviso: sem relatório de qualidade:", e.message);
  }
}

/** Prepara para o navegador uma nuvem que já existe (antiga ou importada): só a conversão em níveis. */
async function optimizeOutput(job) {
  const [o] = await sql`select o.id, o.url, o.format, o.meta, o.capture_id, o.site_id, s.org_id from outputs o join sites s on s.id = o.site_id where o.id = ${job.output_id}`;
  if (!o?.url) throw new Error("Nuvem não encontrada.");
  const dir = join(PROJECTS, `otimizar-${job.id.slice(0, 8)}`);
  mkdirSync(dir, { recursive: true });
  const las = join(dir, `nuvem.${o.format === "laz" ? "laz" : "las"}`);
  log("baixando a nuvem para otimizar");
  await sql`update processing_jobs set stage = 'otimizacao', progress = 10 where id = ${job.id}`;
  const res = await fetch(o.url);
  if (!res.ok || !res.body) throw new Error(`Não foi possível baixar a nuvem (${res.status}).`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(las));
  await sql`update processing_jobs set progress = 40 where id = ${job.id}`;
  log("preparando a nuvem em níveis de detalhe");
  const potree = await publishOctree(job, { org_id: o.org_id, site_id: o.site_id, id: o.capture_id }, las, dir);
  if (!potree) throw new Error("Não foi possível preparar a nuvem. Confira se o PotreeConverter está instalado no computador do motor.");
  const points = readLasCount(las);
  // nivelamento: aproveita a reconstrução do ODM, se a pasta da captura ainda estiver neste computador
  let level = o.meta?.level ?? null;
  if (!level && o.capture_id && existsSync(PROJECTS)) {
    const proj = readdirSync(PROJECTS)
      .filter((n) => n.startsWith(o.capture_id))
      .map((n) => join(PROJECTS, n))
      .find((d) => existsSync(join(d, "opensfm", "reconstruction.json")));
    if (proj) level = levelOf(proj)?.quaternion ?? null;
  }
  await sql`update outputs set point_count = ${points}, meta = coalesce(meta, '{}'::jsonb) || ${JSON.stringify({ potree, points, ...(level ? { level } : {}) })}::jsonb where id = ${o.id}`;
  if (level && o.capture_id) {
    await sql`update outputs set meta = coalesce(meta, '{}'::jsonb) || ${JSON.stringify({ level })}::jsonb
      where capture_id = ${o.capture_id} and (meta->'level' is null or meta->'level' = 'null'::jsonb)`;
  }
  rmSync(dir, { recursive: true, force: true });
  await sql`update processing_jobs set status = 'concluido', stage = 'concluido', progress = 100, finished_at = now() where id = ${job.id}`;
  log(`nuvem otimizada: ${points?.toLocaleString("pt-BR")} pontos`);
}

async function processJob(job) {
  if (job.output_id) return optimizeOutput(job);
  const [capture] = await sql`
    select c.id, c.campaign_id, k.site_id, s.org_id
    from captures c join campaigns k on k.id = c.campaign_id join sites s on s.id = k.site_id
    where c.id = ${job.capture_id}`;
  if (!capture) throw new Error("Captura não encontrada.");
  await sql`update captures set status = 'processando' where id = ${capture.id}`;
  // uma pasta por trabalho: reprocessar com outra qualidade não reaproveita etapas da anterior
  const project = `${capture.id}-${job.id.slice(0, 8)}`;
  const dir = join(PROJECTS, project);
  log(`baixando os quadros (${job.quality})`);
  const total = await download(capture.id, join(dir, "images"), qualityOf(job.quality).maxSide);
  await runOdm(job, project, total);
  await sql`update processing_jobs set stage = 'otimizacao', progress = 95 where id = ${job.id}`;
  await publish(job, capture, dir);
  await quality(job, capture.id, dir, total);
  await sql`update processing_jobs set status = 'concluido', stage = 'concluido', progress = 100, finished_at = now() where id = ${job.id}`;
  await sql`update captures set status = 'concluida' where id = ${capture.id}`;
  await sql`update sites set updated_at = now() where id = ${capture.site_id}`;
  log("concluído");
}

function shutdown() {
  if (child) spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"]);
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// um trabalho interrompido volta para a fila; o ODM retoma da última etapa concluída
await sql`update processing_jobs set status = 'na_fila' where status = 'rodando'`;
log(ONCE ? "motor 3D: uma passada" : "motor 3D ligado. Deixe esta janela aberta e o computador sem suspender.");
log(R2 ? "arquivos: Cloudflare R2" : "arquivos: Vercel Blob");

for (;;) {
  await heartbeat().catch((e) => log("aviso:", e.message));
  const beat = setInterval(() => heartbeat().catch((e) => log("aviso:", e.message)), POLL_MS);
  let job = null;
  try {
    job = await claim();
    if (job) {
      log("processando a captura", job.capture_id);
      await processJob(job);
    }
  } catch (e) {
    log("falhou:", e.message);
    if (job) {
      await sql`update processing_jobs set status = 'falhou', error = ${String(e.message).slice(0, 500)}, finished_at = now() where id = ${job.id}`;
      if (!job.output_id) await sql`update captures set status = 'falhou' where id = ${job.capture_id}`;
    }
  }
  clearInterval(beat);
  if (job) continue;
  if (ONCE) break;
  await sleep(POLL_MS);
}
process.exit(0);
