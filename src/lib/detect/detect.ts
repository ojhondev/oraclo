// Detecção automática de danos, versão 1: visão computacional clássica, roda inteira no
// navegador (Web Worker), sem servidor nem API paga. Cada detector devolve contornos com uma
// confiança heurística (0–1); nada vira dano sem o profissional aceitar. Funções puras.
import { maskToPolygon, type XY } from "../sam/contour";
import { toLab } from "../sam/wand";

export const DETECTOR_VERSION = "cv-1";

export type DetectCode = "FIS" | "BIO" | "VEG" | "PRB" | "UMA" | "UMD" | "SUJ" | "EFL";
export type Detection = {
  code: DetectCode;
  kind: "area" | "linha" | "ponto";
  /** Coordenadas na imagem analisada (o worker converte para pixels da vista). */
  points: XY[];
  confidence: number;
  detector: string;
  /** Tamanho relativo (para ordenar): área em px ou comprimento². */
  size: number;
};

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
  const all = new Uint8Array(w * h).fill(1);
  const f = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) f[i] = mask[i]!;
  const m = boxMean(f, all, w, h, r);
  const out = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) out[i] = m[i]! > 0 ? 1 : 0;
  return out;
}

/** Mínimo/máximo móvel separável (para o fechamento morfológico do detector de fissuras). */
function minMax(src: Float32Array, w: number, h: number, r: number, max: boolean): Float32Array {
  const s = max ? 1 : -1; // compara sempre "maior" (no mínimo, com o sinal trocado)
  const tmp = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let v = s * src[row + x]!;
      const k1 = Math.min(w - 1, x + r);
      for (let k = Math.max(0, x - r); k <= k1; k++) {
        const q = s * src[row + k]!;
        if (q > v) v = q;
      }
      tmp[row + x] = v;
    }
  }
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const k0 = Math.max(0, y - r);
    const k1 = Math.min(h - 1, y + r);
    for (let x = 0; x < w; x++) {
      let v = tmp[y * w + x]!;
      for (let k = k0; k <= k1; k++) {
        const q = tmp[k * w + x]!;
        if (q > v) v = q;
      }
      out[y * w + x] = s * v;
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
function robust(values: number[]) {
  if (!values.length) return { med: 0, sigma: 1 };
  const s = [...values].sort((a, b) => a - b);
  const med = s[Math.floor(s.length / 2)]!;
  const dev = s.map((v) => Math.abs(v - med)).sort((a, b) => a - b);
  return { med, sigma: Math.max(0.5, 1.4826 * dev[Math.floor(dev.length / 2)]!) };
}

export type DetectResult = { detections: Detection[]; facade: { x0: number; y0: number; x1: number; y1: number } };

/**
 * Analisa a imagem (RGBA, já reduzida pelo worker) e devolve as detecções.
 * Pixels transparentes, pretos ou brancos puros (margens da retificação) ficam de fora.
 */
export function detectDamages(px: Uint8ClampedArray, w: number, h: number, debug?: Record<string, Uint8Array>): DetectResult {
  const N = w * h;
  // 1. o que é fachada
  let valid = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const r = px[i * 4]!;
    const g = px[i * 4 + 1]!;
    const b = px[i * 4 + 2]!;
    const a = px[i * 4 + 3]!;
    const black = r < 6 && g < 6 && b < 6;
    const white = r > 250 && g > 250 && b > 250;
    valid[i] = a > 250 && !black && !white ? 1 : 0;
  }
  // tira uma faixa da borda das margens (transição serrilhada)
  {
    const inv = new Uint8Array(N);
    for (let i = 0; i < N; i++) inv[i] = valid[i] ? 0 : 1;
    const near = dilate(inv, w, h, 3);
    const v2 = new Uint8Array(N);
    for (let i = 0; i < N; i++) v2[i] = valid[i] && !near[i] ? 1 : 0;
    valid = v2;
  }
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
  if (validN < 10_000) return { detections: [], facade };
  const fw = fx1 - fx0 + 1;
  const fh = fy1 - fy0 + 1;

  // 2. cor (Lab) e fundo local da parede (média larga): os danos são o que destoa dele
  const lab = toLab(px, w, h);
  const L = new Float32Array(N);
  const A = new Float32Array(N);
  const B = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    L[i] = lab[i * 3]!;
    A[i] = lab[i * 3 + 1]!;
    B[i] = lab[i * 3 + 2]!;
  }
  const R = Math.max(8, Math.round(Math.max(fw, fh) / 22));
  const bgL0 = boxMean(L, valid, w, h, R);
  const bgA = boxMean(A, valid, w, h, R);
  const upper = new Uint8Array(N);
  for (let i = 0; i < N; i++) upper[i] = valid[i] && L[i]! >= bgL0[i]! ? 1 : 0;
  const bgL = boxMean(L, upper, w, h, R);
  const dL = new Float32Array(N);
  const dA = new Float32Array(N);
  const chroma = new Float32Array(N);
  const sample: number[] = [];
  for (let i = 0; i < N; i++) {
    dL[i] = L[i]! - bgL[i]!;
    dA[i] = A[i]! - bgA[i]!;
    chroma[i] = Math.sqrt(A[i]! * A[i]! + B[i]! * B[i]!);
    if (valid[i] && i % 29 === 0) sample.push(dL[i]!);
  }
  const { sigma } = robust(sample);
  const grad = new Float32Array(N);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = L[i + 1]! - L[i - 1]!;
      const gy = L[i + w]! - L[i - w]!;
      grad[i] = Math.sqrt(gx * gx + gy * gy) / 2;
    }
  }
  const gSample: number[] = [];
  for (let i = 0; i < N; i += 29) if (valid[i]) gSample.push(grad[i]!);
  gSample.sort((a, b) => a - b);
  const gradMed = Math.max(0.5, gSample[Math.floor(gSample.length / 2)] ?? 1);
  const T = Math.max(7, 2.5 * sigma);
  // reboco limpo: percentil 90 da luminosidade da fachada (referência global — com a parede
  // quase toda manchada, a média local também fica manchada e esconde a mancha)
  const lSample: number[] = [];
  for (let i = 0; i < N; i += 23) if (valid[i]) lSample.push(L[i]!);
  lSample.sort((a, b) => a - b);
  const Lclean = lSample[Math.floor(lSample.length * 0.9)] ?? 80;
  const stainHi = Lclean - Math.max(10, Lclean * 0.13);
  const stainLo = Math.max(38, Lclean - 48);
  const minA = Math.max(120, validN * 0.0004);
  const out: Detection[] = [];

  // 3. vãos (janelas, portas): muito escuros e retangulares — não são dano e ficam de fora
  const darkMask = new Uint8Array(N);
  for (let i = 0; i < N; i++) darkMask[i] = valid[i] && L[i]! < 24 && dL[i]! < -22 ? 1 : 0;
  const openings = new Uint8Array(N);
  {
    const { lab: dl, comps } = components(darkMask, w, h, [], minA);
    for (const c of comps) {
      const fill = c.n / ((c.x1 - c.x0 + 1) * (c.y1 - c.y0 + 1));
      if (fill > 0.5) for (let y = c.y0; y <= c.y1; y++) for (let x = c.x0; x <= c.x1; x++) openings[y * w + x] = 1;
      else for (let y = c.y0; y <= c.y1; y++) for (let x = c.x0; x <= c.x1; x++) if (dl[y * w + x] === c.id) openings[y * w + x] = 1;
    }
  }
  const blocked = dilate(openings, w, h, 4);

  // 4. biodeterioração e vegetação: desvio para o verde
  const green = new Uint8Array(N);
  for (let i = 0; i < N; i++) green[i] = valid[i] && !blocked[i] && dA[i]! < -6 && A[i]! < -3 && B[i]! > -6 ? 1 : 0;
  const greenS = smooth(green, valid, w, h, 2, 0.5);
  {
    const { lab: gl, comps } = components(greenS, w, h, [dA, A, chroma], minA);
    for (const c of comps) {
      if (c.n > validN * 0.3) continue;
      const fill = c.n / ((c.x1 - c.x0 + 1) * (c.y1 - c.y0 + 1));
      if (fill > 0.62 && c.f[2]! > 14) continue;
      // faixa fina e reta (caixilho, moldura pintada)
      const ga = axes(c);
      if (ga.l1 / ga.l2 > 40) continue;
      const conf = clamp(0.35 + -c.f[0]! / 30, 0.35, 0.92);
      if (c.n < validN * 0.002 && c.f[1]! < -14) {
        out.push({ code: "VEG", kind: "ponto", points: [[c.cx, c.cy]], confidence: conf, detector: `${DETECTOR_VERSION}:verde`, size: c.n });
      } else {
        const poly = polygonOf(gl, w, c);
        if (poly.length >= 3) out.push({ code: "BIO", kind: "area", points: poly, confidence: conf, detector: `${DETECTOR_VERSION}:verde`, size: c.n });
      }
    }
  }

  // 5. perda de reboco: alvenaria (tijolo) aparente, vermelho-alaranjada acima do fundo
  const brick = new Uint8Array(N);
  for (let i = 0; i < N; i++) brick[i] = valid[i] && !blocked[i] && !greenS[i] && A[i]! > 10 && dA[i]! > 7 && B[i]! > 10 && L[i]! > 20 && L[i]! < 82 ? 1 : 0;
  const brickS = smooth(brick, valid, w, h, 2, 0.5);
  {
    const { lab: bl, comps } = components(brickS, w, h, [dA], minA * 1.5);
    for (const c of comps) {
      if (c.n > validN * 0.3) continue;
      // retângulo cheio (telhado, peça pintada) não é lacuna de reboco
      if (c.n / ((c.x1 - c.x0 + 1) * (c.y1 - c.y0 + 1)) > 0.8) continue;
      const poly = polygonOf(bl, w, c);
      if (poly.length >= 3)
        out.push({ code: "PRB", kind: "area", points: poly, confidence: clamp(0.3 + c.f[0]! / 35, 0.3, 0.85), detector: `${DETECTOR_VERSION}:reboco`, size: c.n });
    }
  }

  // 6. manchas escuras (umidade, escorrimento, sujidade) e claras (eflorescência)
  const dark = new Uint8Array(N);
  const bright = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    if (!valid[i] || blocked[i] || greenS[i] || brickS[i]) continue;
    // faixa intermediária: mais escuro que o reboco limpo, mais claro que pedra escura e vãos
    // (vidro reflete o céu e fica azulado; mancha em reboco é neutra ou quente)
    if (L[i]! < stainHi && L[i]! > stainLo && B[i]! > -4) dark[i] = 1;
    else if (dL[i]! > T && chroma[i]! < 10 && L[i]! < 97) bright[i] = 1;
  }
  const darkS = smooth(dark, valid, w, h, 5, 0.55);
  if (debug) Object.assign(debug, { dark, darkS, openings, valid });
  /** Fração clara (reboco) em volta do componente: mancha em reboco sim, pedra escura não. */
  const surroundLight = (c: Comp) => {
    const m = 6;
    let n = 0;
    let light = 0;
    for (let y = Math.max(0, c.y0 - m); y <= Math.min(h - 1, c.y1 + m); y += 2) {
      for (let x = Math.max(0, c.x0 - m); x <= Math.min(w - 1, c.x1 + m); x += 2) {
        const i = y * w + x;
        if (!valid[i] || darkS[i] || openings[i]) continue;
        n++;
        if (L[i]! > 58) light++;
      }
    }
    return n ? light / n : 0;
  };
  {
    const { lab: ml, comps } = components(darkS, w, h, [chroma, grad, L], minA * 2);
    for (const c of comps) {
      const bw = c.x1 - c.x0 + 1;
      const bh = c.y1 - c.y0 + 1;
      // plano inteiro mais escuro (parede na sombra, outro plano da foto): não é mancha
      if (c.n > validN * 0.08) continue;
      // faixa longa e fina na horizontal: sombra de cornija/beiral, não dano
      if (bw > 6 * bh && bh < fh * 0.04) continue;
      // mancha é mosqueada (textura); sombra e pintura uniforme são lisas
      const texture = c.f[1]! / gradMed;
      if (debug) ((debug as unknown as { comps: unknown[] }).comps ??= []).push({ n: c.n, x: c.x0, y: c.y0, bw, bh, grad: +c.f[1]!.toFixed(2), texture: +texture.toFixed(2), L: +c.f[2]!.toFixed(1) });
      // (relativa à textura típica da fachada: não depende da resolução nem da câmera)
      if (texture < 3) continue;
      if (surroundLight(c) < 0.4) continue;
      const contrast = clamp((Lclean - c.f[2]!) / 35, 0, 1);
      const relTop = (c.y0 - fy0) / fh;
      const relBottom = (c.y1 - fy0) / fh;
      let code: DetectCode;
      let base: number;
      if (c.f[0]! < 8 && Lclean - c.f[2]! > 28) {
        // cinza-escuro sem cor: sujidade / crosta negra
        code = "SUJ";
        base = 0.4;
      } else if (relBottom > 0.8 && relTop > 0.45) {
        // na base da parede: umidade ascendente
        code = "UMA";
        base = 0.45;
      } else {
        // escorrimento vindo de cima: umidade descendente / infiltração
        code = "UMD";
        base = bh > 1.4 * bw ? 0.42 : 0.34;
      }
      const poly = polygonOf(ml, w, c);
      if (poly.length >= 3)
        out.push({
          code,
          kind: "area",
          points: poly,
          confidence: clamp(base + 0.2 * contrast + 0.1 * clamp((texture - 3) / 2, 0, 1), 0.3, 0.8),
          detector: `${DETECTOR_VERSION}:mancha`,
          size: c.n,
        });
    }
  }
  const brightS = smooth(bright, valid, w, h, 3, 0.5);
  {
    const { lab: el, comps } = components(brightS, w, h, [dL], minA * 2);
    for (const c of comps) {
      if (c.n > validN * 0.15) continue;
      const poly = polygonOf(el, w, c);
      const contrast = clamp((c.f[0]! - T) / 25, 0, 1);
      if (poly.length >= 3)
        out.push({ code: "EFL", kind: "area", points: poly, confidence: clamp(0.3 + 0.25 * contrast, 0.3, 0.6), detector: `${DETECTOR_VERSION}:clara`, size: c.n });
    }
  }

  // 7. fissuras: linhas finas mais escuras que a vizinhança imediata (black-hat morfológico)
  const gray = new Float32Array(N);
  for (let i = 0; i < N; i++) gray[i] = 0.299 * px[i * 4]! + 0.587 * px[i * 4 + 1]! + 0.114 * px[i * 4 + 2]!;
  const closing = minMax(minMax(gray, w, h, 3, true), w, h, 3, false);
  const bh = new Float32Array(N);
  const bhSample: number[] = [];
  for (let i = 0; i < N; i++) {
    bh[i] = closing[i]! - gray[i]!;
    if (valid[i] && i % 29 === 0) bhSample.push(bh[i]!);
  }
  const bhStats = robust(bhSample);
  const TB = Math.max(14, bhStats.med + 5 * bhStats.sigma);
  /** Vale de verdade: dos dois lados da linha a parede é mais clara e parecida (borda entre materiais não passa). */
  const twoSided = (line: XY[]) => {
    let ok = 0;
    let n = 0;
    const g = (x: number, y: number) => {
      const xi = Math.round(x);
      const yi = Math.round(y);
      return xi >= 0 && yi >= 0 && xi < w && yi < h && valid[yi * w + xi] ? gray[yi * w + xi]! : NaN;
    };
    for (let k = 0; k < line.length; k++) {
      const a = line[Math.max(0, k - 1)]!;
      const b = line[Math.min(line.length - 1, k + 1)]!;
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const nx = -(b[1] - a[1]) / len;
      const ny = (b[0] - a[0]) / len;
      const [x, y] = line[k]!;
      // mínimo numa faixa de ±3 px (a linha central é aproximada)
      let c = Infinity;
      let off = 0;
      for (let t = -3; t <= 3; t++) {
        const v = g(x + nx * t, y + ny * t);
        if (v < c) {
          c = v;
          off = t;
        }
      }
      // os lados ficam a 5 px de onde a linha de fato está
      const s1 = g(x + nx * (off + 5), y + ny * (off + 5));
      const s2 = g(x + nx * (off - 5), y + ny * (off - 5));
      if (!Number.isFinite(c) || Number.isNaN(s1) || Number.isNaN(s2)) continue;
      n++;
      const depth = Math.min(s1, s2) - c;
      if (depth > 8 && Math.abs(s1 - s2) < Math.max(14, depth * 0.8)) ok++;
    }
    return n >= 2 && ok / n >= 0.6;
  };
  const crack = new Uint8Array(N);
  for (let i = 0; i < N; i++) crack[i] = valid[i] && !blocked[i] && !greenS[i] && bh[i]! > TB ? 1 : 0;
  {
    const minLen = Math.max(25, Math.max(fw, fh) / 40);
    const { lab: cl, comps } = components(crack, w, h, [bh], 12);
    for (const c of comps) {
      const { l1, l2, ang } = axes(c);
      const len = Math.sqrt(12 * l1);
      if (debug && len >= minLen) ((debug as unknown as { cracks: unknown[] }).cracks ??= []).push({ n: c.n, len: Math.round(len), width: +(c.n / len).toFixed(1), elong: Math.round(Math.sqrt(l1 / l2)), w2: +Math.sqrt(l2).toFixed(1), deg: Math.round((ang * 180) / Math.PI) });
      if (len < minLen) continue;
      const width = c.n / len;
      const elong = Math.sqrt(l1 / l2);
      if (width > 5 || elong < 6) continue;
      // reta e alinhada com a fachada: junta, frisos, caixilho — arquitetura, não fissura
      const deg = Math.abs(((ang * 180) / Math.PI) % 90);
      const axisAligned = deg < 6 || deg > 84;
      if (axisAligned && Math.sqrt(l2) < 2.5) continue;
      // longa e reta demais (fio, friso, junta): fissura real é sinuosa
      if (Math.sqrt(l2) / len < 0.008 && len > 2 * minLen) continue;
      const line = centerline(cl, w, c);
      if (line.length < 2) continue;
      if (!twoSided(line)) continue;
      const strength = clamp((c.f[0]! - TB) / 30, 0, 1);
      out.push({
        code: "FIS",
        kind: "linha",
        points: line,
        confidence: clamp(0.3 + 0.25 * strength + 0.15 * clamp((len - minLen) / (minLen * 4), 0, 1), 0.3, 0.72),
        detector: `${DETECTOR_VERSION}:fissura`,
        size: len * len,
      });
    }
  }

  // 8. limita por classe (as mais confiáveis e maiores primeiro)
  const byCode = new Map<DetectCode, Detection[]>();
  for (const d of out) byCode.set(d.code, [...(byCode.get(d.code) ?? []), d]);
  const kept: Detection[] = [];
  for (const list of byCode.values()) {
    list.sort((a, b) => b.confidence * Math.sqrt(b.size) - a.confidence * Math.sqrt(a.size));
    kept.push(...list.slice(0, 25));
  }
  return { detections: kept.sort((a, b) => b.confidence - a.confidence).slice(0, 120), facade };
}
