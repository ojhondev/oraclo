/**
 * Motor de desenho do ArchRay CAD: canvas 2D, mundo em metros (Y para cima) ↔ tela em pixels.
 * Desenha grade, camadas (com opacidade), imagem de fundo, seleção com alças, prévia da ferramenta,
 * marcador de encaixe e caixa de seleção. Só roda no navegador.
 */
import { arcPoint, dimGeometry, entitySnaps, type Snap } from "./geometry";
import type { Box, CadDoc, Entity, P } from "./types";

/** Vista: centro do mundo na tela e escala (pixels por metro). */
export type View = { cx: number; cy: number; s: number };

export const toScreen = (v: View, w: number, h: number, p: P): P => [w / 2 + (p[0] - v.cx) * v.s, h / 2 - (p[1] - v.cy) * v.s];
export const toWorld = (v: View, w: number, h: number, x: number, y: number): P => [v.cx + (x - w / 2) / v.s, v.cy - (y - h / 2) / v.s];

/** Passo da grade que deixa as linhas a pelo menos ~14 px umas das outras. */
export function gridStep(s: number) {
  for (const g of [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100]) if (g * s >= 14) return g;
  return 200;
}

export type RenderState = {
  doc: CadDoc;
  view: View;
  w: number;
  h: number;
  images: Map<string, HTMLImageElement>;
  selected: Set<string>;
  hover: string | null;
  preview: Entity[];
  snap: Snap | null;
  box: { a: P; b: P } | null;
  grid: boolean;
  dark: boolean;
};

const fmtLen = (m: number) => m.toFixed(2).replace(".", ",");

function pathEntity(ctx: CanvasRenderingContext2D, e: Entity, S: (p: P) => P, s: number) {
  switch (e.t) {
    case "line": {
      const [a, b] = [S(e.a), S(e.b)];
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      break;
    }
    case "poly": {
      e.pts.forEach((p, i) => {
        const q = S(p);
        if (i) ctx.lineTo(q[0], q[1]);
        else ctx.moveTo(q[0], q[1]);
      });
      if (e.closed) ctx.closePath();
      break;
    }
    case "circle": {
      const c = S(e.c);
      ctx.moveTo(c[0] + e.r * s, c[1]);
      ctx.arc(c[0], c[1], e.r * s, 0, Math.PI * 2);
      break;
    }
    case "arc": {
      const c = S(e.c);
      const a = S(arcPoint(e.c, e.r, e.a0));
      ctx.moveTo(a[0], a[1]);
      // tela com Y para baixo: o anti-horário do mundo vira horário na tela
      ctx.arc(c[0], c[1], e.r * s, -e.a0, -e.a1, true);
      break;
    }
    default:
      break;
  }
}

function drawDim(ctx: CanvasRenderingContext2D, e: Extract<Entity, { t: "dim" }>, S: (p: P) => P, color: string) {
  const g = dimGeometry(e.a, e.b, e.off);
  const [a, b, da, db] = [S(e.a), S(e.b), S(g.da), S(g.db)];
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(da[0], da[1]);
  ctx.moveTo(b[0], b[1]);
  ctx.lineTo(db[0], db[1]);
  ctx.moveTo(da[0], da[1]);
  ctx.lineTo(db[0], db[1]);
  for (const p of [da, db]) {
    ctx.moveTo(p[0] - 4, p[1] + 4);
    ctx.lineTo(p[0] + 4, p[1] - 4);
  }
  ctx.stroke();
  const t = S(g.text);
  let ang = -g.angle;
  if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI;
  ctx.save();
  ctx.translate(t[0], t[1]);
  ctx.rotate(ang);
  ctx.fillStyle = color;
  ctx.font = "12px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(fmtLen(g.length), 0, -3);
  ctx.restore();
}

function strokeEntity(ctx: CanvasRenderingContext2D, e: Entity, S: (p: P) => P, s: number, color: string, images: Map<string, HTMLImageElement>) {
  if (e.t === "image") {
    const img = images.get(e.url);
    const tl = S([e.p[0], e.p[1] + e.h]);
    if (img?.complete && img.naturalWidth) ctx.drawImage(img, tl[0], tl[1], e.w * s, e.h * s);
    else {
      ctx.strokeStyle = color;
      ctx.strokeRect(tl[0], tl[1], e.w * s, e.h * s);
    }
    return;
  }
  if (e.t === "text") {
    const p = S(e.p);
    const px = e.h * s;
    if (px < 2) return;
    ctx.fillStyle = color;
    ctx.font = `${px}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(e.s, p[0], p[1]);
    return;
  }
  if (e.t === "dim") return drawDim(ctx, e, S, color);
  ctx.beginPath();
  pathEntity(ctx, e, S, s);
  ctx.stroke();
}

function drawGrid(ctx: CanvasRenderingContext2D, r: RenderState) {
  const g = gridStep(r.view.s);
  const [x0, y1] = toWorld(r.view, r.w, r.h, 0, 0);
  const [x1, y0] = toWorld(r.view, r.w, r.h, r.w, r.h);
  const major = g * 5;
  ctx.lineWidth = 1;
  for (const [step, alpha] of [[g, 0.05], [major, 0.11]] as const) {
    ctx.strokeStyle = r.dark ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha * 1.2})`;
    ctx.beginPath();
    for (let x = Math.floor(x0 / step) * step; x <= x1; x += step) {
      const sx = Math.round(toScreen(r.view, r.w, r.h, [x, 0])[0]) + 0.5;
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, r.h);
    }
    for (let y = Math.floor(y0 / step) * step; y <= y1; y += step) {
      const sy = Math.round(toScreen(r.view, r.w, r.h, [0, y])[1]) + 0.5;
      ctx.moveTo(0, sy);
      ctx.lineTo(r.w, sy);
    }
    ctx.stroke();
  }
  // eixos da origem
  const o = toScreen(r.view, r.w, r.h, [0, 0]);
  ctx.strokeStyle = r.dark ? "rgba(255,90,90,0.45)" : "rgba(200,0,0,0.4)";
  ctx.beginPath();
  ctx.moveTo(o[0], o[1]);
  ctx.lineTo(o[0] + 40, o[1]);
  ctx.stroke();
  ctx.strokeStyle = r.dark ? "rgba(90,255,120,0.45)" : "rgba(0,150,0,0.4)";
  ctx.beginPath();
  ctx.moveTo(o[0], o[1]);
  ctx.lineTo(o[0], o[1] - 40);
  ctx.stroke();
}

function drawSnap(ctx: CanvasRenderingContext2D, snap: Snap, S: (p: P) => P) {
  const [x, y] = S(snap.p);
  const k = 6;
  ctx.strokeStyle = "#ffcc00";
  ctx.lineWidth = 2;
  ctx.beginPath();
  switch (snap.kind) {
    case "ponta":
      ctx.rect(x - k, y - k, 2 * k, 2 * k);
      break;
    case "meio":
      ctx.moveTo(x, y - k);
      ctx.lineTo(x + k, y + k);
      ctx.lineTo(x - k, y + k);
      ctx.closePath();
      break;
    case "centro":
    case "quadrante":
      ctx.arc(x, y, k, 0, Math.PI * 2);
      break;
    case "interseção":
      ctx.moveTo(x - k, y - k);
      ctx.lineTo(x + k, y + k);
      ctx.moveTo(x + k, y - k);
      ctx.lineTo(x - k, y + k);
      break;
    case "perpendicular":
      ctx.moveTo(x - k, y + k);
      ctx.lineTo(x + k, y + k);
      ctx.moveTo(x - k, y + k);
      ctx.lineTo(x - k, y - k);
      break;
    default:
      ctx.moveTo(x - k, y);
      ctx.lineTo(x + k, y);
      ctx.moveTo(x, y - k);
      ctx.lineTo(x, y + k);
  }
  ctx.stroke();
}

export function render(ctx: CanvasRenderingContext2D, r: RenderState) {
  const S = (p: P) => toScreen(r.view, r.w, r.h, p);
  ctx.fillStyle = r.dark ? "#1a1a1c" : "#f4f4f2";
  ctx.fillRect(0, 0, r.w, r.h);
  if (r.grid) drawGrid(ctx, r);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  for (const layer of r.doc.layers) {
    if (!layer.visible) continue;
    ctx.globalAlpha = layer.opacity;
    for (const e of r.doc.entities) {
      if (e.layer !== layer.id) continue;
      ctx.lineWidth = layer.weight * (r.hover === e.id ? 2 : 1);
      ctx.strokeStyle = layer.color;
      strokeEntity(ctx, e, S, r.view.s, layer.color, r.images);
    }
  }
  ctx.globalAlpha = 1;

  // seleção: traço destacado e alças
  const sel = r.doc.entities.filter((e) => r.selected.has(e.id));
  ctx.setLineDash([6, 4]);
  for (const e of sel) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffb703";
    strokeEntity(ctx, e, S, r.view.s, "#ffb703", new Map());
  }
  ctx.setLineDash([]);
  if (sel.length && sel.length <= 30)
    for (const e of sel)
      for (const g of entitySnaps(e)) {
        if (g.kind === "quadrante" && e.t !== "circle") continue;
        const [x, y] = S(g.p);
        ctx.fillStyle = g.kind === "meio" ? "#ffb703" : "#3b82f6";
        ctx.fillRect(x - 4, y - 4, 8, 8);
      }

  // prévia da ferramenta
  if (r.preview.length) {
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.5;
    for (const e of r.preview) {
      ctx.strokeStyle = r.dark ? "#ffffff" : "#111111";
      strokeEntity(ctx, e, S, r.view.s, r.dark ? "#ffffff" : "#111111", r.images);
    }
    ctx.setLineDash([]);
  }

  // caixa de seleção: janela (→, azul) ou cruzamento (←, verde tracejado)
  if (r.box) {
    const [a, b] = [S(r.box.a), S(r.box.b)];
    const crossing = r.box.b[0] < r.box.a[0];
    ctx.fillStyle = crossing ? "rgba(34,197,94,0.10)" : "rgba(59,130,246,0.10)";
    ctx.strokeStyle = crossing ? "#22c55e" : "#3b82f6";
    ctx.setLineDash(crossing ? [6, 4] : []);
    ctx.lineWidth = 1;
    ctx.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
    ctx.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
    ctx.setLineDash([]);
  }
  if (r.snap) drawSnap(ctx, r.snap, S);
}

/** Vista que enquadra a caixa com margem. */
export function fitView(b: Box, w: number, h: number): View {
  const bw = Math.max(0.5, b.x1 - b.x0), bh = Math.max(0.5, b.y1 - b.y0);
  const s = Math.min(w / (bw * 1.15), h / (bh * 1.15));
  return { cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, s: Math.max(0.5, Math.min(20000, s)) };
}
