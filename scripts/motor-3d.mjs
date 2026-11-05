// Motor 3D do ArchRay: roda no computador do Estúdio, pega as capturas da fila, processa com o
// OpenDroneMap e devolve modelo 3D e nuvem de pontos à plataforma.  Uso: npm run motor
//   MOTOR_UMA_VEZ=1   processa o que houver na fila e encerra (para testes)
import { spawn, spawnSync } from "node:child_process";
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { neon } from "@neondatabase/serverless";
import { put } from "@vercel/blob";
import { loadEnv } from "./treino-comum.mjs";
import { odmArgs, odmCommand, photosUsed, readLasCount, stageFromLine } from "./motor-comum.mjs";

const env = loadEnv();
const sql = neon(env.DATABASE_URL);
const token = env.BLOB_READ_WRITE_TOKEN;
const ODM_DIR = env.MOTOR_ODM_DIR || "A:\\Ferramentas\\ODM";
const PROJECTS = env.MOTOR_PROJETOS || "A:\\Ferramentas\\odm-projetos";
const ONCE = process.env.MOTOR_UMA_VEZ === "1";
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

async function download(captureId, dir) {
  mkdirSync(dir, { recursive: true });
  const files = await sql`select id, url from capture_files where capture_id = ${captureId} and url is not null`;
  let done = 0;
  for (let i = 0; i < files.length; i += 4) {
    await Promise.all(
      files.slice(i, i + 4).map(async (f) => {
        const dest = join(dir, `${f.id}.jpg`);
        if (existsSync(dest) && statSync(dest).size > 0) return;
        const res = await fetch(f.url);
        if (!res.ok) throw new Error(`Falha ao baixar um quadro (${res.status}).`);
        await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
      }),
    );
    done += Math.min(4, files.length - i);
    log(`quadros ${done}/${files.length}`);
  }
  return files.length;
}

function runOdm(job, project) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(join(PROJECTS, `${project}.log`), { flags: "a" });
    const cmd = odmCommand(ODM_DIR, odmArgs(project, PROJECTS));
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
          sql`update processing_jobs set stage = ${s.stage}, progress = ${s.progress} where id = ${job.id}`.catch((e) => log("aviso:", e.message));
        }
      }
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("error", reject);
    child.on("close", (code) => {
      child = null;
      file.end();
      if (code === 0) resolve();
      else reject(new Error(`ODM parou (código ${code}): ${tail.slice(-3).join(" | ")}`.slice(0, 500)));
    });
  });
}

async function publish(job, capture, dir) {
  const results = [
    { file: join(dir, "odm_georeferencing", "odm_georeferenced_model.las"), name: "nuvem-de-pontos.las", kind: "nuvem", format: "las", upAxis: "z" },
    { file: join(dir, "odm_texturing", "odm_textured_model_geo.glb"), name: "modelo-3d.glb", kind: "malha", format: "glb", upAxis: "z" },
  ].filter((r) => existsSync(r.file));
  if (!results.some((r) => r.kind === "nuvem")) throw new Error("O motor terminou sem gerar a nuvem de pontos. Grave de novo mais devagar, com mais sobreposição.");
  for (const r of results) {
    const bytes = statSync(r.file).size;
    log(`enviando ${r.name} (${Math.round(bytes / 1e6)} MB)`);
    const path = `orgs/${capture.org_id}/sites/${capture.site_id}/capturas/${capture.id}/resultado/${r.name}`;
    const blob = await put(path, createReadStream(r.file), { access: "public", token, multipart: true, addRandomSuffix: true, contentType: "application/octet-stream" });
    const points = r.format === "las" ? readLasCount(r.file) : null;
    const meta = { viewable: true, upAxis: r.upAxis, source: "motor" };
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

async function processJob(job) {
  const [capture] = await sql`
    select c.id, c.campaign_id, k.site_id, s.org_id
    from captures c join campaigns k on k.id = c.campaign_id join sites s on s.id = k.site_id
    where c.id = ${job.capture_id}`;
  if (!capture) throw new Error("Captura não encontrada.");
  await sql`update captures set status = 'processando' where id = ${capture.id}`;
  const dir = join(PROJECTS, capture.id);
  log("baixando os quadros");
  const total = await download(capture.id, join(dir, "images"));
  await runOdm(job, capture.id);
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
      await sql`update captures set status = 'falhou' where id = ${job.capture_id}`;
    }
  }
  clearInterval(beat);
  if (job) continue;
  if (ONCE) break;
  await sleep(POLL_MS);
}
process.exit(0);
