/**
 * Medidas sobre o modelo 3D. Pontos em unidades do modelo (x, y, z); o fator de escala
 * (`factor`, metros por unidade do modelo) vem da calibração e vale 1 para modelos já em metros.
 */

export type P3 = [number, number, number];

/** Distância entre dois pontos 3D, em unidades do modelo. */
export function distance3(a: P3, b: P3) {
  return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
}

/** Fator (metros por unidade do modelo) a partir de dois pontos e a distância real entre eles. */
export function scaleFromCalibration3D(a: P3, b: P3, meters: number) {
  const d = distance3(a, b);
  if (d < 1e-9 || !(meters > 0)) return null;
  return meters / d;
}

export function polylineLength3(points: P3[], closed = false) {
  let s = 0;
  const n = closed ? points.length : points.length - 1;
  for (let i = 0; i < n; i++) s += distance3(points[i]!, points[(i + 1) % points.length]!);
  return s;
}

/**
 * Área de um polígono plano ou quase plano no espaço (método de Newell: metade do módulo
 * da soma dos produtos vetoriais). Em unidades do modelo ao quadrado.
 */
export function polygonArea3(points: P3[]) {
  let nx = 0, ny = 0, nz = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1, z1] = points[i]!;
    const [x2, y2, z2] = points[(i + 1) % points.length]!;
    nx += y1 * z2 - z1 * y2;
    ny += z1 * x2 - x1 * z2;
    nz += x1 * y2 - y1 * x2;
  }
  return Math.hypot(nx, ny, nz) / 2;
}

/** Área (m²) e comprimento (m) de um dano 3D; nulos se o modelo não foi calibrado. */
export function measure3(kind: "area" | "linha" | "ponto", points: P3[], factor: number | null) {
  if (!factor) return { areaM2: null, lengthM: null };
  if (kind === "area") {
    return { areaM2: polygonArea3(points) * factor * factor, lengthM: polylineLength3(points, true) * factor };
  }
  if (kind === "linha") return { areaM2: null, lengthM: polylineLength3(points) * factor };
  return { areaM2: null, lengthM: null };
}
