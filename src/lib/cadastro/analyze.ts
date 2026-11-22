/**
 * Levantamento cadastral automático (módulo experimental, isolado do fluxo principal do ArchRay).
 *
 * Lê uma vista de fachada em verdadeira grandeza (retificada ou gerada da nuvem) e reconhece os
 * elementos que um desenho de fachada precisa: vãos (janelas e portas, com ou sem arco), faixas
 * horizontais (cornijas, frisos, peitoris) e pilastras. Puro (sem DOM), testado em
 * tests/cadastro.test.ts. Trabalha em pixels; a conversão para metros fica com quem chama.
 */

export type Box = { x0: number; y0: number; x1: number; y1: number };
/** Vão: retângulo do vão; `arched` = verga em arco; `score` = confiança 0..1. */
export type Vao = Box & { arched: boolean; score: number };
/** Faixa horizontal contínua (cornija, friso, peitoril corrido), em y. */
export type Band = { y: number; strength: number };
export type Analysis = { w: number; h: number; facade: Box; wall: number; vaos: Vao[]; piers: Box[]; bands: Band[]; dark: Uint8Array };

export type Options = {
  /** Parede = acima desta fração do tom do reboco; o resto é recorte (vão, moldura, cantaria). */
  darkFrac?: number;
  /** Fração mínima de colunas com borda horizontal para uma linha contar como faixa. */
  bandContinuity?: number;
};

const lum = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(p * (s.length - 1))))]!;
}

/** Céu: claro, azulado e liso. Fica fora da fachada. */
function skyMask(px: Uint8ClampedArray, L: Float32Array, w: number, h: number) {
  const sky = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const r = px[i * 4]!, g = px[i * 4 + 1]!, b = px[i * 4 + 2]!;
      const flat = Math.abs(L[i + 1]! - L[i - 1]!) + Math.abs(L[i + w]! - L[i - w]!) < 10;
      if (b > r + 12 && b >= g && L[i]! > 110 && flat) sky[i] = 1;
    }
  }
  return sky;
}

/** Caixa da fachada: linhas e colunas com maioria de pixels que não são céu nem vazio. */
function facadeBox(sky: Uint8Array, px: Uint8ClampedArray, w: number, h: number): Box {
  const ok = (i: number) => !sky[i] && px[i * 4 + 3]! > 0;
  const rows: number[] = [];
  for (let y = 0; y < h; y++) {
    let n = 0;
    for (let x = 0; x < w; x++) if (ok(y * w + x)) n++;
    rows.push(n / w);
  }
  const cols: number[] = [];
  for (let x = 0; x < w; x++) {
    let n = 0;
    for (let y = 0; y < h; y++) if (ok(y * w + x)) n++;
    cols.push(n / h);
  }
  const first = (a: number[], t: number) => Math.max(0, a.findIndex((v) => v > t));
  const last = (a: number[], t: number) => {
    for (let i = a.length - 1; i >= 0; i--) if (a[i]! > t) return i;
    return a.length - 1;
  };
  return { x0: first(cols, 0.5), y0: first(rows, 0.5), x1: last(cols, 0.5), y1: last(rows, 0.5) };
}

function dilate(m: Uint8Array, w: number, h: number, r: number) {
  const tmp = new Uint8Array(w * h);
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (let k = -r; k <= r && !v; k++) {
        const xx = x + k;
        if (xx >= 0 && xx < w && m[y * w + xx]) v = 1;
      }
      tmp[y * w + x] = v;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (let k = -r; k <= r && !v; k++) {
        const yy = y + k;
        if (yy >= 0 && yy < h && tmp[yy * w + x]) v = 1;
      }
      out[y * w + x] = v;
    }
  return out;
}

const erode = (m: Uint8Array, w: number, h: number, r: number) => {
  const inv = new Uint8Array(w * h);
  for (let i = 0; i < m.length; i++) inv[i] = m[i] ? 0 : 1;
  const d = dilate(inv, w, h, r);
  for (let i = 0; i < d.length; i++) d[i] = d[i] ? 0 : 1;
  return d;
};

type Blob = Box & { n: number; px: number[] };

/** Componentes conexos (4-vizinhança) da máscara. */
function blobs(m: Uint8Array, w: number, h: number, minN: number): Blob[] {
  const seen = new Uint8Array(w * h);
  const out: Blob[] = [];
  const stack: number[] = [];
  for (let s = 0; s < m.length; s++) {
    if (!m[s] || seen[s]) continue;
    const b: Blob = { x0: w, y0: h, x1: 0, y1: 0, n: 0, px: [] };
    stack.push(s);
    seen[s] = 1;
    while (stack.length) {
      const i = stack.pop()!;
      const x = i % w, y = (i - x) / w;
      b.n++;
      b.px.push(i);
      if (x < b.x0) b.x0 = x;
      if (x > b.x1) b.x1 = x;
      if (y < b.y0) b.y0 = y;
      if (y > b.y1) b.y1 = y;
      const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1];
      for (const j of nb) if (j >= 0 && m[j] && !seen[j]) {
        seen[j] = 1;
        stack.push(j);
      }
    }
    if (b.n >= minN) out.push(b);
  }
  return out;
}

/** Fração preenchida de uma faixa horizontal da caixa (usada para reconhecer arco no topo). */
function rowFill(b: Blob, w: number, f0: number, f1: number) {
  const ya = b.y0 + Math.floor((b.y1 - b.y0 + 1) * f0);
  const yb = b.y0 + Math.max(1, Math.floor((b.y1 - b.y0 + 1) * f1));
  const width = b.x1 - b.x0 + 1;
  let n = 0;
  for (const i of b.px) {
    const y = Math.floor(i / w);
    if (y >= ya && y < yb) n++;
  }
  return n / Math.max(1, width * (yb - ya));
}

/**
 * Faixas horizontais: linhas onde uma borda horizontal atravessa boa parte da largura da fachada
 * (continuidade), com supressão das vizinhas.
 */
function findBands(L: Float32Array, w: number, f: Box, continuity: number): Band[] {
  const fw = f.x1 - f.x0 + 1;
  const prof: number[] = [];
  for (let y = 0; y < L.length / w; y++) {
    if (y < f.y0 + 2 || y > f.y1 - 2) {
      prof.push(0);
      continue;
    }
    let n = 0;
    for (let x = f.x0; x <= f.x1; x++) {
      const i = y * w + x;
      if (Math.abs(L[i + w]! - L[i - w]!) > 18) n++;
    }
    prof.push(n / fw);
  }
  const minGap = Math.max(4, Math.round((f.y1 - f.y0) * 0.02));
  const cand = prof.map((v, y) => ({ y, v })).filter((c) => c.v >= continuity).sort((a, b) => b.v - a.v);
  const picked: Band[] = [];
  for (const c of cand) if (picked.every((p) => Math.abs(p.y - c.y) >= minGap)) picked.push({ y: c.y, strength: c.v });
  return picked.sort((a, b) => a.y - b.y);
}

/** Reconhece vãos, pilastras e faixas numa vista de fachada (RGBA, já reduzida pelo chamador). */
export function analyzeFacade(px: Uint8ClampedArray, w: number, h: number, opts: Options = {}): Analysis {
  const L = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) L[i] = lum(px[i * 4]!, px[i * 4 + 1]!, px[i * 4 + 2]!);
  const sky = skyMask(px, L, w, h);
  const facade = facadeBox(sky, px, w, h);
  const fw = facade.x1 - facade.x0 + 1;
  const fh = facade.y1 - facade.y0 + 1;

  // tom da parede: os tons claros dominantes da fachada (reboco); vão e vidro ficam bem abaixo
  const sample: number[] = [];
  const step = Math.max(1, Math.floor((fw * fh) / 40000));
  for (let y = facade.y0; y <= facade.y1; y += step) for (let x = facade.x0; x <= facade.x1; x += step) if (!sky[y * w + x]) sample.push(L[y * w + x]!);
  const wall = percentile(sample, 0.75);

  // Vão = "buraco" na parede: acha a parede (reboco, o tom claro dominante) e os recortes fechados
  // dentro dela. Funciona com vidro claro ou escuro, cortina, caixilho de qualquer cor.
  const wallMin = wall * (opts.darkFrac ?? 0.72);
  const notWall = new Uint8Array(w * h);
  for (let y = facade.y0; y <= facade.y1; y++)
    for (let x = facade.x0; x <= facade.x1; x++) {
      const i = y * w + x;
      if (!sky[i] && L[i]! < wallMin) notWall[i] = 1;
    }
  // preenche os "anéis": partes claras pequenas e fechadas (caixilho branco, vidro refletindo,
  // cortina) contam como vão; só painéis grandes de reboco continuam sendo parede
  const isWall = new Uint8Array(w * h);
  for (let y = facade.y0; y <= facade.y1; y++) for (let x = facade.x0; x <= facade.x1; x++) if (!notWall[y * w + x] && !sky[y * w + x]) isWall[y * w + x] = 1;
  for (const c of blobs(isWall, w, h, 1)) {
    const small = c.n < fw * fh * 0.012;
    const inner = c.x0 > facade.x0 + 1 && c.x1 < facade.x1 - 1 && c.y0 > facade.y0 + 1 && c.y1 < facade.y1 - 1;
    if (small && inner) for (const i of c.px) notWall[i] = 1;
  }
  // corta frisos e filetes finos de pedra que ligariam um vão à cantaria em volta
  const r = Math.max(1, Math.round(fw * 0.003));
  const cut = erode(notWall, w, h, r);
  const minN = Math.round(fw * fh * 0.0003);
  const margin = r + 2;

  const vaos: Vao[] = [];
  const piers: Box[] = [];
  for (const raw of blobs(cut, w, h, minN)) {
    // devolve à caixa o que a erosão tirou
    const b = { ...raw, x0: Math.max(facade.x0, raw.x0 - r), y0: Math.max(facade.y0, raw.y0 - r), x1: Math.min(facade.x1, raw.x1 + r), y1: Math.min(facade.y1, raw.y1 + r) };
    const bw = b.x1 - b.x0 + 1;
    const bh = b.y1 - b.y0 + 1;
    const fill = raw.n / ((raw.x1 - raw.x0 + 1) * (raw.y1 - raw.y0 + 1));
    const touches = b.x0 <= facade.x0 + margin || b.x1 >= facade.x1 - margin || b.y0 <= facade.y0 + margin || b.y1 >= facade.y1 - margin;
    // pilastra: faixa vertical estreita e alta
    if (bh > fh * 0.3 && bw < fw * 0.09 && bh / bw > 4) {
      piers.push({ x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 });
      continue;
    }
    if (touches) continue; // encosta na borda: é a cantaria/estrutura, não um recorte na parede
    const aspect = bh / bw;
    if (bw < fw * 0.02 || bh < fh * 0.02 || bw > fw * 0.3 || bh > fh * 0.4) continue;
    if (aspect < 0.35 || aspect > 4 || fill < 0.3) continue;
    const top = rowFill(raw, w, 0, 0.18);
    const mid = rowFill(raw, w, 0.35, 0.75);
    const arched = mid > 0.5 && top < mid * 0.7;
    const score = Math.min(1, 0.4 + fill * 0.7) * (aspect > 0.6 && aspect < 3 ? 1 : 0.8);
    vaos.push({ x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1, arched, score: Math.round(score * 100) / 100 });
  }
  const closed = notWall;
  const bands = findBands(L, w, facade, opts.bandContinuity ?? 0.45);
  return { w, h, facade, wall: Math.round(wall), vaos, piers, bands, dark: closed };
}
