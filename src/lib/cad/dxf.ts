/**
 * Exporta o desenho do ArchRay CAD para DXF (metros), com uma camada DXF por camada do desenho e a
 * cor de cada uma. Imagens (foto de fundo) não vão no DXF. Cotas saem como linhas + texto (abrem
 * iguais em qualquer CAD). Roda no navegador. Testado em tests/cad.test.ts.
 */
import { DxfWriter, LWPolylineFlags, TextHorizontalAlignment, Units, point3d } from "@tarikjabiri/dxf";
import { blockPieces, paramsKey } from "./blocks";
import { dimGeometry } from "./geometry";
import type { CadDoc } from "./types";

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const ACI: [number, [number, number, number]][] = [
  [1, [255, 0, 0]], [2, [255, 255, 0]], [3, [0, 255, 0]], [4, [0, 255, 255]], [5, [0, 0, 255]], [6, [255, 0, 255]],
  [7, [255, 255, 255]], [8, [128, 128, 128]], [9, [192, 192, 192]], [30, [255, 127, 0]], [150, [0, 127, 255]],
];
function nearestAci(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  let best = 7, d0 = Infinity;
  for (const [n, [R, G, B]] of ACI) {
    const d = (r - R) ** 2 + (g - G) ** 2 + (b - B) ** 2;
    if (d < d0) {
      d0 = d;
      best = n;
    }
  }
  return best;
}
/** Nome de camada aceito por qualquer CAD (sem acento e sem símbolos). */
export const dxfLayerName = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "").toUpperCase() || "CAMADA";

const fmt = (m: number) => m.toFixed(2).replace(".", ",");
const deg = (r: number) => (r * 180) / Math.PI;

export function cadToDxf(doc: CadDoc): string {
  const dxf = new DxfWriter();
  dxf.setUnits(Units.Meters);
  const names = new Map<string, string>();
  const used = new Set<string>();
  for (const l of doc.layers) {
    let n = dxfLayerName(l.name);
    while (used.has(n)) n += "_";
    used.add(n);
    names.set(l.id, n);
    dxf.addLayer(n, nearestAci(l.color), "CONTINUOUS");
  }
  // blocos: uma definição por tipo (e por medida própria diferente), inserida em cada posição
  const defs = new Map<string, string>();
  const usedBlocks = new Set<string>();
  for (const e of doc.entities) {
    if (e.t !== "block") continue;
    const key = `${e.type}|${paramsKey(e.params)}`;
    if (defs.has(key)) continue;
    const typeName = doc.blockTypes?.find((t) => t.id === e.type)?.name ?? e.params.kind;
    let n = dxfLayerName(typeName);
    if (usedBlocks.has(n)) {
      let i = 2;
      while (usedBlocks.has(`${n}-${i}`)) i++;
      n = `${n}-${i}`;
    }
    usedBlocks.add(n);
    defs.set(key, n);
    const blk = dxf.addBlock(n);
    for (const q of blockPieces(e.params)) {
      if (q.t === "line") blk.addLine(point3d(q.a[0], q.a[1], 0), point3d(q.b[0], q.b[1], 0), { layerName: "0" });
      else blk.addArc(point3d(q.c[0], q.c[1], 0), q.r, deg(q.a0), deg(q.a1), { layerName: "0" });
    }
  }
  for (const e of doc.entities) {
    const layerName = names.get(e.layer) ?? "0";
    const o = { layerName };
    switch (e.t) {
      case "line":
        dxf.addLine(point3d(e.a[0], e.a[1], 0), point3d(e.b[0], e.b[1], 0), o);
        break;
      case "poly":
        if (e.pts.length >= 2) dxf.addLWPolyline(e.pts.map((p) => ({ point: { x: p[0], y: p[1] } })), { ...o, flags: e.closed ? LWPolylineFlags.Closed : LWPolylineFlags.None });
        break;
      case "circle":
        dxf.addCircle(point3d(e.c[0], e.c[1], 0), e.r, o);
        break;
      case "arc":
        dxf.addArc(point3d(e.c[0], e.c[1], 0), e.r, deg(e.a0), deg(e.a1), o);
        break;
      case "text":
        dxf.addText(point3d(e.p[0], e.p[1], 0), e.h, e.s, o);
        break;
      case "dim": {
        const g = dimGeometry(e.a, e.b, e.off);
        const tick = Math.max(0.03, g.length * 0.015);
        dxf.addLine(point3d(e.a[0], e.a[1], 0), point3d(g.da[0], g.da[1], 0), o);
        dxf.addLine(point3d(e.b[0], e.b[1], 0), point3d(g.db[0], g.db[1], 0), o);
        dxf.addLine(point3d(g.da[0], g.da[1], 0), point3d(g.db[0], g.db[1], 0), o);
        for (const p of [g.da, g.db]) dxf.addLine(point3d(p[0] - tick, p[1] - tick, 0), point3d(p[0] + tick, p[1] + tick, 0), o);
        const h = Math.max(0.08, Math.min(0.25, g.length * 0.06));
        const at = point3d(g.text[0] + g.n[0] * h * 0.6, g.text[1] + g.n[1] * h * 0.6, 0);
        let rot = deg(g.angle);
        if (rot > 90 || rot < -90) rot += 180;
        dxf.addText(at, h, fmt(g.length), { ...o, rotation: rot, horizontalAlignment: TextHorizontalAlignment.Center, secondAlignmentPoint: at });
        break;
      }
      case "block":
        dxf.addInsert(defs.get(`${e.type}|${paramsKey(e.params)}`)!, point3d(e.p[0], e.p[1], 0), o);
        break;
      default:
        break; // imagem de fundo não vai para o DXF
    }
  }
  return dxf.stringify();
}
