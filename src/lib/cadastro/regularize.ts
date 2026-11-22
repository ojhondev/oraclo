/**
 * "Limpeza" do desenho pela lógica da fachada: vãos do mesmo andar alinham verga e peitoril, vãos
 * parecidos ficam com a mesma largura, os eixos verticais se alinham entre andares e a fachada
 * tende à simetria. Cada ajuste é pequeno (dentro de tolerâncias) e fica registrado em `raw`.
 * Puro, testado em tests/cadastro.test.ts.
 */
import type { Box, Vao } from "./analyze";

export type RegVao = Vao & { row: number; col: number; raw: Box };
export type Row = { y0: number; y1: number; width: number; height: number; count: number };
export type Regularized = { vaos: RegVao[]; rows: Row[]; columns: number; axis: number | null };

const median = (a: number[]) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};
const cx = (b: Box) => (b.x0 + b.x1) / 2;
const bw = (b: Box) => b.x1 - b.x0;
const bh = (b: Box) => b.y1 - b.y0;

/** Agrupa valores próximos (ordenados): entra no grupo se ficar a até `tol(grupo)` da mediana dele. */
function cluster<T>(items: T[], value: (t: T) => number, tol: (center: number) => number): T[][] {
  const sorted = [...items].sort((a, b) => value(a) - value(b));
  const groups: T[][] = [];
  for (const it of sorted) {
    const g = groups[groups.length - 1];
    if (g && Math.abs(value(it) - median(g.map(value))) <= tol(median(g.map(value)))) g.push(it);
    else groups.push([it]);
  }
  return groups;
}

export function regularize(input: Vao[], facade: Box): Regularized {
  if (!input.length) return { vaos: [], rows: [], columns: 0, axis: null };
  const vaos: RegVao[] = input.map((v) => ({ ...v, row: -1, col: -1, raw: { x0: v.x0, y0: v.y0, x1: v.x1, y1: v.y1 } }));
  const mh = median(vaos.map(bh));
  const mw = median(vaos.map(bw));

  // 1. fiadas (andares): vãos cujos centros verticais estão próximos
  const rowGroups = cluster(vaos, (v) => (v.y0 + v.y1) / 2, () => mh * 0.45);
  const rows: Row[] = [];
  rowGroups.forEach((g, r) => {
    // dentro da fiada, vãos de altura parecida alinham verga e peitoril (porta e janela não se misturam)
    for (const sub of cluster(g, bh, (c) => c * 0.18)) {
      const y0 = median(sub.map((v) => v.y0));
      const y1 = median(sub.map((v) => v.y1));
      for (const v of sub) {
        v.y0 = y0;
        v.y1 = y1;
        v.row = r;
      }
    }
    rows.push({ y0: Math.min(...g.map((v) => v.y0)), y1: Math.max(...g.map((v) => v.y1)), width: median(g.map(bw)), height: median(g.map(bh)), count: g.length });
  });

  // 2. larguras: vãos de largura parecida ficam com a mesma largura (mantendo o centro)
  for (const g of cluster(vaos, bw, (c) => c * 0.1)) {
    const wMed = median(g.map(bw));
    for (const v of g) {
      const c = cx(v);
      v.x0 = c - wMed / 2;
      v.x1 = c + wMed / 2;
    }
  }

  // 3. eixos verticais: centros próximos entre andares se alinham
  const cols = cluster(vaos, cx, () => mw * 0.4);
  cols.forEach((g, c) => {
    const m = median(g.map(cx));
    for (const v of g) {
      const half = bw(v) / 2;
      v.x0 = m - half;
      v.x1 = m + half;
      v.col = c;
    }
  });

  // 4. simetria: se os eixos se espelham em torno do centro da fachada, ficam exatamente espelhados
  const centers = cols.map((g) => median(g.map(cx)));
  const axisGuess = (Math.min(...vaos.map((v) => v.x0)) + Math.max(...vaos.map((v) => v.x1))) / 2;
  const facadeAxis = (facade.x0 + facade.x1) / 2;
  const axis = Math.abs(axisGuess - facadeAxis) < (facade.x1 - facade.x0) * 0.05 ? (axisGuess + facadeAxis) / 2 : axisGuess;
  let mirrored = 0;
  const shift = new Map<number, number>();
  centers.forEach((c, i) => {
    const d = c - axis;
    if (Math.abs(d) < mw * 0.4) {
      shift.set(i, axis - c); // eixo central
      mirrored++;
      return;
    }
    const j = centers.findIndex((o, k) => k !== i && Math.abs(o - axis + d) < mw * 0.4);
    if (j >= 0) {
      const dd = (Math.abs(d) + Math.abs(centers[j]! - axis)) / 2;
      shift.set(i, axis + Math.sign(d) * dd - c);
      mirrored++;
    }
  });
  const symmetric = mirrored >= centers.length * 0.7;
  if (symmetric)
    for (const v of vaos) {
      const s = shift.get(v.col) ?? 0;
      v.x0 += s;
      v.x1 += s;
    }

  const round = (n: number) => Math.round(n * 10) / 10;
  for (const v of vaos) {
    v.x0 = round(v.x0);
    v.x1 = round(v.x1);
    v.y0 = round(v.y0);
    v.y1 = round(v.y1);
  }
  // depois de alinhar, achados repetidos do mesmo vão viram um só
  const unique: RegVao[] = [];
  for (const v of vaos) {
    const dup = unique.find((u) => {
      const ix = Math.max(0, Math.min(u.x1, v.x1) - Math.max(u.x0, v.x0));
      const iy = Math.max(0, Math.min(u.y1, v.y1) - Math.max(u.y0, v.y0));
      return ix * iy > 0.6 * Math.min(bw(u) * bh(u), bw(v) * bh(v));
    });
    if (!dup) unique.push(v);
    else if (v.score > dup.score) Object.assign(dup, v);
  }
  return { vaos: unique, rows, columns: cols.length, axis: symmetric ? round(axis) : null };
}
