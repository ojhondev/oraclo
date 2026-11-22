/**
 * Desenho de fachada a partir do levantamento: converte a análise (pixels) em geometria em metros
 * (origem no canto inferior esquerdo da fachada, y para cima) e gera as cotas em cadeia.
 * Puro: a mesma geometria vira DXF (drawingDxf) e prévia em SVG (drawingSvg).
 */
import { DxfWriter, TextHorizontalAlignment, Units, point3d } from "@tarikjabiri/dxf";
import type { Band, Box } from "./analyze";

export type Seg = { a: [number, number]; b: [number, number] };
export type Label = { at: [number, number]; text: string; size: number; layer: Layer; rotate?: number };
export type Layer = "CONTORNO" | "FAIXAS" | "VAOS" | "COTAS" | "TEXTOS";
export type Drawing = { width: number; height: number; segs: (Seg & { layer: Layer })[]; labels: Label[]; vaos: Box[] };

const fmt = (m: number) => m.toFixed(2).replace(".", ",");

/**
 * `mmPerPixel` da imagem analisada. Vãos já regularizados. As cotas em cadeia ficam acima de cada
 * fiada (larguras dos vãos e dos panos entre eles) e à esquerda (níveis das faixas).
 */
export function buildDrawing(input: { facade: Box; bands: Band[]; vaos: Box[]; mmPerPixel: number }): Drawing {
  const k = input.mmPerPixel / 1000;
  const f = input.facade;
  const W = (f.x1 - f.x0) * k;
  const H = (f.y1 - f.y0) * k;
  const X = (px: number) => (px - f.x0) * k;
  const Y = (py: number) => (f.y1 - py) * k;
  const segs: Drawing["segs"] = [];
  const labels: Label[] = [];
  const line = (a: [number, number], b: [number, number], layer: Layer) => segs.push({ a, b, layer });
  const txt = Math.max(0.12, Math.min(0.3, W / 90));

  // contorno
  line([0, 0], [W, 0], "CONTORNO");
  line([W, 0], [W, H], "CONTORNO");
  line([W, H], [0, H], "CONTORNO");
  line([0, H], [0, 0], "CONTORNO");

  // faixas (cornijas, frisos): só as que não estão grudadas em outra (até 15 cm)
  const bandYs = input.bands.map((b) => Y(b.y)).sort((a, b) => a - b).filter((y, i, a) => i === 0 || y - a[i - 1]! > 0.15);
  for (const y of bandYs) line([0, y], [W, y], "FAIXAS");

  // vãos
  const vaos = input.vaos.map((v) => ({ x0: X(v.x0), x1: X(v.x1), y0: Y(v.y1), y1: Y(v.y0) }));
  for (const v of vaos) {
    line([v.x0, v.y0], [v.x1, v.y0], "VAOS");
    line([v.x1, v.y0], [v.x1, v.y1], "VAOS");
    line([v.x1, v.y1], [v.x0, v.y1], "VAOS");
    line([v.x0, v.y1], [v.x0, v.y0], "VAOS");
    labels.push({ at: [(v.x0 + v.x1) / 2, v.y0 - txt * 1.6], text: `${fmt(v.x1 - v.x0)} × ${fmt(v.y1 - v.y0)}`, size: txt * 0.8, layer: "TEXTOS" });
  }

  // cota em cadeia horizontal: marca, traço e texto centralizado
  const tick = txt * 0.5;
  const dimH = (xs: number[], y: number) => {
    line([xs[0]!, y], [xs[xs.length - 1]!, y], "COTAS");
    for (const x of xs) {
      line([x - tick / 2, y - tick / 2], [x + tick / 2, y + tick / 2], "COTAS");
      line([x, y - tick], [x, y + tick], "COTAS");
    }
    for (let i = 0; i < xs.length - 1; i++) if (xs[i + 1]! - xs[i]! > txt * 2.2) labels.push({ at: [(xs[i]! + xs[i + 1]!) / 2, y + txt * 0.5], text: fmt(xs[i + 1]! - xs[i]!), size: txt, layer: "COTAS" });
  };
  // fiadas: vãos com a base parecida (até 30 cm) formam uma fiada
  const rows: typeof vaos[] = [];
  for (const v of [...vaos].sort((a, b) => a.y0 - b.y0)) {
    const r = rows.find((g) => Math.abs(g[0]!.y0 - v.y0) < 0.3);
    if (r) r.push(v);
    else rows.push([v]);
  }
  for (const r of rows) {
    const xs = [0, ...r.flatMap((v) => [v.x0, v.x1]), W].sort((a, b) => a - b);
    const top = Math.max(...r.map((v) => v.y1));
    dimH(xs, top + txt * 2.2);
  }
  // total embaixo
  dimH([0, W], -txt * 3);

  // níveis à esquerda (cota vertical em cadeia das faixas)
  const xL = -txt * 3;
  const ys = [0, ...bandYs, H];
  line([xL, 0], [xL, H], "COTAS");
  for (const y of ys) {
    line([xL - tick / 2, y - tick / 2], [xL + tick / 2, y + tick / 2], "COTAS");
    line([xL - tick, y], [xL + tick, y], "COTAS");
  }
  for (let i = 0; i < ys.length - 1; i++) if (ys[i + 1]! - ys[i]! > txt * 2.2) labels.push({ at: [xL - txt * 0.6, (ys[i]! + ys[i + 1]!) / 2], text: fmt(ys[i + 1]! - ys[i]!), size: txt, layer: "COTAS", rotate: 90 });

  return { width: W, height: H, segs, labels, vaos: vaos.map((v) => ({ x0: v.x0, y0: v.y0, x1: v.x1, y1: v.y1 })) };
}

const COLORS: Record<Layer, number> = { CONTORNO: 7, FAIXAS: 2, VAOS: 4, COTAS: 1, TEXTOS: 7 };

/** DXF em metros, com uma camada por tipo (CAD-CONTORNO, CAD-FAIXAS, CAD-VAOS, CAD-COTAS, CAD-TEXTOS). */
export function drawingDxf(d: Drawing): string {
  const dxf = new DxfWriter();
  dxf.setUnits(Units.Meters);
  for (const [name, color] of Object.entries(COLORS)) dxf.addLayer(`CAD-${name}`, color, "CONTINUOUS");
  for (const s of d.segs) dxf.addLine(point3d(s.a[0], s.a[1], 0), point3d(s.b[0], s.b[1], 0), { layerName: `CAD-${s.layer}` });
  for (const l of d.labels) {
    const p = point3d(l.at[0], l.at[1], 0);
    // centralizado no ponto
    dxf.addText(p, l.size, l.text, { layerName: `CAD-${l.layer}`, rotation: l.rotate ?? 0, horizontalAlignment: TextHorizontalAlignment.Center, secondAlignmentPoint: p });
  }
  return dxf.stringify();
}

/** Prévia em SVG (fundo branco, traço técnico), para conferir sem abrir o CAD. */
export function drawingSvg(d: Drawing, pxPerM = 40): string {
  const pad = 1.6;
  const W = (d.width + pad * 2) * pxPerM;
  const H = (d.height + pad * 2) * pxPerM;
  const sx = (x: number) => (x + pad) * pxPerM;
  const sy = (y: number) => (d.height + pad - y) * pxPerM;
  const stroke: Record<Layer, string> = { CONTORNO: "#111", FAIXAS: "#8a6d00", VAOS: "#0a66c2", COTAS: "#c0392b", TEXTOS: "#333" };
  const width: Record<Layer, number> = { CONTORNO: 2, FAIXAS: 1.2, VAOS: 1.6, COTAS: 0.8, TEXTOS: 1 };
  const lines = d.segs.map((s) => `<line x1="${sx(s.a[0]).toFixed(1)}" y1="${sy(s.a[1]).toFixed(1)}" x2="${sx(s.b[0]).toFixed(1)}" y2="${sy(s.b[1]).toFixed(1)}" stroke="${stroke[s.layer]}" stroke-width="${width[s.layer]}"/>`).join("");
  const texts = d.labels
    .map((l) => {
      const x = sx(l.at[0]).toFixed(1), y = sy(l.at[1]).toFixed(1);
      return `<text x="${x}" y="${y}" font-size="${(l.size * pxPerM).toFixed(1)}" fill="${stroke[l.layer]}" text-anchor="middle" font-family="Arial"${l.rotate ? ` transform="rotate(${-l.rotate} ${x} ${y})"` : ""}>${l.text}</text>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(0)}" height="${H.toFixed(0)}"><rect width="100%" height="100%" fill="#fff"/>${lines}${texts}</svg>`;
}
