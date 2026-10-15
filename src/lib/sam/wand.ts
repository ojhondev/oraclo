// "Mancha": varinha mágica por cor. Cresce a região a partir do clique pelos pixels de cor
// parecida (ΔE no espaço Lab, que segue a percepção do olho). Função pura (roda no worker).
import type { XY } from "./contour";

/** RGBA → Lab (D65), com um leve desfoque 3×3 antes para a textura do reboco não picotar a região. */
export function toLab(px: Uint8ClampedArray, w: number, h: number): Float32Array {
  const lin = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const c = i / 255;
    lin[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const raw = new Float32Array(3 * w * h);
  for (let i = 0; i < w * h; i++) {
    const r = lin[px[i * 4]!]!;
    const g = lin[px[i * 4 + 1]!]!;
    const b = lin[px[i * 4 + 2]!]!;
    const fx = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047);
    const fy = f(0.2126 * r + 0.7152 * g + 0.0722 * b);
    const fz = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
    raw[i * 3] = 116 * fy - 16;
    raw[i * 3 + 1] = 500 * (fx - fy);
    raw[i * 3 + 2] = 200 * (fy - fz);
  }
  const out = new Float32Array(3 * w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let n = 0;
      let l = 0;
      let a = 0;
      let b = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          const j = (yy * w + xx) * 3;
          l += raw[j]!;
          a += raw[j + 1]!;
          b += raw[j + 2]!;
          n++;
        }
      }
      const o = (y * w + x) * 3;
      out[o] = l / n;
      out[o + 1] = a / n;
      out[o + 2] = b / n;
    }
  }
  return out;
}

/** Cor média (Lab) numa janela em volta do ponto — o "tom" da mancha clicada. */
function seedColor(lab: Float32Array, w: number, h: number, x: number, y: number, r = 3) {
  let n = 0;
  const s = [0, 0, 0];
  for (let yy = Math.max(0, y - r); yy <= Math.min(h - 1, y + r); yy++) {
    for (let xx = Math.max(0, x - r); xx <= Math.min(w - 1, x + r); xx++) {
      const j = (yy * w + xx) * 3;
      s[0] += lab[j]!;
      s[1] += lab[j + 1]!;
      s[2] += lab[j + 2]!;
      n++;
    }
  }
  return s.map((v) => v / n) as [number, number, number];
}

/** Preenchimento 4-conexo a partir de (x,y) com ΔE ≤ tol em relação à cor da semente. */
function grow(lab: Float32Array, w: number, h: number, x: number, y: number, tol: number, out: Uint8Array, value: 0 | 1) {
  const [L, A, B] = seedColor(lab, w, h, x, y);
  const t2 = tol * tol;
  const seen = new Uint8Array(w * h);
  const stack = [y * w + x];
  seen[y * w + x] = 1;
  while (stack.length) {
    const i = stack.pop()!;
    const dl = lab[i * 3]! - L;
    const da = lab[i * 3 + 1]! - A;
    const db = lab[i * 3 + 2]! - B;
    if (dl * dl + da * da + db * db > t2) continue;
    out[i] = value;
    const px = i % w;
    if (px > 0 && !seen[i - 1]) { seen[i - 1] = 1; stack.push(i - 1); }
    if (px < w - 1 && !seen[i + 1]) { seen[i + 1] = 1; stack.push(i + 1); }
    if (i >= w && !seen[i - w]) { seen[i - w] = 1; stack.push(i - w); }
    if (i < w * (h - 1) && !seen[i + w]) { seen[i + w] = 1; stack.push(i + w); }
  }
}

/** Dilatação (max) ou erosão (min) com janela quadrada de raio r, separável. */
function morph(m: Uint8Array, w: number, h: number, r: number, dilate: boolean) {
  const tmp = new Uint8Array(w * h);
  const out = new Uint8Array(w * h);
  const hit = dilate ? 1 : 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = dilate ? 0 : 1;
      for (let k = Math.max(0, x - r); k <= Math.min(w - 1, x + r); k++) if (m[y * w + k] === hit) { v = hit; break; }
      tmp[y * w + x] = v;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = dilate ? 0 : 1;
      for (let k = Math.max(0, y - r); k <= Math.min(h - 1, y + r); k++) if (tmp[k * w + x] === hit) { v = hit; break; }
      out[y * w + x] = v;
    }
  }
  return out;
}

/**
 * Máscara da mancha: une o que cresce dos pontos positivos, tira o que cresce dos negativos
 * e fecha falhas pequenas (textura, fissuras finas) para o contorno sair contínuo.
 */
export function wandMask(lab: Float32Array, w: number, h: number, points: XY[], labels: number[], tol: number, clip?: { x0: number; y0: number; x1: number; y1: number }) {
  let mask = new Uint8Array(w * h);
  const at = (p: XY) => [Math.min(w - 1, Math.max(0, Math.round(p[0]))), Math.min(h - 1, Math.max(0, Math.round(p[1])))] as const;
  points.forEach((p, i) => labels[i] === 1 && grow(lab, w, h, ...at(p), tol, mask, 1));
  const r = Math.max(1, Math.round(Math.max(w, h) / 400));
  mask = morph(morph(mask, w, h, r, true), w, h, r, false); // fechamento
  points.forEach((p, i) => labels[i] === 0 && grow(lab, w, h, ...at(p), tol, mask, 0));
  if (clip) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < clip.x0 || x > clip.x1 || y < clip.y0 || y > clip.y1) mask[y * w + x] = 0;
  }
  return mask;
}
