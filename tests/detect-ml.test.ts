import { describe, expect, it } from "vitest";
import { coveredCodes, probsToDetections, tileStarts, tileTensor, type ModelCard } from "@/lib/detect/ml";

const card = (enabled: Record<string, boolean>): ModelCard => ({
  version: "ml-1",
  file: "ml-1-int8.onnx",
  input: { name: "imagem", size: 512, mean: [0.485, 0.456, 0.406], std: [0.229, 0.224, 0.225], maxSide: 2200, overlap: 64 },
  output: "probs",
  classes: [
    { id: 0, name: "fundo", codes: [] },
    { id: 1, name: "fissura", codes: ["FIS", "TRI", "RAC"] },
    { id: 2, name: "perda_pintura", codes: ["DPT"] },
    { id: 3, name: "mancha", codes: ["UMA", "UMD", "SUJ", "PAS"] },
  ],
  thresholds: { fissura: 0.5, perda_pintura: 0.5, mancha: 0.5 },
  enabled: { fissura: false, perda_pintura: false, mancha: false, ...enabled },
  metrics: { views: 12, model: { perda_pintura: { precision: 0.81, recall: 0.6, iou: 0.52, pixels: 90000 } } },
  training: { date: "2026-11-03", sources: [] },
});

/** Probabilidades sintéticas: fundo em tudo, com uma região de `cls` (prob. 0,9). */
function probs(w: number, h: number, C: number, cls: number, region: (x: number, y: number) => boolean) {
  const p = Array.from({ length: C }, () => new Float32Array(w * h));
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (region(x, y)) {
        p[cls]![i] = 0.9;
        p[0]![i] = 0.1;
      } else p[0]![i] = 1;
    }
  return p;
}

describe("motor treinado (ml-1)", () => {
  it("recortes cobrem a imagem inteira, com sobreposição", () => {
    expect(tileStarts(400, 512, 64)).toEqual([0]);
    const s = tileStarts(1300, 512, 64);
    expect(s[0]).toBe(0);
    expect(s.at(-1)).toBe(1300 - 512);
    for (let i = 1; i < s.length; i++) expect(s[i]! - s[i - 1]!).toBeLessThanOrEqual(448);
  });

  it("normaliza o recorte em CHW e preenche além da borda", () => {
    const px = new Uint8ClampedArray([255, 0, 0, 255]);
    const t = tileTensor(px, 1, 1, 0, 0, 2, [0.5, 0.5, 0.5], [0.5, 0.5, 0.5]);
    expect(t.length).toBe(12);
    expect(t[0]).toBeCloseTo(1); // R do pixel real
    expect(t[4]).toBeCloseTo(-1); // G
    expect(t[1]).toBeCloseTo(-1); // fora da imagem
  });

  it("só sugere as classes ligadas na ficha do modelo", () => {
    const w = 400;
    const h = 300;
    const p = probs(w, h, 4, 2, (x, y) => (x - 200) ** 2 + (y - 150) ** 2 < 60 ** 2);
    expect(probsToDetections(p, w, h, card({}))).toEqual([]);
    const found = probsToDetections(p, w, h, card({ perda_pintura: true }));
    expect(found).toHaveLength(1);
    expect(found[0]!.code).toBe("DPT");
    expect(found[0]!.detector).toBe("ml-1:perda_pintura");
    expect(found[0]!.confidence).toBeCloseTo(0.9, 1);
    expect(found[0]!.reason).toMatch(/81%/);
  });

  it("transforma a classe fissura em linha", () => {
    const w = 400;
    const h = 300;
    const p = probs(w, h, 4, 1, (x, y) => Math.abs(y - (60 + x * 0.4 + 6 * Math.sin(x / 20))) < 2 && x > 50 && x < 350);
    const found = probsToDetections(p, w, h, card({ fissura: true }));
    expect(found).toHaveLength(1);
    expect(found[0]!.kind).toBe("linha");
  });

  it("os códigos cobertos pelo modelo saem do cv-2", () => {
    expect([...coveredCodes(card({ mancha: true }))].sort()).toEqual(["PAS", "SUJ", "UMA", "UMD"]);
  });
});
