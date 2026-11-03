// Exporta a base de treino da IA do ArchRay: recortes 512×512 + máscara de classes (PNG em tons
// de cinza: 0 = fundo, 1..6 = classes, 255 = ignorar), separados em treino/validação por projeto.
// Só entram organizações que autorizaram o uso (organizations.training_consent); projetos de
// demonstração e os de nome "Teste…" ficam de fora (dados de exemplo não ensinam nada real).
//
//   node scripts/treino-exportar.mjs [pasta-de-saída]     (padrão: .cache/treino/archray)
//
// Rótulos:
// - danos validados (manual, contorno IA ou detecção aceita) → classe do grupo;
// - sugestões rejeitadas → fundo (a IA errou ali: exemplo negativo);
// - vista com "mapeamento completo" → o que não foi marcado é fundo; nas outras, é "ignorar"
//   (dano não marcado não pode ensinar que aquilo é parede sã).
// Também grava as vistas de validação inteiras em views/ (para comparar motores com treino-avaliar).
import { neon } from "@neondatabase/serverless";
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { CLASSES, IGNORE, burn, classOf, loadEnv, splitOf } from "./treino-comum.mjs";

const OUT = process.argv[2] ?? ".cache/treino/archray";
const MAX_SIDE = 2200; // o mesmo lado de análise da detecção no navegador
const TILE = 512;
const STRIDE = 384;
const sql = neon(loadEnv().DATABASE_URL);

const views = await sql`
  select o.id, o.site_id, o.url, o.width_px, o.height_px, o.mm_per_pixel, o.mapping_complete_at
  from orthophotos o
  join sites s on s.id = o.site_id
  join organizations g on g.id = s.org_id
  where g.training_consent = true
    and not s.is_demo
    and s.name not ilike 'teste%'`;
if (!views.length) {
  console.log("Nenhuma vista de organização com consentimento de treino. Ative em Equipe › Uso dos dados.");
  process.exit(0);
}
const ids = views.map((v) => v.id);
const damages = await sql`
  select d.orthophoto_id, d.geometry, t.code, t.geometry as kind
  from damages d join damage_types t on t.id = d.type_id
  where d.orthophoto_id = any(${ids})`;
const negatives = await sql`
  select s.orthophoto_id, s.geometry, t.code, t.geometry as kind
  from damage_suggestions s join damage_types t on t.id = s.type_id
  where s.status = 'rejeitada' and s.orthophoto_id = any(${ids})`;

for (const d of ["train", "val"]) for (const k of ["img", "mask"]) mkdirSync(`${OUT}/${d}/${k}`, { recursive: true });
mkdirSync(`${OUT}/views`, { recursive: true });

const counts = { views: 0, skipped: 0, train: 0, val: 0, pixels: {} };
const manifest = [];
for (const v of views) {
  const pos = damages.filter((d) => d.orthophoto_id === v.id);
  const neg = negatives.filter((d) => d.orthophoto_id === v.id);
  const complete = !!v.mapping_complete_at;
  if (!complete && !pos.length && !neg.length) {
    counts.skipped++;
    continue;
  }
  const res = await fetch(v.url);
  if (!res.ok) {
    console.warn(`vista ${v.id}: imagem indisponível (${res.status})`);
    counts.skipped++;
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(buf).metadata();
  const k = Math.min(1, MAX_SIDE / Math.max(meta.width, meta.height));
  const w = Math.round(meta.width * k);
  const h = Math.round(meta.height * k);
  // a geometria está em pixels da vista (widthPx); a imagem pode ter sido salva em outro tamanho
  const kg = (w / (v.width_px || meta.width));
  const img = await sharp(buf).resize(w, h).removeAlpha().raw().toBuffer();
  const mask = new Uint8Array(w * h).fill(complete ? 0 : IGNORE);
  // espessura da fissura: ~6 mm (ou 3 px), nunca menos que 2 px
  const lineR = Math.max(2, v.mm_per_pixel ? 3 / (v.mm_per_pixel / kg) : 3);
  for (const n of neg) burn(mask, w, h, n.kind, n.geometry.points, kg, 0, lineR);
  // danos fora das classes do modelo ficam "ignorar"; os demais por cima
  for (const d of pos) if (classOf(d.code) === IGNORE) burn(mask, w, h, d.kind, d.geometry.points, kg, IGNORE, lineR);
  for (const d of pos) if (classOf(d.code) !== IGNORE) burn(mask, w, h, d.kind, d.geometry.points, kg, classOf(d.code), lineR);
  // fora da imagem retificada (margens pretas/transparentes) não há o que aprender
  for (let i = 0; i < w * h; i++) {
    const r = img[i * 3];
    const g = img[i * 3 + 1];
    const b = img[i * 3 + 2];
    if ((r < 6 && g < 6 && b < 6) || (r > 250 && g > 250 && b > 250)) mask[i] = IGNORE;
    if (mask[i] !== IGNORE) counts.pixels[mask[i]] = (counts.pixels[mask[i]] ?? 0) + 1;
  }
  const split = splitOf(v.site_id);
  counts.views++;
  manifest.push({ id: v.id, site: v.site_id, split, complete, w, h, damages: pos.length, negatives: neg.length });
  if (split === "val") {
    await sharp(img, { raw: { width: w, height: h, channels: 3 } }).jpeg({ quality: 92 }).toFile(`${OUT}/views/${v.id}.jpg`);
    await sharp(Buffer.from(mask), { raw: { width: w, height: h, channels: 1 } }).png().toFile(`${OUT}/views/${v.id}.png`);
  }
  // recortes com sobreposição; só os que têm rótulo de verdade
  const xs = [];
  const ys = [];
  for (let x = 0; x + TILE < w; x += STRIDE) xs.push(x);
  xs.push(Math.max(0, w - TILE));
  for (let y = 0; y + TILE < h; y += STRIDE) ys.push(y);
  ys.push(Math.max(0, h - TILE));
  for (const y0 of [...new Set(ys)])
    for (const x0 of [...new Set(xs)]) {
      const tw = Math.min(TILE, w);
      const th = Math.min(TILE, h);
      const tm = Buffer.alloc(TILE * TILE, IGNORE);
      let labeled = 0;
      for (let y = 0; y < th; y++)
        for (let x = 0; x < tw; x++) {
          const m = mask[(y + y0) * w + x + x0];
          tm[y * TILE + x] = m;
          if (m !== IGNORE) labeled++;
        }
      if (labeled < TILE * TILE * 0.05) continue;
      const name = `${v.id}_${x0}_${y0}`;
      await sharp(img, { raw: { width: w, height: h, channels: 3 } })
        .extract({ left: x0, top: y0, width: tw, height: th })
        .extend({ right: TILE - tw, bottom: TILE - th, background: "#000" })
        .jpeg({ quality: 92 })
        .toFile(`${OUT}/${split}/img/${name}.jpg`);
      await sharp(tm, { raw: { width: TILE, height: TILE, channels: 1 } }).png().toFile(`${OUT}/${split}/mask/${name}.png`);
      counts[split]++;
    }
}
writeFileSync(`${OUT}/classes.json`, JSON.stringify({ classes: CLASSES, ignore: IGNORE, tile: TILE, maxSide: MAX_SIDE }, null, 2));
writeFileSync(`${OUT}/vistas.json`, JSON.stringify(manifest, null, 2));
console.log(
  `${counts.views} vistas (${counts.skipped} sem rótulo), ${counts.train} recortes de treino e ${counts.val} de validação em ${OUT}`,
  "\npixels por classe:",
  Object.fromEntries(Object.entries(counts.pixels).map(([c, n]) => [CLASSES[c]?.name ?? c, n])),
);
