/**
 * Ilustrações em curvas de nível: cada objeto é cortado em fatias horizontais (como um mapa
 * topográfico) e cada fatia vira um contorno fechado, projetado em perspectiva. Puro (sem DOM),
 * testado em tests/contour.test.ts.
 *
 * Coordenadas do objeto: x (largura), y (profundidade), z (altura), em unidades livres (~1).
 */

export type Pt = [number, number];
/** Uma fatia: altura e um ou mais contornos fechados naquela altura. */
export type Slice = { z: number; rings: Pt[][] };
export type ObjectName = "celular" | "igreja" | "notebook" | "laudo" | "fachada" | "torre";

const TAU = Math.PI * 2;

/** Retângulo com cantos arredondados (superelipse), centrado em (cx, cy). */
function roundRect(cx: number, cy: number, w: number, h: number, r: number, n = 48): Pt[] {
  const out: Pt[] = [];
  const rx = Math.min(r, w / 2);
  const ry = Math.min(r, h / 2);
  const hw = w / 2 - rx;
  const hh = h / 2 - ry;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const c = Math.cos(a);
    const s = Math.sin(a);
    out.push([cx + Math.sign(c) * hw + rx * c, cy + Math.sign(s) * hh + ry * s]);
  }
  return out;
}

const rect = (cx: number, cy: number, w: number, h: number): Pt[] => [
  [cx - w / 2, cy - h / 2],
  [cx + w / 2, cy - h / 2],
  [cx + w / 2, cy + h / 2],
  [cx - w / 2, cy + h / 2],
];

/** Fatias igualmente espaçadas entre z0 e z1, com a função que dá os contornos de cada altura. */
function slices(z0: number, z1: number, count: number, rings: (z: number, t: number) => Pt[][]): Slice[] {
  const out: Slice[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    const z = z0 + (z1 - z0) * t;
    const r = rings(z, t).filter((ring) => ring.length > 2);
    if (r.length) out.push({ z, rings: r });
  }
  return out;
}

/** Celular em pé: fatias finas, cantos que arredondam no topo e na base, câmera no alto. */
function celular(): Slice[] {
  const H = 2.1;
  return slices(0, H, 34, (z, t) => {
    // perfil arredondado nas pontas (o aparelho visto de lado)
    const edge = Math.min(t, 1 - t) * 34;
    const shrink = edge < 1.6 ? 0.06 * (1.6 - edge) : 0;
    const body = roundRect(0, 0, 1.0 - shrink, 0.14 - shrink * 0.5, 0.06);
    const rings: Pt[][] = [body];
    // tela: contorno interno na face da frente
    if (t > 0.08 && t < 0.92) rings.push(roundRect(0, -0.05, 0.86, 0.02, 0.01, 16));
    // módulo de câmera no topo, saliente atrás
    if (t > 0.78 && t < 0.92) rings.push(roundRect(-0.26, 0.1, 0.32, 0.08, 0.04, 20));
    void z;
    return rings;
  });
}

/** Igreja: nave com telhado de duas águas e torre com coruchéu na frente. */
function igreja(): Slice[] {
  const naveW = 1.2;
  const naveL = 2.0;
  const wall = 1.0;
  const ridge = 1.55;
  const towerTop = 2.3;
  const spireTop = 3.1;
  return slices(0, spireTop, 44, (z) => {
    const rings: Pt[][] = [];
    if (z <= wall) rings.push(rect(0, 0.2, naveW, naveL));
    else if (z <= ridge) {
      // telhado: a largura diminui até a cumeeira
      const w = naveW * (1 - (z - wall) / (ridge - wall));
      if (w > 0.03) rings.push(rect(0, 0.2, w, naveL));
    }
    // torre na fachada (y negativo)
    if (z <= towerTop) rings.push(rect(0, -1.0, 0.56, 0.56));
    else if (z <= spireTop) {
      const s = 0.56 * (1 - (z - towerTop) / (spireTop - towerTop));
      if (s > 0.02) rings.push(rect(0, -1.0, s, s));
    }
    // janelas da torre (aberturas) no alto
    if (z > 1.6 && z < 1.95) rings.push(rect(0, -1.0, 0.22, 0.6));
    return rings;
  });
}

/** Notebook aberto: base fina e tela inclinada para trás. */
function notebook(): Slice[] {
  const base = slices(0, 0.08, 4, () => [roundRect(0, 0.15, 1.7, 1.1, 0.05), roundRect(0, 0.32, 1.3, 0.45, 0.02, 16)]);
  const tilt = 0.32; // recuo da tela por unidade de altura
  const screen = slices(0.1, 1.15, 26, (z) => [roundRect(0, -0.38 + tilt * (z - 0.1), 1.66, 0.05, 0.02)]);
  return [...base, ...screen];
}

/** Laudo: pilha de folhas levemente desalinhadas, com a de cima dobrada no canto. */
function laudo(): Slice[] {
  return slices(0, 0.9, 22, (z, t) => {
    const j = Math.sin(t * 17.3) * 0.04;
    const a = Math.sin(t * 7.1) * 0.06;
    const sheet = rect(j, -j, 1.05, 1.45).map(([x, y]): Pt => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]);
    void z;
    return [sheet];
  });
}

/** Fachada: bloco de sobrado com janelas marcadas nas fatias. */
function fachada(): Slice[] {
  return slices(0, 1.8, 36, (z) => {
    const rings: Pt[][] = [rect(0, 0, 2.0, 0.5)];
    const floor = z < 0.9 ? 0 : 1;
    const zf = z - floor * 0.9;
    if (zf > 0.3 && zf < 0.7) for (const x of [-0.65, 0, 0.65]) rings.push(rect(x, -0.24, 0.3, 0.04));
    if (z > 1.7) rings.push(rect(0, 0, 2.15, 0.62));
    return rings;
  });
}

/** Torre de prédio: planta que gira levemente andar a andar. */
function torre(): Slice[] {
  return slices(0, 3.0, 40, (_z, t) => {
    const a = t * 0.5;
    return [rect(0, 0, 0.9, 0.9).map(([x, y]): Pt => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)])];
  });
}

const BUILDERS: Record<ObjectName, () => Slice[]> = { celular, igreja, notebook, laudo, fachada, torre };
const cache = new Map<ObjectName, Slice[]>();

/** Fatias do objeto (calculadas uma vez). */
export function objectSlices(name: ObjectName): Slice[] {
  let s = cache.get(name);
  if (!s) {
    s = BUILDERS[name]();
    cache.set(name, s);
  }
  return s;
}

export type View = { yaw: number; pitch: number; scale: number; cx: number; cy: number };

/** Projeção axonométrica: gira no plano (yaw), achata a profundidade (pitch) e sobe pela altura. */
export function project([x, y]: Pt, z: number, v: View): Pt {
  const c = Math.cos(v.yaw);
  const s = Math.sin(v.yaw);
  const xr = x * c - y * s;
  const yr = x * s + y * c;
  return [v.cx + xr * v.scale, v.cy + (yr * v.pitch - z) * v.scale];
}

/** Caminho SVG de um contorno fechado. */
export function ringPath(ring: Pt[], z: number, v: View) {
  let d = "";
  for (let i = 0; i < ring.length; i++) {
    const [px, py] = project(ring[i]!, z, v);
    d += `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`;
  }
  return d + "Z";
}

/** Altura total do objeto (para enquadrar). */
export const objectHeight = (name: ObjectName) => Math.max(...objectSlices(name).map((s) => s.z));
