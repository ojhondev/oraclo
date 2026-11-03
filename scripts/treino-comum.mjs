// Partes comuns da esteira de treino (exportar, avaliar): classes do modelo e rasterização.
// As classes do modelo são grupos da legenda: o modelo aprende a família do dano; a classe fina
// (ex.: umidade ascendente × descendente) continua com o profissional e com as regras do cv-2.
import { readFileSync } from "node:fs";

/** Índice da classe no modelo → códigos da legenda. 255 = ignorar (sem rótulo confiável). */
export const CLASSES = [
  { id: 0, name: "fundo", codes: [] },
  { id: 1, name: "fissura", codes: ["FIS", "TRI", "RAC"] },
  { id: 2, name: "perda_pintura", codes: ["DPT"] },
  { id: 3, name: "mancha", codes: ["UMA", "UMD", "SUJ", "PAS"] },
  { id: 4, name: "biologico", codes: ["BIO", "VEG"] },
  { id: 5, name: "perda_reboco", codes: ["PRB", "DES"] },
  { id: 6, name: "eflorescencia", codes: ["EFL"] },
];
export const IGNORE = 255;
const byCode = new Map(CLASSES.flatMap((c) => c.codes.map((code) => [code, c.id])));
/** Classe do modelo para um código da legenda (os demais danos viram "ignorar"). */
export const classOf = (code) => byCode.get(code) ?? IGNORE;
/** Classe de modelo → código usado ao sugerir (o mais comum do grupo). */
export const CODE_OF_CLASS = { 1: "FIS", 2: "DPT", 3: "UMD", 4: "BIO", 5: "PRB", 6: "EFL" };

export function loadEnv(file = ".env.local") {
  const env = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const i = line.indexOf("=");
    if (i < 1 || line.trimStart().startsWith("#")) continue;
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

/** Preenche um polígono (regra par-ímpar, varredura por linha) com `value`. */
export function fillPolygon(mask, w, h, pts, value) {
  if (pts.length < 3) return;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const [, y] of pts) {
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(h - 1, Math.ceil(y1)); y++) {
    const cy = y + 0.5;
    const xs = [];
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if (yi > cy !== yj > cy) xs.push(xi + ((cy - yi) * (xj - xi)) / (yj - yi));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const a = Math.max(0, Math.ceil(xs[k] - 0.5));
      const b = Math.min(w - 1, Math.floor(xs[k + 1] - 0.5));
      for (let x = a; x <= b; x++) mask[y * w + x] = value;
    }
  }
}

/** Carimba um disco de raio r. */
export function disk(mask, w, h, cx, cy, r, value) {
  for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(h - 1, Math.ceil(cy + r)); y++)
    for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(w - 1, Math.ceil(cx + r)); x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) mask[y * w + x] = value;
}

/** Linha com espessura (discos a cada pixel ao longo dos segmentos). */
export function strokePolyline(mask, w, h, pts, r, value) {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay)));
    for (let t = 0; t <= n; t++) disk(mask, w, h, ax + ((bx - ax) * t) / n, ay + ((by - ay) * t) / n, r, value);
  }
  if (pts.length === 1) disk(mask, w, h, pts[0][0], pts[0][1], r, value);
}

/** Desenha uma geometria (área, linha ou ponto) na máscara, já na escala k da imagem de trabalho. */
export function burn(mask, w, h, geometry, points, k, value, lineR) {
  const p = points.map(([x, y]) => [x * k, y * k]);
  if (geometry === "area") fillPolygon(mask, w, h, p, value);
  else if (geometry === "linha") strokePolyline(mask, w, h, p, lineR, value);
  else for (const [x, y] of p) disk(mask, w, h, x, y, Math.max(6, lineR * 3), value);
}

/** Separação treino/validação por projeto (nunca a mesma edificação nos dois lados). */
export function splitOf(siteId) {
  let hsh = 2166136261;
  for (const ch of siteId) hsh = Math.imul(hsh ^ ch.charCodeAt(0), 16777619) >>> 0;
  return hsh % 5 === 0 ? "val" : "train";
}

/** Precisão, revocação e IoU por classe (pixels), ignorando 255 no gabarito. */
export function scoreMaps(pred, truth, stats) {
  for (let i = 0; i < truth.length; i++) {
    const t = truth[i];
    if (t === IGNORE) continue;
    const p = pred[i];
    if (p === t) {
      if (t) (stats[t] ??= { tp: 0, fp: 0, fn: 0 }).tp++;
    } else {
      if (p) (stats[p] ??= { tp: 0, fp: 0, fn: 0 }).fp++;
      if (t) (stats[t] ??= { tp: 0, fp: 0, fn: 0 }).fn++;
    }
  }
  return stats;
}

export function summarize(stats) {
  const out = {};
  for (const c of CLASSES.slice(1)) {
    const s = stats[c.id] ?? { tp: 0, fp: 0, fn: 0 };
    const precision = s.tp + s.fp ? s.tp / (s.tp + s.fp) : null;
    const recall = s.tp + s.fn ? s.tp / (s.tp + s.fn) : null;
    const iou = s.tp + s.fp + s.fn ? s.tp / (s.tp + s.fp + s.fn) : null;
    out[c.name] = { precision, recall, iou, pixels: s.tp + s.fn };
  }
  return out;
}
