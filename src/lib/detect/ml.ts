// Motor treinado (ml-1): segmentação de danos por um modelo próprio do ArchRay, em ONNX, rodando
// no navegador. É opcional e entra classe a classe: o notebook de treino (treino/) só liga uma
// classe se, em vistas reais de validação, ela superar o motor clássico cv-2 — as demais
// continuam com o cv-2. Sem public/modelos/modelo.json, nada muda. Funções puras (exceto runModel).
import type * as Ort from "onnxruntime-web";
import { axes, centerline, components, polygonOf, smooth, type Detection, type DetectCode } from "./detect";

/** Ficha do modelo (gerada pelo notebook de treino). */
export type ModelCard = {
  version: string;
  file: string;
  input: { name: string; size: number; mean: number[]; std: number[]; maxSide: number; overlap: number };
  output: string;
  classes: { id: number; name: string; codes: string[] }[];
  thresholds: Record<string, number>;
  enabled: Record<string, boolean>;
  metrics: { views: number; model: Record<string, { precision: number | null; recall: number | null; iou: number | null; pixels: number }> };
  training: { date: string; sources: string[] };
};

/** Código da legenda sugerido para cada classe do modelo. */
const CODE_OF: Record<string, DetectCode> = {
  fissura: "FIS",
  perda_pintura: "DPT",
  mancha: "UMD",
  biologico: "BIO",
  perda_reboco: "PRB",
  eflorescencia: "EFL",
};
const LABEL: Record<string, string> = {
  fissura: "fissura",
  perda_pintura: "perda de pintura",
  mancha: "mancha de umidade ou sujidade",
  biologico: "biodeterioração",
  perda_reboco: "perda de reboco",
  eflorescencia: "eflorescência",
};

/** Classes que o modelo assume (as outras ficam com o cv-2). */
export const enabledClasses = (card: ModelCard) => card.classes.filter((c) => c.id > 0 && card.enabled[c.name]);

/** Códigos da legenda cobertos pelo modelo: as sugestões do cv-2 nesses códigos são descartadas. */
export const coveredCodes = (card: ModelCard) => new Set(enabledClasses(card).flatMap((c) => c.codes));

/** Posições dos recortes (com sobreposição) que cobrem um lado de `len` pixels. */
export function tileStarts(len: number, tile: number, overlap: number) {
  if (len <= tile) return [0];
  const out: number[] = [];
  for (let s = 0; s + tile < len; s += tile - overlap) out.push(s);
  out.push(len - tile);
  return [...new Set(out)];
}

/** Recorte RGBA → tensor CHW normalizado (preenche com zero além da borda). */
export function tileTensor(px: Uint8ClampedArray, w: number, h: number, x0: number, y0: number, size: number, mean: number[], std: number[]) {
  const t = new Float32Array(3 * size * size);
  const plane = size * size;
  for (let y = 0; y < size; y++) {
    const yy = y0 + y;
    for (let x = 0; x < size; x++) {
      const xx = x0 + x;
      const o = y * size + x;
      if (yy >= h || xx >= w) {
        for (let c = 0; c < 3; c++) t[c * plane + o] = (0 - mean[c]!) / std[c]!;
        continue;
      }
      const i = (yy * w + xx) * 4;
      for (let c = 0; c < 3; c++) t[c * plane + o] = (px[i + c]! / 255 - mean[c]!) / std[c]!;
    }
  }
  return t;
}

/**
 * Mapas de probabilidade (média nas sobreposições) → detecções das classes ligadas.
 * `probs[c]` tem w×h; vale a classe de maior probabilidade, se passar do limiar dela.
 */
export function probsToDetections(probs: Float32Array[], w: number, h: number, card: ModelCard): Detection[] {
  const N = w * h;
  const valid = new Uint8Array(N).fill(1);
  const best = new Uint8Array(N);
  const bestP = new Float32Array(N);
  for (let c = 0; c < probs.length; c++) {
    const p = probs[c]!;
    for (let i = 0; i < N; i++)
      if (p[i]! > bestP[i]!) {
        bestP[i] = p[i]!;
        best[i] = c;
      }
  }
  const out: Detection[] = [];
  const maxSide = Math.max(w, h);
  const minArea = Math.max(60, N * 0.00012);
  for (const cls of enabledClasses(card)) {
    const t = card.thresholds[cls.name] ?? 0.5;
    const mask = new Uint8Array(N);
    for (let i = 0; i < N; i++) if (best[i] === cls.id && bestP[i]! >= t) mask[i] = 1;
    const sm = cls.name === "fissura" ? mask : smooth(mask, valid, w, h, 1, 0.5);
    const { lab, comps } = components(sm, w, h, [probs[cls.id]!], cls.name === "fissura" ? 12 : minArea);
    const m = card.metrics.model[cls.name];
    const val = m?.precision != null ? ` Na validação, ${Math.round(m.precision * 100)}% das sugestões desta classe estavam certas.` : "";
    for (const c of comps) {
      const prob = c.f[0]!;
      const reason = `Modelo ${card.version}: ${LABEL[cls.name]} com probabilidade média de ${Math.round(prob * 100)}%.${val}`;
      if (cls.name === "fissura") {
        const len = Math.sqrt(12 * axes(c).l1);
        if (len < Math.max(20, maxSide / 60)) continue;
        const line = centerline(lab, w, c);
        if (line.length < 2) continue;
        out.push({ code: "FIS", kind: "linha", points: line, confidence: prob, detector: `${card.version}:fissura`, size: len * len, reason });
        continue;
      }
      let code = CODE_OF[cls.name]!;
      // umidade junto à base da imagem: ascendente
      if (cls.name === "mancha" && c.y1 > h * 0.85 && c.y0 > h * 0.45) code = "UMA";
      if (cls.name === "biologico" && c.n < minArea * 3) {
        out.push({ code: "VEG", kind: "ponto", points: [[c.cx, c.cy]], confidence: prob, detector: `${card.version}:${cls.name}`, size: c.n, reason });
        continue;
      }
      const poly = polygonOf(lab, w, c, 64);
      if (poly.length >= 3) out.push({ code, kind: "area", points: poly, confidence: prob, detector: `${card.version}:${cls.name}`, size: c.n, reason });
    }
  }
  return out;
}

/** Roda o modelo na imagem inteira, em recortes com sobreposição, e devolve as detecções. */
export async function runModel(
  ort: typeof Ort,
  session: Ort.InferenceSession,
  px: Uint8ClampedArray,
  w: number,
  h: number,
  card: ModelCard,
  onProgress?: (done: number, total: number) => void,
): Promise<Detection[]> {
  const { size, mean, std, overlap, name } = card.input;
  const C = card.classes.length;
  const probs = Array.from({ length: C }, () => new Float32Array(w * h));
  const cnt = new Float32Array(w * h);
  const xs = tileStarts(w, size, overlap);
  const ys = tileStarts(h, size, overlap);
  const total = xs.length * ys.length;
  let done = 0;
  for (const y0 of ys) {
    for (const x0 of xs) {
      const input = new ort.Tensor("float32", tileTensor(px, w, h, x0, y0, size, mean, std), [1, 3, size, size]);
      const res = await session.run({ [name]: input });
      const out = res[card.output]!.data as Float32Array;
      const plane = size * size;
      for (let y = 0; y < size && y0 + y < h; y++)
        for (let x = 0; x < size && x0 + x < w; x++) {
          const i = (y0 + y) * w + x0 + x;
          cnt[i]!++;
          for (let c = 0; c < C; c++) probs[c]![i]! += out[c * plane + y * size + x]!;
        }
      onProgress?.(++done, total);
    }
  }
  for (let i = 0; i < w * h; i++) if (cnt[i]! > 1) for (let c = 0; c < C; c++) probs[c]![i]! /= cnt[i]!;
  return probsToDetections(probs, w, h, card);
}
