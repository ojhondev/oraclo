import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { BAR, bearing, detectMarkers, markerSvg, MARKER, project, rodrigues, scaleFromDetections, triangulate } from "../scripts/escala.mjs";

const W = 1600, H = 1200;
const cam = { projection_type: "brown", focal_x: 0.85, focal_y: 0.85, c_x: 0.002, c_y: -0.003, k1: -0.08, k2: 0.02, k3: 0, p1: 0.0005, p2: -0.0003 };

/** Câmera olhando para a origem a partir de `pos` (mundo → câmera, como no OpenSfM). */
function shotAt(pos: number[]) {
  const f = pos.map((v) => -v);
  const n = Math.hypot(...f);
  const z = f.map((v) => v / n);
  const up = [0, 0, 1];
  let x = [z[1]! * up[2]! - z[2]! * up[1]!, z[2]! * up[0]! - z[0]! * up[2]!, z[0]! * up[1]! - z[1]! * up[0]!];
  const xn = Math.hypot(...x);
  x = x.map((v) => v / xn);
  const y = [z[1]! * x[2]! - z[2]! * x[1]!, z[2]! * x[0]! - z[0]! * x[2]!, z[0]! * x[1]! - z[1]! * x[0]!];
  // R tem as linhas x, -y... usamos y para baixo na imagem
  const R = [...x, ...y, ...z];
  // rotação → vetor de Rodrigues
  const tr = R[0]! + R[4]! + R[8]!;
  const th = Math.acos(Math.min(1, Math.max(-1, (tr - 1) / 2)));
  const k = th / (2 * Math.sin(th) || 1);
  const rotation = [(R[7]! - R[5]!) * k, (R[2]! - R[6]!) * k, (R[3]! - R[1]!) * k];
  const Rr = rodrigues(rotation);
  const translation = [0, 1, 2].map((i) => -(Rr[i * 3]! * pos[0]! + Rr[i * 3 + 1]! * pos[1]! + Rr[i * 3 + 2]! * pos[2]!));
  return { camera: "c", rotation, translation };
}

describe("triangulação", () => {
  it("reencontra um ponto visto por duas câmeras com distorção", () => {
    const X = [0.3, -0.2, 0.5];
    const shots = [shotAt([4, -1, 1]), shotAt([3, 2.5, 1.5]), shotAt([-1, 4, 0.8])];
    const views = shots.map((s) => {
      const [u, v] = project(cam, s, X, W, H);
      return { shot: s, ray: bearing(cam, u!, v!, W, H) };
    });
    const p = triangulate(views)!;
    p.forEach((v, i) => expect(v).toBeCloseTo(X[i]!, 6));
  });
});

describe("escala pelo marcador", () => {
  it("acha o fator real a partir de um modelo em escala arbitrária, com ruído de detecção", () => {
    const u = 0.37; // o modelo saiu com 1 unidade = 1/0,37 m
    const s = MARKER.side * u, g = MARKER.gap * u;
    // folha em pé no plano x=0: marcador A em cima, B embaixo
    const square = (cz: number) => [[0, -s / 2, cz + s / 2], [0, s / 2, cz + s / 2], [0, s / 2, cz - s / 2], [0, -s / 2, cz - s / 2]];
    const A = square(g / 2), B = square(-g / 2);
    let seed = 7;
    const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 0.8; // ±0,4 px
    const shots: Record<string, ReturnType<typeof shotAt>> = {};
    const detections = [];
    for (let i = 0; i < 12; i++) {
      const ang = -0.7 + (i / 11) * 1.4;
      const name = `${String(i + 1).padStart(5, "0")}.jpg`;
      shots[name] = shotAt([Math.cos(ang) * 1.2, Math.sin(ang) * 1.2, 0.15 + 0.05 * (i % 3)]);
      const markers = [
        { id: MARKER.ids[0]!, corners: A.map((p) => project(cam, shots[name]!, p, W, H).map((v) => v + noise())) },
        { id: MARKER.ids[1]!, corners: B.map((p) => project(cam, shots[name]!, p, W, H).map((v) => v + noise())) },
      ];
      detections.push({ image: name, width: W, height: H, markers });
    }
    const r = scaleFromDetections(detections, { shots, cameras: { c: cam } })!;
    expect(r).not.toBeNull();
    expect(r.factor * u).toBeCloseTo(1, 2);
    expect(r.markers).toBe(2);
    expect(r.doubtful).toBe(false);
  });

  it("sem marcador visto em câmeras suficientes não inventa escala", () => {
    expect(scaleFromDetections([{ image: "x.jpg", width: W, height: H, markers: [] }], { shots: {}, cameras: {} })).toBeNull();
  });
});

describe("detecção na imagem", () => {
  it("acha os dois marcadores impressos numa foto", async () => {
    const svg = (id: number) => Buffer.from(markerSvg(id).replace("<svg ", '<svg width="300" height="300" '));
    const [a, b] = await Promise.all([sharp(svg(MARKER.ids[0]!)).png().toBuffer(), sharp(svg(MARKER.ids[1]!)).png().toBuffer()]);
    const { data, info } = await sharp({ create: { width: 900, height: 800, channels: 4, background: { r: 170, g: 160, b: 150, alpha: 1 } } })
      .composite([{ input: a, left: 300, top: 40 }, { input: b, left: 300, top: 440 }])
      .rotate(12, { background: { r: 170, g: 160, b: 150, alpha: 1 } })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const found = detectMarkers(info.width, info.height, new Uint8ClampedArray(data.buffer, data.byteOffset, data.length));
    expect(found.map((m: { id: number }) => m.id).sort((x: number, y: number) => x - y)).toEqual([...MARKER.ids].sort((x, y) => x - y));
    // o quadrado preto ocupa 8 de 10 módulos do SVG de 300 px → lado ≈ 240 px
    const [p0, p1] = found[0]!.corners;
    expect(Math.hypot(p1![0]! - p0![0]!, p1![1]! - p0![1]!)).toBeGreaterThan(220);
    expect(Math.hypot(p1![0]! - p0![0]!, p1![1]! - p0![1]!)).toBeLessThan(260);
  });
});

describe("marcador impresso", () => {
  it("a página de impressão usa os mesmos ids e medidas que o motor procura", async () => {
    const { SCALE_MARKER, SCALE_BAR, MARKER_SVG } = await import("@/lib/scale-marker");
    expect([...SCALE_BAR.ids]).toEqual(BAR.ids);
    expect(SCALE_BAR.sideMm).toBeCloseTo(BAR.side * 1000, 6);
    expect(SCALE_BAR.gapMm).toBeCloseTo(BAR.gap * 1000, 6);
    for (const id of BAR.ids) expect(MARKER_SVG[id]).toBe(markerSvg(id));
    expect([...SCALE_MARKER.ids]).toEqual(MARKER.ids);
    expect(SCALE_MARKER.sideMm).toBeCloseTo(MARKER.side * 1000, 6);
    expect(SCALE_MARKER.gapMm).toBeCloseTo(MARKER.gap * 1000, 6);
    for (const id of MARKER.ids) expect(MARKER_SVG[id]).toBe(markerSvg(id));
  });
});

describe("barra de escala de 1 m", () => {
  const u = 2.6; // modelo com escala arbitrária
  const square = (cy: number, side: number) => [[0, cy - side / 2, side / 2], [0, cy + side / 2, side / 2], [0, cy + side / 2, -side / 2], [0, cy - side / 2, -side / 2]];
  function scene(ids: number[], dist: number) {
    const s = BAR.side * u, g = BAR.gap * u;
    const A = square(-g / 2, s), B = square(g / 2, s);
    let seed = 11;
    const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 1.2; // ±0,6 px
    const shots: Record<string, ReturnType<typeof shotAt>> = {};
    const detections = [];
    for (let i = 0; i < 10; i++) {
      const ang = -0.5 + (i / 9) * 1.0;
      const name = `b${i}.jpg`;
      shots[name] = shotAt([Math.cos(ang) * dist * u, Math.sin(ang) * dist * u, 0.3 * u]);
      const markers = [
        { id: BAR.ids[0]!, corners: A.map((p) => project(cam, shots[name]!, p, W, H).map((v) => v + noise())) },
        { id: BAR.ids[1]!, corners: B.map((p) => project(cam, shots[name]!, p, W, H).map((v) => v + noise())) },
      ].filter((m) => ids.includes(m.id));
      detections.push({ image: name, width: W, height: H, markers });
    }
    return scaleFromDetections(detections, { shots, cameras: { c: cam } });
  }
  it("lida de 5 m acerta a escala com folga", () => {
    const r = scene([...BAR.ids], 5)!;
    expect(r.kind).toBe("barra");
    expect(Math.abs(r.factor * u - 1)).toBeLessThan(0.005);
    expect(r.doubtful).toBe(false);
  });
  it("com só uma das folhas vista, a escala fica marcada como duvidosa", () => {
    const r = scene([BAR.ids[0]!], 4)!;
    expect(r.doubtful).toBe(true);
  });
});
