// Bancada do modo semiautomático: um vão marcado → todos os parecidos → grade limpa.
// Uso: npx tsx scripts/bancada-cadastro-semi.mts <imagem> <mm-por-pixel> <x0,y0,x1,y1 em fração 0..1> [saida-prefixo]
import fs from "node:fs";
import sharp from "sharp";
import { analyzeFacade } from "../src/lib/cadastro/analyze";
import { regularize } from "../src/lib/cadastro/regularize";
import { toGray } from "../src/lib/cadastro/complete";
import { findSimilar } from "../src/lib/cadastro/similar";
import { edgesOf } from "../src/lib/cadastro/refine";
import { buildDrawing, drawingDxf, drawingSvg } from "../src/lib/cadastro/drawing";

const [file, mmArg, boxArg, outArg] = process.argv.slice(2);
const out = outArg ?? file!.replace(/\.\w+$/, "") + "-semi";
const MAX = 1200;
const img = sharp(file!).rotate();
const meta = await img.metadata();
const k = Math.min(1, MAX / Math.max(meta.width!, meta.height!));
const { data, info } = await img.resize(Math.round(meta.width! * k)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const px = new Uint8ClampedArray(data.buffer, data.byteOffset, data.length);
// uma semente por tipo de janela, separadas por ";"
const seeds = boxArg!.split(";").map((s) => {
  const [fx0, fy0, fx1, fy1] = s.split(",").map(Number);
  return { x0: fx0! * info.width, y0: fy0! * info.height, x1: fx1! * info.width, y1: fy1! * info.height };
});
const seed = seeds[0]!;
const t0 = performance.now();
const a = analyzeFacade(px, info.width, info.height);
const gray = toGray(px, info.width, info.height);
const edges = edgesOf(gray);
const matches = seeds.flatMap((sd, family) => findSimilar(gray, sd, a.facade, { edges, minScore: 0.42 }).map((m) => ({ ...m, family })));
// debug-matches
if (process.env.DEBUG) for (const mt of matches) console.log("m", (mt as {family:number}).family, Math.round(mt.x0), Math.round(mt.y0), Math.round(mt.x1), Math.round(mt.y1), mt.score, mt.seed ? "semente" : "");
const reg = regularize(matches.map((m) => ({ ...m, arched: false })), a.facade);
const ms = Math.round(performance.now() - t0);
const mmPx = Number(mmArg) / k;

const rect = (b: { x0: number; y0: number; x1: number; y1: number }, color: string, sw: number, dash = "") =>
  `<rect x="${b.x0}" y="${b.y0}" width="${b.x1 - b.x0}" height="${b.y1 - b.y0}" fill="none" stroke="${color}" stroke-width="${sw}" ${dash ? `stroke-dasharray="${dash}"` : ""}/>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${info.width}" height="${info.height}">
  ${a.bands.map((b) => `<line x1="${a.facade.x0}" x2="${a.facade.x1}" y1="${b.y}" y2="${b.y}" stroke="#ffd400" stroke-width="2"/>`).join("")}
  ${matches.map((m) => rect(m, m.seed ? "#ff2d55" : "#ff9500", 1.5, "4 3")).join("")}
  ${reg.vaos.map((v) => rect(v, "#00e5ff", 2.5)).join("")}
  ${seeds.map((sd) => rect(sd, "#ff2d55", 4)).join("")}
</svg>`;
await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).composite([{ input: Buffer.from(svg) }]).jpeg({ quality: 82 }).toFile(`${out}-overlay.jpg`);
const m = (p: number) => `${((p * mmPx) / 1000).toFixed(2)} m`;
console.log(`semente ${m(seed.x1 - seed.x0)} × ${m(seed.y1 - seed.y0)} · achados ${matches.length - 1} parecidos em ${ms} ms · ${reg.rows.length} fiadas, ${reg.columns} eixos${reg.axis ? ", simétrica" : ""}`);
for (const [i, r] of reg.rows.entries()) console.log(`  fiada ${i + 1}: ${r.count} vãos · ${m(r.width)} × ${m(r.height)}`);
fs.writeFileSync(`${out}-dados.json`, JSON.stringify({ facade: a.facade, bands: a.bands, vaos: reg.vaos, rows: reg.rows, mmPerPixel: mmPx }, null, 1));

// desenho técnico: DXF em metros + prévia
const drawing = buildDrawing({ facade: a.facade, bands: a.bands, vaos: reg.vaos, mmPerPixel: mmPx });
fs.writeFileSync(`${out}.dxf`, drawingDxf(drawing));
await sharp(Buffer.from(drawingSvg(drawing))).png().toFile(`${out}-desenho.png`);
console.log(`desenho: ${drawing.width.toFixed(2)} × ${drawing.height.toFixed(2)} m · ${drawing.segs.length} linhas · ${drawing.labels.length} textos → ${out}.dxf`);
