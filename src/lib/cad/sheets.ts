/**
 * Pranchas do ArchRay CAD: folha ABNT (A4…A0), escala técnica, enquadramento do desenho e carimbo.
 * Converte o desenho (metros) em traços no papel (milímetros, origem no canto inferior esquerdo da
 * folha, Y para cima), já recortados à janela de desenho. A mesma lista alimenta a prévia (SVG) e o
 * PDF, então o que se vê é o que se imprime. Puro, testado em tests/cad.test.ts.
 */
import { expandBlock } from "./blocks";
import { arcPoint, dimGeometry, extents } from "./geometry";
import type { Box, CadDoc, Entity, P } from "./types";

export type SheetSize = "A4" | "A3" | "A2" | "A1" | "A0";
export type Stamp = { projeto: string; local: string; autor: string; data: string; numero: string; obs: string };
export type Sheet = {
  id: string;
  /** Título da prancha (ex.: "Fachada principal"). */
  name: string;
  size: SheetSize;
  orient: "paisagem" | "retrato";
  /** Denominador da escala (50 = 1:50). */
  scale: number;
  /** Ponto do desenho (m) no centro da janela de desenho. */
  center: P;
  /** Camadas fora da prancha (por padrão: Foto e Sugestões). */
  hidden: string[];
  /** Foto de fundo clareada sob o desenho. */
  photo: boolean;
  stamp: Stamp;
};

/** Folhas ABNT NBR 10068 em mm (paisagem). */
export const SHEET_MM: Record<SheetSize, [number, number]> = { A4: [297, 210], A3: [420, 297], A2: [594, 420], A1: [841, 594], A0: [1189, 841] };
export const SCALES = [10, 20, 25, 50, 75, 100, 125, 200, 250, 500, 1000];
/** Carimbo: 175 mm de largura (NBR 10068), altura fixa. */
export const STAMP_W = 175, STAMP_H = 52;

export type SheetLayout = { w: number; h: number; frame: Box; view: Box; stamp: Box };

/** Folha, quadro (margem esquerda 25 mm; demais 10 mm, ou 7 mm do A2 ao A4), carimbo e janela de desenho. */
export function sheetLayout(s: Pick<Sheet, "size" | "orient">): SheetLayout {
  const [a, b] = SHEET_MM[s.size];
  const [w, h] = s.orient === "paisagem" ? [a, b] : [b, a];
  const m = s.size === "A0" || s.size === "A1" ? 10 : 7;
  const frame = { x0: 25, y0: m, x1: w - m, y1: h - m };
  const sw = Math.min(STAMP_W, frame.x1 - frame.x0);
  const stamp = { x0: frame.x1 - sw, y0: frame.y0, x1: frame.x1, y1: frame.y0 + STAMP_H };
  // janela de desenho: o quadro inteiro acima do carimbo (com folga de 5 mm)
  const view = { x0: frame.x0 + 5, y0: stamp.y1 + 5, x1: frame.x1 - 5, y1: frame.y1 - 5 };
  return { w, h, frame, view, stamp };
}

/** Camadas que não vão para a prancha por padrão. */
export const defaultHidden = (d: CadDoc) => d.layers.filter((l) => l.name === "Foto" || l.name === "Sugestões").map((l) => l.id);

/** Parte do desenho que conta para enquadrar (camadas visíveis na prancha, sem imagens). */
function drawingExtents(d: CadDoc, hidden: string[]): Box | null {
  return extents(d.entities.filter((e) => e.t !== "image" && !hidden.includes(e.layer)));
}

/** Menor escala técnica em que o desenho cabe na janela (com 5% de folga). */
export function fitScale(d: CadDoc, s: Pick<Sheet, "size" | "orient" | "hidden">): { scale: number; center: P } {
  const L = sheetLayout(s);
  const b = drawingExtents(d, s.hidden);
  if (!b) return { scale: 50, center: [0, 0] };
  const vw = L.view.x1 - L.view.x0, vh = L.view.y1 - L.view.y0;
  const need = Math.max(((b.x1 - b.x0) * 1000 * 1.05) / vw, ((b.y1 - b.y0) * 1000 * 1.05) / vh);
  const scale = SCALES.find((k) => k >= need) ?? Math.ceil(need / 100) * 100;
  return { scale, center: [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2] };
}

export function newSheet(d: CadDoc, id: string, n: number): Sheet {
  const base = { size: "A3" as SheetSize, orient: "paisagem" as const, hidden: defaultHidden(d) };
  const f = fitScale(d, base);
  return {
    id,
    name: n === 1 ? "Fachada" : `Prancha ${n}`,
    ...base,
    ...f,
    photo: false,
    stamp: { projeto: "", local: "", autor: "", data: new Date().toLocaleDateString("pt-BR"), numero: String(n).padStart(2, "0"), obs: "" },
  };
}

// ── traços no papel ────────────────────────────────────────────────────

export type PaperSeg = { a: P; b: P; w: number };
export type PaperText = { p: P; size: number; s: string; rot: number; align: "left" | "center" | "right"; bold?: boolean; muted?: boolean };
export type PaperDrawing = { segs: PaperSeg[]; texts: PaperText[]; image?: { url: string; p: P; w: number; h: number; clip: Box } };

/** Espessura no papel (mm) a partir do peso da camada. */
export const penMm = (weight: number) => Math.max(0.1, Math.min(0.7, weight * 0.2));

/** Recorta o segmento à caixa (Liang–Barsky); null se fica todo fora. */
export function clipSeg(a: P, b: P, c: Box): [P, P] | null {
  let t0 = 0, t1 = 1;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const tests: [number, number][] = [[-dx, a[0] - c.x0], [dx, c.x1 - a[0]], [-dy, a[1] - c.y0], [dy, c.y1 - a[1]]];
  for (const [p, q] of tests) {
    if (Math.abs(p) < 1e-12) {
      if (q < 0) return null;
      continue;
    }
    const r = q / p;
    if (p < 0) {
      if (r > t1) return null;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return null;
      if (r < t1) t1 = r;
    }
  }
  return [[a[0] + t0 * dx, a[1] + t0 * dy], [a[0] + t1 * dx, a[1] + t1 * dy]];
}

/** Arco (ou círculo) como polilinha fina o bastante para o papel. */
function arcPts(c: P, r: number, a0: number, a1: number, full: boolean, k: number): P[] {
  const span = full ? Math.PI * 2 : (((a1 - a0) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) || Math.PI * 2;
  const rmm = r * k;
  const n = Math.max(8, Math.min(720, Math.ceil(span / Math.acos(Math.max(-1, 1 - 0.05 / Math.max(rmm, 0.05))) )));
  return Array.from({ length: n + 1 }, (_, i) => arcPoint(c, r, a0 + (span * i) / n));
}

/** Desenho no papel: segmentos e textos em mm, recortados à janela de desenho. */
export function paperDrawing(d: CadDoc, s: Sheet): PaperDrawing {
  const L = sheetLayout(s);
  const k = 1000 / s.scale; // mm de papel por metro
  const vc: P = [(L.view.x0 + L.view.x1) / 2, (L.view.y0 + L.view.y1) / 2];
  const M = (p: P): P => [vc[0] + (p[0] - s.center[0]) * k, vc[1] + (p[1] - s.center[1]) * k];
  const segs: PaperSeg[] = [];
  const texts: PaperText[] = [];
  const push = (a: P, b: P, w: number) => {
    const c = clipSeg(M(a), M(b), L.view);
    if (c) segs.push({ a: c[0], b: c[1], w });
  };
  const inside = (p: P) => p[0] >= L.view.x0 && p[0] <= L.view.x1 && p[1] >= L.view.y0 && p[1] <= L.view.y1;
  const visible = new Set(d.layers.filter((l) => l.visible && !s.hidden.includes(l.id)).map((l) => l.id));
  const weight = new Map(d.layers.map((l) => [l.id, l.weight]));
  let image: PaperDrawing["image"];

  const draw = (e: Entity, w: number) => {
    switch (e.t) {
      case "line":
        return push(e.a, e.b, w);
      case "poly":
        for (let i = 0; i < e.pts.length - 1; i++) push(e.pts[i]!, e.pts[i + 1]!, w);
        if (e.closed && e.pts.length > 2) push(e.pts[e.pts.length - 1]!, e.pts[0]!, w);
        return;
      case "circle":
      case "arc": {
        const pts = e.t === "circle" ? arcPts(e.c, e.r, 0, 0, true, k) : arcPts(e.c, e.r, e.a0, e.a1, false, k);
        for (let i = 0; i < pts.length - 1; i++) push(pts[i]!, pts[i + 1]!, w);
        return;
      }
      case "block":
        for (const c of expandBlock(e)) draw(c, w);
        return;
      case "text": {
        const p = M(e.p);
        if (inside(p)) texts.push({ p, size: e.h * k, s: e.s, rot: 0, align: "left" });
        return;
      }
      case "dim": {
        const g = dimGeometry(e.a, e.b, e.off);
        const tick = 1.2 / k; // 1,2 mm no papel
        push(e.a, g.da, w);
        push(e.b, g.db, w);
        push(g.da, g.db, w);
        for (const q of [g.da, g.db]) push([q[0] - tick, q[1] - tick], [q[0] + tick, q[1] + tick], w * 1.8);
        // texto de cota com 2,5 mm de altura no papel, sempre legível (nunca de cabeça para baixo)
        let rot = g.angle;
        if (rot > Math.PI / 2 + 1e-9 || rot < -Math.PI / 2 - 1e-9) rot += Math.PI;
        const off = 1 / k;
        const t = M([g.text[0] + g.n[0] * off * Math.sign(e.off || 1), g.text[1] + g.n[1] * off * Math.sign(e.off || 1)]);
        if (inside(t)) texts.push({ p: t, size: 2.5, s: g.length.toFixed(2).replace(".", ","), rot, align: "center" });
        return;
      }
      case "image": {
        if (!s.photo) return;
        const p0 = M(e.p);
        image = { url: e.url, p: p0, w: e.w * k, h: e.h * k, clip: L.view };
        return;
      }
    }
  };
  for (const e of d.entities) {
    if (e.t === "image" ? !s.photo || !d.layers.some((l) => l.id === e.layer && l.visible) : !visible.has(e.layer)) continue;
    draw(e, penMm(weight.get(e.layer) ?? 1));
  }
  return { segs, texts, image };
}

/** Escala gráfica: comprimento redondo (m) que dá entre 30 e 80 mm no papel. */
export function graphicScale(scale: number): { meters: number; mm: number; parts: number } {
  const k = 1000 / scale;
  for (const m of [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100]) if (m * k >= 30) return { meters: m, mm: m * k, parts: m * k > 60 ? 5 : 4 };
  return { meters: 100, mm: 100 * k, parts: 5 };
}

/** Pontos do desenho onde está um clique na janela da prancha (para arrastar o enquadramento). */
export function paperToWorld(s: Sheet, p: P): P {
  const L = sheetLayout(s);
  const k = 1000 / s.scale;
  const vc: P = [(L.view.x0 + L.view.x1) / 2, (L.view.y0 + L.view.y1) / 2];
  return [s.center[0] + (p[0] - vc[0]) / k, s.center[1] + (p[1] - vc[1]) / k];
}


/**
 * Folha completa: desenho recortado + quadro + carimbo (projeto, local, título, autor, data,
 * escala, número) + escala gráfica no canto da janela. Tudo em mm, pronto para SVG ou PDF.
 */
export function sheetPaper(d: CadDoc, s: Sheet): PaperDrawing & { layout: SheetLayout } {
  const L = sheetLayout(s);
  const out = paperDrawing(d, s);
  const segs = [...out.segs], texts = [...out.texts];
  const rect = (b: Box, w: number) => {
    segs.push({ a: [b.x0, b.y0], b: [b.x1, b.y0], w }, { a: [b.x1, b.y0], b: [b.x1, b.y1], w }, { a: [b.x1, b.y1], b: [b.x0, b.y1], w }, { a: [b.x0, b.y1], b: [b.x0, b.y0], w });
  };
  const hline = (y: number, x0: number, x1: number, w = 0.25) => segs.push({ a: [x0, y], b: [x1, y], w });
  const vline = (x: number, y0: number, y1: number, w = 0.25) => segs.push({ a: [x, y0], b: [x, y1], w });
  const label = (x: number, y: number, t: string) => texts.push({ p: [x, y], size: 1.8, s: t, rot: 0, align: "left", muted: true });
  const value = (x: number, y: number, t: string, size = 3.2, bold = false) => texts.push({ p: [x, y], size, s: t, rot: 0, align: "left", bold });

  rect(L.frame, 0.5);
  // carimbo: coluna principal + coluna da direita (escala e número)
  const S = L.stamp;
  rect(S, 0.5);
  const right = S.x1 - 52;
  vline(right, S.y0, S.y1, 0.35);
  const rows = [S.y1 - 13, S.y1 - 25, S.y1 - 39]; // divisões horizontais
  for (const y of rows) hline(y, S.x0, right);
  hline(S.y1 - 25, right, S.x1);
  vline((S.x0 + right) / 2, S.y0, rows[2]!);
  const st = s.stamp;
  label(S.x0 + 2, S.y1 - 3.5, "PROJETO");
  value(S.x0 + 2, S.y1 - 10, st.projeto || "—", 3.6, true);
  label(S.x0 + 2, rows[0]! - 3.5, "LOCAL");
  value(S.x0 + 2, rows[0]! - 9.5, st.local || "—", 3);
  label(S.x0 + 2, rows[1]! - 3.5, "PRANCHA");
  value(S.x0 + 2, rows[1]! - 11, s.name || "—", 4.2, true);
  label(S.x0 + 2, rows[2]! - 3.5, "RESPONSÁVEL");
  value(S.x0 + 2, rows[2]! - 9.5, st.autor || "—", 2.8);
  const mid = (S.x0 + right) / 2;
  label(mid + 2, rows[2]! - 3.5, "DATA");
  value(mid + 2, rows[2]! - 9.5, st.data || "—", 2.8);
  label(right + 2, S.y1 - 3.5, "ESCALA");
  value(right + 2, S.y1 - 13, `1:${s.scale}`, 6, true);
  value(right + 2, S.y1 - 19.5, "medidas em metros", 2, false);
  label(right + 2, S.y1 - 28.5, "FOLHA");
  value(right + 2, S.y1 - 38, st.numero || "01", 6, true);
  value(right + 2, S.y1 - 44, s.size, 2.4);
  texts.push({ p: [S.x1 - 2, S.y0 + 2], size: 1.7, s: "ArchRay · archray.com.br", rot: 0, align: "right", muted: true });
  if (st.obs) texts.push({ p: [S.x0 + 2, S.y0 + 2], size: 1.9, s: st.obs, rot: 0, align: "left", muted: true });

  // escala gráfica no canto inferior esquerdo da janela de desenho
  const g = graphicScale(s.scale);
  const x0 = L.view.x0 + 2, y0 = L.view.y0 + 4;
  hline(y0, x0, x0 + g.mm, 0.35);
  hline(y0 + 1.5, x0, x0 + g.mm, 0.35);
  for (let i = 0; i <= g.parts; i++) {
    const x = x0 + (g.mm * i) / g.parts;
    vline(x, y0, y0 + 1.5, 0.35);
    if (i % 2 === 0 && i < g.parts) for (let k = 0; k < 4; k++) hline(y0 + 0.3 + k * 0.3, x, x + g.mm / g.parts, 0.25);
  }
  const fmt = (m: number) => (m < 1 ? m.toFixed(2) : String(m)).replace(".", ",");
  texts.push({ p: [x0, y0 + 2.6], size: 2, s: "0", rot: 0, align: "center" }, { p: [x0 + g.mm, y0 + 2.6], size: 2, s: `${fmt(g.meters)} m`, rot: 0, align: "center" });
  return { segs, texts: texts.filter((t) => t.s), image: out.image, layout: L };
}
