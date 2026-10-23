/**
 * Retificação métrica de fachadas (correção de perspectiva) — motor puro, sem DOM, usado no
 * navegador (Web Worker) e nos testes.
 *
 * Modelo: plano da parede em metros (origem no canto superior esquerdo do retângulo de
 * referência, x para a direita, y para baixo) → foto sem distorção (homografia H) → foto real
 * (distorção radial da lente, modelo polinomial de 1 termo, k1).
 *
 * - Pontos de controle: os 4 cantos do retângulo de referência e, opcionalmente, outros pontos
 *   com coordenadas medidas. Com mais de 4, a homografia sai por mínimos quadrados (DLT
 *   normalizada) e cada ponto ganha o seu resíduo em mm.
 * - Lente: k1 estimado a partir de linhas que deveriam ser retas (arestas, cornijas, prumadas).
 * - Conferência: distâncias conhecidas medidas na foto e comparadas com a trena.
 * - Saída: retângulo de referência ou o plano inteiro visível na foto, em mm/pixel constante.
 */

export type Pt = [number, number];
/** Distorção radial: r' = r·(1 + k1·r² + k2·r⁴), com r normalizado pela meia-diagonal. k2 é opcional (retificações antigas só têm k1). */
export type Lens = { k1: number; k2?: number; cx: number; cy: number; norm: number };
export type Control = { img: Pt; plane: Pt };
export type Check = { a: Pt; b: Pt; meters: number };
export type Extent = [number, number, number, number]; // x0, y0, x1, y1 (m)

/* ───────────── álgebra ───────────── */

/** Resolve A·x = b (n×n) por eliminação de Gauss com pivoteamento parcial. */
function solve(A: number[][], b: number[]) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]!]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r]![c]!) > Math.abs(M[p]![c]!)) p = r;
    if (Math.abs(M[p]![c]!) < 1e-12) throw new Error("Pontos inválidos: três pontos não podem estar alinhados.");
    [M[c], M[p]] = [M[p]!, M[c]!];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r]![c]! / M[c]![c]!;
      for (let k = c; k <= n; k++) M[r]![k]! -= f * M[c]![k]!;
    }
  }
  return M.map((row, i) => row[n]! / row[i]!);
}

const mul3 = (A: number[], B: number[]) => {
  const C = new Array(9).fill(0);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) C[i * 3 + j] += A[i * 3 + k]! * B[k * 3 + j]!;
  return C as number[];
};

export function inv3(m: number[]) {
  const [a, b, c, d, e, f, g, h, i] = m as [number, number, number, number, number, number, number, number, number];
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-18) throw new Error("Transformação degenerada.");
  return [A, -(b * i - c * h), b * f - c * e, B, a * i - c * g, -(a * f - c * d), C, -(a * h - b * g), a * e - b * d].map((v) => v / det);
}

export function apply(H: number[], [x, y]: Pt): Pt {
  const w = H[6]! * x + H[7]! * y + H[8]!;
  return [(H[0]! * x + H[1]! * y + H[2]!) / w, (H[3]! * x + H[4]! * y + H[5]!) / w];
}
const wOf = (H: number[], [x, y]: Pt) => H[6]! * x + H[7]! * y + H[8]!;

/** Normalização de Hartley: centróide na origem, distância média √2. */
function normalizer(pts: Pt[]) {
  const n = pts.length;
  const cx = pts.reduce((s, p) => s + p[0], 0) / n;
  const cy = pts.reduce((s, p) => s + p[1], 0) / n;
  const md = pts.reduce((s, p) => s + Math.hypot(p[0] - cx, p[1] - cy), 0) / n || 1;
  const s = Math.SQRT2 / md;
  return [s, 0, -s * cx, 0, s, -s * cy, 0, 0, 1];
}

/**
 * Homografia src → dst. Com 4 pares é exata; com mais, mínimos quadrados (DLT normalizada,
 * h33 = 1, equações normais).
 */
export function fitHomography(src: Pt[], dst: Pt[]) {
  if (src.length < 4 || src.length !== dst.length) throw new Error("São precisos pelo menos 4 pontos.");
  const T1 = normalizer(src);
  const T2 = normalizer(dst);
  const s = src.map((p) => apply(T1, p));
  const d = dst.map((p) => apply(T2, p));
  const rows: number[][] = [];
  const rhs: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const [x, y] = s[i]!;
    const [u, v] = d[i]!;
    rows.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    rhs.push(u);
    rows.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    rhs.push(v);
  }
  // equações normais (AᵀA)h = Aᵀb
  const AtA = Array.from({ length: 8 }, (_, i) => Array.from({ length: 8 }, (_, j) => rows.reduce((acc, r) => acc + r[i]! * r[j]!, 0)));
  const Atb = Array.from({ length: 8 }, (_, i) => rows.reduce((acc, r, k) => acc + r[i]! * rhs[k]!, 0));
  const Hn = [...solve(AtA, Atb), 1];
  const H = mul3(inv3(T2), mul3(Hn, T1));
  return H.map((v) => v / H[8]!);
}

/* ───────────── lente (distorção radial) ───────────── */

export const lensFor = (w: number, h: number, k1 = 0): Lens => ({ k1, cx: w / 2, cy: h / 2, norm: Math.hypot(w, h) / 2 });

/** Foto sem distorção → foto real. */
export function distort([x, y]: Pt, L: Lens): Pt {
  if (!L.k1 && !L.k2) return [x, y];
  const dx = (x - L.cx) / L.norm;
  const dy = (y - L.cy) / L.norm;
  const r2 = dx * dx + dy * dy;
  const f = 1 + L.k1 * r2 + (L.k2 ?? 0) * r2 * r2;
  return [L.cx + dx * f * L.norm, L.cy + dy * f * L.norm];
}

/** Foto real → foto sem distorção (inversa numérica). */
export function undistort([x, y]: Pt, L: Lens): Pt {
  if (!L.k1 && !L.k2) return [x, y];
  const px = (x - L.cx) / L.norm;
  const py = (y - L.cy) / L.norm;
  let ux = px;
  let uy = py;
  for (let i = 0; i < 30; i++) {
    const r2 = ux * ux + uy * uy;
    const f = 1 + L.k1 * r2 + (L.k2 ?? 0) * r2 * r2;
    ux = px / f;
    uy = py / f;
  }
  return [L.cx + ux * L.norm, L.cy + uy * L.norm];
}

/** Soma dos quadrados das distâncias à reta de melhor ajuste (mínimos quadrados totais). */
function lineSSE(pts: Pt[]) {
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p[0], 0) / n;
  const my = pts.reduce((s, p) => s + p[1], 0) / n;
  let sxx = 0, syy = 0, sxy = 0;
  for (const [x, y] of pts) {
    sxx += (x - mx) ** 2;
    syy += (y - my) ** 2;
    sxy += (x - mx) * (y - my);
  }
  // menor autovalor da matriz de covariância = soma dos quadrados perpendiculares
  const tr = sxx + syy;
  const det = sxx * syy - sxy * sxy;
  return Math.max(0, tr / 2 - Math.sqrt(Math.max(0, (tr * tr) / 4 - det)));
}

const straightRms = (lines: Pt[][], L: Lens) => {
  let sse = 0;
  let n = 0;
  for (const line of lines) {
    sse += lineSSE(line.map((p) => undistort(p, L)));
    n += line.length;
  }
  return Math.sqrt(sse / Math.max(1, n));
};

/** Mínimo de uma função unimodal em [a, b] pela razão áurea. */
function golden(fn: (x: number) => number, a: number, b: number, iters = 60) {
  const g = (Math.sqrt(5) - 1) / 2;
  let c = b - g * (b - a);
  let d = a + g * (b - a);
  let fc = fn(c);
  let fd = fn(d);
  for (let i = 0; i < iters; i++) {
    if (fc < fd) {
      b = d; d = c; fd = fc; c = b - g * (b - a); fc = fn(c);
    } else {
      a = c; c = d; fc = fd; d = a + g * (b - a); fd = fn(d);
    }
  }
  return (a + b) / 2;
}

/** Nelder-Mead em 2 variáveis, com limites. Devolve o melhor ponto. */
function nelderMead2(fn: (x: number, y: number) => number, start: [number, number], step: [number, number], lo: [number, number], hi: [number, number], iters = 160) {
  const clamp = (v: [number, number]): [number, number] => [Math.min(hi[0], Math.max(lo[0], v[0])), Math.min(hi[1], Math.max(lo[1], v[1]))];
  let pts = ([start, [start[0] + step[0], start[1]], [start[0], start[1] + step[1]]] as [number, number][]).map((q) => {
    const c = clamp(q);
    return { x: c, f: fn(c[0], c[1]) };
  });
  for (let it = 0; it < iters; it++) {
    pts.sort((a, b) => a.f - b.f);
    const [best, , worst] = pts as [(typeof pts)[0], (typeof pts)[0], (typeof pts)[0]];
    const mid: [number, number] = [(pts[0]!.x[0] + pts[1]!.x[0]) / 2, (pts[0]!.x[1] + pts[1]!.x[1]) / 2];
    const at = (t: number): { x: [number, number]; f: number } => {
      const c = clamp([mid[0] + t * (worst.x[0] - mid[0]), mid[1] + t * (worst.x[1] - mid[1])]);
      return { x: c, f: fn(c[0], c[1]) };
    };
    const refl = at(-1);
    if (refl.f < best.f) {
      const exp = at(-2);
      pts[2] = exp.f < refl.f ? exp : refl;
    } else if (refl.f < pts[1]!.f) {
      pts[2] = refl;
    } else {
      const con = at(refl.f < worst.f ? -0.5 : 0.5);
      if (con.f < Math.min(refl.f, worst.f)) pts[2] = con;
      else {
        // encolhe em direção ao melhor
        pts = pts.map((q, i) => {
          if (i === 0) return q;
          const c = clamp([best.x[0] + 0.5 * (q.x[0] - best.x[0]), best.x[1] + 0.5 * (q.x[1] - best.x[1])]);
          return { x: c, f: fn(c[0], c[1]) };
        });
      }
    }
  }
  pts.sort((a, b) => a.f - b.f);
  return pts[0]!.x;
}

/** Com poucas linhas o segundo termo ajusta ruído: só tenta com pelo menos isto. */
export const MIN_LINES_K2 = 6;

/**
 * Estima a lente a partir de linhas que deveriam ser retas (cada uma com 3 ou mais pontos na foto).
 * Primeiro k1 (razão áurea em [-0,4; 0,4]); com 6 ou mais linhas, tenta também k2 (em [-0,3; 0,3]) e só o
 * mantém se houver curvatura residual real (> 0,1 px) e ele a reduzir em mais de 15%. Retorna o desvio de retidão antes e depois (px).
 */
export function estimateLens(lines: Pt[][], w: number, h: number) {
  const valid = lines.filter((l) => l.length >= 3);
  const base = lensFor(w, h);
  if (!valid.length) return { lens: base, rmsBefore: 0, rmsAfter: 0 };
  const f = (k1: number, k2 = 0) => straightRms(valid, { ...base, k1, k2 });
  const k1a = golden((k) => f(k), -0.4, 0.4);
  const rms1 = f(k1a);
  let lens: Lens = { ...base, k1: k1a };
  let rmsAfter = rms1;
  if (valid.length >= MIN_LINES_K2) {
    const [k1, k2] = nelderMead2(f, [k1a, 0], [0.05, 0.05], [-0.4, -0.3], [0.4, 0.3]);
    const rms2 = f(k1, k2);
    if (rms1 > 0.1 && rms2 < 0.85 * rms1) {
      lens = { ...base, k1, k2 };
      rmsAfter = rms2;
    }
  }
  return { lens, rmsBefore: f(0), rmsAfter };
}

/* ───────────── solução ───────────── */

export type Solution = {
  /** plano (m) → foto sem distorção */
  Hpi: number[];
  /** foto sem distorção → plano (m) */
  Hip: number[];
  lens: Lens;
  /** resíduo de cada ponto de controle (mm) — só significativo com mais de 4 pontos */
  residualsMm: number[];
  residualRmsMm: number | null;
  /** erro de previsão de cada ponto quando ele fica de fora do ajuste (mm); exige 5+ pontos. Nulo no ponto cujo "sem ele" fica degenerado (pontos alinhados). */
  looMm: (number | null)[] | null;
  looRmsMm: number | null;
  /** índice (em controls) do ponto que parece mal marcado: tirá-lo derruba o resíduo dos demais; exige 6+ pontos */
  suspects: number[];
  checks: { real: number; measured: number; errMm: number; errPct: number }[];
  checkRmsMm: number | null;
  /** tamanho no plano de 1 pixel da foto, no pior ponto de controle (mm) */
  mmPerSrcPx: number;
  /** precisão estimada (95%), em mm */
  precisionMm: number;
};

/** Tamanho no plano (mm) de 1 pixel da foto em torno de um ponto da foto sem distorção. */
function pxFootprintMm(Hip: number[], u: Pt) {
  const p = apply(Hip, u);
  const px = apply(Hip, [u[0] + 1, u[1]]);
  const py = apply(Hip, [u[0], u[1] + 1]);
  return Math.max(Math.hypot(px[0] - p[0], px[1] - p[1]), Math.hypot(py[0] - p[0], py[1] - p[1])) * 1000;
}

/**
 * Resolve a retificação. `clickPx` = incerteza de marcação de um ponto, em pixels da foto
 * (com lupa ~0,7 px).
 */
export function solveRectification({ controls, lens, checks = [], clickPx = 0.7 }: { controls: Control[]; lens: Lens; checks?: Check[]; clickPx?: number }): Solution {
  const und = controls.map((c) => undistort(c.img, lens));
  const Hip = fitHomography(und, controls.map((c) => c.plane));
  const Hpi = inv3(Hip);
  const residualsMm = und.map((u, i) => {
    const p = apply(Hip, u);
    return Math.hypot(p[0] - controls[i]!.plane[0], p[1] - controls[i]!.plane[1]) * 1000;
  });
  const dof = controls.length - 4;
  const residualRmsMm = dof > 0 ? Math.sqrt(residualsMm.reduce((s, r) => s + r * r, 0) / dof) : null;
  // "deixa um de fora": quanto o ajuste feito sem o ponto erra a posição dele (previsão fora da amostra)
  const looMm =
    controls.length >= 5
      ? und.map((u, i) => {
          const keep = controls.map((_, k) => k).filter((k) => k !== i);
          try {
            const Hi = fitHomography(keep.map((k) => und[k]!), keep.map((k) => controls[k]!.plane));
            const p = apply(Hi, u);
            return Math.hypot(p[0] - controls[i]!.plane[0], p[1] - controls[i]!.plane[1]) * 1000;
          } catch {
            return null; // sem esse ponto sobram 3 alinhados: não dá para prever
          }
        })
      : null;
  const looValid = looMm?.filter((e): e is number => e != null) ?? [];
  const looRmsMm = looValid.length ? Math.sqrt(looValid.reduce((s, r) => s + r * r, 0) / looValid.length) : null;
  const cs = checks
    .filter((c) => c.meters > 0)
    .map((c) => {
      const a = apply(Hip, undistort(c.a, lens));
      const b = apply(Hip, undistort(c.b, lens));
      const measured = Math.hypot(b[0] - a[0], b[1] - a[1]);
      return { real: c.meters, measured, errMm: (measured - c.meters) * 1000, errPct: ((measured - c.meters) / c.meters) * 100 };
    });
  const checkRmsMm = cs.length ? Math.sqrt(cs.reduce((s, c) => s + c.errMm ** 2, 0) / cs.length) : null;
  const feet = und.map((u) => pxFootprintMm(Hip, u));
  const mmPerSrcPx = Math.max(...feet);
  const avgFoot = feet.reduce((a, b) => a + b, 0) / feet.length;
  // incerteza (95%): com conferências, vale o erro medido (e os resíduos do ajuste), com piso na
  // incerteza de marcação; sem conferências, só a marcação dos pontos pode ser estimada
  const click = clickPx * avgFoot;
  const measured = Math.sqrt((checkRmsMm ?? 0) ** 2 + (residualRmsMm ?? 0) ** 2);
  const known = checkRmsMm != null || residualRmsMm != null;
  // o erro de previsão (fora da amostra) é a melhor medida de exatidão com 5+ pontos: vale o maior dos dois
  const sigma = known ? Math.max(measured, looRmsMm ?? 0, click) : click;
  // ponto suspeito: o ajuste sem ele deixa os demais com resíduo bem menor (influência); só o de maior efeito
  let suspects: number[] = [];
  if (controls.length >= 6 && residualRmsMm != null && residualRmsMm > 5 * avgFoot) {
    let best = -1;
    let bestRms = Infinity;
    controls.forEach((_, i) => {
      const keep = controls.map((__, k) => k).filter((k) => k !== i);
      try {
        const Hi = fitHomography(keep.map((k) => und[k]!), keep.map((k) => controls[k]!.plane));
        const ss = keep.reduce((acc, k) => {
          const p = apply(Hi, und[k]!);
          return acc + ((p[0] - controls[k]!.plane[0]) ** 2 + (p[1] - controls[k]!.plane[1]) ** 2) * 1e6;
        }, 0);
        const rms = Math.sqrt(ss / (keep.length - 4));
        if (rms < bestRms) {
          bestRms = rms;
          best = i;
        }
      } catch {
        // combinação degenerada: ignora
      }
    });
    if (best >= 0 && bestRms < 0.3 * residualRmsMm) suspects = [best];
  }
  return { Hpi, Hip, lens, residualsMm, residualRmsMm, looMm, looRmsMm, suspects, checks: cs, checkRmsMm, mmPerSrcPx, precisionMm: 1.96 * sigma };
}

/* ───────────── extensão e resolução da saída ───────────── */

/**
 * Plano inteiro visível na foto: contorno da foto projetado no plano, limitado a 1× o
 * retângulo de referência para cada lado (perto do horizonte a projeção explode).
 */
export function photoExtent(sol: Solution, srcW: number, srcH: number, ref: Extent): Extent {
  const [rx0, ry0, rx1, ry1] = ref;
  const rw = rx1 - rx0;
  const rh = ry1 - ry0;
  const lim: Extent = [rx0 - rw, ry0 - rh, rx1 + rw, ry1 + rh];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const N = 40;
  const edge: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    edge.push([t * srcW, 0], [t * srcW, srcH], [0, t * srcH], [srcW, t * srcH]);
  }
  // o sinal de w nos pontos de controle indica o lado "visível" do plano
  const sign = Math.sign(wOf(sol.Hip, apply(sol.Hpi, [(rx0 + rx1) / 2, (ry0 + ry1) / 2])));
  for (const e of edge) {
    const u = undistort(e, sol.lens);
    if (Math.sign(wOf(sol.Hip, u)) !== sign) continue;
    const [x, y] = apply(sol.Hip, u);
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  if (!Number.isFinite(x0)) return ref;
  return [Math.max(lim[0], x0), Math.max(lim[1], y0), Math.min(lim[2], x1), Math.min(lim[3], y1)];
}

/**
 * mm/pixel da saída: preserva a resolução que a foto tem no retângulo de referência (no eixo
 * mais detalhado), limitado a `maxSide` pixels no lado maior.
 */
export function outputSize(sol: Solution, refImg: Pt[], extent: Extent, maxSide = 6000) {
  const und = refImg.map((p) => undistort(p, sol.lens));
  let mm = Math.min(...und.map((u) => pxFootprintMm(sol.Hip, u)));
  // o pixel mais fino da foto costuma ser exagero: usa a média entre o mais fino e o centro
  const c = undistort([(refImg[0]![0] + refImg[2]![0]) / 2, (refImg[0]![1] + refImg[2]![1]) / 2], sol.lens);
  mm = (mm + pxFootprintMm(sol.Hip, c)) / 2;
  const ew = (extent[2] - extent[0]) * 1000;
  const eh = (extent[3] - extent[1]) * 1000;
  let w = Math.round(ew / mm);
  let h = Math.round(eh / mm);
  const k = Math.max(w, h) / maxSide;
  if (k > 1) {
    mm *= k;
    w = Math.round(ew / mm);
    h = Math.round(eh / mm);
  }
  return { width: Math.max(1, w), height: Math.max(1, h), mmPerPixel: mm };
}

/* ───────────── reamostragem ───────────── */

export type RenderJob = {
  Hpi: number[];
  lens: Lens;
  extent: Extent;
  mmPerPixel: number;
  width: number;
  height: number;
  /** fator foto real → foto carregada (quando a foto foi reduzida para caber na memória) */
  srcScale: number;
};

/**
 * Renderiza linhas [y0, y0+rows) da saída em `out` (RGBA). Mapeamento inverso com bilinear e
 * superamostragem adaptativa (até 3×3) onde a foto é mais densa que a saída — evita
 * serrilhado e moiré em texturas repetitivas.
 */
export function renderRows(src: Uint8ClampedArray | Uint8Array, SW: number, SH: number, job: RenderJob, out: Uint8ClampedArray, y0: number, rows: number) {
  const { Hpi, lens, extent, mmPerPixel, width: W, srcScale: S } = job;
  const m = mmPerPixel / 1000;
  const map = (x: number, y: number): Pt => {
    const u = apply(Hpi, [extent[0] + x * m, extent[1] + y * m]);
    const d = distort(u, lens);
    return [d[0] * S - 0.5, d[1] * S - 0.5];
  };
  const acc = [0, 0, 0];
  for (let r = 0; r < rows; r++) {
    const y = y0 + r;
    // densidade local (px da foto por px da saída), amostrada a cada 64 colunas
    let ss = 1;
    for (let x = 0; x < W; x++) {
      if (x % 64 === 0) {
        const a = map(x + 0.5, y + 0.5);
        const bx = map(x + 1.5, y + 0.5);
        const by = map(x + 0.5, y + 1.5);
        const fp = Math.max(Math.hypot(bx[0] - a[0], bx[1] - a[1]), Math.hypot(by[0] - a[0], by[1] - a[1]));
        ss = fp > 1.25 ? Math.min(3, Math.ceil(fp)) : 1;
      }
      const o = (r * W + x) * 4;
      acc[0] = acc[1] = acc[2] = 0;
      let n = 0;
      for (let j = 0; j < ss; j++) {
        for (let i = 0; i < ss; i++) {
          const [sx, sy] = map(x + (i + 0.5) / ss, y + (j + 0.5) / ss);
          if (sx < 0 || sy < 0 || sx >= SW - 1 || sy >= SH - 1) continue;
          const x0 = sx | 0;
          const yy = sy | 0;
          const fx = sx - x0;
          const fy = sy - yy;
          const i00 = (yy * SW + x0) * 4;
          const i10 = i00 + 4;
          const i01 = i00 + SW * 4;
          const i11 = i01 + 4;
          for (let c = 0; c < 3; c++) {
            const top = src[i00 + c]! * (1 - fx) + src[i10 + c]! * fx;
            const bot = src[i01 + c]! * (1 - fx) + src[i11 + c]! * fx;
            acc[c]! += top * (1 - fy) + bot * fy;
          }
          n++;
        }
      }
      if (!n) {
        out[o] = out[o + 1] = out[o + 2] = 255; // fora da foto: branco
      } else {
        out[o] = acc[0]! / n;
        out[o + 1] = acc[1]! / n;
        out[o + 2] = acc[2]! / n;
      }
      out[o + 3] = 255;
    }
  }
}

/* ───────────── formatação ───────────── */

export function fmtPrecision(mm: number) {
  if (mm < 10) return `±${mm.toFixed(0)} mm`;
  return `±${(mm / 10).toFixed(mm < 100 ? 1 : 0).replace(".", ",")} cm`;
}

/** Qualidade da retificação a partir da precisão relativa à maior dimensão de referência. */
export function quality(precisionMm: number, refSizeM: number) {
  const rel = precisionMm / (refSizeM * 1000);
  if (rel <= 0.003) return { level: "excelente", label: "Excelente" };
  if (rel <= 0.01) return { level: "boa", label: "Boa" };
  if (rel <= 0.025) return { level: "regular", label: "Regular" };
  return { level: "fraca", label: "Fraca — revise os pontos" };
}
