/**
 * ArchRay CAD (laboratório): formato do desenho. Unidade = metro, Y para cima (convenção de CAD).
 * Puro e serializável (vai inteiro para o banco em JSON).
 */
import type { Sheet } from "./sheets";

export type P = [number, number];

type Base = { id: string; layer: string };
export type Line = Base & { t: "line"; a: P; b: P };
/** Polilinha (retângulo é uma polilinha fechada de 4 pontos). */
export type Poly = Base & { t: "poly"; pts: P[]; closed: boolean };
export type Circle = Base & { t: "circle"; c: P; r: number };
/** Arco no sentido anti-horário, de a0 até a1 (radianos). */
export type Arc = Base & { t: "arc"; c: P; r: number; a0: number; a1: number };
export type Text = Base & { t: "text"; p: P; h: number; s: string };
/** Cota alinhada entre a e b, deslocada `off` metros para a esquerda do segmento a→b. */
export type Dim = Base & { t: "dim"; a: P; b: P; off: number };
/** Imagem de fundo (foto/ortofoto) em escala: canto inferior esquerdo em p, w × h metros. */
export type Img = Base & { t: "image"; url: string; p: P; w: number; h: number };

/** Verga do vão: reta, arco pleno (meia-volta) ou arco abatido (flecha = rise). */
export type BlockTop = "reta" | "pleno" | "abatido";
export type BlockKind = "janela" | "porta";
/** Parâmetros de um bloco de esquadria (metros). O vão vai de (0,0) a (w,h); moldura e peitoril ficam por fora. */
export type BlockParams = {
  kind: BlockKind;
  w: number;
  h: number;
  top: BlockTop;
  /** Flecha do arco abatido. */
  rise: number;
  /** Largura do caixilho/marco (para dentro do vão). */
  frame: number;
  /** Divisões do caixilho: colunas (folhas) e linhas (vidros/almofadas). */
  cols: number;
  rows: number;
  /** Largura da moldura (para fora do vão; 0 = sem moldura). */
  moldura: number;
  /** Altura do peitoril abaixo da janela (0 = sem peitoril). */
  peitoril: number;
};
/** Tipo de bloco (como "J1" numa planta): mudar o tipo muda todas as cópias que não têm medida própria. */
export type BlockType = { id: string; name: string; params: BlockParams };
/** Bloco inserido: canto inferior esquerdo do vão em p. Guarda os parâmetros já resolvidos (própria ou do tipo). */
export type Block = Base & { t: "block"; type: string; p: P; params: BlockParams; own?: boolean };

export type Entity = Line | Poly | Circle | Arc | Text | Dim | Img | Block;
export type EntityType = Entity["t"];

export type Layer = { id: string; name: string; color: string; weight: number; visible: boolean; locked: boolean; opacity: number };

export type CadDoc = {
  v: 1;
  layers: Layer[];
  /** Camada atual: onde nasce o que é desenhado. */
  current: string;
  entities: Entity[];
  /** Tipos de bloco do desenho (janelas, portas). */
  blockTypes?: BlockType[];
  /** Pranchas (folha, escala, enquadramento e carimbo). */
  sheets?: Sheet[];
};

export type Box = { x0: number; y0: number; x1: number; y1: number };
