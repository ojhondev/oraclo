import { describe, expect, it } from "vitest";
import { fmtArea, fmtLength, fmtMmPerPixel, fmtPlusMinus, measure, measureUncertainty, minPoints, polygonAreaPx, polylineLengthPx, scaleFromCalibration, segmentsCross, selfIntersects, type Pt } from "@/lib/geometry";

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

describe("contorno que se cruza", () => {
  it("reconhece o cruzamento próprio de dois segmentos", () => {
    expect(segmentsCross([0, 0], [10, 10], [0, 10], [10, 0])).toBe(true);
    expect(segmentsCross([0, 0], [10, 0], [0, 5], [10, 5])).toBe(false); // paralelos
    expect(segmentsCross([0, 0], [5, 5], [5, 5], [10, 0])).toBe(false); // só tocam na ponta
    expect(segmentsCross([0, 0], [4, 4], [6, 6], [10, 10])).toBe(false); // colineares separados
  });

  it("polígono simples não se cruza, em qualquer sentido", () => {
    expect(selfIntersects(square)).toBe(false);
    expect(selfIntersects([...square].reverse())).toBe(false);
    expect(selfIntersects([[0, 0], [10, 0], [10, 10], [5, 3], [0, 10]])).toBe(false); // côncavo
    expect(selfIntersects([[0, 0], [10, 0], [5, 8]])).toBe(false); // triângulo
  });

  it("detecta o laço (gravata-borboleta) e outros cruzamentos", () => {
    expect(selfIntersects([[0, 0], [10, 10], [10, 0], [0, 10]])).toBe(true);
    expect(selfIntersects([[0, 0], [10, 0], [0, 10], [10, 10], [5, -5]])).toBe(true);
  });
});

describe("margem de erro das medidas", () => {
  // 100 px × 10 mm/px = quadrado de 1 m de lado; posição com precisão de 20 mm
  const sq: Pt[] = [[0, 0], [100, 0], [100, 100], [0, 100]];

  it("linha reta: erro nos dois extremos, p·√2", () => {
    const u = measureUncertainty("linha", [[0, 0], [300, 400]], 2, 10);
    expect(u.lengthM).toBeCloseTo(0.01 * Math.SQRT2, 10);
    expect(u.areaM2).toBeNull();
  });

  it("área de um quadrado de lado s: σ = p·s·√2", () => {
    const u = measureUncertainty("area", sq, 10, 20);
    expect(u.areaM2).toBeCloseTo(0.02 * 1 * Math.SQRT2, 10);
    expect(u.lengthM).toBeGreaterThan(0);
  });

  it("cresce com a imprecisão e com o tamanho do dano", () => {
    const a = measureUncertainty("area", sq, 10, 10).areaM2!;
    const b = measureUncertainty("area", sq, 10, 40).areaM2!;
    expect(b).toBeCloseTo(a * 4, 10);
    const big = sq.map(([x, y]) => [x * 3, y * 3] as Pt);
    expect(measureUncertainty("area", big, 10, 10).areaM2!).toBeCloseTo(a * 3, 10);
  });

  it("concorda com uma simulação de Monte Carlo (mesma ordem de grandeza)", () => {
    // ruído gaussiano independente de σ = p/1,96 em cada vértice; compara o desvio da área com σ_área/1,96
    let seed = 12345;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
    const gauss = () => Math.sqrt(-2 * Math.log(rnd() || 1e-12)) * Math.cos(2 * Math.PI * rnd());
    const mm = 10, precisionMm = 20;
    const sigmaPx = precisionMm / 1.96 / mm;
    const area0 = polygonAreaPx(sq) * (mm / 1000) ** 2;
    const N = 4000;
    let acc = 0;
    for (let i = 0; i < N; i++) {
      const noisy = sq.map(([x, y]) => [x + gauss() * sigmaPx, y + gauss() * sigmaPx] as Pt);
      acc += (polygonAreaPx(noisy) * (mm / 1000) ** 2 - area0) ** 2;
    }
    const sim = Math.sqrt(acc / N) * 1.96;
    const formula = measureUncertainty("area", sq, 10, precisionMm).areaM2!;
    expect(formula / sim).toBeGreaterThan(0.9);
    expect(formula / sim).toBeLessThan(1.1);
  });

  it("sem escala, sem precisão ou em pontos, não há margem", () => {
    expect(measureUncertainty("area", sq, null, 20)).toEqual({ areaM2: null, lengthM: null });
    expect(measureUncertainty("area", sq, 10, null)).toEqual({ areaM2: null, lengthM: null });
    expect(measureUncertainty("area", sq, 10, undefined)).toEqual({ areaM2: null, lengthM: null });
    expect(measureUncertainty("ponto", [[1, 1]], 10, 20)).toEqual({ areaM2: null, lengthM: null });
  });

  it("formata a margem em pt-BR", () => {
    expect(fmtPlusMinus(0.1234, "m²")).toBe("± 0,12 m²");
    expect(fmtPlusMinus(null, "m")).toBeNull();
  });
});
