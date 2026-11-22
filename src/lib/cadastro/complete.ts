/**
 * Completar a grade da fachada: os andares vêm das faixas (cornijas), os eixos vêm dos vãos achados
 * com segurança. Onde um eixo cruza um andar sem vão, procura-se o mesmo vão (o recorte de um vão
 * do eixo) deslizando na vertical dentro do andar; aceita só com semelhança alta (correlação
 * normalizada). Puro, testado em tests/cadastro.test.ts.
 */
import type { Band, Box, Vao } from "./analyze";

export type Gray = { data: Float32Array; w: number; h: number };

export function toGray(px: Uint8ClampedArray, w: number, h: number): Gray {
  const data = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) data[i] = 0.299 * px[i * 4]! + 0.587 * px[i * 4 + 1]! + 0.114 * px[i * 4 + 2]!;
  return { data, w, h };
}

/** Recorte (amostrado em grade fixa gw×gh) normalizado: média 0, desvio 1. Nulo se for liso. */
function patch(g: Gray, b: Box, gw = 24, gh = 32): Float32Array | null {
  const out = new Float32Array(gw * gh);
  const bw = b.x1 - b.x0, bh = b.y1 - b.y0;
  let sum = 0;
  for (let j = 0; j < gh; j++)
    for (let i = 0; i < gw; i++) {
      const x = Math.min(g.w - 1, Math.max(0, Math.round(b.x0 + ((i + 0.5) / gw) * bw)));
      const y = Math.min(g.h - 1, Math.max(0, Math.round(b.y0 + ((j + 0.5) / gh) * bh)));
      const v = g.data[y * g.w + x]!;
      out[j * gw + i] = v;
      sum += v;
    }
  const mean = sum / out.length;
  let sq = 0;
  for (let k = 0; k < out.length; k++) {
    out[k] = out[k]! - mean;
    sq += out[k]! * out[k]!;
  }
  const sd = Math.sqrt(sq / out.length);
  if (sd < 6) return null;
  for (let k = 0; k < out.length; k++) out[k] = out[k]! / sd;
  return out;
}

/** Correlação normalizada entre dois recortes (−1..1). */
export function ncc(a: Float32Array, b: Float32Array) {
  let s = 0;
  for (let k = 0; k < a.length; k++) s += a[k]! * b[k]!;
  return s / a.length;
}

/** Andares: intervalos entre faixas fortes, com altura mínima. */
export function floorsOf(bands: Band[], facade: Box): { y0: number; y1: number }[] {
  const fh = facade.y1 - facade.y0;
  const ys = [facade.y0, ...bands.map((b) => b.y), facade.y1].sort((a, b) => a - b);
  const out: { y0: number; y1: number }[] = [];
  for (let i = 0; i < ys.length - 1; i++) if (ys[i + 1]! - ys[i]! > fh * 0.08) out.push({ y0: ys[i]!, y1: ys[i + 1]! });
  return out;
}

const overlap = (a: Box, b: Box) => {
  const ix = Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0));
  const iy = Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
  const inter = ix * iy;
  return inter / Math.min((a.x1 - a.x0) * (a.y1 - a.y0), (b.x1 - b.x0) * (b.y1 - b.y0));
};

/**
 * Devolve os vãos achados + os completados (marcados com `found: "grade"`). `minScore` é a
 * correlação mínima para aceitar.
 */
export function completeGrid(g: Gray, vaos: Vao[], bands: Band[], facade: Box, minScore = 0.55): (Vao & { found?: "grade" })[] {
  const out: (Vao & { found?: "grade" })[] = vaos.map((v) => ({ ...v }));
  if (vaos.length < 2) return out;
  const floors = floorsOf(bands, facade);
  const fw = facade.x1 - facade.x0;
  // eixos: centros próximos (até 3% da largura) viram um eixo; cada eixo guarda seus vãos
  const sorted = [...vaos].sort((a, b) => (a.x0 + a.x1) - (b.x0 + b.x1));
  const axes: Vao[][] = [];
  for (const v of sorted) {
    const c = (v.x0 + v.x1) / 2;
    const last = axes[axes.length - 1];
    if (last && Math.abs(c - (last[0]!.x0 + last[0]!.x1) / 2) < fw * 0.03) last.push(v);
    else axes.push([v]);
  }
  for (const axis of axes) {
    const ref = [...axis].sort((a, b) => b.score - a.score)[0]!;
    const tpl = patch(g, ref);
    if (!tpl) continue;
    const bw = ref.x1 - ref.x0, bh = ref.y1 - ref.y0;
    const cx = (ref.x0 + ref.x1) / 2;
    for (const fl of floors) {
      if (bh > (fl.y1 - fl.y0) * 0.95) continue; // o vão não cabe neste andar
      const hasOne = out.some((v) => Math.abs((v.x0 + v.x1) / 2 - cx) < fw * 0.03 && (v.y0 + v.y1) / 2 > fl.y0 && (v.y0 + v.y1) / 2 < fl.y1);
      if (hasOne) continue;
      let best = { s: -1, box: null as Box | null };
      const stepY = Math.max(1, Math.round(bh * 0.04));
      const stepX = Math.max(1, Math.round(bw * 0.05));
      for (let y0 = fl.y0; y0 + bh <= fl.y1; y0 += stepY)
        for (let dx = -2; dx <= 2; dx++) {
          const box = { x0: cx - bw / 2 + dx * stepX, y0, x1: cx + bw / 2 + dx * stepX, y1: y0 + bh };
          const p = patch(g, box);
          if (!p) continue;
          const s = ncc(tpl, p);
          if (s > best.s) best = { s, box };
        }
      if (best.box && best.s >= minScore && !out.some((v) => overlap(v, best.box!) > 0.3))
        out.push({ ...best.box, arched: ref.arched, score: Math.round(best.s * 100) / 100, found: "grade" });
    }
  }
  return out;
}
