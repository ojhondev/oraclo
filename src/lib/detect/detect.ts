// Detecção automática de danos, versão 2: visão computacional clássica, roda inteira no
// navegador (Web Worker), sem servidor nem API paga. Funções puras.
//
// Princípio: nenhuma regra depende de uma cor absoluta ("avermelhado = tijolo"), porque cada
// edificação tem o seu acabamento. O motor primeiro separa a imagem em superfícies homogêneas
// (pintura, reboco, moldura, pedra, vidro, céu, área em sombra) e só então procura, dentro de
// cada superfície, o que destoa dela — com limiares medidos no ruído da própria superfície.
// Assim parede rosa, azul ou ocre, ao sol ou na sombra, é tratada do mesmo jeito.
//
// 1. Superfícies: segmentação por grafo (Felzenszwalb) numa versão reduzida da imagem.
// 2. Cada superfície é classificada: vão/vidro/céu (ignorada), lisa ou decorada/texturizada.
// 3. Fundo local de cada superfície (média aparada, só com pixels dela): sombra de outra
//    superfície ou a moldura ao lado não contaminam o fundo.
// 4. Desvios do fundo, em unidades do ruído da superfície, viram candidatos; a classe sai da
//    direção do desvio (mais claro e menos saturado = pintura perdida; mais escuro e neutro =
//    sujidade; esverdeado = biodeterioração; mesmo tom mais escuro = umidade…).
// 5. Formas geométricas (retângulos, faixas retas, polígonos limpos) são arquitetura, não dano.
// 6. Fissuras: filtro de cristas (Hessiana) em duas escalas, histerese, teste de vale dos dois
//    lados e rejeição de linhas retas demais (juntas, frisos, fios).
// 7. Avisos de qualidade da imagem (sombra dura, superfície decorada, baixa resolução…).
//
// A confiança é heurística (0–1). Nada vira dano sem o profissional aceitar; cada sugestão
// traz a justificativa medida (`reason`) para a revisão.
import { maskToPolygon, type XY } from "../sam/contour";
import { toLab } from "../sam/wand";

export const DETECTOR_VERSION = "cv-2";

export type DetectCode = "FIS" | "BIO" | "VEG" | "PRB" | "UMA" | "UMD" | "SUJ" | "EFL" | "DPT";
export type Detection = {
  code: DetectCode;
  kind: "area" | "linha" | "ponto";
  /** Coordenadas na imagem analisada (o worker converte para pixels da vista). */
  points: XY[];
  confidence: number;
  detector: string;
  /** Tamanho relativo (para ordenar): área em px ou comprimento². */
  size: number;
  /** Por que o motor sugeriu (medidas do desvio), para a revisão humana. */
  reason?: string;
};

/** Aviso sobre a imagem: limita o que a detecção consegue ver. */
export type QualityWarning = { code: "sombra" | "decorada" | "resolucao" | "estourada" | "escura" | "pouca-parede"; message: string };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Média móvel separável (janela 2r+1) ponderada por `weight` (pixels fora da fachada não contam). */
function boxMean(src: Float32Array, weight: Uint8Array, w: number, h: number, r: number): Float32Array {
  const sv = new Float32Array(w * h);
  const sw = new Float32Array(w * h);
  // horizontal
  for (let y = 0; y < h; y++) {
    let a = 0;
    let c = 0;
    const row = y * w;
    for (let x = -r; x < w; x++) {
      const xi = x + r;
      if (xi < w && weight[row + xi]) {
        a += src[row + xi]!;
        c++;
      }
      const xo = x - r - 1;
      if (xo >= 0 && weight[row + xo]) {
        a -= src[row + xo]!;
        c--;
      }
      if (x >= 0) {
        sv[row + x] = a;
        sw[row + x] = c;
      }
    }
  }
  // vertical
  const out = new Float32Array(w * h);
  for (let x = 0; x < w; x++) {
    let a = 0;
    let c = 0;
    for (let y = -r; y < h; y++) {
      const yi = y + r;
      if (yi < h) {
        a += sv[yi * w + x]!;
        c += sw[yi * w + x]!;
      }
      const yo = y - r - 1;
      if (yo >= 0) {
        a -= sv[yo * w + x]!;
        c -= sw[yo * w + x]!;
      }
      if (y >= 0) out[y * w + x] = c > 0 ? a / c : 0;
    }
  }
  return out;
}

/** Suaviza uma máscara binária: fica ligado onde mais de `frac` da vizinhança está ligada. */
function smooth(mask: Uint8Array, valid: Uint8Array, w: number, h: number, r: number, frac: number): Uint8Array {
  const f = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) f[i] = mask[i]!;
  const m = boxMean(f, valid, w, h, r);
  const out = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) out[i] = valid[i] && m[i]! > frac ? 1 : 0;
  return out;
}

/** Dilata uma máscara (quadrado 2r+1). */
function dilate(mask: Uint8Array, w: number, h: number, r: number): Uint8Array {
  // contagem deslizante de pixels ligados na janela, linha e depois coluna
  const tmp = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let c = 0;
    for (let x = 0; x < Math.min(r, w); x++) c += mask[row + x] ? 1 : 0;
    for (let x = 0; x < w; x++) {
      if (x + r < w && mask[row + x + r]) c++;
      if (x - r - 1 >= 0 && mask[row + x - r - 1]) c--;
      tmp[row + x] = c > 0 ? 1 : 0;
    }
  }
  const out = new Uint8Array(w * h);
  for (let x = 0; x < w; x++) {
    let c = 0;
    for (let y = 0; y < Math.min(r, h); y++) c += tmp[y * w + x]!;
    for (let y = 0; y < h; y++) {
      if (y + r < h) c += tmp[(y + r) * w + x]!;
      if (y - r - 1 >= 0) c -= tmp[(y - r - 1) * w + x]!;
      out[y * w + x] = c > 0 ? 1 : 0;
    }
  }
  return out;
}


type Comp = {
  id: number;
  n: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  cx: number;
  cy: number;
  /** Covariância da posição dos pixels (forma). */
  sxx: number;
  syy: number;
  sxy: number;
  /** Médias das grandezas pedidas, na ordem de `feats`. */
  f: number[];
};

/** Componentes 8-conexos da máscara, com estatísticas de forma e médias de `feats`. */
function components(mask: Uint8Array, w: number, h: number, feats: Float32Array[], minN: number) {
  const lab = new Int32Array(w * h);
  const comps: Comp[] = [];
  const stack: number[] = [];
  for (let i = 0; i < w * h; i++) {
    if (!mask[i] || lab[i]) continue;
    const id = comps.length + 1;
    lab[i] = id;
    stack.push(i);
    let n = 0;
    let x0 = w;
    let y0 = h;
    let x1 = 0;
    let y1 = 0;
    let sx = 0;
    let sy = 0;
    let sxx = 0;
    let syy = 0;
    let sxy = 0;
    const fs = feats.map(() => 0);
    while (stack.length) {
      const j = stack.pop()!;
      const x = j % w;
      const y = (j - x) / w;
      n++;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      sx += x;
      sy += y;
      sxx += x * x;
      syy += y * y;
      sxy += x * y;
      for (let k = 0; k < feats.length; k++) fs[k]! += feats[k]![j]!;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          const q = yy * w + xx;
          if (mask[q] && !lab[q]) {
            lab[q] = id;
            stack.push(q);
          }
        }
      }
    }
    const cx = sx / n;
    const cy = sy / n;
    comps.push({
      id,
      n,
      x0,
      y0,
      x1,
      y1,
      cx,
      cy,
      sxx: sxx / n - cx * cx,
      syy: syy / n - cy * cy,
      sxy: sxy / n - cx * cy,
      f: fs.map((v) => v / n),
    });
  }
  return { lab, comps: comps.filter((c) => c.n >= minN) };
}

/** Contorno (polígono) de um componente, recortando só a caixa dele. */
function polygonOf(lab: Int32Array, w: number, c: Comp, maxVertices = 48): XY[] {
  const bx = Math.max(0, c.x0 - 1);
  const by = Math.max(0, c.y0 - 1);
  const bw = c.x1 - bx + 3;
  const bh = c.y1 - by + 3;
  const sub = new Uint8Array(bw * bh);
  for (let y = c.y0; y <= c.y1; y++) for (let x = c.x0; x <= c.x1; x++) if (lab[y * w + x] === c.id) sub[(y - by) * bw + (x - bx)] = 1;
  return maskToPolygon(sub, bw, bh, [], maxVertices).map(([x, y]) => [x + bx, y + by] as XY);
}

/** Eixos principais (autovalores e direção do maior) da nuvem de pixels. */
function axes(c: Comp) {
  const tr = c.sxx + c.syy;
  const det = c.sxx * c.syy - c.sxy * c.sxy;
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  const l1 = tr / 2 + disc;
  const l2 = Math.max(1e-6, tr / 2 - disc);
  const ang = 0.5 * Math.atan2(2 * c.sxy, c.sxx - c.syy);
  return { l1, l2, ux: Math.cos(ang), uy: Math.sin(ang), ang };
}

/** Linha central de uma fissura: média dos pixels em fatias ao longo do eixo principal. */
function centerline(lab: Int32Array, w: number, c: Comp): XY[] {
  const { ux, uy, l1 } = axes(c);
  const len = Math.sqrt(12 * l1);
  const bins = clamp(Math.round(len / 6), 2, 60);
  const half = len / 2;
  const sx = new Float64Array(bins);
  const sy = new Float64Array(bins);
  const sn = new Float64Array(bins);
  for (let y = c.y0; y <= c.y1; y++) {
    for (let x = c.x0; x <= c.x1; x++) {
      if (lab[y * w + x] !== c.id) continue;
      const t = (x - c.cx) * ux + (y - c.cy) * uy;
      const b = clamp(Math.floor(((t + half) / len) * bins), 0, bins - 1);
      sx[b]! += x;
      sy[b]! += y;
      sn[b]!++;
    }
  }
  const out: XY[] = [];
  for (let b = 0; b < bins; b++) if (sn[b]) out.push([sx[b]! / sn[b]!, sy[b]! / sn[b]!]);
  return out;
}


/** Mediana e desvio robusto (MAD) de uma amostra. */
/** Até 6000 valores espaçados: estatística robusta não precisa de todos. */
const thin = (values: number[]) => (values.length <= 6000 ? values : values.filter((_, k) => k % Math.ceil(values.length / 6000) === 0));

function robust(values: number[]) {
  if (!values.length) return { med: 0, sigma: 1 };
  const s = thin(values).sort((a, b) => a - b);
  const med = s[Math.floor(s.length / 2)]!;
  const dev = s.map((v) => Math.abs(v - med)).sort((a, b) => a - b);
  return { med, sigma: Math.max(0.5, 1.4826 * dev[Math.floor(dev.length / 2)]!) };
}

const percentile = (values: number[], p: number) => {
  if (!values.length) return 0;
  const s = thin(values).sort((a, b) => a - b);
  return s[clamp(Math.floor(s.length * p), 0, s.length - 1)]!;
};

/** Área (fórmula do laço) de um polígono. */
function polyArea(p: XY[]) {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i]!;
    const [x2, y2] = p[(i + 1) % p.length]!;
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

/**
 * A máscara (recorte bw×bh) é um polígono simples de até 6 vértices? Mede a sobreposição real
 * (IoU) entre a máscara e o polígono rasterizado — a área sozinha engana (lóbulos se compensam).
 */
function isPolygonal(sub: Uint8Array, bw: number, bh: number, poly: XY[]) {
  if (poly.length < 3 || poly.length > 6) return false;
  let inter = 0;
  let uni = 0;
  for (let y = 0; y < bh; y++) {
    const py = y + 0.5;
    for (let x = 0; x < bw; x++) {
      const px = x + 0.5;
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i]!;
        const [xj, yj] = poly[j]!;
        if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
      }
      const m = sub[y * bw + x]!;
      if (m && inside) inter++;
      if (m || inside) uni++;
    }
  }
  return uni > 0 && inter / uni > 0.93;
}

/** Área do fecho convexo (cadeia monótona) dos pontos. */
function hullArea(pts: XY[]) {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return 0;
  const cross = (o: XY, a: XY, b: XY) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: XY[] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: XY[] = [];
  for (const q of [...p].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, q) <= 0) upper.pop();
    upper.push(q);
  }
  return polyArea([...lower.slice(0, -1), ...upper.slice(0, -1)]);
}

/**
 * Segmentação por grafo (Felzenszwalb–Huttenlocher) da imagem reduzida, em Lab.
 * Junta pixels vizinhos enquanto a diferença entre eles não passa da variação interna da
 * região (+ k/tamanho); regiões menores que `minSize` são absorvidas pela vizinha mais parecida.
 * Devolve o rótulo de cada pixel (0 = fora da fachada) e quantas regiões há.
 */
function segment(L: Float32Array, A: Float32Array, B: Float32Array, valid: Uint8Array, w: number, h: number, k: number, minSize: number) {
  const N = w * h;
  const ea = new Int32Array(N * 4);
  const eb = new Int32Array(N * 4);
  const ew = new Uint16Array(N * 4);
  let m = 0;
  const add = (i: number, j: number) => {
    if (!valid[i] || !valid[j]) return;
    const d = Math.hypot(L[i]! - L[j]!, A[i]! - A[j]!, B[i]! - B[j]!);
    ea[m] = i;
    eb[m] = j;
    ew[m] = Math.min(4095, Math.round(d * 16));
    m++;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (x < w - 1) add(i, i + 1);
      if (y < h - 1) {
        add(i, i + w);
        if (x < w - 1) add(i, i + w + 1);
        if (x > 0) add(i, i + w - 1);
      }
    }
  }
  // ordenação por contagem (pesos inteiros)
  const cnt = new Int32Array(4097);
  for (let e = 0; e < m; e++) cnt[ew[e]! + 1]!++;
  for (let v = 1; v <= 4096; v++) cnt[v]! += cnt[v - 1]!;
  const order = new Int32Array(m);
  for (let e = 0; e < m; e++) order[cnt[ew[e]!]!++] = e;

  const parent = new Int32Array(N);
  const size = new Int32Array(N).fill(1);
  const thr = new Float32Array(N).fill(k);
  for (let i = 0; i < N; i++) parent[i] = i;
  const find = (i: number) => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]!]!;
      i = parent[i]!;
    }
    return i;
  };
  const union = (a: number, b: number, wv: number) => {
    if (size[a]! < size[b]!) [a, b] = [b, a];
    parent[b] = a;
    size[a]! += size[b]!;
    thr[a] = wv + k / size[a]!;
  };
  for (let o = 0; o < m; o++) {
    const e = order[o]!;
    const a = find(ea[e]!);
    const b = find(eb[e]!);
    if (a === b) continue;
    const wv = ew[e]! / 16;
    if (wv <= thr[a]! && wv <= thr[b]!) union(a, b, wv);
  }
  // regiões pequenas e finas (moldura, arco, friso, caixilho) são arquitetura: ficam como superfície
  // própria; as pequenas e compactas (lacunas, manchas) voltam para a superfície em volta
  const root = new Int32Array(N);
  for (let i = 0; i < N; i++) root[i] = find(i);
  const perim = new Int32Array(N);
  const bx0 = new Int32Array(N).fill(w);
  const by0 = new Int32Array(N).fill(h);
  const bx1 = new Int32Array(N);
  const by1 = new Int32Array(N);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!valid[i]) continue;
      const r = root[i]!;
      if (x < bx0[r]!) bx0[r] = x;
      if (x > bx1[r]!) bx1[r] = x;
      if (y < by0[r]!) by0[r] = y;
      if (y > by1[r]!) by1[r] = y;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1 || root[i - 1] !== r || root[i + 1] !== r || root[i - w] !== r || root[i + w] !== r) perim[r]!++;
    }
  const prot = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    if (root[i] !== i || size[i]! >= minSize || size[i]! < 30) continue;
    const thickness = (2 * size[i]!) / Math.max(1, perim[i]!);
    if (thickness <= 6 && Math.max(bx1[i]! - bx0[i]!, by1[i]! - by0[i]!) >= 30) prot[i] = 1;
  }
  const small = (r: number) => size[r]! < minSize && !prot[r];
  for (let o = 0; o < m; o++) {
    const e = order[o]!;
    const a = find(ea[e]!);
    const b = find(eb[e]!);
    if (a === b || !(small(a) || small(b))) continue;
    const keep = prot[a] || prot[b];
    union(a, b, ew[e]! / 16);
    prot[find(a)] = keep;
  }
  const lab = new Int32Array(N);
  const ids = new Map<number, number>();
  for (let i = 0; i < N; i++) {
    if (!valid[i]) continue;
    const r = find(i);
    let id = ids.get(r);
    if (id === undefined) ids.set(r, (id = ids.size + 1));
    lab[i] = id;
  }
  return { lab, count: ids.size };
}

/**
 * Inclusões: região irregular quase toda cercada por uma superfície bem maior (uma lacuna de
 * pintura grande, uma mancha) é dano dentro da superfície, não superfície própria — volta para
 * ela, para que o desvio apareça. Vãos, peças geométricas (janelas, placas, arcos) e áreas muito
 * escuras ou estouradas continuam separadas.
 */
function absorbInclusions(lab: Int32Array, L: Float32Array, w: number, h: number, count: number): number {
  const size = new Int32Array(count + 1);
  const meanL = new Float64Array(count + 1);
  const x0 = new Int32Array(count + 1).fill(w);
  const y0 = new Int32Array(count + 1).fill(h);
  const x1 = new Int32Array(count + 1);
  const y1 = new Int32Array(count + 1);
  const touch = new Map<number, Map<number, number>>();
  const perim = new Int32Array(count + 1);
  const note = (a: number, b: number) => {
    let m = touch.get(a);
    if (!m) touch.set(a, (m = new Map()));
    m.set(b, (m.get(b) ?? 0) + 1);
  };
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const id = lab[i]!;
      if (!id) continue;
      size[id]!++;
      meanL[id]! += L[i]!;
      if (x < x0[id]!) x0[id] = x;
      if (x > x1[id]!) x1[id] = x;
      if (y < y0[id]!) y0[id] = y;
      if (y > y1[id]!) y1[id] = y;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) {
        const other = j < 0 ? 0 : lab[j]!;
        if (other === id) continue;
        perim[id]!++;
        if (other) note(id, other);
      }
    }
  const target = new Int32Array(count + 1);
  const order = Array.from({ length: count }, (_, k) => k + 1).sort((a, b) => size[a]! - size[b]!);
  for (const id of order) {
    const L0 = meanL[id]! / Math.max(1, size[id]!);
    if (L0 < 22 || L0 > 93 || !perim[id]) continue;
    let best = 0;
    let bn = 0;
    for (const [o, n] of touch.get(id) ?? []) if (n > bn) [best, bn] = [o, n];
    if (!best || bn < 0.5 * perim[id]!) continue;
    // inteiramente cercada (miolo de uma mancha em anéis) basta não ser maior que a vizinha;
    // parcialmente, precisa ser bem menor que ela
    const enclosed = bn >= 0.8 * perim[id]!;
    if (enclosed ? size[best]! < size[id]! : size[best]! < 3 * size[id]! || size[id]! > 0.15 * size[best]!) continue;
    // peça geométrica (janela, placa, arco, retângulo pintado): arquitetura
    const bw = x1[id]! - x0[id]! + 1;
    const bh = y1[id]! - y0[id]! + 1;
    const sub = new Uint8Array(bw * bh);
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) if (lab[(y + y0[id]!) * w + x + x0[id]!] === id) sub[y * bw + x] = 1;
    if (isPolygonal(sub, bw, bh, maskToPolygon(sub, bw, bh, [], 6))) continue;
    target[id] = best;
  }
  // segue a cadeia (inclusão dentro de inclusão)
  const resolve = (id: number) => {
    let t = id;
    for (let k = 0; k < 8 && target[t]; k++) t = target[t]!;
    return t;
  };
  let moved = 0;
  for (let i = 0; i < w * h; i++)
    if (lab[i] && target[lab[i]!]) {
      lab[i] = resolve(lab[i]!);
      moved++;
    }
  return moved;
}

/** Desfoque aproximadamente gaussiano (duas médias móveis de raio r). */
function blur(src: Float32Array, w: number, h: number, r: number) {
  const all = new Uint8Array(w * h).fill(1);
  return boxMean(boxMean(src, all, w, h, r), all, w, h, r);
}

/** Erosão de uma máscara (quadrado 2r+1). */
function erode(mask: Uint8Array, w: number, h: number, r: number) {
  const inv = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) inv[i] = mask[i] ? 0 : 1;
  const d = dilate(inv, w, h, r);
  const out = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) out[i] = d[i] ? 0 : 1;
  return out;
}

type HostKind = "vazio" | "lisa" | "decorada";
type Host = {
  id: number;
  n: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  L: number;
  A: number;
  B: number;
  C: number;
  texture: number;
  sL: number;
  sA: number;
  sB: number;
  kind: HostKind;
};

const NAMES: Record<DetectCode, string> = {
  FIS: "fissura",
  BIO: "biodeterioração",
  VEG: "vegetação",
  PRB: "perda de reboco",
  UMA: "umidade ascendente",
  UMD: "umidade descendente",
  SUJ: "sujidade",
  EFL: "eflorescência",
  DPT: "perda de pintura",
};

export type DetectResult = { detections: Detection[]; facade: { x0: number; y0: number; x1: number; y1: number }; quality: QualityWarning[] };

/**
 * Analisa a imagem (RGBA, já reduzida pelo worker) e devolve as detecções e os avisos de qualidade.
 * Pixels transparentes, pretos ou brancos puros (margens da retificação) ficam de fora.
 */
export function detectDamages(px: Uint8ClampedArray, w: number, h: number, debug?: Record<string, unknown>): DetectResult {
  const N = w * h;
  const t0 = performance.now();
  const times: Record<string, number> = {};
  const tick = (k: string) => (times[k] = Math.round(performance.now() - t0));
  const quality: QualityWarning[] = [];
  // 1. o que é imagem (as margens da retificação ficam de fora, com uma faixa de segurança)
  let valid = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const r = px[i * 4]!;
    const g = px[i * 4 + 1]!;
    const b = px[i * 4 + 2]!;
    const a = px[i * 4 + 3]!;
    valid[i] = a > 250 && !(r < 6 && g < 6 && b < 6) && !(r > 250 && g > 250 && b > 250) ? 1 : 0;
  }
  valid = erode(valid, w, h, 3);
  let fx0 = w;
  let fy0 = h;
  let fx1 = 0;
  let fy1 = 0;
  let validN = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!valid[y * w + x]) continue;
      validN++;
      if (x < fx0) fx0 = x;
      if (x > fx1) fx1 = x;
      if (y < fy0) fy0 = y;
      if (y > fy1) fy1 = y;
    }
  }
  const facade = { x0: fx0, y0: fy0, x1: fx1, y1: fy1 };
  if (validN < 10_000) return { detections: [], facade, quality };
  const maxSide = Math.max(fx1 - fx0 + 1, fy1 - fy0 + 1);
  if (maxSide < 1000)
    quality.push({ code: "resolucao", message: "Imagem com pouca resolução: fissuras finas e manchas pequenas podem não aparecer." });

  const lab = toLab(px, w, h);
  const L = new Float32Array(N);
  const A = new Float32Array(N);
  const B = new Float32Array(N);
  let blown = 0;
  for (let i = 0; i < N; i++) {
    L[i] = lab[i * 3]!;
    A[i] = lab[i * 3 + 1]!;
    B[i] = lab[i * 3 + 2]!;
    if (valid[i] && L[i]! > 97) blown++;
  }
  if (blown > validN * 0.04)
    quality.push({ code: "estourada", message: "Parte da imagem está estourada (branca demais): nada pode ser visto nessas áreas." });

  // 2. superfícies: segmentação na imagem reduzida
  const s = Math.max(1, Math.round(Math.max(w, h) / 520));
  const sw = Math.ceil(w / s);
  const sh = Math.ceil(h / s);
  const SN = sw * sh;
  const sL = new Float32Array(SN);
  const sA = new Float32Array(SN);
  const sB = new Float32Array(SN);
  const sCnt = new Float32Array(SN);
  const sTot = new Float32Array(SN);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const c = Math.floor(y / s) * sw + Math.floor(x / s);
      sTot[c]!++;
      if (!valid[i]) continue;
      sL[c]! += L[i]!;
      sA[c]! += A[i]!;
      sB[c]! += B[i]!;
      sCnt[c]!++;
    }
  }
  const sValid = new Uint8Array(SN);
  for (let c = 0; c < SN; c++) {
    if (sCnt[c]! > sTot[c]! * 0.5) {
      sValid[c] = 1;
      sL[c]! /= sCnt[c]!;
      sA[c]! /= sCnt[c]!;
      sB[c]! /= sCnt[c]!;
    }
  }
  const sValidN = sValid.reduce((a, v) => a + v, 0);
  const seg = segment(blur(sL, sw, sh, 1), blur(sA, sw, sh, 1), blur(sB, sw, sh, 1), sValid, sw, sh, 400, Math.max(40, Math.round(sValidN * 0.0025)));
  tick("segment");
  // em passadas: a mancha de borda difusa vira anéis (borda e miolo), absorvidos de fora para dentro
  for (let pass = 0; pass < 6 && absorbInclusions(seg.lab, sL, sw, sh, seg.count); pass++);
  const H = seg.count;
  // cor média de cada região (para decidir o rótulo dos pixels na borda)
  const rL = new Float64Array(H + 1);
  const rA = new Float64Array(H + 1);
  const rB = new Float64Array(H + 1);
  const rN = new Float64Array(H + 1);
  for (let c = 0; c < SN; c++) {
    const id = seg.lab[c]!;
    if (!id) continue;
    rL[id]! += sL[c]!;
    rA[id]! += sA[c]!;
    rB[id]! += sB[c]!;
    rN[id]!++;
  }
  for (let id = 1; id <= H; id++) {
    rL[id]! /= rN[id]! || 1;
    rA[id]! /= rN[id]! || 1;
    rB[id]! /= rN[id]! || 1;
  }
  // rótulo em resolução cheia: entre as células vizinhas, a região de cor mais próxima
  const label = new Int32Array(N);
  const cell = new Int32Array(N);
  // células cercadas pela mesma região: o pixel herda o rótulo sem comparar cores
  const uniform = new Uint8Array(SN);
  for (let cy = 0; cy < sh; cy++)
    for (let cx = 0; cx < sw; cx++) {
      const c = cy * sw + cx;
      const id = seg.lab[c]!;
      if (!id) continue;
      let same = 1;
      for (let dy = -1; dy <= 1 && same; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const yy = cy + dy;
          const xx = cx + dx;
          if (yy >= 0 && yy < sh && xx >= 0 && xx < sw && seg.lab[yy * sw + xx] !== id) {
            same = 0;
            break;
          }
        }
      uniform[c] = same;
    }
  for (let y = 0; y < h; y++) {
    const cy = Math.floor(y / s);
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!valid[i]) continue;
      const cx = Math.floor(x / s);
      const own = cy * sw + cx;
      if (uniform[own]) {
        label[i] = seg.lab[own]!;
        cell[i] = own;
        continue;
      }
      let best = -1;
      let bestD = Infinity;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = cy + dy;
        if (yy < 0 || yy >= sh) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = cx + dx;
          if (xx < 0 || xx >= sw) continue;
          const c = yy * sw + xx;
          const id = seg.lab[c]!;
          if (!id) continue;
          // a célula do próprio pixel tem preferência (empate e ruído)
          const d = Math.hypot(L[i]! - rL[id]!, A[i]! - rA[id]!, B[i]! - rB[id]!) - (dx === 0 && dy === 0 ? 2 : 0);
          if (d < bestD) {
            bestD = d;
            best = c;
          }
        }
      }
      if (best < 0) continue;
      label[i] = seg.lab[best]!;
      cell[i] = best;
    }
  }
  // borda entre superfícies (faixa de 2 px): ali o rótulo é incerto
  const border = new Uint8Array(N);
  /** Extensão (px) da divisa entre cada par de superfícies. */
  const contact = new Map<number, number>();
  const touch = (a: number, b: number) => {
    if (!a || !b) return;
    const key = Math.min(a, b) * 100_000 + Math.max(a, b);
    contact.set(key, (contact.get(key) ?? 0) + 1);
  };
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      const i = y * w + x;
      if (label[i] !== label[i + 1] || label[i] !== label[i + w]) {
        border[i] = 1;
        if (label[i] !== label[i + 1]) touch(label[i]!, label[i + 1]!);
        if (label[i] !== label[i + w]) touch(label[i]!, label[i + w]!);
      }
    }
  }
  const band = dilate(border, w, h, 2);

  // gradiente (textura)
  const grad = new Float32Array(N);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      grad[i] = Math.hypot(L[i + 1]! - L[i - 1]!, L[i + w]! - L[i - w]!) / 2;
    }
  }

  tick("labels");
  // 3. estatísticas de cada superfície
  const hosts: Host[] = [];
  {
    const samples: { L: number[]; A: number[]; B: number[]; g: number[] }[] = [];
    for (let id = 0; id <= H; id++) {
      hosts.push({ id, n: 0, x0: w, y0: h, x1: 0, y1: 0, L: 0, A: 0, B: 0, C: 0, texture: 0, sL: 1, sA: 1, sB: 1, kind: "vazio" });
      samples.push({ L: [], A: [], B: [], g: [] });
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const id = label[i]!;
        if (!id) continue;
        const ho = hosts[id]!;
        ho.n++;
        if (x < ho.x0) ho.x0 = x;
        if (x > ho.x1) ho.x1 = x;
        if (y < ho.y0) ho.y0 = y;
        if (y > ho.y1) ho.y1 = y;
        if (i % 7 === 0 && !band[i]) {
          const sp = samples[id]!;
          sp.L.push(L[i]!);
          sp.A.push(A[i]!);
          sp.B.push(B[i]!);
          sp.g.push(grad[i]!);
        }
      }
    }
    for (const ho of hosts) {
      const sp = samples[ho.id]!;
      if (ho.n < 50 || sp.L.length < 20) continue;
      ho.L = percentile(sp.L, 0.5);
      ho.A = percentile(sp.A, 0.5);
      ho.B = percentile(sp.B, 0.5);
      ho.C = Math.hypot(ho.A, ho.B);
      // quartil superior: padrão de estêncil tem fundo liso entre os motivos
      ho.texture = percentile(sp.g, 0.75);
      const sky = ho.B < -14 && ho.L > 35;
      ho.kind = ho.L < 22 || ho.L > 93 || sky ? "vazio" : ho.texture > 3.6 ? "decorada" : "lisa";
    }
  }
  const surfaceN = { lisa: 0, decorada: 0, vazio: 0 };
  for (const ho of hosts) surfaceN[ho.kind] += ho.n;
  if (surfaceN.decorada > validN * 0.25)
    quality.push({
      code: "decorada",
      message: "Há superfícies decoradas ou muito texturizadas (pintura decorativa, marmorizado, pedra, madeira): nelas a detecção só aponta desvios fortes. Revise essas áreas manualmente.",
    });
  if (surfaceN.lisa < validN * 0.2)
    quality.push({ code: "pouca-parede", message: "Pouca superfície lisa de parede na imagem: a detecção tem pouco onde comparar." });
  {
    // sombra dura: duas superfícies grandes, vizinhas por uma divisa longa, do mesmo tom
    // (a sombra escurece e tira um pouco de cor; o matiz desvia pouco, para o azul do céu) e bem mais escura uma que a outra
    const big = hosts.filter((ho) => ho.kind !== "vazio" && ho.n > validN * 0.04);
    const hue = (ho: Host) => Math.atan2(ho.B, ho.A);
    let shadow = false;
    for (const a of big)
      for (const b of big) {
        if (a === b || a.L - b.L < 22 || a.C < 8 || b.C < 4) continue;
        const shared = contact.get(Math.min(a.id, b.id) * 100_000 + Math.max(a.id, b.id)) ?? 0;
        const ratio = b.C / a.C;
        if (shared > maxSide * 0.08 && Math.abs(hue(a) - hue(b)) < 0.5 && ratio > 0.45 && ratio < 1.15) shadow = true;
      }
    if (shadow)
      quality.push({
        code: "sombra",
        message: "Sombras duras na imagem: as áreas sombreadas são analisadas à parte e com menos contraste. Prefira fotos com luz difusa (céu nublado ou fachada toda na sombra).",
      });
  }
  const medL = percentile(Array.from({ length: Math.min(4000, validN) }, (_, k) => L[Math.floor((k * N) / 4000)]!), 0.5);
  if (medL < 25) quality.push({ code: "escura", message: "Imagem escura: manchas e fissuras perdem contraste." });

  tick("hosts");
  // 4. fundo local de cada superfície (média aparada, na imagem reduzida, só com células dela)
  const bgL = new Float32Array(SN);
  const bgA = new Float32Array(SN);
  const bgB = new Float32Array(SN);
  const R = Math.max(4, Math.round(Math.max(sw, sh) / 8));
  for (const ho of hosts) {
    if (ho.kind === "vazio" || !ho.n) continue;
    const bx0 = Math.floor(ho.x0 / s);
    const by0 = Math.floor(ho.y0 / s);
    const bw = Math.floor(ho.x1 / s) - bx0 + 1;
    const bh = Math.floor(ho.y1 / s) - by0 + 1;
    const n = bw * bh;
    const wt = new Uint8Array(n);
    const cl = new Float32Array(n);
    const ca = new Float32Array(n);
    const cb = new Float32Array(n);
    for (let y = 0; y < bh; y++)
      for (let x = 0; x < bw; x++) {
        const c = (y + by0) * sw + x + bx0;
        const k = y * bw + x;
        if (seg.lab[c] === ho.id) wt[k] = 1;
        cl[k] = sL[c]!;
        ca[k] = sA[c]!;
        cb[k] = sB[c]!;
      }
    let mL = boxMean(cl, wt, bw, bh, R);
    let mA = boxMean(ca, wt, bw, bh, R);
    let mB = boxMean(cb, wt, bw, bh, R);
    // duas passadas aparando o que destoa (o próprio dano não pode puxar o fundo)
    for (let pass = 0; pass < 2; pass++) {
      const res: number[] = [];
      for (let k = 0; k < n; k++) if (wt[k]) res.push(cl[k]! - mL[k]!);
      const { sigma } = robust(res);
      const keep = new Uint8Array(n);
      for (let k = 0; k < n; k++)
        keep[k] = wt[k] && Math.abs(cl[k]! - mL[k]!) < Math.max(3, 2.2 * sigma) && Math.hypot(ca[k]! - mA[k]!, cb[k]! - mB[k]!) < Math.max(3, 2.2 * sigma) ? 1 : 0;
      const nL = boxMean(cl, keep, bw, bh, R);
      const nA = boxMean(ca, keep, bw, bh, R);
      const nB = boxMean(cb, keep, bw, bh, R);
      // onde a janela ficou sem pixels aparados, fica a média anterior
      const wk = boxMean(Float32Array.from(keep), wt, bw, bh, R);
      for (let k = 0; k < n; k++)
        if (wk[k]! < 0.05) {
          nL[k] = mL[k]!;
          nA[k] = mA[k]!;
          nB[k] = mB[k]!;
        }
      mL = nL;
      mA = nA;
      mB = nB;
    }
    for (let y = 0; y < bh; y++)
      for (let x = 0; x < bw; x++) {
        const k = y * bw + x;
        if (!wt[k]) continue;
        const c = (y + by0) * sw + x + bx0;
        bgL[c] = mL[k]!;
        bgA[c] = mA[k]!;
        bgB[c] = mB[k]!;
      }
  }

  tick("background");
  // 5. desvios em resolução cheia, em unidades do ruído de cada superfície
  const dL = new Float32Array(N);
  const dA = new Float32Array(N);
  const dB = new Float32Array(N);
  const dC = new Float32Array(N);
  const sC = new Float32Array(H + 1).fill(1);
  {
    const res: { L: number[]; A: number[]; B: number[]; C: number[] }[] = hosts.map(() => ({ L: [], A: [], B: [], C: [] }));
    for (let i = 0; i < N; i++) {
      const id = label[i]!;
      if (!id || hosts[id]!.kind === "vazio") continue;
      const c = cell[i]!;
      dL[i] = L[i]! - bgL[c]!;
      dA[i] = A[i]! - bgA[c]!;
      dB[i] = B[i]! - bgB[c]!;
      dC[i] = Math.hypot(A[i]!, B[i]!) - Math.hypot(bgA[c]!, bgB[c]!);
      if (i % 5 === 0 && !band[i]) {
        const r = res[id]!;
        r.L.push(dL[i]!);
        r.A.push(dA[i]!);
        r.B.push(dB[i]!);
        r.C.push(dC[i]!);
      }
    }
    for (const ho of hosts) {
      const r = res[ho.id]!;
      if (r.L.length < 20) continue;
      ho.sL = robust(r.L).sigma;
      ho.sA = robust(r.A).sigma;
      ho.sB = robust(r.B).sigma;
      sC[ho.id] = robust(r.C).sigma;
    }
  }
  if (debug) {
    const rgb = new Uint8Array(N * 3);
    for (let i = 0; i < N; i++) {
      const id = label[i]!;
      if (!id) continue;
      const ho = hosts[id]!;
      const hsh = (id * 2654435761) >>> 0;
      const base = ho.kind === "vazio" ? 20 : ho.kind === "decorada" ? 90 : 160;
      rgb[i * 3] = base + (hsh & 63);
      rgb[i * 3 + 1] = base + ((hsh >> 8) & 63);
      rgb[i * 3 + 2] = border[i] ? 255 : base + ((hsh >> 16) & 63);
    }
    debug.seg = rgb;
    debug.hosts = hosts
      .filter((ho) => ho.n > validN * 0.01)
      .map((ho) => ({ id: ho.id, n: ho.n, kind: ho.kind, L: +ho.L.toFixed(1), C: +ho.C.toFixed(1), tex: +ho.texture.toFixed(2), sL: +ho.sL.toFixed(2), sA: +ho.sA.toFixed(2) }));
  }

  const minArea = Math.max(60, validN * 0.00015);
  const out: Detection[] = [];
  const zoneConf = new Map<DetectCode, Float32Array>();
  const zoneReason = new Map<DetectCode, string[]>();
  const kept = new Map<DetectCode, Uint8Array>();
  const keep = (code: DetectCode, comp: { lab: Int32Array; c: Comp }, conf: number, reason: string) => {
    let m = kept.get(code);
    let cf = zoneConf.get(code);
    if (!m || !cf) {
      kept.set(code, (m = new Uint8Array(N)));
      zoneConf.set(code, (cf = new Float32Array(N)));
      zoneReason.set(code, []);
    }
    const { lab: cl, c } = comp;
    for (let y = c.y0; y <= c.y1; y++)
      for (let x = c.x0; x <= c.x1; x++) {
        const i = y * w + x;
        if (cl[i] === c.id) {
          m[i] = 1;
          cf[i] = conf;
        }
      }
    zoneReason.get(code)!.push(`${c.n}|${reason}`);
  };
  /** Superfície predominante do componente. */
  const hostOf = (cl: Int32Array, c: Comp) => {
    const cnt = new Map<number, number>();
    for (let y = c.y0; y <= c.y1; y += 2) for (let x = c.x0; x <= c.x1; x += 2) if (cl[y * w + x] === c.id) cnt.set(label[y * w + x]!, (cnt.get(label[y * w + x]!) ?? 0) + 1);
    let best = 0;
    let bn = -1;
    for (const [id, n] of cnt) if (n > bn) [best, bn] = [id, n];
    return hosts[best]!;
  };
  /** Polígono limpo (retângulo, triângulo, faixa): elemento de arquitetura ou sombra projetada. */
  const geometric = (cl: Int32Array, c: Comp) => {
    if (c.n < 400) return false;
    const bw = c.x1 - c.x0 + 1;
    const bh = c.y1 - c.y0 + 1;
    const sub = new Uint8Array(bw * bh);
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) if (cl[(y + c.y0) * w + x + c.x0] === c.id) sub[y * bw + x] = 1;
    return isPolygonal(sub, bw, bh, maskToPolygon(sub, bw, bh, [], 6));
  };

  tick("residuals");
  // 6. manchas: claras, escuras e de cor, por superfície
  const light = new Uint8Array(N);
  const darkM = new Uint8Array(N);
  const greenM = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const id = label[i]!;
    if (!id) continue;
    const ho = hosts[id]!;
    if (ho.kind === "vazio") continue;
    // superfície decorada e borda entre superfícies: só desvio forte
    const k = (ho.kind === "decorada" ? 1.6 : 1) * (band[i] ? 1.6 : 1);
    const tL = Math.max(5 * k, 3.5 * k * ho.sL);
    const zL = dL[i]! / ho.sL;
    // mais clara e desbotada (pintura perdida) soma as duas evidências
    const zDesat = Math.max(0, -dC[i]!) / sC[id]!;
    if (dL[i]! > tL || (dL[i]! > 4 * k && zL > 1.2 * k && zL + zDesat > 4.5 * k)) light[i] = 1;
    else if (dL[i]! < -tL) darkM[i] = 1;
    // biodeterioração é verde de fato (a < 0), não só "menos vermelha" que uma parede rosa
    if (dA[i]! < -Math.max(4 * k, 3.5 * k * ho.sA) && A[i]! < Math.min(-1.5, ho.A - 4) && L[i]! > 15) greenM[i] = 1;
  }
  if (debug) Object.assign(debug, { light, darkM, greenM });
  const feats = [dL, dA, dB, L, A, B, band, grad];
  // lascas e pontos próximos formam uma área só (como no mapa feito à mão)
  const rg = Math.max(2, Math.round(maxSide / 300));
  const analyse = (mask: Uint8Array, kind: "clara" | "escura" | "verde") => {
    const sm = smooth(mask, valid, w, h, 1, 0.5);
    const grp = erode(dilate(sm, w, h, rg), w, h, rg);
    for (let i = 0; i < N; i++) if (!valid[i]) grp[i] = 0;
    const edge = new Float32Array(N);
    const edgeSm = new Uint8Array(N);
    for (let i = w; i < N - w; i++) {
      if (grp[i] && (!grp[i - 1] || !grp[i + 1] || !grp[i - w] || !grp[i + w])) edge[i] = 1;
      if (sm[i] && (!sm[i - 1] || !sm[i + 1] || !sm[i - w] || !sm[i + w])) edgeSm[i] = 1;
    }
    const { lab: cl, comps } = components(grp, w, h, [edge], minArea);
    for (const c of comps) {
      // médias só nos pixels do desvio: os vãos entre as lascas são parede
      const sum = new Float64Array(feats.length);
      let n = 0;
      let rim = 0;
      let rimGrad = 0;
      for (let y = c.y0; y <= c.y1; y++)
        for (let x = c.x0; x <= c.x1; x++) {
          const i = y * w + x;
          if (cl[i] !== c.id || !sm[i]) continue;
          n++;
          if (edgeSm[i]) {
            rim++;
            rimGrad += grad[i]!;
          }
          for (let k = 0; k < feats.length; k++) sum[k]! += feats[k]![i]!;
        }
      if (n < minArea * 0.6) continue;
      const [mdL, mdA, mdB, mL, mA, mB, inBand, mGrad] = Array.from(sum, (v) => v / n) as [number, number, number, number, number, number, number, number];
      const ho = hostOf(cl, c);
      if (ho.kind === "vazio") continue;
      // a superfície inteira destoando é falha da segmentação, não dano
      if (c.n > ho.n * 0.5) continue;
      // faixa ao longo da borda entre superfícies: aresta de moldura, sombra, vão
      if (inBand > 0.55) continue;
      const ax = axes(c);
      if (ax.l1 / ax.l2 > 15) continue;
      // faixa de largura constante (arco, friso, sombra de moldura): fina e comprida
      const thickness = 2 / Math.max(1e-6, c.f[0]!);
      if (thickness < maxSide / 150 && Math.sqrt(12 * ax.l1) > maxSide / 15) continue;
      if (geometric(cl, c)) continue;
      // contorno liso e contínuo é objeto (arco de pedra, caixilho, painel de reboco entre
      // cantarias, sombra projetada): mancha escura se esgarça na borda; lacuna de pintura tem
      // borda nítida, mas contraste moderado — só o contraste muito forte e liso é descartado
      if (kind === "escura" || Math.abs(mdL) > 35) {
        const p = polygonOf(cl, w, c, 40);
        let per = 0;
        for (let k = 0; k < p.length; k++) per += Math.hypot(p[(k + 1) % p.length]![0] - p[k]![0], p[(k + 1) % p.length]![1] - p[k]![1]);
        // nitidez: na aresta de um objeto o degrau acontece em 1–2 px; na mancha, se espalha
        const sharp = rim ? rimGrad / rim / Math.max(1, Math.abs(mdL)) : 0;
        if (per > 0 && rim / per < 1.45 && sharp > 0.15 && n > minArea * 2) continue;
      }
      // verde de borda nítida é pintura (caixilho, porta, grade); colonização biológica se esgarça
      if (kind === "verde") {
        const sharp = rim ? rimGrad / rim / Math.max(1, Math.hypot(mdL, mdA)) : 0;
        if (sharp > 0.2) continue;
      }
      // peça cheia e convexa de contraste forte (painel, caixilho, tímpano): arquitetura
      if (Math.abs(mdL) > 25 && c.n > minArea * 3) {
        const p = polygonOf(cl, w, c, 40);
        const hull = hullArea(p);
        if (hull > 0 && c.n / hull > 0.86) continue;
      }
      const decor = ho.kind === "decorada";
      if (decor && n < minArea * 4) continue;
      const C = Math.hypot(mA, mB);
      const z = Math.abs(mdL) / ho.sL;
      const zc = Math.hypot(mdA / ho.sA, mdB / ho.sB);
      const relBottom = (c.y1 - ho.y0) / Math.max(1, ho.y1 - ho.y0);
      const sizeK = clamp(Math.log10(n / minArea) / 2, 0, 1);
      let code: DetectCode | null = null;
      let base = 0.4;
      let strength = z;
      let reason = "";
      const sign = (v: number) => (v > 0 ? "+" : "") + v.toFixed(0);
      if (kind === "verde") {
        code = c.n < minArea * 3 && C > 18 ? "VEG" : "BIO";
        base = 0.5;
        strength = zc;
        reason = `Tom esverdeado destoando da superfície (Δa ${sign(mdA)}, ${zc.toFixed(1)}× o ruído dela).`;
      } else if (kind === "clara") {
        if (ho.C < 8 && ho.L > 65 && mL > 85 && C < 6) {
          code = "EFL";
          base = 0.4;
          reason = `Depósito branco e sem cor sobre o reboco claro (ΔL ${sign(mdL)}): sais na superfície, ou lacuna da pintura.`;
        } else if (C <= ho.C - 3 || (ho.C < 8 && mdL > 0)) {
          code = "DPT";
          base = 0.55;
          reason =
            ho.C >= 8
              ? `Mais clara (ΔL ${sign(mdL)}) e menos saturada que a pintura em volta (croma ${C.toFixed(0)} × ${ho.C.toFixed(0)}): base ou reboco exposto.`
              : `Mais clara (ΔL ${sign(mdL)}) que o acabamento em volta: lacuna da pintura, base ou reboco exposto.`;
        }
      } else {
        // escura
        if (mdA > 5 && mdB > 4 && ho.C < 14) {
          code = "PRB";
          base = 0.5;
          reason = `Mais escura e alaranjada que o reboco em volta (ΔL ${sign(mdL)}, Δa ${sign(mdA)}, Δb ${sign(mdB)}): alvenaria aparente.`;
        } else if (C < ho.C * 0.7 - 1 || (ho.C < 8 && mdL < -22)) {
          code = "SUJ";
          base = 0.45;
          reason = `Mais escura (ΔL ${sign(mdL)}) e acinzentada em relação à superfície: depósito de sujidade ou crosta.`;
        } else {
          code = relBottom > 0.85 && c.y0 - ho.y0 > (ho.y1 - ho.y0) * 0.4 ? "UMA" : "UMD";
          base = 0.4;
          reason = `Mesmo tom da superfície, mais escuro (ΔL ${sign(mdL)}): ${code === "UMA" ? "umedecimento junto à base" : "umedecimento ou escorrimento"}.`;
        }
        // azulado: reflexo de céu em vidro ou superfície polida; mancha em alvenaria é quente ou neutra
        if (mdB < -Math.max(4, 2.5 * ho.sB)) continue;
        // sombra suave dentro da superfície: escura, lisa e sem mudança de tom
        if (code !== "PRB" && mGrad < ho.texture * 1.1 && zc < 1.5 && c.n > minArea * 20) continue;
      }
      if (!code) continue;
      let conf = base + 0.22 * clamp((strength - 3.5) / 5, 0, 1) + 0.12 * sizeK - (decor ? 0.15 : 0) - 0.1 * inBand;
      conf = clamp(conf, 0.3, decor ? 0.5 : 0.9);
      keep(code, { lab: cl, c }, conf, reason);
    }
  };
  analyse(greenM, "verde");
  analyse(light, "clara");
  analyse(darkM, "escura");

  tick("stains");
  // zonas: componentes próximos da mesma classe viram uma área só, como no mapa feito à mão
  const rz = Math.max(3, Math.round(maxSide / 160));
  for (const [code, m] of kept) {
    const cf = zoneConf.get(code)!;
    const closed = erode(dilate(m, w, h, rz), w, h, rz);
    const { lab: zl, comps } = components(closed, w, h, [cf, Float32Array.from(m)], minArea);
    const reasons = zoneReason.get(code)!.map((r) => r.split("|")).sort((a, b) => Number(b[0]) - Number(a[0]));
    for (const c of comps) {
      if (!c.f[1]) continue;
      const conf = clamp(c.f[0]! / c.f[1]!, 0.3, 0.9);
      const reason = reasons[0]?.[1] ?? NAMES[code];
      if (code === "VEG") {
        out.push({ code, kind: "ponto", points: [[c.cx, c.cy]], confidence: conf, detector: `${DETECTOR_VERSION}:mancha`, size: c.n, reason });
        continue;
      }
      const poly = polygonOf(zl, w, c, 64);
      if (poly.length >= 3) out.push({ code, kind: "area", points: poly, confidence: conf, detector: `${DETECTOR_VERSION}:mancha`, size: c.n, reason });
    }
  }

  tick("zones");
  // 7. fissuras: cristas escuras (Hessiana) em duas escalas
  const ridge = new Float32Array(N);
  {
    const g1 = blur(L, w, h, 1);
    const g2 = blur(g1, w, h, 2);
    const scales: [Float32Array, number, number][] = [
      [g1, 1, 1.3],
      [g2, 2, 4.8],
    ];
    for (const [g, d, s2] of scales) {
      const dd = d * d;
      for (let y = d; y < h - d; y++) {
        for (let x = d; x < w - d; x++) {
          const i = y * w + x;
          const c = g[i]!;
          const dxx = (g[i + d]! - 2 * c + g[i - d]!) / dd;
          const dyy = (g[i + d * w]! - 2 * c + g[i - d * w]!) / dd;
          const dxy = (g[i + d + d * w]! - g[i + d - d * w]! - g[i - d + d * w]! + g[i - d - d * w]!) / (4 * dd);
          const tr = (dxx + dyy) / 2;
          const disc = Math.sqrt(((dxx - dyy) / 2) ** 2 + dxy * dxy);
          const l1 = tr + disc;
          const l2 = tr - disc;
          // vale (linha escura): curvatura forte numa direção, fraca na outra
          if (l1 > 0 && Math.abs(l2) < 0.5 * l1) {
            const r = l1 * s2;
            if (r > ridge[i]!) ridge[i] = r;
          }
        }
      }
    }
  }
  /** Desvio médio (px) da linha central em relação à reta que liga as pontas. */
  const straightness = (line: XY[]) => {
    const [ax, ay] = line[0]!;
    const [bx, by] = line[line.length - 1]!;
    const len = Math.hypot(bx - ax, by - ay) || 1;
    let s = 0;
    for (const [x, y] of line) s += ((bx - ax) * (ay - y) - (ax - x) * (by - ay)) ** 2 / (len * len);
    return Math.sqrt(s / line.length);
  };
  /** Vale de verdade: dos dois lados a parede é mais clara e parecida (borda entre materiais não passa). */
  const twoSided = (line: XY[]) => {
    let ok = 0;
    let n = 0;
    const g = (x: number, y: number) => {
      const xi = Math.round(x);
      const yi = Math.round(y);
      return xi >= 0 && yi >= 0 && xi < w && yi < h && valid[yi * w + xi] ? L[yi * w + xi]! : NaN;
    };
    for (let k = 0; k < line.length; k++) {
      const a = line[Math.max(0, k - 1)]!;
      const b = line[Math.min(line.length - 1, k + 1)]!;
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const nx = -(b[1] - a[1]) / len;
      const ny = (b[0] - a[0]) / len;
      const [x, y] = line[k]!;
      let c = Infinity;
      let off = 0;
      for (let t = -3; t <= 3; t++) {
        const v = g(x + nx * t, y + ny * t);
        if (v < c) {
          c = v;
          off = t;
        }
      }
      const s1 = g(x + nx * (off + 5), y + ny * (off + 5));
      const s2 = g(x + nx * (off - 5), y + ny * (off - 5));
      if (!Number.isFinite(c) || Number.isNaN(s1) || Number.isNaN(s2)) continue;
      n++;
      const depth = Math.min(s1, s2) - c;
      if (depth > 3 && Math.abs(s1 - s2) < Math.max(6, depth * 0.9)) ok++;
    }
    return n >= 2 && ok / n >= 0.55;
  };
  {
    // limiar por superfície: no ruído dela (a parte na sombra tem menos contraste)
    const hi = new Float32Array(H + 1);
    for (const ho of hosts) hi[ho.id] = ho.kind === "lisa" ? Math.max(1.6, 0.9 * ho.sL) : Infinity;
    const strong = new Uint8Array(N);
    const weak = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      const id = label[i]!;
      if (!id) continue;
      const t = hi[id]!;
      if (ridge[i]! > t) strong[i] = 1;
      if (ridge[i]! > t * 0.5) weak[i] = 1;
    }
    if (debug) Object.assign(debug, { strong, weak });
    const minLen = Math.max(20, maxSide / 60);
    const maxWidth = Math.max(7, maxSide / 250);
    const band4 = Float32Array.from(dilate(border, w, h, 4));
    const { lab: cl, comps } = components(weak, w, h, [Float32Array.from(strong), ridge, band4], 12);
    for (const c of comps) {
      if (c.f[0]! * c.n < 5) continue; // histerese: precisa de trecho forte
      const { l1, l2 } = axes(c);
      const len = Math.sqrt(12 * l1);
      if (len < minLen) continue;
      const width = c.n / len;
      const dev = Math.sqrt(l2);
      if (width > maxWidth || len / Math.max(dev, 0.5) < 5) continue;
      // correndo pela borda entre superfícies: aresta de moldura, de vão ou de sombra
      if (c.f[2]! > 0.4) continue;
      const ho = hostOf(cl, c);
      if (ho.kind !== "lisa") continue;
      const line = centerline(cl, w, c);
      if (line.length < 3 || !twoSided(line)) continue;
      // reta demais (junta, friso, fio, aresta, piso): fissura real é sinuosa
      if (straightness(line) < Math.max(1.5, len * 0.012)) continue;
      const strength = clamp((c.f[1]! / hi[ho.id]! - 0.5) / 1.5, 0, 1);
      out.push({
        code: "FIS",
        kind: "linha",
        points: line,
        confidence: clamp(0.35 + 0.3 * strength + 0.2 * clamp((len - minLen) / (minLen * 4), 0, 1), 0.3, 0.85),
        detector: `${DETECTOR_VERSION}:fissura`,
        size: len * len,
        reason: `Linha fina e sinuosa mais escura que a parede dos dois lados (${Math.round(len)} px). A abertura não é medida: classifique como fissura, trinca ou rachadura na vistoria.`,
      });
    }
  }

  tick("cracks");
  if (debug) debug.times = times;
  // 8. limita por classe (as mais confiáveis e maiores primeiro)
  const byCode = new Map<DetectCode, Detection[]>();
  for (const d of out) byCode.set(d.code, [...(byCode.get(d.code) ?? []), d]);
  const result: Detection[] = [];
  for (const list of byCode.values()) {
    list.sort((a, b) => b.confidence * Math.sqrt(b.size) - a.confidence * Math.sqrt(a.size));
    result.push(...list.slice(0, 25));
  }
  return { detections: result.sort((a, b) => b.confidence - a.confidence).slice(0, 120), facade, quality };
}
