/**
 * Modo semiautomático: a partir de UM vão marcado pelo usuário, acha os vãos parecidos na fachada
 * (mesma aparência, tamanhos próximos) por correlação normalizada, com supressão de sobreposições.
 * Como a vista está em verdadeira grandeza, vãos iguais têm o mesmo tamanho em pixels.
 * Puro, testado em tests/cadastro.test.ts.
 */
import type { Box } from "./analyze";
import { ncc, type Gray } from "./complete";
import { frameSupport, snapBox, type Edges } from "./refine";

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
  if (sd < 6) return 0;
  for (let k = 0; k < out.length; k++) out[k] = out[k]! / sd;
  return sd;
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
export function findSimilar(g: Gray, seedIn: Box, within: Box, opts: { minScore?: number; scales?: number[]; edges?: Edges; minFrame?: number } = {}): Match[] {
  const minScore = opts.minScore ?? 0.5;
  // Vão com caixilho: o modelo é o retângulo marcado. Vão liso (miolo sem variação, sem caixilho):
  // encaixa na borda real e o modelo ganha uma margem igual em volta, para o contraste com a parede
  // entrar na comparação (senão o recorte é só uma mancha uniforme).
  const probe = new Float32Array(20 * 28);
  const iw = seedIn.x1 - seedIn.x0, ih = seedIn.y1 - seedIn.y0;
  const plain = patchAt(g, seedIn.x0 + iw * 0.2, seedIn.y0 + ih * 0.2, iw * 0.6, ih * 0.6, 20, 28, probe) < 12;
  const seed = plain && opts.edges ? snapBox(opts.edges, snapBox(opts.edges, seedIn, 0.2), 0.08) : seedIn;
  const scales = opts.scales ?? [0.85, 1, 1.18];
  const gw = 20, gh = 28;
  const tpl = new Float32Array(gw * gh);
  const sw = seed.x1 - seed.x0, sh = seed.y1 - seed.y0;
  const M = plain ? 0.15 : 0;
  const mx = sw * M, my = sh * M;
  if (!patchAt(g, seed.x0 - mx, seed.y0 - my, sw + 2 * mx, sh + 2 * my, gw, gh, tpl)) return [{ ...seed, score: 1, seed: true }];
  const buf = new Float32Array(gw * gh);
  const cand: Match[] = [];
  for (const sx of scales)
    for (const sy of scales) {
      const bw = sw * sx, bh = sh * sy;
      const step = Math.max(2, Math.round(Math.min(bw, bh) * (plain ? 0.04 : 0.06)));
      const ex = bw * M, ey = bh * M;
      for (let y0 = within.y0; y0 + bh <= within.y1; y0 += step)
        for (let x0 = within.x0; x0 + bw <= within.x1; x0 += step) {
          if (!patchAt(g, x0 - ex, y0 - ey, bw + 2 * ex, bh + 2 * ey, gw, gh, buf)) continue;
          const s = ncc(tpl, buf);
          if (s >= minScore) cand.push({ x0, y0, x1: x0 + bw, y1: y0 + bh, score: s });
        }
    }
  // supressão: fica o melhor de cada grupo que se sobrepõe
  cand.sort((a, b) => b.score - a.score);
  const first: Match[] = [];
  for (const c of cand) if (iou(seed, c) < 0.25 && first.every((o) => iou(o, c) < 0.25)) first.push(c);
  const e = opts.edges;
  if (!e) return [{ ...seed, score: 1, seed: true }, ...first.map((c) => ({ ...c, score: Math.round(c.score * 100) / 100 }))];

  // com bordas: cada caixa encaixa na moldura real e só fica se tiver moldura nos quatro lados
  const seedBox = plain ? seed : snapBox(e, seed);
  const seedFrame = frameSupport(e, seedBox);
  const minFrame = opts.minFrame ?? Math.max(0.3, seedFrame.min * 0.55);
  const out: Match[] = [{ ...seedBox, score: 1, seed: true }];
  const refined = first
    .map((c) => {
      const b = snapBox(e, c);
      const fr = frameSupport(e, b);
      return { ...b, score: Math.round(c.score * (0.6 + 0.4 * fr.mean) * 100) / 100, frame: fr.min };
    })
    .filter((c) => c.frame >= minFrame && c.score >= minScore)
    .sort((a, b) => b.score - a.score);
  for (const c of refined) if (out.every((o) => iou(o, c) < 0.3)) out.push({ x0: c.x0, y0: c.y0, x1: c.x1, y1: c.y1, score: c.score });
  return out;
}

/** Semelhança (−1..1) entre dois recortes da mesma imagem, reamostrados no mesmo tamanho. */
export function similarity(g: Gray, a: Box, b: Box): number {
  const gw = 20, gh = 28;
  const pa = new Float32Array(gw * gh), pb = new Float32Array(gw * gh);
  if (!patchAt(g, a.x0, a.y0, a.x1 - a.x0, a.y1 - a.y0, gw, gh, pa)) return 0;
  if (!patchAt(g, b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, gw, gh, pb)) return 0;
  return ncc(pa, pb);
}

/**
 * Tipo de cada vão: o modelo (semente) mais parecido com ele. Resolve o caso de um vão achado por
 * duas sementes, em que as notas de busca não são comparáveis entre si.
 */
export function assignFamilies<T extends Box & { family?: number }>(g: Gray, vaos: T[], models: Box[]): T[] {
  return vaos.map((v) => {
    let best = v.family ?? 0, bs = -2;
    models.forEach((m, i) => {
      // peso pelo tamanho: um vão bem maior ou menor que o modelo dificilmente é do mesmo tipo
      const size = Math.min((v.x1 - v.x0) / (m.x1 - m.x0), (m.x1 - m.x0) / (v.x1 - v.x0));
      const s = similarity(g, v, m) * (0.7 + 0.3 * size);
      if (s > bs) {
        bs = s;
        best = i;
      }
    });
    return { ...v, family: best };
  });
}
