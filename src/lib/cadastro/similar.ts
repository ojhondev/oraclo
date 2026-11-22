/**
 * Modo semiautomático: a partir de UM vão marcado pelo usuário, acha os vãos parecidos na fachada
 * (mesma aparência, tamanhos próximos) por correlação normalizada, com supressão de sobreposições.
 * Como a vista está em verdadeira grandeza, vãos iguais têm o mesmo tamanho em pixels.
 * Puro, testado em tests/cadastro.test.ts.
 */
import type { Box } from "./analyze";
import { ncc, type Gray } from "./complete";

export type Match = Box & { score: number; seed?: boolean };

function patchAt(g: Gray, x0: number, y0: number, bw: number, bh: number, gw: number, gh: number, out: Float32Array) {
  let sum = 0;
  for (let j = 0; j < gh; j++) {
    const y = Math.min(g.h - 1, Math.max(0, Math.round(y0 + ((j + 0.5) / gh) * bh)));
    for (let i = 0; i < gw; i++) {
      const x = Math.min(g.w - 1, Math.max(0, Math.round(x0 + ((i + 0.5) / gw) * bw)));
      const v = g.data[y * g.w + x]!;
      out[j * gw + i] = v;
      sum += v;
    }
  }
  const mean = sum / out.length;
  let sq = 0;
  for (let k = 0; k < out.length; k++) {
    const d = out[k]! - mean;
    out[k] = d;
    sq += d * d;
  }
  const sd = Math.sqrt(sq / out.length);
  if (sd < 6) return false;
  for (let k = 0; k < out.length; k++) out[k] = out[k]! / sd;
  return true;
}

const iou = (a: Box, b: Box) => {
  const ix = Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0));
  const iy = Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
  const inter = ix * iy;
  const ua = (a.x1 - a.x0) * (a.y1 - a.y0) + (b.x1 - b.x0) * (b.y1 - b.y0) - inter;
  return inter / ua;
};

/**
 * Procura na área `within` vãos parecidos com `seed`. `scales` = variações de largura e altura
 * aceitas (vãos da mesma família com tamanho um pouco diferente). Devolve o semente + os achados.
 */
export function findSimilar(g: Gray, seed: Box, within: Box, opts: { minScore?: number; scales?: number[] } = {}): Match[] {
  const minScore = opts.minScore ?? 0.5;
  const scales = opts.scales ?? [0.85, 1, 1.18];
  const gw = 20, gh = 28;
  const tpl = new Float32Array(gw * gh);
  const sw = seed.x1 - seed.x0, sh = seed.y1 - seed.y0;
  if (!patchAt(g, seed.x0, seed.y0, sw, sh, gw, gh, tpl)) return [{ ...seed, score: 1, seed: true }];
  const buf = new Float32Array(gw * gh);
  const cand: Match[] = [];
  for (const sx of scales)
    for (const sy of scales) {
      const bw = sw * sx, bh = sh * sy;
      const step = Math.max(2, Math.round(Math.min(bw, bh) * 0.06));
      for (let y0 = within.y0; y0 + bh <= within.y1; y0 += step)
        for (let x0 = within.x0; x0 + bw <= within.x1; x0 += step) {
          if (!patchAt(g, x0, y0, bw, bh, gw, gh, buf)) continue;
          const s = ncc(tpl, buf);
          if (s >= minScore) cand.push({ x0, y0, x1: x0 + bw, y1: y0 + bh, score: s });
        }
    }
  // supressão: fica o melhor de cada grupo que se sobrepõe
  cand.sort((a, b) => b.score - a.score);
  const out: Match[] = [{ ...seed, score: 1, seed: true }];
  for (const c of cand) if (out.every((o) => iou(o, c) < 0.25)) out.push({ ...c, score: Math.round(c.score * 100) / 100 });
  return out;
}
