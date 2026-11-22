/**
 * Desenho de fachada a partir do levantamento: converte a análise (pixels) em geometria em metros
 * (origem no canto inferior esquerdo da fachada, y para cima) e gera as cotas em cadeia.
 * Puro: a mesma geometria vira DXF (drawingDxf) e prévia em SVG (drawingSvg).
 */
import { DxfWriter, TextHorizontalAlignment, Units, point3d } from "@tarikjabiri/dxf";
import type { Band, Box } from "./analyze";
import type { WindowDetail } from "./detail";

export type Seg = { a: [number, number]; b: [number, number] };
export type Label = { at: [number, number]; text: string; size: number; layer: Layer; rotate?: number };
export type Layer = "CONTORNO" | "FAIXAS" | "VAOS" | "COTAS" | "TEXTOS" | "ESQUADRIAS" | "MOLDURAS" | "ARCOS";
export type Arc = { c: [number, number]; r: number; a0: number; a1: number; layer: Layer };
/** Bloco de um tipo de janela: geometria relativa ao canto inferior esquerdo do vão-modelo (metros). */
export type BlockDef = { name: string; w: number; h: number; segs: (Seg & { layer: Layer })[]; arcs: Arc[] };
export type Insert = { block: string; at: [number, number]; sx: number; sy: number };
export type Drawing = { width: number; height: number; segs: (Seg & { layer: Layer })[]; arcs: Arc[]; labels: Label[]; vaos: Box[]; blocks: BlockDef[]; inserts: Insert[] };

/** Geometria do detalhe para um vão de largura w e altura h (origem no canto inferior esquerdo). */
export function detailGeometry(d: WindowDetail, w: number, h: number): { segs: (Seg & { layer: Layer })[]; arcs: Arc[] } {
  const segs: (Seg & { layer: Layer })[] = [];
  const arcs: Arc[] = [];
  const L = (a: [number, number], b: [number, number], layer: Layer) => segs.push({ a, b, layer });
  for (const mx of d.mullionsX) L([mx * w, 0], [mx * w, h], "ESQUADRIAS");
  for (const my of d.mullionsY) L([0, h - my * h], [w, h - my * h], "ESQUADRIAS");
  const fr = d.frame;
  if (fr.top || fr.bottom || fr.left || fr.right) {
    const x0 = -fr.left * w, x1 = w + fr.right * w, y0 = -fr.bottom * h, y1 = h + fr.top * h;
    L([x0, y0], [x1, y0], "MOLDURAS");
    L([x1, y0], [x1, y1], "MOLDURAS");
    L([x1, y1], [x0, y1], "MOLDURAS");
    L([x0, y1], [x0, y0], "MOLDURAS");
  }
  if (d.arch) {
    const c: [number, number] = [w / 2, h - d.arch.cy * w];
    arcs.push({ c, r: d.arch.r * w, a0: 0, a1: 180, layer: "ARCOS" });
    if (d.arch.inner) arcs.push({ c, r: d.arch.inner * w, a0: 0, a1: 180, layer: "ARCOS" });
    // base do arco
    L([c[0] - d.arch.r * w, c[1]], [c[0] + d.arch.r * w, c[1]], "ARCOS");
  }
  return { segs, arcs };
}

const fmt = (m: number) => m.toFixed(2).replace(".", ",");

/**
 * `mmPerPixel` da imagem analisada. Vãos já regularizados. As cotas em cadeia ficam acima de cada
 * fiada (larguras dos vãos e dos panos entre eles) e à esquerda (níveis das faixas).
 */
export function buildDrawing(input: { facade: Box; bands: Band[]; vaos: (Box & { family?: number })[]; mmPerPixel: number; details?: Record<number, WindowDetail> }): Drawing {
  const k = input.mmPerPixel / 1000;
  const f = input.facade;
  const W = (f.x1 - f.x0) * k;
  const H = (f.y1 - f.y0) * k;
  const X = (px: number) => (px - f.x0) * k;
  const Y = (py: number) => (f.y1 - py) * k;
  const segs: Drawing["segs"] = [];
  const arcs: Arc[] = [];
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
  const vaos = input.vaos.map((v) => ({ x0: X(v.x0), x1: X(v.x1), y0: Y(v.y1), y1: Y(v.y0), family: v.family }));

  // detalhe por tipo de janela: um bloco por família, inserido em cada vão dela (escala = vão / modelo)
  const blocks: BlockDef[] = [];
  const inserts: Insert[] = [];
  for (const [famKey, det] of Object.entries(input.details ?? {})) {
    const fam = Number(famKey);
    const members = vaos.filter((v) => v.family === fam);
    if (!members.length) continue;
    const med = (a: number[]) => [...a].sort((x, y) => x - y)[a.length >> 1]!;
    const w = med(members.map((v) => v.x1 - v.x0));
    const h = med(members.map((v) => v.y1 - v.y0));
    const geo = detailGeometry(det, w, h);
    const name = `JANELA-${String.fromCharCode(65 + fam)}`;
    blocks.push({ name, w, h, ...geo });
    for (const v of members) {
      const sx = (v.x1 - v.x0) / w, sy = (v.y1 - v.y0) / h;
      inserts.push({ block: name, at: [v.x0, v.y0], sx, sy });
      // versão "explodida" para a prévia
      for (const g of geo.segs) segs.push({ a: [v.x0 + g.a[0] * sx, v.y0 + g.a[1] * sy], b: [v.x0 + g.b[0] * sx, v.y0 + g.b[1] * sy], layer: g.layer });
      for (const a of geo.arcs) arcs.push({ ...a, c: [v.x0 + a.c[0] * sx, v.y0 + a.c[1] * sy], r: a.r * (sx + sy) / 2 });
    }
  }
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

  return { width: W, height: H, segs, arcs, labels, vaos: vaos.map((v) => ({ x0: v.x0, y0: v.y0, x1: v.x1, y1: v.y1 })), blocks, inserts };
}

const COLORS: Record<Layer, number> = { CONTORNO: 7, FAIXAS: 2, VAOS: 4, COTAS: 1, TEXTOS: 7, ESQUADRIAS: 5, MOLDURAS: 8, ARCOS: 6 };
const DETAIL: Layer[] = ["ESQUADRIAS", "MOLDURAS", "ARCOS"];

/** DXF em metros, com uma camada por tipo (CAD-CONTORNO, CAD-FAIXAS, CAD-VAOS, CAD-COTAS, CAD-TEXTOS). */
export function drawingDxf(d: Drawing): string {
  const dxf = new DxfWriter();
  dxf.setUnits(Units.Meters);
  for (const [name, color] of Object.entries(COLORS)) dxf.addLayer(`CAD-${name}`, color, "CONTINUOUS");
  // blocos dos tipos de janela (o detalhe vai como INSERT; a prévia usa a versão explodida)
  for (const b of d.blocks) {
    const blk = dxf.addBlock(b.name);
    for (const s of b.segs) blk.addLine(point3d(s.a[0], s.a[1], 0), point3d(s.b[0], s.b[1], 0), { layerName: `CAD-${s.layer}` });
    for (const a of b.arcs) blk.addArc(point3d(a.c[0], a.c[1], 0), a.r, a.a0, a.a1, { layerName: `CAD-${a.layer}` });
  }
  for (const i of d.inserts) dxf.addInsert(i.block, point3d(i.at[0], i.at[1], 0), { scaleFactor: { x: i.sx, y: i.sy, z: 1 }, layerName: "CAD-VAOS" });
  const hasBlocks = d.blocks.length > 0;
  for (const s of d.segs) {
    if (hasBlocks && DETAIL.includes(s.layer)) continue;
    dxf.addLine(point3d(s.a[0], s.a[1], 0), point3d(s.b[0], s.b[1], 0), { layerName: `CAD-${s.layer}` });
  }
  for (const a of d.arcs) if (!(hasBlocks && DETAIL.includes(a.layer))) dxf.addArc(point3d(a.c[0], a.c[1], 0), a.r, a.a0, a.a1, { layerName: `CAD-${a.layer}` });
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
  const stroke: Record<Layer, string> = { CONTORNO: "#111", FAIXAS: "#8a6d00", VAOS: "#0a66c2", COTAS: "#c0392b", TEXTOS: "#333", ESQUADRIAS: "#3b5bdb", MOLDURAS: "#555", ARCOS: "#6741d9" };
  const width: Record<Layer, number> = { CONTORNO: 2, FAIXAS: 1.2, VAOS: 1.6, COTAS: 0.8, TEXTOS: 1, ESQUADRIAS: 0.9, MOLDURAS: 1.2, ARCOS: 1.3 };
  const lines = d.segs.map((s) => `<line x1="${sx(s.a[0]).toFixed(1)}" y1="${sy(s.a[1]).toFixed(1)}" x2="${sx(s.b[0]).toFixed(1)}" y2="${sy(s.b[1]).toFixed(1)}" stroke="${stroke[s.layer]}" stroke-width="${width[s.layer]}"/>`).join("");
  const arcsSvg = d.arcs
    .map((a) => {
      const p = (deg: number) => [sx(a.c[0] + a.r * Math.cos((deg * Math.PI) / 180)).toFixed(1), sy(a.c[1] + a.r * Math.sin((deg * Math.PI) / 180)).toFixed(1)];
      const [x0, y0] = p(a.a0), [x1, y1] = p(a.a1);
      const r = (a.r * pxPerM).toFixed(1);
      return `<path d="M${x0} ${y0} A${r} ${r} 0 0 0 ${x1} ${y1}" fill="none" stroke="${stroke[a.layer]}" stroke-width="${width[a.layer]}"/>`;
    })
    .join("");
  const texts = d.labels
    .map((l) => {
      const x = sx(l.at[0]).toFixed(1), y = sy(l.at[1]).toFixed(1);
      return `<text x="${x}" y="${y}" font-size="${(l.size * pxPerM).toFixed(1)}" fill="${stroke[l.layer]}" text-anchor="middle" font-family="Arial"${l.rotate ? ` transform="rotate(${-l.rotate} ${x} ${y})"` : ""}>${l.text}</text>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(0)}" height="${H.toFixed(0)}"><rect width="100%" height="100%" fill="#fff"/>${lines}${arcsSvg}${texts}</svg>`;
}
