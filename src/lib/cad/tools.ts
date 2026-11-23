/**
 * Ferramentas de desenho do ArchRay CAD como funções puras: o que cada clique faz, a prévia
 * enquanto o cursor se move e a medida digitada (comprimento, deslocamento, largura × altura, raio).
 * Testado em tests/cad.test.ts.
 */
import { arcFrom3, atDistance, dimGeometry, dist } from "./geometry";
import { uid } from "./doc";
import type { Entity, P } from "./types";

export type DrawTool = "line" | "poly" | "rect" | "circle" | "arc" | "text" | "dim";
export type EditTool = "move" | "copy" | "mirror";
export type ToolId = "select" | DrawTool | EditTool;

/** Prompt mostrado na barra de status para cada ferramenta e etapa. */
export function prompt(tool: ToolId, n: number): string {
  switch (tool) {
    case "line":
      return n ? "Próximo ponto (ou digite o comprimento + Enter). Esc termina." : "Ponto inicial da linha.";
    case "poly":
      return n ? "Próximo ponto · Enter termina · C fecha · digite o comprimento + Enter." : "Ponto inicial da polilinha.";
    case "rect":
      return n ? "Canto oposto (ou digite largura x altura, ex.: 1,2x0,8)." : "Primeiro canto do retângulo.";
    case "circle":
      return n ? "Raio: clique ou digite (ex.: 0,45)." : "Centro do círculo.";
    case "arc":
      return ["Início do arco.", "Ponto do meio do arco.", "Fim do arco."][n] ?? "";
    case "text":
      return "Clique onde o texto começa.";
    case "dim":
      return ["Primeiro ponto da cota.", "Segundo ponto da cota.", "Posição da linha de cota (ou digite o afastamento)."][n] ?? "";
    case "move":
      return n ? "Destino (ou digite a distância na direção do cursor; dx;dy também vale)." : "Ponto base do que vai mover.";
    case "copy":
      return n ? "Destino da cópia (repete até Esc)." : "Ponto base da cópia.";
    case "mirror":
      return n ? "Segundo ponto do eixo de espelho." : "Primeiro ponto do eixo de espelho.";
    default:
      return "Clique para selecionar · arraste para a direita (janela) ou para a esquerda (cruzamento) · duplo clique edita.";
  }
}

/** Número em português ("1,20") ou com ponto. */
export const parseNum = (s: string) => {
  const v = Number(s.trim().replace(",", "."));
  return Number.isFinite(v) ? v : null;
};

/** Par de números: "1,2;0,8" · "1,2x0,8" · "1,2 0,8" (o @ inicial é opcional). */
export function parsePair(s: string): [number, number] | null {
  const parts = s.replace(/^@/, "").split(/[;x×\s]+/i).filter(Boolean);
  if (parts.length !== 2) return null;
  const a = parseNum(parts[0]!), b = parseNum(parts[1]!);
  return a === null || b === null ? null : [a, b];
}

/**
 * Converte o texto digitado num ponto, conforme a ferramenta: comprimento na direção do cursor,
 * deslocamento dx;dy a partir do último ponto, largura x altura do retângulo, raio do círculo.
 */
export function typedPoint(tool: ToolId, pts: P[], cursor: P, text: string): P | null {
  const last = pts[pts.length - 1];
  if (!last) {
    const abs = parsePair(text);
    return abs ? [abs[0], abs[1]] : null;
  }
  const pair = parsePair(text);
  if (tool === "rect" && pair) {
    // largura x altura, para o lado em que o cursor está
    const sx = cursor[0] >= last[0] ? 1 : -1, sy = cursor[1] >= last[1] ? 1 : -1;
    return [last[0] + sx * pair[0], last[1] + sy * pair[1]];
  }
  if (pair) return [last[0] + pair[0], last[1] + pair[1]];
  const n = parseNum(text);
  if (n === null) return null;
  if (tool === "dim" && pts.length === 2) {
    // afastamento da cota, para o lado do cursor
    const g = dimGeometry(pts[0]!, pts[1]!, 1);
    const side = Math.sign((cursor[0] - pts[0]![0]) * g.n[0] + (cursor[1] - pts[0]![1]) * g.n[1]) || 1;
    return [pts[0]![0] + g.n[0] * n * side, pts[0]![1] + g.n[1] * n * side];
  }
  return atDistance(last, cursor, n);
}

const rectPts = (a: P, b: P): P[] => [a, [b[0], a[1]], b, [a[0], b[1]]];
/** Afastamento com sinal de p em relação à reta a→b (positivo à esquerda). */
const signedOffset = (a: P, b: P, p: P) => {
  const g = dimGeometry(a, b, 1);
  return (p[0] - a[0]) * g.n[0] + (p[1] - a[1]) * g.n[1];
};

/** Prévia do que a ferramenta vai criar com os pontos dados e o cursor. */
export function preview(tool: ToolId, pts: P[], cur: P, layer: string): Entity[] {
  const id = "preview";
  const a = pts[0];
  if (!a) return [];
  switch (tool) {
    case "line":
      return [{ id, layer, t: "line", a: pts[pts.length - 1]!, b: cur }];
    case "poly":
      return [{ id, layer, t: "poly", pts: [...pts, cur], closed: false }];
    case "rect":
      return [{ id, layer, t: "poly", pts: rectPts(a, cur), closed: true }];
    case "circle":
      return [{ id, layer, t: "circle", c: a, r: dist(a, cur) }];
    case "arc": {
      if (pts.length === 1) return [{ id, layer, t: "line", a, b: cur }];
      const arc = arcFrom3(a, pts[1]!, cur);
      return arc ? [{ id, layer, t: "arc", ...arc }] : [{ id, layer, t: "line", a, b: cur }];
    }
    case "dim":
      if (pts.length === 1) return [{ id, layer, t: "line", a, b: cur }];
      return [{ id, layer, t: "dim", a, b: pts[1]!, off: signedOffset(a, pts[1]!, cur) }];
    case "move":
    case "copy":
    case "mirror":
      return [{ id, layer, t: "line", a: pts[pts.length - 1]!, b: cur }];
    default:
      return [];
  }
}

export type ClickResult = { pts: P[]; add?: Entity[]; askText?: P };

/** O que um clique faz na ferramenta de desenho (ferramentas de edição ficam com o editor). */
export function click(tool: DrawTool, pts: P[], p: P, layer: string): ClickResult {
  switch (tool) {
    case "line":
      if (!pts.length) return { pts: [p] };
      return dist(pts[pts.length - 1]!, p) < 1e-9 ? { pts } : { pts: [p], add: [{ id: uid(), layer, t: "line", a: pts[pts.length - 1]!, b: p }] };
    case "poly":
      return { pts: pts.length && dist(pts[pts.length - 1]!, p) < 1e-9 ? pts : [...pts, p] };
    case "rect":
      if (!pts.length) return { pts: [p] };
      if (Math.abs(p[0] - pts[0]![0]) < 1e-9 || Math.abs(p[1] - pts[0]![1]) < 1e-9) return { pts };
      return { pts: [], add: [{ id: uid(), layer, t: "poly", pts: rectPts(pts[0]!, p), closed: true }] };
    case "circle":
      if (!pts.length) return { pts: [p] };
      return dist(pts[0]!, p) < 1e-9 ? { pts } : { pts: [], add: [{ id: uid(), layer, t: "circle", c: pts[0]!, r: dist(pts[0]!, p) }] };
    case "arc": {
      if (pts.length < 2) return { pts: [...pts, p] };
      const arc = arcFrom3(pts[0]!, pts[1]!, p);
      return arc ? { pts: [], add: [{ id: uid(), layer, t: "arc", ...arc }] } : { pts };
    }
    case "text":
      return { pts: [], askText: p };
    case "dim":
      if (pts.length < 2) return { pts: [...pts, p] };
      return { pts: [], add: [{ id: uid(), layer, t: "dim", a: pts[0]!, b: pts[1]!, off: signedOffset(pts[0]!, pts[1]!, p) }] };
  }
}

/** Termina a polilinha (Enter / duplo clique / C para fechar). */
export function finishPoly(pts: P[], layer: string, closed: boolean): Entity | null {
  if (pts.length < 2 || (closed && pts.length < 3)) return null;
  return { id: uid(), layer, t: "poly", pts, closed };
}

/** Comandos digitados (como no AutoCAD) → ferramenta ou ação. */
export const COMMANDS: Record<string, ToolId | "erase" | "undo" | "redo" | "extents" | "array"> = {
  L: "line", LINHA: "line",
  PL: "poly", POLI: "poly",
  REC: "rect", R: "rect", RET: "rect",
  C: "circle", CIRC: "circle",
  A: "arc", ARCO: "arc",
  T: "text", TEXTO: "text",
  DIM: "dim", COTA: "dim", CO: "copy", CP: "copy", COPIA: "copy",
  M: "move", MOVER: "move",
  MI: "mirror", ESPELHO: "mirror",
  E: "erase", DEL: "erase", APAGAR: "erase",
  U: "undo", Z: "extents", ZE: "extents", AR: "array", MATRIZ: "array",
  S: "select", SEL: "select",
};
