import { describe, expect, it } from "vitest";
import { fmtArea, fmtLength, fmtMmPerPixel, measure, minPoints, polygonAreaPx, polylineLengthPx, scaleFromCalibration, type Pt } from "@/lib/geometry";

const square: Pt[] = [[0, 0], [100, 0], [100, 100], [0, 100]];

describe("geometria 2D", () => {
  it("calcula a área de um polígono em pixels, qualquer sentido", () => {
    expect(polygonAreaPx(square)).toBe(10_000);
    expect(polygonAreaPx([...square].reverse())).toBe(10_000);
    expect(polygonAreaPx([[0, 0], [30, 0], [0, 40]])).toBe(600);
  });

  it("calcula o comprimento de uma polilinha aberta e fechada", () => {
    expect(polylineLengthPx(square)).toBe(300);
    expect(polylineLengthPx(square, true)).toBe(400);
    expect(polylineLengthPx([[0, 0], [3, 4]])).toBe(5);
  });

  it("converte pixels em metros pela escala (mm por pixel)", () => {
    // 100 px × 10 mm/px = 1 m de lado → 1 m² e 4 m de perímetro
    const m = measure("area", square, 10);
    expect(m.areaM2).toBeCloseTo(1, 10);
    expect(m.lengthM).toBeCloseTo(4, 10);
    expect(measure("linha", [[0, 0], [300, 400]], 2).lengthM).toBeCloseTo(1, 10);
    expect(measure("linha", [[0, 0], [300, 400]], 2).areaM2).toBeNull();
  });

  it("não mede sem escala nem mede pontos", () => {
    expect(measure("area", square, null)).toEqual({ areaM2: null, lengthM: null });
    expect(measure("ponto", [[5, 5]], 10)).toEqual({ areaM2: null, lengthM: null });
  });

  it("deriva a escala de uma linha de calibração", () => {
    expect(scaleFromCalibration([0, 0], [1000, 0], 2)).toBe(2);
    expect(scaleFromCalibration([0, 0], [300, 400], 1)).toBe(2);
  });

  it("rejeita calibração inválida", () => {
    expect(scaleFromCalibration([5, 5], [5, 5], 2)).toBeNull();
    expect(scaleFromCalibration([0, 0], [10, 0], 0)).toBeNull();
    expect(scaleFromCalibration([0, 0], [10, 0], -1)).toBeNull();
  });

  it("exige o mínimo de pontos de cada geometria", () => {
    expect(minPoints("area")).toBe(3);
    expect(minPoints("linha")).toBe(2);
    expect(minPoints("ponto")).toBe(1);
  });

  it("formata quantidades em pt-BR", () => {
    expect(fmtArea(null)).toBe("—");
    expect(fmtLength(undefined)).toBe("—");
    expect(fmtArea(1.5)).toBe("1,50 m²");
    expect(fmtLength(12.345)).toBe("12,35 m");
    expect(fmtMmPerPixel(null)).toBe("sem escala");
    expect(fmtMmPerPixel(2)).toBe("2,00 mm/pixel");
  });
});
