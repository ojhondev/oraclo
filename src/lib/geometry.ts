/**
 * Medidas sobre a ortofoto. Pontos em pixels da imagem (x → direita, y → baixo);
 * a escala vem em mm por pixel. Usado no editor (ao vivo) e no servidor (valor gravado).
 */

export type Pt = [number, number];
export type GeometryKind = "area" | "linha" | "ponto";

export function polygonAreaPx(points: Pt[]) {
  let s = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i]!;
    const [x2, y2] = points[(i + 1) % points.length]!;
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) / 2;
}

export function polylineLengthPx(points: Pt[], closed = false) {
  let s = 0;
  const n = closed ? points.length : points.length - 1;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = points[i]!;
    const [x2, y2] = points[(i + 1) % points.length]!;
    s += Math.hypot(x2 - x1, y2 - y1);
  }
  return s;
}

/** Área (m²) e comprimento (m) de um dano; nulos se a ortofoto não tiver escala. */
export function measure(kind: GeometryKind, points: Pt[], mmPerPixel: number | null) {
  if (!mmPerPixel) return { areaM2: null, lengthM: null };
  const m = mmPerPixel / 1000;
  if (kind === "area") {
    return { areaM2: polygonAreaPx(points) * m * m, lengthM: polylineLengthPx(points, true) * m };
  }
  if (kind === "linha") return { areaM2: null, lengthM: polylineLengthPx(points) * m };
  return { areaM2: null, lengthM: null };
}

/** Sinal da área do triângulo (a, b, c): >0 anti-horário, <0 horário, 0 colinear. */
const orient = (a: Pt, b: Pt, c: Pt) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

/** Os segmentos ab e cd se cruzam de fato (cruzamento próprio, sem contar o toque nas pontas). */
export function segmentsCross(a: Pt, b: Pt, c: Pt, d: Pt) {
  const o1 = orient(a, b, c), o2 = orient(a, b, d), o3 = orient(c, d, a), o4 = orient(c, d, b);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

/** O contorno se cruza sozinho (forma de laço): a área calculada deixa de ser confiável. */
export function selfIntersects(points: Pt[]) {
  const n = points.length;
  if (n < 4) return false;
  for (let i = 0; i < n; i++) {
    const a = points[i]!, b = points[(i + 1) % n]!;
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue; // arestas vizinhas (fecham o polígono)
      if (segmentsCross(a, b, points[j]!, points[(j + 1) % n]!)) return true;
    }
  }
  return false;
}

/**
 * Margem de erro (95%) de uma medida, em m² e m, propagada da precisão de posição da vista
 * (`precisionMm`, a da retificação). Propagação de primeira ordem, com erro independente em cada vértice:
 * σ = p · √Σ |∂medida/∂vértice|². Na área, o gradiente de um vértice é metade da corda entre os vizinhos;
 * no comprimento, a diferença dos versores dos segmentos que chegam e saem dele. Nulo sem escala ou sem precisão.
 */
export function measureUncertainty(kind: GeometryKind, points: Pt[], mmPerPixel: number | null, precisionMm: number | null | undefined) {
  const none = { areaM2: null as number | null, lengthM: null as number | null };
  if (!mmPerPixel || precisionMm == null || kind === "ponto" || points.length < 2) return none;
  const p = precisionMm / 1000; // m
  const m = mmPerPixel / 1000; // m por pixel
  const n = points.length;
  const closed = kind === "area";
  const unit = (a: Pt, b: Pt): Pt => {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
  };
  let sumL = 0;
  for (let i = 0; i < n; i++) {
    const prev = closed ? points[(i - 1 + n) % n]! : i > 0 ? points[i - 1]! : null;
    const next = closed ? points[(i + 1) % n]! : i < n - 1 ? points[i + 1]! : null;
    const uIn = prev ? unit(prev, points[i]!) : null;
    const uOut = next ? unit(points[i]!, next) : null;
    const gx = (uIn ? uIn[0] : 0) - (uOut ? uOut[0] : 0);
    const gy = (uIn ? uIn[1] : 0) - (uOut ? uOut[1] : 0);
    sumL += gx * gx + gy * gy;
  }
  const lengthM = p * Math.sqrt(sumL);
  if (!closed) return { areaM2: null, lengthM };
  let sumA = 0;
  for (let i = 0; i < n; i++) {
    const a = points[(i - 1 + n) % n]!, b = points[(i + 1) % n]!;
    const half = (Math.hypot(b[0] - a[0], b[1] - a[1]) * m) / 2; // m
    sumA += half * half;
  }
  return { areaM2: p * Math.sqrt(sumA), lengthM };
}

/** mm/pixel a partir de uma linha de calibração com distância real conhecida. */
export function scaleFromCalibration(a: Pt, b: Pt, meters: number) {
  const px = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (px < 1 || !(meters > 0)) return null;
  return (meters * 1000) / px;
}

export function minPoints(kind: GeometryKind) {
  return kind === "area" ? 3 : kind === "linha" ? 2 : 1;
}

const nf2 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function fmtArea(m2: number | null | undefined) {
  return m2 == null ? "—" : `${nf2.format(m2)} m²`;
}

export function fmtLength(m: number | null | undefined) {
  return m == null ? "—" : `${nf2.format(m)} m`;
}

/** Texto da escala da ortofoto. */
export const fmtPlusMinus = (v: number | null | undefined, unit: string) => (v == null ? null : `± ${nf2.format(v)} ${unit}`);

export function fmtMmPerPixel(mm: number | null | undefined) {
  if (!mm) return "sem escala";
  return `${nf2.format(mm)} mm/pixel`;
}
