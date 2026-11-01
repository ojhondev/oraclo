/**
 * Comparação entre vistorias: alinhamento de duas vistas do mesmo trecho (pares de pontos
 * homólogos → transformação "depois → antes") e o que mudou nos danos. Funções puras.
 */
import { apply, fitHomography, inv3, type Pt } from "./rectify";
import { centroid, pointInPolygon, polygonAreaPx, polylineLengthPx, type GeometryKind } from "./geometry";

export type Pair = { a: Pt; b: Pt };

/**
 * Transformação dos pixels da vista B para os da vista A, como homografia 3×3 (em linha).
 * 2 pares = similaridade (escala, giro, deslocamento), 3 = afim, 4 ou mais = homografia
 * (perspectiva) por mínimos quadrados.
 */
export function fitAlignment(pairs: Pair[]): number[] {
  const n = pairs.length;
  if (n < 2) throw new Error("Marque pelo menos 2 pares de pontos.");
  if (n >= 4) return fitHomography(pairs.map((p) => p.b), pairs.map((p) => p.a));
  if (n === 3) {
    // afim exata: [x' y'] = M·[x y 1]
    const S = pairs.flatMap((p) => [p.b[0], p.b[1], 1]);
    const Si = inv3(S);
    const solve = (k: 0 | 1) => {
      const v = pairs.map((p) => p.a[k]);
      return [0, 1, 2].map((i) => Si[i * 3]! * v[0]! + Si[i * 3 + 1]! * v[1]! + Si[i * 3 + 2]! * v[2]!);
    };
    return [...solve(0), ...solve(1), 0, 0, 1];
  }
  // similaridade por números complexos: a = s·b + t
  const [p, q] = pairs as [Pair, Pair];
  const db: Pt = [q.b[0] - p.b[0], q.b[1] - p.b[1]];
  const da: Pt = [q.a[0] - p.a[0], q.a[1] - p.a[1]];
  const den = db[0] * db[0] + db[1] * db[1];
  if (den < 1e-9) throw new Error("Os dois pontos estão no mesmo lugar.");
  const sr = (da[0] * db[0] + da[1] * db[1]) / den;
  const si = (da[1] * db[0] - da[0] * db[1]) / den;
  const tx = p.a[0] - (sr * p.b[0] - si * p.b[1]);
  const ty = p.a[1] - (si * p.b[0] + sr * p.b[1]);
  return [sr, -si, tx, si, sr, ty, 0, 0, 1];
}

/** Erro médio quadrático dos pares depois do ajuste (pixels da vista A). */
export function alignmentRms(H: number[], pairs: Pair[]) {
  if (!pairs.length) return 0;
  const s = pairs.reduce((acc, p) => {
    const [x, y] = apply(H, p.b);
    return acc + (x - p.a[0]) ** 2 + (y - p.a[1]) ** 2;
  }, 0);
  return Math.sqrt(s / pairs.length);
}

/** Palpite inicial sem pontos: as duas vistas com a mesma origem, ajustadas só pela escala. */
export function scaleGuess(mmA: number | null, mmB: number | null, wA: number, wB: number): number[] {
  const r = mmA && mmB ? mmB / mmA : wA / wB;
  return [r, 0, 0, 0, r, 0, 0, 0, 1];
}

/** CSS matrix3d que aplica a homografia (pixels de B → pixels de A) a um elemento com origem 0 0. */
export function toMatrix3d(H: number[]) {
  const [a, b, c, d, e, f, g, h, i] = H.map((v) => v / H[8]!) as [number, number, number, number, number, number, number, number, number];
  return `matrix3d(${[a, d, 0, g, b, e, 0, h, 0, 0, 1, 0, c, f, 0, i].map((v) => +v.toFixed(10)).join(",")})`;
}

export const mapPoints = (H: number[], pts: Pt[]) => pts.map((p) => apply(H, p));

/* ───────────── diferenças entre os danos ───────────── */

export type CmpDamage = { id: string; typeId: string; points: Pt[] };
export type CmpType = { id: string; code: string; category: string; geometry: GeometryKind };
/** novo: só depois · cresceu/estável/diminuiu: nas duas · sumiu: só antes (tratado ou não visível). */
export type DiffStatus = "novo" | "cresceu" | "estavel" | "diminuiu" | "sumiu";

export type DamageDiff = {
  status: DiffStatus;
  /** Danos da outra vistoria que correspondem a este. */
  matches: string[];
  /** Tamanho depois ÷ antes, medido no referencial da vista A. */
  ratio: number | null;
  /** O tipo mudou entre as vistorias (ex.: fissura → trinca). */
  typeChanged: boolean;
};

/** Limite de variação para considerar que o dano cresceu ou diminuiu (±20%). */
export const GROWTH = 0.2;

/**
 * Casa os danos de A com os de B (já levados para os pixels de A) por sobreposição numa grade,
 * dentro da categoria (fissura casa com trinca). Só entra o que está na área comum às duas vistas.
 */
export function compareDamages({
  a,
  b,
  types,
  W,
  H,
  footB,
}: {
  a: CmpDamage[];
  b: CmpDamage[];
  types: Map<string, CmpType>;
  W: number;
  H: number;
  /** Contorno da vista B levado para os pixels de A. */
  footB: Pt[];
}) {
  const cell = Math.max(W, H) / 400;
  const gw = Math.ceil(W / cell);
  const gh = Math.ceil(H / cell);
  const idx = (x: number, y: number) => {
    const cx = Math.floor(x / cell);
    const cy = Math.floor(y / cell);
    return cx < 0 || cy < 0 || cx >= gw || cy >= gh ? -1 : cy * gw + cx;
  };
  const mask = (d: CmpDamage): Set<number> => {
    const g = types.get(d.typeId)?.geometry ?? "area";
    const out = new Set<number>();
    const add = (x: number, y: number, r: number) => {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const k = idx(x + dx * cell, y + dy * cell);
        if (k >= 0) out.add(k);
      }
    };
    const p = d.points;
    if (g === "ponto") add(p[0]![0], p[0]![1], 2);
    else if (g === "linha") {
      for (let i = 0; i < p.length - 1; i++) {
        const [x0, y0] = p[i]!;
        const [x1, y1] = p[i + 1]!;
        const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (cell / 2)));
        for (let s = 0; s <= steps; s++) add(x0 + ((x1 - x0) * s) / steps, y0 + ((y1 - y0) * s) / steps, 1);
      }
    } else {
      const xs = p.map((q) => q[0]);
      const ys = p.map((q) => q[1]);
      for (let cy = Math.max(0, Math.floor(Math.min(...ys) / cell)); cy <= Math.min(gh - 1, Math.floor(Math.max(...ys) / cell)); cy++) {
        for (let cx = Math.max(0, Math.floor(Math.min(...xs) / cell)); cx <= Math.min(gw - 1, Math.floor(Math.max(...xs) / cell)); cx++) {
          if (pointInPolygon([(cx + 0.5) * cell, (cy + 0.5) * cell], p)) out.add(cy * gw + cx);
        }
      }
      if (!out.size) {
        const [x, y] = centroid(p);
        add(x, y, 0);
      }
    }
    return out;
  };
  const size = (d: CmpDamage) => {
    const g = types.get(d.typeId)?.geometry ?? "area";
    return g === "area" ? polygonAreaPx(d.points) : g === "linha" ? polylineLengthPx(d.points) : 1;
  };
  const frameA: Pt[] = [[0, 0], [W, 0], [W, H], [0, H]];
  const common = (d: CmpDamage) => {
    const c = centroid(d.points);
    return pointInPolygon(c, frameA) && pointInPolygon(c, footB);
  };
  const same = (x: CmpDamage, y: CmpDamage) => {
    const tx = types.get(x.typeId);
    const ty = types.get(y.typeId);
    return !!tx && !!ty && (tx.code === ty.code || tx.category === ty.category);
  };

  const inA = a.filter(common);
  const inB = b.filter(common);
  const mA = new Map(inA.map((d) => [d.id, mask(d)]));
  const mB = new Map(inB.map((d) => [d.id, mask(d)]));
  const overlap = (x: Set<number>, y: Set<number>) => {
    const [small, big] = x.size < y.size ? [x, y] : [y, x];
    let n = 0;
    for (const k of small) if (big.has(k)) n++;
    return n / Math.max(1, small.size);
  };

  const bDiff = new Map<string, DamageDiff>();
  const aMatched = new Map<string, string[]>();
  for (const d of inB) {
    const matches = inA.filter((x) => same(x, d) && overlap(mA.get(x.id)!, mB.get(d.id)!) >= 0.2);
    for (const x of matches) aMatched.set(x.id, [...(aMatched.get(x.id) ?? []), d.id]);
    if (!matches.length) {
      bDiff.set(d.id, { status: "novo", matches: [], ratio: null, typeChanged: false });
      continue;
    }
    const before = matches.reduce((s, x) => s + size(x), 0);
    const ratio = before > 0 ? size(d) / before : null;
    const typeChanged = matches.some((x) => x.typeId !== d.typeId);
    const status: DiffStatus = ratio == null ? "estavel" : ratio > 1 + GROWTH || typeChanged ? "cresceu" : ratio < 1 - GROWTH ? "diminuiu" : "estavel";
    bDiff.set(d.id, { status, matches: matches.map((x) => x.id), ratio, typeChanged });
  }
  const aDiff = new Map<string, DamageDiff>();
  for (const d of inA) {
    const m = aMatched.get(d.id);
    if (!m) aDiff.set(d.id, { status: "sumiu", matches: [], ratio: null, typeChanged: false });
  }
  const counts: Record<DiffStatus, number> = { novo: 0, cresceu: 0, estavel: 0, diminuiu: 0, sumiu: aDiff.size };
  for (const v of bDiff.values()) counts[v.status]++;
  return { a: aDiff, b: bDiff, counts, inA: new Set(inA.map((d) => d.id)), inB: new Set(inB.map((d) => d.id)) };
}
