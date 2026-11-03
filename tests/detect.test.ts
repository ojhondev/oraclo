import { describe, expect, it } from "vitest";
import { detectDamages } from "@/lib/detect/detect";
import { centroid, pointInPolygon, type Pt } from "@/lib/geometry";

type RGB = [number, number, number];

/** Parede lisa com ruído leve (textura), em RGBA. */
function wall(w: number, h: number, seed = 1, rgb: RGB = [226, 220, 208]) {
  const px = new Uint8ClampedArray(w * h * 4);
  let s = seed;
  const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < w * h; i++) {
    const n = (rnd() - 0.5) * 8;
    px[i * 4] = rgb[0] + n;
    px[i * 4 + 1] = rgb[1] + n;
    px[i * 4 + 2] = rgb[2] + n;
    px[i * 4 + 3] = 255;
  }
  return { px, rnd };
}

const paint = (px: Uint8ClampedArray, w: number, x: number, y: number, rgb: RGB, a = 1) => {
  const i = (y * w + x) * 4;
  px[i] = px[i]! * (1 - a) + rgb[0] * a;
  px[i + 1] = px[i + 1]! * (1 - a) + rgb[1] * a;
  px[i + 2] = px[i + 2]! * (1 - a) + rgb[2] * a;
};

/** Mancha irregular (contorno ondulado), de borda difusa e mosqueada — como umidade de verdade. */
function blob(px: Uint8ClampedArray, w: number, rnd: () => number, cx: number, cy: number, R: number, rgb: RGB, soft = 14, seed = 1) {
  for (let y = Math.max(0, cy - R * 1.6); y < cy + R * 1.6; y++) {
    for (let x = Math.max(0, cx - R * 1.6); x < cx + R * 1.6; x++) {
      const th = Math.atan2(y - cy, x - cx);
      const r = R * (1 + 0.28 * Math.sin(3 * th + seed) + 0.16 * Math.sin(7 * th + 2 * seed) + 0.08 * Math.sin(13 * th));
      const d = Math.hypot(x - cx, y - cy);
      const a = Math.max(0, Math.min(1, (r - d) / soft)) * (0.75 + 0.25 * rnd());
      if (a > 0) paint(px, w, Math.round(x), Math.round(y), rgb, a);
    }
  }
}

describe("detecção automática de danos (cv-2)", () => {
  it("não sugere nada numa parede limpa com uma janela", () => {
    const w = 600;
    const h = 400;
    const { px } = wall(w, h);
    for (let y = 120; y < 300; y++) for (let x = 250; x < 350; x++) paint(px, w, x, y, [30, 34, 40]);
    expect(detectDamages(px, w, h).detections).toEqual([]);
  });

  it("encontra uma fissura diagonal e sinuosa", () => {
    const w = 600;
    const h = 400;
    const { px } = wall(w, h, 7);
    for (let t = 0; t < 1; t += 0.0015) {
      const x = Math.round(150 + 300 * t + 12 * Math.sin(t * 18));
      const y = Math.round(80 + 240 * t);
      paint(px, w, x, y, [95, 90, 84]);
      paint(px, w, x + 1, y, [120, 115, 108]);
    }
    const found = detectDamages(px, w, h).detections.filter((d) => d.code === "FIS");
    expect(found.length).toBeGreaterThanOrEqual(1);
    expect(found[0]!.kind).toBe("linha");
    expect(found[0]!.confidence).toBeGreaterThan(0.3);
    expect(found[0]!.reason).toMatch(/sinuosa/);
  });

  it("não confunde uma junta ou aresta reta com fissura", () => {
    const w = 600;
    const h = 400;
    const { px } = wall(w, h, 9);
    for (let t = 0; t < 1; t += 0.001) {
      const x = Math.round(100 + 400 * t);
      const y = Math.round(90 + 200 * t);
      paint(px, w, x, y, [95, 90, 84]);
    }
    expect(detectDamages(px, w, h).detections.filter((d) => d.code === "FIS")).toEqual([]);
  });

  it("encontra uma mancha de umidade irregular e de borda difusa", () => {
    const w = 600;
    const h = 400;
    const { px, rnd } = wall(w, h, 3);
    blob(px, w, rnd, 300, 170, 70, [168, 160, 146]);
    const stains = detectDamages(px, w, h).detections.filter((d) => ["UMD", "UMA", "SUJ"].includes(d.code));
    expect(stains.length).toBe(1);
    expect(pointInPolygon([300, 170], stains[0]!.points as Pt[])).toBe(true);
    expect(stains[0]!.reason).toBeTruthy();
  });

  it("aponta perda de pintura numa parede rosa (e não perda de reboco)", () => {
    const w = 800;
    const h = 600;
    const { px, rnd } = wall(w, h, 5, [196, 128, 112]);
    blob(px, w, rnd, 250, 250, 55, [236, 232, 220], 2, 1);
    blob(px, w, rnd, 560, 380, 45, [236, 232, 220], 2, 2);
    const found = detectDamages(px, w, h).detections;
    expect(found.some((d) => d.code === "PRB")).toBe(false);
    const dpt = found.filter((d) => d.code === "DPT");
    expect(dpt.length).toBeGreaterThanOrEqual(1);
    expect(dpt.some((d) => pointInPolygon([250, 250], d.points as Pt[]) || pointInPolygon([560, 380], d.points as Pt[]))).toBe(true);
  });

  it("não aponta a sombra projetada como dano e avisa da sombra dura", () => {
    const w = 900;
    const h = 1200;
    const { px } = wall(w, h, 11, [204, 136, 118]);
    // metade de baixo na sombra (mesmo tom, bem mais escura), divisa inclinada
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (y < 560 + x * 0.15) continue;
        const i = (y * w + x) * 4;
        px[i] = px[i]! * 0.55;
        px[i + 1] = px[i + 1]! * 0.55;
        px[i + 2] = px[i + 2]! * 0.58;
      }
    const { detections, quality } = detectDamages(px, w, h);
    expect(detections).toEqual([]);
    expect(quality.map((q) => q.code)).toContain("sombra");
  });

  it("não aponta moldura de pedra escura (arco) como sujidade", () => {
    const w = 800;
    const h = 600;
    const { px } = wall(w, h, 13);
    const [cx, cy, r0, r1] = [400, 380, 150, 175];
    for (let y = 150; y < 380; y++)
      for (let x = 200; x < 600; x++) {
        const d = Math.hypot(x - cx, y - cy);
        if (d >= r0 && d <= r1) paint(px, w, x, y, [52, 54, 58]);
      }
    expect(detectDamages(px, w, h).detections.filter((d) => ["SUJ", "UMD", "UMA"].includes(d.code))).toEqual([]);
  });

  it("avisa quando a imagem tem pouca resolução", () => {
    const { px } = wall(600, 400);
    expect(detectDamages(px, 600, 400).quality.map((q) => q.code)).toContain("resolucao");
  });

  it("ponto no polígono e centro médio", () => {
    const sq: Pt[] = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];
    expect(pointInPolygon([5, 5], sq)).toBe(true);
    expect(pointInPolygon([15, 5], sq)).toBe(false);
    expect(centroid(sq)).toEqual([5, 5]);
  });
});
