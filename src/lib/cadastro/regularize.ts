/**
 * "Limpeza" do desenho pela lógica da fachada, com cuidado para não deformar o que foi medido:
 * - só vãos do MESMO TIPO (família = mesma semente) igualam largura e altura;
 * - todo ajuste é pequeno (limite de alguns % do tamanho); acima disso, vale a medida;
 * - caixas empilhadas no mesmo eixo (as folhas de uma janela alta) viram um vão só.
 * Cada vão guarda a medida original em `raw`. Puro, testado em tests/cadastro.test.ts.
 */
import type { Box, Vao } from "./analyze";

export type RegVao = Vao & { row: number; col: number; raw: Box; family?: number };
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

const byFamily = <T extends { family?: number }>(items: T[]) => {
  const m = new Map<number, T[]>();
  for (const it of items) {
    const k = it.family ?? -1;
    m.set(k, [...(m.get(k) ?? []), it]);
  }
  return [...m.values()];
};

/** Junta caixas empilhadas no mesmo eixo, de largura parecida, encostadas na vertical. */
export function mergeStacked<T extends Vao & { family?: number }>(items: T[]): T[] {
  const list = items.map((v) => ({ ...v }));
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < list.length && !changed; i++)
      for (let j = i + 1; j < list.length && !changed; j++) {
        const a = list[i]!, b = list[j]!;
        const w = Math.max(bw(a), bw(b));
        const sameAxis = Math.abs(cx(a) - cx(b)) < w * 0.15 && Math.abs(bw(a) - bw(b)) < w * 0.15;
        const gap = Math.max(a.y0, b.y0) - Math.min(a.y1, b.y1);
        if (sameAxis && gap < Math.min(bh(a), bh(b)) * 0.12) {
          a.x0 = Math.min(a.x0, b.x0);
          a.x1 = Math.max(a.x1, b.x1);
          a.y0 = Math.min(a.y0, b.y0);
          a.y1 = Math.max(a.y1, b.y1);
          a.score = Math.max(a.score, b.score);
          list.splice(j, 1);
          changed = true;
        }
      }
  }
  return list;
}

/** Move `v` para `target` só se a diferença for pequena (até `lim`); senão mantém a medida. */
const nudge = (v: number, target: number, lim: number) => (Math.abs(target - v) <= lim ? target : v);

export function regularize(input: (Vao & { family?: number })[], facade: Box): Regularized {
  if (!input.length) return { vaos: [], rows: [], columns: 0, axis: null };
  const merged = mergeStacked(input);
  const vaos: RegVao[] = merged.map((v) => ({ ...v, row: -1, col: -1, raw: { x0: v.x0, y0: v.y0, x1: v.x1, y1: v.y1 } }));
  const mh = median(vaos.map(bh));

  // 1. fiadas (andares): vãos cujos centros verticais estão próximos
  const rowGroups = cluster(vaos, (v) => (v.y0 + v.y1) / 2, () => mh * 0.45);
  const rows: Row[] = [];
  rowGroups.forEach((g, r) => {
    for (const v of g) v.row = r;
    // mesma fiada + mesmo tipo + altura parecida: verga e peitoril alinhados
    for (const fam of byFamily(g))
      for (const sub of cluster(fam, bh, (c) => c * 0.08)) {
        const y0 = median(sub.map((v) => v.y0));
        const y1 = median(sub.map((v) => v.y1));
        for (const v of sub) {
          v.y0 = nudge(v.y0, y0, bh(v) * 0.06);
          v.y1 = nudge(v.y1, y1, bh(v) * 0.06);
        }
      }
    rows.push({ y0: Math.min(...g.map((v) => v.y0)), y1: Math.max(...g.map((v) => v.y1)), width: median(g.map(bw)), height: median(g.map(bh)), count: g.length });
  });

  // 2. larguras: só dentro do mesmo tipo, com diferença pequena
  for (const fam of byFamily(vaos))
    for (const g of cluster(fam, bw, (c) => c * 0.06)) {
      const wMed = median(g.map(bw));
      for (const v of g) {
        if (Math.abs(bw(v) - wMed) > wMed * 0.06) continue;
        const c = cx(v);
        v.x0 = c - wMed / 2;
        v.x1 = c + wMed / 2;
      }
    }

  // 3. eixos verticais: centros muito próximos (até 12% da largura) se alinham
  const cols = cluster(vaos, cx, (c) => median(vaos.filter((v) => Math.abs(cx(v) - c) < bw(v)).map(bw)) * 0.12 || 1);
  cols.forEach((g, c) => {
    const m = median(g.map(cx));
    for (const v of g) {
      const s = nudge(cx(v), m, bw(v) * 0.1) - cx(v);
      v.x0 += s;
      v.x1 += s;
      v.col = c;
    }
  });

  // 4. simetria: eixos que se espelham em torno do centro ficam exatamente espelhados (ajuste pequeno)
  const centers = cols.map((g) => median(g.map(cx)));
  const widths = cols.map((g) => median(g.map(bw)));
  const axisGuess = (Math.min(...vaos.map((v) => v.x0)) + Math.max(...vaos.map((v) => v.x1))) / 2;
  const facadeAxis = (facade.x0 + facade.x1) / 2;
  const axis = Math.abs(axisGuess - facadeAxis) < (facade.x1 - facade.x0) * 0.05 ? (axisGuess + facadeAxis) / 2 : axisGuess;
  let mirrored = 0;
  const shift = new Map<number, number>();
  centers.forEach((c, i) => {
    const lim = widths[i]! * 0.08;
    const d = c - axis;
    if (Math.abs(d) < lim) {
      shift.set(i, axis - c);
      mirrored++;
      return;
    }
    const j = centers.findIndex((o, k) => k !== i && Math.abs(o - axis + d) < widths[i]! * 0.25);
    if (j >= 0) {
      const target = axis + Math.sign(d) * (Math.abs(d) + Math.abs(centers[j]! - axis)) / 2;
      if (Math.abs(target - c) <= lim) shift.set(i, target - c);
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
  // achados repetidos do mesmo vão viram um só
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
