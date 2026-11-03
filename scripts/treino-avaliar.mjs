// Avalia o motor clássico (cv-2) nas vistas de validação exportadas por treino-exportar.mjs,
// com a mesma métrica do notebook de treino (precisão, revocação e IoU por classe, em pixels,
// ignorando o que não tem rótulo). O resultado entra na ficha do modelo: um modelo treinado só é
// ligado, classe a classe, onde supera o cv-2.
//
//   node scripts/treino-avaliar.mjs [pasta-da-base]     (padrão: .cache/treino/archray)
import { build } from "esbuild";
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { IGNORE, burn, classOf, scoreMaps, summarize } from "./treino-comum.mjs";

const DIR = process.argv[2] ?? ".cache/treino/archray";
if (!existsSync(`${DIR}/views`)) {
  console.log(`Sem vistas de validação em ${DIR}/views. Rode antes: node scripts/treino-exportar.mjs`);
  process.exit(0);
}
await build({ entryPoints: ["src/lib/detect/detect.ts"], bundle: true, platform: "node", format: "esm", outfile: ".cache/detect-avaliar.mjs", logLevel: "warning" });
const { detectDamages, DETECTOR_VERSION } = await import(pathToFileURL(".cache/detect-avaliar.mjs").href + `?t=${Date.now()}`);

const stats = {};
let n = 0;
for (const f of readdirSync(`${DIR}/views`).filter((f) => f.endsWith(".jpg"))) {
  const { data, info } = await sharp(`${DIR}/views/${f}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const truth = (await sharp(`${DIR}/views/${f.replace(".jpg", ".png")}`).extractChannel(0).raw().toBuffer());
  const { width: w, height: h } = info;
  const { detections } = detectDamages(new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), w, h);
  const pred = new Uint8Array(w * h);
  for (const d of detections) {
    const c = classOf(d.code);
    if (c === IGNORE) continue;
    burn(pred, w, h, d.kind, d.points, 1, c, 3);
  }
  scoreMaps(pred, truth, stats);
  n++;
}
const result = { engine: DETECTOR_VERSION, views: n, date: new Date().toISOString(), classes: summarize(stats) };
writeFileSync(`${DIR}/avaliacao-${DETECTOR_VERSION}.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
