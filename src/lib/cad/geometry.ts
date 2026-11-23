/**
 * Geometria do ArchRay CAD: caixas, distância de um ponto até cada entidade (seleção), pontos de
 * encaixe (extremidade, meio, centro, quadrante, interseção, perpendicular) e seleção por janela /
 * cruzamento. Puro, testado em tests/cad.test.ts.
 */
import { expandBlock } from "./blocks";
import type { Box, Entity, P } from "./types";

const TAU = Math.PI * 2;
export const dist = (a: P, b: P) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const mid = (a: P, b: P): P => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const norm = (a: number) => ((a % TAU) + TAU) % TAU;

/** Ângulo está dentro do arco (anti-horário de a0 a a1)? */
export function inArc(ang: number, a0: number, a1: number) {
  const s = norm(a1 - a0);
  return norm(ang - a0) <= s + 1e-9;
}

/** Segmentos retos da entidade (linhas, lados de polilinha, cota). */
export function segments(e: Entity): [P, P][] {
  switch (e.t) {
    case "line":
      return [[e.a, e.b]];
    case "poly": {
      const s: [P, P][] = [];
      for (let i = 0; i < e.pts.length - 1; i++) s.push([e.pts[i]!, e.pts[i + 1]!]);
      if (e.closed && e.pts.length > 2) s.push([e.pts[e.pts.length - 1]!, e.pts[0]!]);
      return s;
    }
    case "block":
      return expandBlock(e).flatMap(segments);
    case "image":
      return [
        [e.p, [e.p[0] + e.w, e.p[1]]],
        [[e.p[0] + e.w, e.p[1]], [e.p[0] + e.w, e.p[1] + e.h]],
        [[e.p[0] + e.w, e.p[1] + e.h], [e.p[0], e.p[1] + e.h]],
        [[e.p[0], e.p[1] + e.h], e.p],
      ];
    default:
      return [];
  }
}

/** Geometria da cota: pontos da linha de cota (deslocada) e posição do texto. */
export function dimGeometry(a: P, b: P, off: number) {
  const L = dist(a, b) || 1e-9;
  const nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L; // normal à esquerda
  const da: P = [a[0] + nx * off, a[1] + ny * off];
  const db: P = [b[0] + nx * off, b[1] + ny * off];
  return { da, db, text: mid(da, db), angle: Math.atan2(b[1] - a[1], b[0] - a[0]), length: L, n: [nx, ny] as P };
}

/** Largura aproximada de um texto (fonte técnica: ~0,6 da altura por caractere). */
export const textWidth = (s: string, h: number) => s.length * h * 0.6;

export function bbox(e: Entity): Box {
  const pts: P[] = [];
  switch (e.t) {
    case "line":
      pts.push(e.a, e.b);
      break;
    case "poly":
      pts.push(...e.pts);
      break;
    case "circle":
      return { x0: e.c[0] - e.r, y0: e.c[1] - e.r, x1: e.c[0] + e.r, y1: e.c[1] + e.r };
    case "arc": {
      pts.push(arcPoint(e.c, e.r, e.a0), arcPoint(e.c, e.r, e.a1));
      for (const q of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) if (inArc(q, e.a0, e.a1)) pts.push(arcPoint(e.c, e.r, q));
      break;
    }
    case "text":
      return { x0: e.p[0], y0: e.p[1], x1: e.p[0] + textWidth(e.s, e.h), y1: e.p[1] + e.h };
    case "dim": {
      const g = dimGeometry(e.a, e.b, e.off);
      pts.push(e.a, e.b, g.da, g.db);
      break;
    }
    case "image":
      return { x0: e.p[0], y0: e.p[1], x1: e.p[0] + e.w, y1: e.p[1] + e.h };
    case "block":
      return extents(expandBlock(e)) ?? { x0: e.p[0], y0: e.p[1], x1: e.p[0], y1: e.p[1] };
  }
  return {
    x0: Math.min(...pts.map((p) => p[0])),
    y0: Math.min(...pts.map((p) => p[1])),
    x1: Math.max(...pts.map((p) => p[0])),
    y1: Math.max(...pts.map((p) => p[1])),
  };
}

export const arcPoint = (c: P, r: number, a: number): P => [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];

/** Distância de p ao segmento ab e o ponto mais próximo. */
export function segDist(p: P, a: P, b: P): { d: number; q: P; t: number } {
  const vx = b[0] - a[0], vy = b[1] - a[1];
  const L2 = vx * vx + vy * vy;
  const t = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L2)) : 0;
  const q: P = [a[0] + t * vx, a[1] + t * vy];
  return { d: dist(p, q), q, t };
}

/** Distância de um ponto até a entidade (para clicar em cima). Imagem: só pela borda. */
export function distanceTo(e: Entity, p: P): number {
  switch (e.t) {
    case "circle":
      return Math.abs(dist(p, e.c) - e.r);
    case "arc": {
      const ang = Math.atan2(p[1] - e.c[1], p[0] - e.c[0]);
      if (inArc(ang, e.a0, e.a1)) return Math.abs(dist(p, e.c) - e.r);
      return Math.min(dist(p, arcPoint(e.c, e.r, e.a0)), dist(p, arcPoint(e.c, e.r, e.a1)));
    }
    case "text": {
      const b = bbox(e);
      const dx = Math.max(b.x0 - p[0], 0, p[0] - b.x1), dy = Math.max(b.y0 - p[1], 0, p[1] - b.y1);
      return Math.hypot(dx, dy);
    }
    case "dim": {
      const g = dimGeometry(e.a, e.b, e.off);
      return Math.min(segDist(p, g.da, g.db).d, dist(p, g.text));
    }
    case "block": {
      // clicar dentro do vão também pega a janela/porta
      const { w, h } = e.params;
      if (p[0] >= e.p[0] && p[0] <= e.p[0] + w && p[1] >= e.p[1] && p[1] <= e.p[1] + h) return 0;
      return Math.min(...expandBlock(e).map((c) => distanceTo(c, p)));
    }
    default:
      return Math.min(...segments(e).map(([a, b]) => segDist(p, a, b).d), Infinity);
  }
}

/** Interseção de dois segmentos (ou null). */
export function segIntersect(a: P, b: P, c: P, d: P): P | null {
  const r: P = [b[0] - a[0], b[1] - a[1]], s: P = [d[0] - c[0], d[1] - c[1]];
  const den = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(den) < 1e-12) return null;
  const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den;
  const u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den;
  return t >= -1e-9 && t <= 1 + 1e-9 && u >= -1e-9 && u <= 1 + 1e-9 ? [a[0] + t * r[0], a[1] + t * r[1]] : null;
}

export type SnapKind = "ponta" | "meio" | "centro" | "quadrante" | "interseção" | "perpendicular" | "grade";
export type Snap = { p: P; kind: SnapKind };

/** Pontos de encaixe próprios de uma entidade. */
export function entitySnaps(e: Entity): Snap[] {
  const out: Snap[] = [];
  for (const [a, b] of segments(e)) {
    out.push({ p: a, kind: "ponta" }, { p: b, kind: "ponta" }, { p: mid(a, b), kind: "meio" });
  }
  if (e.t === "circle") {
    out.push({ p: e.c, kind: "centro" });
    for (const q of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) out.push({ p: arcPoint(e.c, e.r, q), kind: "quadrante" });
  }
  if (e.t === "arc") {
    out.push({ p: e.c, kind: "centro" }, { p: arcPoint(e.c, e.r, e.a0), kind: "ponta" }, { p: arcPoint(e.c, e.r, e.a1), kind: "ponta" });
    out.push({ p: arcPoint(e.c, e.r, e.a0 + norm(e.a1 - e.a0) / 2), kind: "meio" });
  }
  if (e.t === "text") out.push({ p: e.p, kind: "ponta" });
  if (e.t === "dim") out.push({ p: e.a, kind: "ponta" }, { p: e.b, kind: "ponta" });
  if (e.t === "block") {
    // segmentos já entraram acima; faltam os pontos dos arcos (centro, pontas, meio)
    for (const c of expandBlock(e)) if (c.t === "arc") out.push(...entitySnaps(c));
    out.push({ p: [e.p[0] + e.params.w / 2, e.p[1]], kind: "meio" });
  }
  return out;
}

export type SnapOptions = { tol: number; kinds: Set<SnapKind>; grid?: number; from?: P | null };

/**
 * Melhor encaixe perto de p (até `tol` metros) entre as entidades dadas. Prioridade: ponta,
 * interseção, centro, meio, quadrante, perpendicular (a partir de `from`), grade.
 */
export function findSnap(entities: Entity[], p: P, o: SnapOptions): Snap | null {
  const rank: Record<SnapKind, number> = { ponta: 0, "interseção": 1, centro: 2, meio: 3, quadrante: 4, perpendicular: 5, grade: 6 };
  let best: Snap | null = null, bestScore = Infinity;
  const consider = (s: Snap) => {
    if (!o.kinds.has(s.kind)) return;
    const d = dist(s.p, p);
    if (d > o.tol) return;
    const score = rank[s.kind] * o.tol * 0.25 + d;
    if (score < bestScore) {
      bestScore = score;
      best = s;
    }
  };
  const near = entities.filter((e) => {
    const b = bbox(e);
    return p[0] >= b.x0 - o.tol && p[0] <= b.x1 + o.tol && p[1] >= b.y0 - o.tol && p[1] <= b.y1 + o.tol;
  });
  for (const e of near) for (const s of entitySnaps(e)) consider(s);
  if (o.kinds.has("interseção")) {
    const segs = near.flatMap(segments);
    for (let i = 0; i < segs.length; i++)
      for (let j = i + 1; j < segs.length; j++) {
        const x = segIntersect(segs[i]![0], segs[i]![1], segs[j]![0], segs[j]![1]);
        if (x) consider({ p: x, kind: "interseção" });
      }
  }
  if (o.kinds.has("perpendicular") && o.from)
    for (const e of near)
      for (const [a, b] of segments(e)) {
        const { q, t } = segDist(o.from, a, b);
        if (t > 0 && t < 1) consider({ p: q, kind: "perpendicular" });
      }
  if (!best && o.grid && o.kinds.has("grade")) {
    const g = o.grid;
    consider({ p: [Math.round(p[0] / g) * g, Math.round(p[1] / g) * g], kind: "grade" });
  }
  return best;
}

/** Restringe o ponto ao eixo horizontal ou vertical a partir de `from` (modo ortogonal). */
export function ortho(from: P, p: P): P {
  return Math.abs(p[0] - from[0]) >= Math.abs(p[1] - from[1]) ? [p[0], from[1]] : [from[0], p[1]];
}

/** Ponto a `len` metros de `from` na direção de `towards` (medida digitada). */
export function atDistance(from: P, towards: P, len: number): P {
  const d = dist(from, towards) || 1;
  return [from[0] + ((towards[0] - from[0]) / d) * len, from[1] + ((towards[1] - from[1]) / d) * len];
}

const boxInside = (inner: Box, outer: Box) => inner.x0 >= outer.x0 && inner.x1 <= outer.x1 && inner.y0 >= outer.y0 && inner.y1 <= outer.y1;
const boxOverlap = (a: Box, b: Box) => a.x0 <= b.x1 && a.x1 >= b.x0 && a.y0 <= b.y1 && a.y1 >= b.y0;

/**
 * Seleção por área: janela (arrastando para a direita) pega só o que está inteiro dentro;
 * cruzamento (arrastando para a esquerda) pega também o que encosta.
 */
export function selectInBox(entities: Entity[], box: Box, crossing: boolean): Entity[] {
  return entities.filter((e) => {
    const b = bbox(e);
    if (!crossing) return boxInside(b, box);
    if (!boxOverlap(b, box)) return false;
    if (boxInside(b, box)) return true;
    const segs = segments(e);
    if (!segs.length) return true; // círculo, arco, texto: basta a caixa encostar
    const edges: [P, P][] = [
      [[box.x0, box.y0], [box.x1, box.y0]],
      [[box.x1, box.y0], [box.x1, box.y1]],
      [[box.x1, box.y1], [box.x0, box.y1]],
      [[box.x0, box.y1], [box.x0, box.y0]],
    ];
    return segs.some(([a, b2]) => {
      const inside = (q: P) => q[0] >= box.x0 && q[0] <= box.x1 && q[1] >= box.y0 && q[1] <= box.y1;
      return inside(a) || inside(b2) || edges.some(([c, d]) => segIntersect(a, b2, c, d));
    });
  });
}

/** Desloca uma entidade. */
export function translate<T extends Entity>(e: T, dx: number, dy: number): T {
  const m = (p: P): P => [p[0] + dx, p[1] + dy];
  switch (e.t) {
    case "line":
      return { ...e, a: m(e.a), b: m(e.b) };
    case "poly":
      return { ...e, pts: e.pts.map(m) };
    case "circle":
    case "arc":
      return { ...e, c: m(e.c) };
    case "text":
    case "image":
    case "block":
      return { ...e, p: m(e.p) };
    case "dim":
      return { ...e, a: m(e.a), b: m(e.b) };
  }
  return e;
}

/** Espelha uma entidade pela reta que passa por a e b. */
export function mirror<T extends Entity>(e: T, a: P, b: P): T {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L2 = dx * dx + dy * dy || 1;
  const m = (p: P): P => {
    const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2;
    const q: P = [a[0] + t * dx, a[1] + t * dy];
    return [2 * q[0] - p[0], 2 * q[1] - p[1]];
  };
  const axis = Math.atan2(dy, dx);
  switch (e.t) {
    case "line":
      return { ...e, a: m(e.a), b: m(e.b) };
    case "poly":
      return { ...e, pts: e.pts.map(m) };
    case "circle":
      return { ...e, c: m(e.c) };
    case "arc":
      // espelhar inverte o sentido: o novo arco vai de (2·eixo − a1) a (2·eixo − a0)
      return { ...e, c: m(e.c), a0: norm(2 * axis - e.a1), a1: norm(2 * axis - e.a0) };
    case "dim":
      return { ...e, a: m(e.b), b: m(e.a) };
    case "text": {
      const p = m(e.p);
      return { ...e, p: [p[0] - textWidth(e.s, e.h), p[1]] };
    }
    case "block": {
      // janela/porta são simétricas: espelhar = levar a caixa do vão para o outro lado
      const cs = [e.p, [e.p[0] + e.params.w, e.p[1]], [e.p[0], e.p[1] + e.params.h], [e.p[0] + e.params.w, e.p[1] + e.params.h]].map((q) => m(q as P));
      return { ...e, p: [Math.min(...cs.map((q) => q[0])), Math.min(...cs.map((q) => q[1]))] };
    }
    default:
      return e;
  }
}

/** Arco que passa por três pontos (início, meio, fim), ou null se forem colineares. */
export function arcFrom3(p1: P, p2: P, p3: P): { c: P; r: number; a0: number; a1: number } | null {
  const ax = p1[0], ay = p1[1], bx = p2[0], by = p2[1], cx = p3[0], cy = p3[1];
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(d) < 1e-12) return null;
  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
  const c: P = [ux, uy];
  const r = dist(c, p1);
  const a1 = Math.atan2(p1[1] - uy, p1[0] - ux), a2 = Math.atan2(p2[1] - uy, p2[0] - ux), a3 = Math.atan2(p3[1] - uy, p3[0] - ux);
  // anti-horário de p1 a p3 passando por p2? senão, inverte
  return inArc(a2, a1, a3) ? { c, r, a0: norm(a1), a1: norm(a3) } : { c, r, a0: norm(a3), a1: norm(a1) };
}

/** Caixa de várias entidades (para "mostrar tudo"). */
export function extents(entities: Entity[]): Box | null {
  if (!entities.length) return null;
  const bs = entities.map(bbox);
  return { x0: Math.min(...bs.map((b) => b.x0)), y0: Math.min(...bs.map((b) => b.y0)), x1: Math.max(...bs.map((b) => b.x1)), y1: Math.max(...bs.map((b) => b.y1)) };
}

/** Interseção das retas (infinitas) ab e cd, ou null se paralelas. */
function lineX(a: P, b: P, c: P, d: P): P | null {
  const r: P = [b[0] - a[0], b[1] - a[1]], q: P = [d[0] - c[0], d[1] - c[1]];
  const den = r[0] * q[1] - r[1] * q[0];
  if (Math.abs(den) < 1e-12) return null;
  const t = ((c[0] - a[0]) * q[1] - (c[1] - a[1]) * q[0]) / den;
  return [a[0] + t * r[0], a[1] + t * r[1]];
}

/**
 * Deslocamento (offset): cópia paralela a `d` metros, para o lado em que está `side`.
 * Linha, polilinha (cantos em quina), círculo e arco. Devolve null se não der (raio zerado etc.).
 */
export function offsetEntity(e: Entity, d: number, side: P): Entity | null {
  if (!(d > 0)) return null;
  const left = (a: P, b: P) => {
    const L = dist(a, b) || 1e-9;
    return [-(b[1] - a[1]) / L, (b[0] - a[0]) / L] as P;
  };
  const sideOf = (a: P, b: P) => Math.sign((b[0] - a[0]) * (side[1] - a[1]) - (b[1] - a[1]) * (side[0] - a[0])) || 1;
  switch (e.t) {
    case "line": {
      const n = left(e.a, e.b), k = sideOf(e.a, e.b) * d;
      return { ...e, a: [e.a[0] + n[0] * k, e.a[1] + n[1] * k], b: [e.b[0] + n[0] * k, e.b[1] + n[1] * k] };
    }
    case "circle":
    case "arc": {
      const r = dist(side, e.c) < e.r ? e.r - d : e.r + d;
      return r > 1e-6 ? { ...e, r } : null;
    }
    case "poly": {
      const segs = segments(e);
      if (!segs.length) return null;
      // lado escolhido pelo segmento mais perto do clique; vale para a polilinha toda
      let best = 0, bd = Infinity;
      segs.forEach(([a, b], i) => {
        const dd = segDist(side, a, b).d;
        if (dd < bd) {
          bd = dd;
          best = i;
        }
      });
      const k = sideOf(segs[best]![0], segs[best]![1]) * d;
      const off = segs.map(([a, b]) => {
        const n = left(a, b);
        return [[a[0] + n[0] * k, a[1] + n[1] * k], [b[0] + n[0] * k, b[1] + n[1] * k]] as [P, P];
      });
      const n = off.length;
      const pts: P[] = [];
      if (e.closed) {
        for (let i = 0; i < n; i++) {
          const prev = off[(i - 1 + n) % n]!, cur = off[i]!;
          pts.push(lineX(prev[0], prev[1], cur[0], cur[1]) ?? cur[0]);
        }
      } else {
        pts.push(off[0]![0]);
        for (let i = 1; i < n; i++) pts.push(lineX(off[i - 1]![0], off[i - 1]![1], off[i]![0], off[i]![1]) ?? off[i]![0]);
        pts.push(off[n - 1]![1]);
      }
      return { ...e, pts };
    }
    default:
      return null;
  }
}
