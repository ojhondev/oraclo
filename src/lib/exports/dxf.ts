import "server-only";
import {
  DxfWriter,
  HatchBoundaryPaths,
  HatchPolylineBoundary,
  HatchPredefinedPatterns,
  LWPolylineFlags,
  Units,
  pattern,
  point3d,
  vertex,
} from "@tarikjabiri/dxf";
import { fmtArea, fmtLength } from "@/lib/geometry";
import { hexToRgb, pointsOf, type ExportData } from "./common";

/** Cores ACI básicas (para a cor da camada); as entidades levam a cor exata (true color). */
const ACI: [number, [number, number, number]][] = [
  [1, [255, 0, 0]], [2, [255, 255, 0]], [3, [0, 255, 0]], [4, [0, 255, 255]], [5, [0, 0, 255]],
  [6, [255, 0, 255]], [8, [128, 128, 128]], [9, [192, 192, 192]], [30, [255, 127, 0]],
  [34, [153, 76, 0]], [14, [127, 0, 0]], [94, [0, 127, 0]], [150, [0, 127, 255]], [200, [191, 0, 255]],
  [40, [255, 191, 0]], [250, [51, 51, 51]],
];

function nearestAci(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  let best = 7;
  let dist = Infinity;
  for (const [n, [R, G, B]] of ACI) {
    const d = (r - R) ** 2 + (g - G) ** 2 + (b - B) ** 2;
    if (d < dist) {
      dist = d;
      best = n;
    }
  }
  return best;
}

const trueColor = (hex: string) => {
  const [r, g, b] = hexToRgb(hex);
  return String((r << 16) | (g << 8) | b);
};

function hatchFor(name: string) {
  switch (name) {
    case "cruzado":
      return HatchPredefinedPatterns.ANSI37;
    case "pontilhado":
    case "pontilhado-denso":
    case "circulos":
      return HatchPredefinedPatterns.DOTS;
    case "horizontal":
      return HatchPredefinedPatterns.ANSI31; // girado 45° → horizontal
    default:
      return HatchPredefinedPatterns.ANSI31;
  }
}

/** Nome de camada válido no AutoCAD (sem < > / \ " : ; ? * | = ` ). */
const layerName = (code: string, name: string) =>
  `DANO-${code}-${name}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[<>/\\":;?*|=`,()]/g, "")
    .replace(/\s+/g, "_")
    .toUpperCase()
    .slice(0, 60);

/**
 * Gera o DXF (R2007, unidades em metros) com a ortofoto referenciada como IMAGE,
 * uma camada por tipo de dano (polilinhas + hachuras), rótulos e legenda com quantitativos.
 * Sem escala definida, desenha em pixels (unidade "sem unidade").
 */
export function buildDxf(data: ExportData, imageFile: string) {
  const { ortho, damages, typeById, summary, site, element } = data;
  const W = ortho.widthPx;
  const H = ortho.heightPx;
  const s = ortho.mmPerPixel ? ortho.mmPerPixel / 1000 : 1; // unidade de desenho por pixel
  const X = (x: number) => x * s;
  const Y = (y: number) => (H - y) * s;
  const Wm = W * s;
  const Hm = H * s;
  const txt = Math.max(Wm, Hm) / 120; // altura de texto proporcional ao desenho

  const dxf = new DxfWriter();
  dxf.setUnits(ortho.mmPerPixel ? Units.Meters : Units.Unitless);

  dxf.addLayer("ORTOFOTO", 8, "CONTINUOUS");
  dxf.addLayer("LIMITE-ORTOFOTO", 8, "CONTINUOUS");
  dxf.addLayer("ROTULOS-DANOS", 7, "CONTINUOUS");
  dxf.addLayer("LEGENDA", 7, "CONTINUOUS");

  // Ortofoto em escala, canto inferior esquerdo na origem.
  dxf.setCurrentLayerName("ORTOFOTO");
  // a lib recebe a largura total da imagem em unidades de desenho (u = largura / pixels)
  dxf.addImage(imageFile, "ortofoto", point3d(0, 0, 0), W, H, Wm, 0);
  dxf.setCurrentLayerName("LIMITE-ORTOFOTO");
  dxf.addLWPolyline(
    [{ point: { x: 0, y: 0 } }, { point: { x: Wm, y: 0 } }, { point: { x: Wm, y: Hm } }, { point: { x: 0, y: Hm } }],
    { flags: LWPolylineFlags.Closed },
  );

  const layers = new Map<string, string>();
  for (const { type } of summary) {
    const name = layerName(type.code, type.name);
    layers.set(type.id, name);
    dxf.addLayer(name, nearestAci(type.color), "CONTINUOUS");
  }

  const hatchScale = Math.max(Wm, Hm) / 160 / 3.175; // ~160 linhas de hachura na largura

  damages.forEach((d, i) => {
    const t = typeById.get(d.typeId)!;
    const layer = layers.get(t.id)!;
    const color = trueColor(t.color);
    const p = pointsOf(d);
    if (!p.length) return;
    dxf.setCurrentLayerName(layer);
    const opts = { layerName: layer, trueColor: color };
    let labelAt: [number, number];
    if (t.geometry === "area" && p.length >= 3) {
      dxf.addLWPolyline(p.map(([x, y]) => ({ point: { x: X(x), y: Y(y) } })), { ...opts, flags: LWPolylineFlags.Closed });
      const boundary = new HatchBoundaryPaths();
      boundary.addPolylineBoundary(new HatchPolylineBoundary(p.map(([x, y]) => vertex(X(x), Y(y)))));
      dxf.addHatch(
        boundary,
        pattern({ name: hatchFor(t.pattern), scale: hatchScale, angle: t.pattern === "horizontal" ? 315 : t.pattern === "diagonal-inversa" ? 90 : 0 }),
        opts,
      );
      const cx = p.reduce((a, q) => a + q[0], 0) / p.length;
      const cy = p.reduce((a, q) => a + q[1], 0) / p.length;
      labelAt = [X(cx), Y(cy)];
    } else if (t.geometry === "linha" && p.length >= 2) {
      dxf.addLWPolyline(p.map(([x, y]) => ({ point: { x: X(x), y: Y(y) } })), opts);
      labelAt = [X(p[0]![0]), Y(p[0]![1])];
    } else {
      dxf.addCircle(point3d(X(p[0]![0]), Y(p[0]![1]), 0), txt * 0.6, opts);
      labelAt = [X(p[0]![0]) + txt * 0.8, Y(p[0]![1])];
    }
    dxf.setCurrentLayerName("ROTULOS-DANOS");
    dxf.addText(point3d(labelAt[0], labelAt[1], 0), txt * 0.7, `${t.code}-${i + 1}`, { layerName: "ROTULOS-DANOS", trueColor: color });
  });

  // Legenda com quantitativos, à direita da ortofoto.
  dxf.setCurrentLayerName("LEGENDA");
  const lx = Wm + txt * 4;
  let ly = Hm;
  const line = (text: string, h = txt) => {
    dxf.addText(point3d(lx, ly, 0), h, text, { layerName: "LEGENDA" });
    ly -= h * 1.8;
  };
  line("MAPA DE DANOS", txt * 1.4);
  line(site.name, txt * 0.9);
  if (element) line(element.name, txt * 0.9);
  line(ortho.name, txt * 0.9);
  line(ortho.mmPerPixel ? "Unidades: metros" : "SEM ESCALA - unidades em pixels", txt * 0.8);
  ly -= txt;
  for (const { type, count, areaM2, lengthM } of summary) {
    const color = trueColor(type.color);
    const sw = txt * 1.6;
    if (type.geometry === "linha") {
      dxf.addLine(point3d(lx, ly + txt * 0.4, 0), point3d(lx + sw, ly + txt * 0.4, 0), { layerName: "LEGENDA", trueColor: color });
    } else if (type.geometry === "ponto") {
      dxf.addCircle(point3d(lx + sw / 2, ly + txt * 0.4, 0), txt * 0.45, { layerName: "LEGENDA", trueColor: color });
    } else {
      dxf.addLWPolyline(
        [
          { point: { x: lx, y: ly - txt * 0.1 } },
          { point: { x: lx + sw, y: ly - txt * 0.1 } },
          { point: { x: lx + sw, y: ly + txt * 0.9 } },
          { point: { x: lx, y: ly + txt * 0.9 } },
        ],
        { layerName: "LEGENDA", trueColor: color, flags: LWPolylineFlags.Closed },
      );
    }
    const qty =
      type.geometry === "area"
        ? ortho.mmPerPixel ? fmtArea(areaM2) : `${count} un.`
        : type.geometry === "linha"
          ? ortho.mmPerPixel ? fmtLength(lengthM) : `${count} un.`
          : `${count} un.`;
    dxf.addText(point3d(lx + sw + txt, ly, 0), txt * 0.8, `${type.code} - ${type.name} - ${qty}`, { layerName: "LEGENDA" });
    ly -= txt * 1.9;
  }

  return dxf.stringify();
}
