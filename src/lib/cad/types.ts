/**
 * ArchRay CAD (laboratório): formato do desenho. Unidade = metro, Y para cima (convenção de CAD).
 * Puro e serializável (vai inteiro para o banco em JSON).
 */
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

export type Entity = Line | Poly | Circle | Arc | Text | Dim | Img;
export type EntityType = Entity["t"];

export type Layer = { id: string; name: string; color: string; weight: number; visible: boolean; locked: boolean; opacity: number };

export type CadDoc = {
  v: 1;
  layers: Layer[];
  /** Camada atual: onde nasce o que é desenhado. */
  current: string;
  entities: Entity[];
};

export type Box = { x0: number; y0: number; x1: number; y1: number };
