/**
 * Danos desenhados sobre o vídeo da primeira dobra (viewBox 1000×500). Siglas, cores e padrões vêm
 * da biblioteca padrão de danos (src/lib/damage-library.ts, que é server-only; o teste
 * tests/damage-overlay.test.ts garante que continuam iguais). Os nomes são a forma curta da legenda.
 */

export type OverlayItem = {
  code: string;
  name: string;
  color: string;
  pattern: "diagonal" | "circulos" | "pontilhado" | "pontilhado-denso" | "cruzado" | "solido" | "linha" | "linha-dupla";
  kind: "area" | "linha";
  /** Contorno fechado (áreas). */
  d?: string;
  /** Traços (fissuras); o primeiro é o principal. */
  lines?: string[];
  /** Ponto onde a linha de chamada encosta no dano. */
  anchor: [number, number];
  /** Canto superior esquerdo da etiqueta. */
  tag: [number, number];
};

/** Gerador determinístico (mulberry32): o desenho é sempre o mesmo. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mancha orgânica: elipse com o raio perturbado, suavizada por Catmull-Rom fechada. */
export function blob(cx: number, cy: number, rx: number, ry: number, seed: number, n = 11): string {
  const r = rng(seed);
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 0.72 + r() * 0.5;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  let d = `M${pts[0]![0].toFixed(1)} ${pts[0]![1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]!;
    const p1 = pts[i]!;
    const p2 = pts[(i + 1) % n]!;
    const p3 = pts[(i + 2) % n]!;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0]!.toFixed(1)} ${c1[1]!.toFixed(1)} ${c2[0]!.toFixed(1)} ${c2[1]!.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + "Z";
}

/** Fissura: segmentos curtos com desvio aleatório entre dois pontos. */
export function crack(x0: number, y0: number, x1: number, y1: number, seed: number, steps = 12, amp = 10): string {
  const r = rng(seed);
  let d = `M${x0} ${y0}`;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const j = i === steps ? 0 : (r() - 0.5) * 2 * amp;
    const x = x0 + (x1 - x0) * t - ((y1 - y0) / Math.hypot(x1 - x0, y1 - y0)) * j;
    const y = y0 + (y1 - y0) * t + ((x1 - x0) / Math.hypot(x1 - x0, y1 - y0)) * j;
    d += `L${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

export const DAMAGE_OVERLAY: OverlayItem[] = [
  // lado direito: casam com as linhas pontilhadas da moldura do aparelho
  { code: "FIS", name: "Fissura", color: "#b42318", pattern: "linha", kind: "linha", lines: [crack(600, 40, 860, 92, 3, 14, 12), crack(690, 70, 712, 190, 8, 7, 8)], anchor: [760, 86], tag: [520, 112] },
  { code: "BIO", name: "Biodeterioração", color: "#2f6b4f", pattern: "circulos", kind: "area", d: blob(890, 196, 86, 58, 21), anchor: [836, 172], tag: [640, 190] },
  { code: "TRI", name: "Trinca", color: "#7a1610", pattern: "linha-dupla", kind: "linha", lines: [crack(520, 268, 812, 250, 5, 14, 9), crack(523, 276, 815, 258, 5, 14, 9)], anchor: [700, 262], tag: [560, 286] },
  { code: "DES", name: "Desagregação do reboco", color: "#c8742a", pattern: "pontilhado-denso", kind: "area", d: blob(860, 350, 90, 48, 34), anchor: [788, 334], tag: [560, 352] },
  { code: "UMA", name: "Umidade ascendente", color: "#1d5fa8", pattern: "diagonal", kind: "area", d: blob(560, 470, 300, 46, 55, 14), anchor: [764, 440], tag: [470, 404] },
  // lado esquerdo
  { code: "PRB", name: "Perda de reboco", color: "#e0a050", pattern: "solido", kind: "area", d: blob(200, 100, 88, 56, 61), anchor: [214, 96], tag: [120, 168] },
  { code: "EFL", name: "Eflorescência", color: "#8fb8de", pattern: "pontilhado", kind: "area", d: blob(300, 238, 64, 42, 72), anchor: [300, 238], tag: [210, 290] },
  { code: "SUJ", name: "Sujidade / crosta negra", color: "#55524c", pattern: "pontilhado", kind: "area", d: blob(150, 360, 80, 54, 83), anchor: [170, 350], tag: [90, 420] },
];
