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
export function fmtMmPerPixel(mm: number | null | undefined) {
  if (!mm) return "sem escala";
  return `${nf2.format(mm)} mm/pixel`;
}
