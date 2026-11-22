/**
 * Moldura e encaixe: a vista é retificada, então janela tem bordas retas na horizontal e na
 * vertical. `frameSupport` mede quanto cada lado de uma caixa coincide com uma borda nítida;
 * `snapBox` desliza cada lado até a borda mais forte por perto (a caixa "abraça" a janela real).
 * Puro, testado em tests/cadastro.test.ts.
 */
import type { Box } from "./analyze";
import type { Gray } from "./complete";

export type Edges = { gx: Float32Array; gy: Float32Array; w: number; h: number; t: number };

/** Gradientes horizontais e verticais (diferença central numa versão levemente suavizada). */
export function edgesOf(g: Gray): Edges {
  const { w, h, data } = g;
  const s = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      s[i] = (data[i]! * 4 + data[i - 1]! + data[i + 1]! + data[i - w]! + data[i + w]!) / 8;
    }
  const gx = new Float32Array(w * h);
  const gy = new Float32Array(w * h);
  const sample: number[] = [];
  for (let y = 2; y < h - 2; y++)
    for (let x = 2; x < w - 2; x++) {
      const i = y * w + x;
      gx[i] = Math.abs(s[i + 1]! - s[i - 1]!);
      gy[i] = Math.abs(s[i + w]! - s[i - w]!);
      if ((x + y) % 7 === 0) sample.push(Math.max(gx[i]!, gy[i]!));
    }
  sample.sort((a, b) => a - b);
  // borda "nítida" = entre as 15% mais fortes da imagem (adapta à luz e ao contraste da foto)
  const t = Math.max(8, sample[Math.floor(sample.length * 0.85)] ?? 8);
  return { gx, gy, w, h, t };
}

/** Fração de um segmento horizontal (y fixo) com borda horizontal forte a até ±2 px. */
function hSupport(e: Edges, y: number, x0: number, x1: number) {
  const yy = Math.round(y);
  let n = 0, tot = 0;
  for (let x = Math.round(x0); x <= Math.round(x1); x++) {
    if (x < 0 || x >= e.w) continue;
    tot++;
    let m = 0;
    for (let d = -2; d <= 2; d++) {
      const r = yy + d;
      if (r >= 0 && r < e.h) m = Math.max(m, e.gy[r * e.w + x]!);
    }
    if (m >= e.t) n++;
  }
  return tot ? n / tot : 0;
}

/** Fração de um segmento vertical (x fixo) com borda vertical forte a até ±2 px. */
function vSupport(e: Edges, x: number, y0: number, y1: number) {
  const xx = Math.round(x);
  let n = 0, tot = 0;
  for (let y = Math.round(y0); y <= Math.round(y1); y++) {
    if (y < 0 || y >= e.h) continue;
    tot++;
    let m = 0;
    for (let d = -2; d <= 2; d++) {
      const c = xx + d;
      if (c >= 0 && c < e.w) m = Math.max(m, e.gx[y * e.w + c]!);
    }
    if (m >= e.t) n++;
  }
  return tot ? n / tot : 0;
}

/** Apoio de moldura de cada lado (0..1) e o pior deles: janela de verdade tem os quatro. */
export function frameSupport(e: Edges, b: Box) {
  const top = hSupport(e, b.y0, b.x0, b.x1);
  const bottom = hSupport(e, b.y1, b.x0, b.x1);
  const left = vSupport(e, b.x0, b.y0, b.y1);
  const right = vSupport(e, b.x1, b.y0, b.y1);
  return { top, bottom, left, right, min: Math.min(top, bottom, left, right), mean: (top + bottom + left + right) / 4 };
}

/**
 * Encaixa cada lado na borda mais forte a até `frac` do tamanho da caixa (lados independentes),
 * preferindo ficar perto da posição original quando há empate.
 */
export function snapBox(e: Edges, b: Box, frac = 0.12): Box {
  const bw = b.x1 - b.x0, bh = b.y1 - b.y0;
  const rx = Math.max(2, Math.round(bw * frac)), ry = Math.max(2, Math.round(bh * frac));
  const best = (cur: number, r: number, f: (v: number) => number) => {
    let pos = cur, score = f(cur) + 0.02;
    for (let d = -r; d <= r; d++) {
      const s = f(cur + d) - Math.abs(d) * 0.002;
      if (s > score) {
        score = s;
        pos = cur + d;
      }
    }
    return pos;
  };
  const y0 = best(b.y0, ry, (y) => hSupport(e, y, b.x0, b.x1));
  const y1 = best(b.y1, ry, (y) => hSupport(e, y, b.x0, b.x1));
  const x0 = best(b.x0, rx, (x) => vSupport(e, x, y0, y1));
  const x1 = best(b.x1, rx, (x) => vSupport(e, x, y0, y1));
  return x1 - x0 > bw * 0.5 && y1 - y0 > bh * 0.5 ? { x0, y0, x1, y1 } : b;
}
