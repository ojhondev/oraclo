/**
 * Retificação de foto (correção de perspectiva) por homografia de 4 pontos — tudo no
 * navegador. Os 4 cantos marcados na foto viram um retângulo de largura × altura reais,
 * e a imagem resultante sai em escala conhecida (mm por pixel).
 */

export type Pt = [number, number];

/** Resolve A·x = b (8×8) por eliminação de Gauss com pivoteamento parcial. */
function solve(A: number[][], b: number[]) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]!]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r]![c]!) > Math.abs(M[p]![c]!)) p = r;
    if (Math.abs(M[p]![c]!) < 1e-12) throw new Error("Pontos inválidos: três cantos não podem estar alinhados.");
    [M[c], M[p]] = [M[p]!, M[c]!];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r]![c]! / M[c]![c]!;
      for (let k = c; k <= n; k++) M[r]![k]! -= f * M[c]![k]!;
    }
  }
  return M.map((row, i) => row[n]! / row[i]!);
}

/** Homografia 3×3 (linha a linha, h33 = 1) que leva src[i] → dst[i]. */
export function homography(src: Pt[], dst: Pt[]) {
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i]!;
    const [u, v] = dst[i]!;
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }
  const h = solve(A, b);
  return [...h, 1];
}

export function apply(H: number[], [x, y]: Pt): Pt {
  const w = H[6]! * x + H[7]! * y + H[8]!;
  return [(H[0]! * x + H[1]! * y + H[2]!) / w, (H[3]! * x + H[4]! * y + H[5]!) / w];
}

const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/**
 * Resolução de saída: mantém aproximadamente a quantidade de pixels que a foto tinha naquele
 * trecho (sem inventar detalhe), limitada a `maxSide` no lado maior.
 */
export function outputSize(corners: Pt[], widthM: number, heightM: number, maxSide = 6000) {
  const [tl, tr, br, bl] = corners as [Pt, Pt, Pt, Pt];
  const pxW = Math.max(dist(tl, tr), dist(bl, br));
  const pxH = Math.max(dist(tl, bl), dist(tr, br));
  // mm por pixel que preserva a resolução no eixo mais detalhado
  let mm = Math.min((widthM * 1000) / pxW, (heightM * 1000) / pxH);
  let w = Math.round((widthM * 1000) / mm);
  let h = Math.round((heightM * 1000) / mm);
  const k = Math.max(w, h) / maxSide;
  if (k > 1) {
    mm *= k;
    w = Math.round((widthM * 1000) / mm);
    h = Math.round((heightM * 1000) / mm);
  }
  return { width: w, height: h, mmPerPixel: mm };
}

/**
 * Gera a imagem retificada. `corners` na ordem: superior esquerdo, superior direito,
 * inferior direito, inferior esquerdo (em pixels da foto original).
 */
export async function rectify(
  img: CanvasImageSource & { width: number; height: number },
  corners: Pt[],
  widthM: number,
  heightM: number,
  onProgress?: (p: number) => void,
) {
  const { width: W, height: H, mmPerPixel } = outputSize(corners, widthM, heightM);
  // mapeamento inverso: pixel de saída → posição na foto
  const Hinv = homography([[0, 0], [W, 0], [W, H], [0, H]], corners);

  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = img.width;
  srcCanvas.height = img.height;
  const sctx = srcCanvas.getContext("2d", { willReadFrequently: true })!;
  sctx.drawImage(img, 0, 0);
  const src = sctx.getImageData(0, 0, img.width, img.height).data;
  const SW = img.width;
  const SH = img.height;

  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const octx = out.getContext("2d")!;
  const rowsPerChunk = Math.max(1, Math.floor(400_000 / W));
  for (let y0 = 0; y0 < H; y0 += rowsPerChunk) {
    const rows = Math.min(rowsPerChunk, H - y0);
    const block = octx.createImageData(W, rows);
    const d = block.data;
    for (let r = 0; r < rows; r++) {
      const y = y0 + r + 0.5;
      for (let x = 0; x < W; x++) {
        const xx = x + 0.5;
        const w = Hinv[6]! * xx + Hinv[7]! * y + Hinv[8]!;
        const sx = (Hinv[0]! * xx + Hinv[1]! * y + Hinv[2]!) / w - 0.5;
        const sy = (Hinv[3]! * xx + Hinv[4]! * y + Hinv[5]!) / w - 0.5;
        const o = (r * W + x) * 4;
        if (sx < 0 || sy < 0 || sx >= SW - 1 || sy >= SH - 1) {
          d[o] = d[o + 1] = d[o + 2] = 255;
          d[o + 3] = 255;
          continue;
        }
        // interpolação bilinear
        const x0 = sx | 0;
        const yy0 = sy | 0;
        const fx = sx - x0;
        const fy = sy - yy0;
        const i00 = (yy0 * SW + x0) * 4;
        const i10 = i00 + 4;
        const i01 = i00 + SW * 4;
        const i11 = i01 + 4;
        for (let c = 0; c < 3; c++) {
          const top = src[i00 + c]! * (1 - fx) + src[i10 + c]! * fx;
          const bot = src[i01 + c]! * (1 - fx) + src[i11 + c]! * fx;
          d[o + c] = top * (1 - fy) + bot * fy;
        }
        d[o + 3] = 255;
      }
    }
    octx.putImageData(block, 0, y0);
    onProgress?.(Math.min(1, (y0 + rows) / H));
    await new Promise((res) => setTimeout(res, 0));
  }
  return { canvas: out, width: W, height: H, mmPerPixel };
}
