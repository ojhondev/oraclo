// Bancada da detecção automática: node scripts/bancada-deteccao.mjs <pasta-de-fotos> [pasta-de-saída] [filtro]
// Empacota src/lib/detect/detect.ts, roda em todas as fotos da pasta e grava cada uma com as detecções desenhadas
// (e as máscaras de depuração). As fotos de clientes ficam fora do git: use uma pasta em .cache/.
import { build } from "esbuild";
import { readdirSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const DIR = process.argv[2] ?? ".cache/bench";
const OUT = process.argv[3] ?? `${DIR}/resultado`;
mkdirSync(OUT, { recursive: true });
await build({ entryPoints: ["src/lib/detect/detect.ts"], bundle: true, platform: "node", format: "esm", outfile: ".cache/detect-bancada.mjs", logLevel: "warning" });
const { detectDamages } = await import(pathToFileURL(".cache/detect-bancada.mjs").href + "?t=" + Date.now());
const COLORS = { FIS: "#ff2d2d", BIO: "#22c55e", VEG: "#a3e635", PRB: "#f59e0b", UMA: "#3b82f6", UMD: "#60a5fa", SUJ: "#a855f7", EFL: "#f0f0f0", DPT: "#ff00d4" };
const filter = process.argv[4];
const files = readdirSync(DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f) && (!filter || f.includes(filter)));
for (const f of files) {
  const file = `${DIR}/${f}`;
  const meta = await sharp(file).metadata();
  const k = Math.min(1, 2200 / Math.max(meta.width, meta.height));
  const w = Math.round(meta.width * k), h = Math.round(meta.height * k);
  const { data } = await sharp(file).rotate().resize(w, h).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const t0 = performance.now();
  const dbg = {};
  const { detections, quality } = detectDamages(new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), w, h, dbg);
  const ms = Math.round(performance.now() - t0);
  const count = {};
  for (const d of detections) count[d.code] = (count[d.code] ?? 0) + 1;
  
  console.log(f.padEnd(24), `${w}x${h}`, String(ms).padStart(5) + "ms", JSON.stringify(count), quality ? JSON.stringify(quality) : "");
  const sw = Math.max(3, Math.round(w / 250));
  const shapes = detections.map((d) => {
    const c = COLORS[d.code] ?? "#fff";
    const p = d.points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    if (d.kind === "area") return `<polygon points="${p}" fill="${c}" fill-opacity="0.3" stroke="${c}" stroke-width="${sw}"/>`;
    if (d.kind === "linha") return `<polyline points="${p}" fill="none" stroke="${c}" stroke-width="${sw * 1.5}"/>`;
    const [x, y] = d.points[0];
    return `<circle cx="${x}" cy="${y}" r="${sw * 5}" fill="${c}" stroke="#000" stroke-width="${sw}"/>`;
  }).join("");
  const fs = Math.round(w / 70);
  const labels = detections.map((d) => { const [x, y] = d.points[0]; return `<text x="${x}" y="${y}" font-size="${fs}" font-family="Arial" fill="#fff" stroke="#000" stroke-width="${fs / 6}" paint-order="stroke">${d.code} ${Math.round(d.confidence * 100)}</text>`; }).join("");
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${shapes}${labels}</svg>`);
  const name = f.replace(/\.\w+$/, "");
  const comp = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).composite([{ input: svg }]).png().toBuffer();
  await sharp(comp).resize({ width: 1100, height: 1100, fit: "inside" }).jpeg({ quality: 80 }).toFile(`${OUT}/${name}.jpg`);
  // máscaras de depuração pedidas pelo detector
  for (const [key, m] of Object.entries(dbg)) {
    if (key === "seg") { await sharp(Buffer.from(m), { raw: { width: w, height: h, channels: 3 } }).resize({ width: 700, height: 700, fit: "inside" }).jpeg().toFile(`${OUT}/${name}--seg.jpg`); continue; }
    if (!(m instanceof Uint8Array) || m.length !== w * h) continue;
    const g = Buffer.alloc(w * h);
    for (let i = 0; i < w * h; i++) g[i] = m[i] ? 255 : 0;
    await sharp(g, { raw: { width: w, height: h, channels: 1 } }).resize({ width: 700, height: 700, fit: "inside" }).jpeg().toFile(`${OUT}/${name}--${key}.jpg`);
  }
}
