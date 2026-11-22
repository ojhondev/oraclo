// Bancada do levantamento cadastral automático (módulo experimental src/lib/cadastro).
// Uso: npx tsx scripts/bancada-cadastro.mts <imagem> [mm-por-pixel] [saida-prefixo]
// Gera <prefixo>-overlay.jpg (bruto em vermelho, regularizado em ciano, faixas em amarelo,
// pilastras em verde) e <prefixo>-mascara.png (o que foi considerado escuro).
import fs from "node:fs";
import sharp from "sharp";
import { analyzeFacade } from "../src/lib/cadastro/analyze";
import { regularize } from "../src/lib/cadastro/regularize";
import { completeGrid, toGray } from "../src/lib/cadastro/complete";

const [file, mmArg, outArg] = process.argv.slice(2);
if (!file) throw new Error("informe a imagem");
const out = outArg ?? file.replace(/\.\w+$/, "");
const MAX = 1200;
const img = sharp(file).rotate();
const meta = await img.metadata();
const k = Math.min(1, MAX / Math.max(meta.width!, meta.height!));
const { data, info } = await img.resize(Math.round(meta.width! * k)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const t0 = performance.now();
const px = new Uint8ClampedArray(data.buffer, data.byteOffset, data.length);
const a = analyzeFacade(px, info.width, info.height);
const full = completeGrid(toGray(px, info.width, info.height), a.vaos, a.bands, a.facade);
const added = full.length - a.vaos.length;
const reg = regularize(full, a.facade);
const ms = Math.round(performance.now() - t0);
const mmPx = mmArg ? Number(mmArg) / k : null; // mm por pixel na imagem reduzida

const rect = (b: { x0: number; y0: number; x1: number; y1: number }, color: string, sw: number, dash = "") =>
  `<rect x="${b.x0}" y="${b.y0}" width="${b.x1 - b.x0 + 1}" height="${b.y1 - b.y0 + 1}" fill="none" stroke="${color}" stroke-width="${sw}" ${dash ? `stroke-dasharray="${dash}"` : ""}/>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${info.width}" height="${info.height}">
  ${rect(a.facade, "#ff00ff", 2, "8 6")}
  ${a.bands.map((b) => `<line x1="${a.facade.x0}" x2="${a.facade.x1}" y1="${b.y}" y2="${b.y}" stroke="#ffd400" stroke-width="2"/>`).join("")}
  ${a.piers.map((p) => rect(p, "#27e36b", 2)).join("")}
  ${full.map((v) => rect(v, (v as { found?: string }).found ? "#ff9500" : "#ff3b30", 1.5, "4 3")).join("")}
  ${reg.vaos.map((v) => rect(v, "#00e5ff", 2.5) + (v.arched ? `<path d="M${v.x0} ${v.y0 + (v.x1 - v.x0) / 2} A${(v.x1 - v.x0) / 2} ${(v.x1 - v.x0) / 2} 0 0 1 ${v.x1} ${v.y0 + (v.x1 - v.x0) / 2}" fill="none" stroke="#00e5ff" stroke-width="2"/>` : "")).join("")}
</svg>`;
await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .composite([{ input: Buffer.from(svg) }])
  .jpeg({ quality: 82 })
  .toFile(`${out}-overlay.jpg`);
const mask = Buffer.alloc(info.width * info.height);
for (let i = 0; i < mask.length; i++) mask[i] = a.dark[i] ? 255 : 0;
await sharp(mask, { raw: { width: info.width, height: info.height, channels: 1 } }).png().toFile(`${out}-mascara.png`);

const m = (px: number) => (mmPx ? `${((px * mmPx) / 1000).toFixed(2)} m` : `${px}px`);
console.log(`${file}: ${info.width}x${info.height} em ${ms} ms · parede L=${a.wall}`);
console.log(`vãos brutos ${a.vaos.length} + ${added} pela grade → regularizados ${reg.vaos.length} (${reg.rows.length} fiadas, ${reg.columns} eixos) · pilastras ${a.piers.length} · faixas ${a.bands.length}`);
for (const [i, r] of reg.rows.entries()) console.log(`  fiada ${i + 1}: ${r.count} vãos · largura ${m(r.width)} · altura ${m(r.height)} · topo em ${m(r.y0 - a.facade.y0)}`);
fs.writeFileSync(`${out}-dados.json`, JSON.stringify({ facade: a.facade, bands: a.bands, piers: a.piers, vaos: reg.vaos, rows: reg.rows, mmPerPixel: mmPx }, null, 1));
