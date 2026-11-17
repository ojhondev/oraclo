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
export type ObjectName = "celular" | "igreja" | "notebook" | "laudo" | "fachada" | "torre" | "catedral";

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
  return slices(0, H, 58, (z, t) => {
    // perfil arredondado nas pontas (o aparelho visto de lado)
    const edge = Math.min(t, 1 - t) * 58;
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
  return slices(0, spireTop, 76, (z) => {
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
  const screen = slices(0.1, 1.15, 42, (z) => [roundRect(0, -0.38 + tilt * (z - 0.1), 1.66, 0.05, 0.02)]);
  return [...base, ...screen];
}

/** Laudo: pilha de folhas levemente desalinhadas, com a de cima dobrada no canto. */
function laudo(): Slice[] {
  return slices(0, 0.9, 36, (z, t) => {
    const j = Math.sin(t * 17.3) * 0.04;
    const a = Math.sin(t * 7.1) * 0.06;
    const sheet = rect(j, -j, 1.05, 1.45).map(([x, y]): Pt => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]);
    void z;
    return [sheet];
  });
}

/** Fachada: bloco de sobrado com janelas marcadas nas fatias. */
function fachada(): Slice[] {
  return slices(0, 1.8, 62, (z) => {
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
  return slices(0, 3.0, 66, (_z, t) => {
    const a = t * 0.5;
    return [rect(0, 0, 0.9, 0.9).map(([x, y]): Pt => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)])];
  });
}


/** Polígono regular (círculo quando n é grande), centrado em (cx, cy). */
function circle(cx: number, cy: number, r: number, n = 40, rot = 0): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * TAU;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}

/** Meio círculo (abside), aberto para y negativo e fechado pela corda. */
function apse(cx: number, cy: number, r: number, n = 24): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}

/** Largura, numa altura z, de um vão em arco pleno (base z0, ombro z1, raio r). 0 fora dele. */
function arch(z: number, z0: number, z1: number, r: number) {
  if (z < z0) return 0;
  if (z <= z1) return 2 * r;
  const d = z - z1;
  return d >= r ? 0 : 2 * Math.sqrt(r * r - d * d);
}

/**
 * Catedral: nave com naves laterais, transepto, abside, cúpula sobre o cruzeiro, duas torres com
 * coruchéu na fachada, contrafortes, rosácea e portais. Fachada voltada para y negativo.
 */
function catedral(): Slice[] {
  const FY = -1.25; // plano da fachada
  return slices(0, 3.7, 96, (z) => {
    const r: Pt[][] = [];
    // nave central: paredes até 1,3 e telhado de duas águas até 1,85
    if (z <= 1.3) r.push(rect(0, 0.25, 1.1, 2.9));
    else if (z <= 1.85) {
      const w = 1.1 * (1 - (z - 1.3) / 0.55);
      if (w > 0.03) r.push(rect(0, 0.25, w, 2.9));
    }
    // naves laterais: paredes até 0,8 e telhado de uma água até 1,05
    for (const sx of [-1, 1]) {
      if (z <= 0.8) r.push(rect(sx * 0.78, 0.15, 0.46, 2.5));
      else if (z <= 1.05) {
        const w = 0.46 * (1 - (z - 0.8) / 0.25);
        if (w > 0.03) r.push(rect(sx * (0.55 + w / 2), 0.15, w, 2.5));
      }
    }
    // transepto: braço transversal com empena
    if (z <= 1.3) r.push(rect(0, 0.75, 2.7, 0.85));
    else if (z <= 1.85) {
      const l = 0.85 * (1 - (z - 1.3) / 0.55);
      if (l > 0.03) r.push(rect(0, 0.75, 2.7, l));
    }
    // abside semicircular com telhado cônico
    if (z <= 1.15) r.push(apse(0, 1.7, 0.55));
    else if (z <= 1.55) {
      const rr = 0.55 * (1 - (z - 1.15) / 0.4);
      if (rr > 0.03) r.push(apse(0, 1.7, rr));
    }
    // cúpula do cruzeiro: tambor, calota e lanterna
    if (z > 1.75 && z <= 2.2) r.push(circle(0, 0.75, 0.44, 32));
    if (z > 1.95 && z < 2.1) r.push(circle(0, 0.75, 0.48, 32));
    if (z > 2.2 && z <= 2.66) {
      const d = (z - 2.2) / 0.46;
      r.push(circle(0, 0.75, 0.46 * Math.sqrt(Math.max(0, 1 - d * d)) + 0.06, 32));
    }
    if (z > 2.62 && z <= 2.9) r.push(circle(0, 0.75, 0.08, 12));
    if (z > 2.9 && z <= 3.05) r.push(circle(0, 0.75, 0.02 + 0.05 * (1 - (z - 2.9) / 0.15), 8));
    // torres da fachada: corpo, cornija, campanário vazado e coruchéu octogonal
    for (const sx of [-1, 1]) {
      const cx = sx * 0.66;
      const cy = FY - 0.05;
      if (z <= 2.55) r.push(rect(cx, cy, 0.5, 0.5));
      if (z > 1.32 && z < 1.4) r.push(rect(cx, cy, 0.58, 0.58));
      if (z > 2.48 && z <= 2.58) r.push(rect(cx, cy, 0.6, 0.6));
      const bw = arch(z, 1.95, 2.25, 0.09);
      if (bw > 0) {
        r.push(rect(cx, cy - 0.25, bw, 0.03));
        r.push(rect(cx - sx * 0.25, cy, 0.03, bw));
      }
      if (z > 2.58 && z <= 3.7) {
        const k = 1 - (z - 2.58) / 1.12;
        if (k > 0.02) r.push(circle(cx, cy, 0.26 * k, 8, Math.PI / 8));
      }
    }
    // contrafortes ao longo das naves laterais
    if (z <= 0.72) {
      const bw = 0.12 * (1 - 0.4 * (z / 0.72));
      for (const sx of [-1, 1]) for (const y of [-0.85, -0.3, 1.25]) r.push(rect(sx * 1.06, y, bw, 0.1));
    }
    // fachada: portal central e portais laterais em arco, frontão e rosácea
    const pw = arch(z, 0, 0.55, 0.17);
    if (pw > 0) r.push(rect(0, FY + 0.02, pw, 0.03));
    const ps = arch(z, 0, 0.38, 0.09);
    if (ps > 0) for (const sx of [-1, 1]) r.push(rect(sx * 0.66, FY - 0.31, ps, 0.03));
    const rz = z - 1.02;
    if (Math.abs(rz) < 0.2) {
      const w = 2 * Math.sqrt(0.04 - rz * rz);
      r.push(rect(0, FY + 0.02, w, 0.03));
      if (Math.abs(rz) < 0.09) r.push(rect(0, FY + 0.02, 2 * Math.sqrt(0.0081 - rz * rz), 0.02));
    }
    // janelas altas da nave (clerestório), dos dois lados
    const ww = arch(z, 0.95, 1.12, 0.06);
    if (ww > 0) for (const sx of [-1, 1]) for (const y of [-0.55, -0.05, 1.35]) r.push(rect(sx * 0.56, y, 0.03, ww));
    return r;
  });
}

const BUILDERS: Record<ObjectName, () => Slice[]> = { celular, igreja, notebook, laudo, fachada, torre, catedral };
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
