/**
 * Blocos paramétricos do ArchRay CAD: janela e porta geradas a partir de medidas (largura, altura,
 * verga reta / arco pleno / arco abatido, caixilho, divisões, moldura, peitoril). O bloco vira linhas
 * e arcos na hora de desenhar, encaixar e exportar. Puro (sem dependências do resto do CAD para não
 * criar ciclo de import), testado em tests/cad.test.ts.
 */
import type { Arc, Block, BlockParams, Entity, Line, P } from "./types";

/** Modelos para começar um tipo novo. */
export const BLOCK_PRESETS: { key: string; name: string; params: BlockParams }[] = [
  { key: "janela", name: "Janela", params: { kind: "janela", w: 1.2, h: 1.5, top: "reta", rise: 0.25, frame: 0.06, cols: 2, rows: 3, moldura: 0.12, peitoril: 0.06 } },
  { key: "janela-arco", name: "Janela em arco", params: { kind: "janela", w: 1.1, h: 2.2, top: "pleno", rise: 0.25, frame: 0.06, cols: 2, rows: 3, moldura: 0.15, peitoril: 0.08 } },
  { key: "janela-abatida", name: "Janela abatida", params: { kind: "janela", w: 1.2, h: 1.8, top: "abatido", rise: 0.2, frame: 0.06, cols: 2, rows: 3, moldura: 0.14, peitoril: 0.07 } },
  { key: "porta", name: "Porta", params: { kind: "porta", w: 0.9, h: 2.1, top: "reta", rise: 0.2, frame: 0.05, cols: 1, rows: 1, moldura: 0.1, peitoril: 0 } },
  { key: "portada", name: "Portada em arco", params: { kind: "porta", w: 1.6, h: 3.2, top: "pleno", rise: 0.3, frame: 0.06, cols: 2, rows: 2, moldura: 0.2, peitoril: 0 } },
];

/** Flecha efetiva da verga (0 = reta). */
export function riseOf(p: BlockParams) {
  if (p.top === "reta") return 0;
  if (p.top === "pleno") return p.w / 2;
  return Math.max(0.01, Math.min(p.rise, p.w / 2, p.h * 0.9));
}

/** Corrige parâmetros fora do razoável (vindos de campo digitado). */
export function cleanParams(p: BlockParams): BlockParams {
  const w = Math.max(0.1, p.w), h = Math.max(0.1, p.h);
  return {
    ...p,
    w,
    h: p.top === "pleno" ? Math.max(h, w / 2 + 0.05) : h,
    frame: Math.max(0, Math.min(p.frame, w / 4, h / 4)),
    cols: Math.max(1, Math.min(12, Math.round(p.cols))),
    rows: Math.max(1, Math.min(12, Math.round(p.rows))),
    moldura: Math.max(0, p.moldura),
    peitoril: p.kind === "porta" ? 0 : Math.max(0, p.peitoril),
    rise: Math.max(0.01, p.rise),
  };
}

type Piece = { t: "line"; a: P; b: P } | { t: "arc"; c: P; r: number; a0: number; a1: number };

/**
 * Contorno do vão afastado k para dentro (k < 0: para fora), com os lados descendo até yb.
 * Verga em arco: arcos concêntricos ao do vão (o afastamento fica constante).
 */
function outline(w: number, h: number, f: number, k: number, yb: number, bottom: boolean): { pieces: Piece[]; spring: number } {
  const x0 = k, x1 = w - k;
  const out: Piece[] = [];
  let spring: number;
  if (f <= 1e-9) {
    spring = h - k;
    out.push({ t: "line", a: [x0, yb], b: [x0, spring] }, { t: "line", a: [x0, spring], b: [x1, spring] }, { t: "line", a: [x1, spring], b: [x1, yb] });
  } else {
    const c = w / 2;
    const R = (c * c + f * f) / (2 * f);
    const cy = h - R, r = R - k, dx = c - k;
    spring = r > dx ? cy + Math.sqrt(r * r - dx * dx) : cy;
    const a0 = Math.atan2(spring - cy, dx);
    out.push({ t: "line", a: [x0, yb], b: [x0, spring] }, { t: "arc", c: [c, cy], r: Math.max(r, 1e-6), a0, a1: Math.PI - a0 }, { t: "line", a: [x1, spring], b: [x1, yb] });
  }
  if (bottom) out.push({ t: "line", a: [x0, yb], b: [x1, yb] });
  return { pieces: out.filter((q) => q.t === "arc" || Math.hypot(q.a[0] - q.b[0], q.a[1] - q.b[1]) > 1e-9), spring };
}

/** Peças do bloco em coordenadas locais (origem no canto inferior esquerdo do vão). */
export function blockPieces(raw: BlockParams): Piece[] {
  const p = cleanParams(raw);
  const f = riseOf(p);
  const win = p.kind === "janela";
  const pieces: Piece[] = [];
  // vão
  pieces.push(...outline(p.w, p.h, f, 0, 0, win).pieces);
  // moldura (por fora; na janela desce até o peitoril, na porta até o chão)
  if (p.moldura > 0) {
    const m = outline(p.w, p.h, f, -p.moldura, 0, false);
    pieces.push(...m.pieces);
    if (win && p.peitoril <= 0) pieces.push({ t: "line", a: [-p.moldura, 0], b: [p.w + p.moldura, 0] });
  }
  // peitoril
  if (win && p.peitoril > 0) {
    const ext = p.moldura + 0.04;
    const y0 = -p.peitoril;
    pieces.push(
      { t: "line", a: [-ext, y0], b: [p.w + ext, y0] },
      { t: "line", a: [p.w + ext, y0], b: [p.w + ext, 0] },
      { t: "line", a: [p.w + ext, 0], b: [-ext, 0] },
      { t: "line", a: [-ext, 0], b: [-ext, y0] },
    );
  }
  // caixilho / marco
  if (p.frame > 0) {
    const yb = win ? p.frame : 0;
    const inner = outline(p.w, p.h, f, p.frame, yb, win);
    pieces.push(...inner.pieces);
    // divisões dentro do caixilho, na parte retangular
    const x0 = p.frame, x1 = p.w - p.frame;
    const top = inner.spring;
    if (f > 0) {
      // bandeira: travessa na linha de nascença do arco e montante central no arco
      pieces.push({ t: "line", a: [x0, top], b: [x1, top] });
      if (p.cols >= 2) pieces.push({ t: "line", a: [p.w / 2, top], b: [p.w / 2, p.h - p.frame] });
    }
    for (let i = 1; i < p.cols; i++) {
      const x = x0 + ((x1 - x0) * i) / p.cols;
      pieces.push({ t: "line", a: [x, yb], b: [x, top] });
    }
    for (let j = 1; j < p.rows; j++) {
      const y = yb + ((top - yb) * j) / p.rows;
      pieces.push({ t: "line", a: [x0, y], b: [x1, y] });
    }
  }
  return pieces;
}

/** Bloco como linhas e arcos no desenho (ids derivados do bloco, mesma camada). */
export function expandBlock(b: Block): Entity[] {
  const [ox, oy] = b.p;
  const m = (q: P): P => [q[0] + ox, q[1] + oy];
  return blockPieces(b.params).map((q, i): Line | Arc =>
    q.t === "line" ? { id: `${b.id}#${i}`, layer: b.layer, t: "line", a: m(q.a), b: m(q.b) } : { id: `${b.id}#${i}`, layer: b.layer, t: "arc", c: m(q.c), r: q.r, a0: q.a0, a1: q.a1 },
  );
}

/** Chave dos parâmetros (blocos com a mesma chave viram a mesma definição no DXF). */
export const paramsKey = (p: BlockParams) => JSON.stringify(cleanParams(p), (_k, v) => (typeof v === "number" ? Math.round(v * 10000) / 10000 : v));
