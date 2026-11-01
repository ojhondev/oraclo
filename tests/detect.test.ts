import { describe, expect, it } from "vitest";
import { detectDamages } from "@/lib/detect/detect";
import { centroid, pointInPolygon, type Pt } from "@/lib/geometry";

/** Parede de reboco claro com ruído leve (textura), em RGBA. */
function wall(w: number, h: number, seed = 1) {
  const px = new Uint8ClampedArray(w * h * 4);
  let s = seed;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = 0; i < w * h; i++) {
    const n = (rnd() - 0.5) * 8;
    px[i * 4] = 226 + n;
    px[i * 4 + 1] = 220 + n;
    px[i * 4 + 2] = 208 + n;
    px[i * 4 + 3] = 255;
  }
  return { px, rnd };
}

const paint = (px: Uint8ClampedArray, w: number, x: number, y: number, rgb: [number, number, number]) => {
  const i = (y * w + x) * 4;
  px[i] = rgb[0];
  px[i + 1] = rgb[1];
  px[i + 2] = rgb[2];
};

describe("detecção automática de danos", () => {
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
  });

  it("encontra uma mancha escura e mosqueada sobre o reboco", () => {
    const w = 600;
    const h = 400;
    const { px, rnd } = wall(w, h, 3);
    const [cx, cy, r] = [300, 160, 70];
    for (let y = cy - r; y < cy + r; y++) {
      for (let x = cx - r; x < cx + r; x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue;
        const v = 150 + (rnd() - 0.5) * 50; // mosqueada: textura forte
        paint(px, w, x, y, [v, v - 4, v - 10]);
      }
    }
    const stains = detectDamages(px, w, h).detections.filter((d) => ["UMD", "UMA", "SUJ"].includes(d.code));
    expect(stains.length).toBe(1);
    expect(pointInPolygon([cx, cy], stains[0]!.points as Pt[])).toBe(true);
  });

  it("ponto no polígono e centro médio", () => {
    const sq: Pt[] = [[0, 0], [10, 0], [10, 10], [0, 10]];
    expect(pointInPolygon([5, 5], sq)).toBe(true);
    expect(pointInPolygon([15, 5], sq)).toBe(false);
    expect(centroid(sq)).toEqual([5, 5]);
  });
});
