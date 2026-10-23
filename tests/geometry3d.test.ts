import { describe, expect, it } from "vitest";
import { distance3, measure3, polygonArea3, polylineLength3, scaleFromCalibration3D, type P3 } from "@/lib/geometry3d";

const rect: P3[] = [[0, 0, 0], [2, 0, 0], [2, 3, 0], [0, 3, 0]];

describe("geometria 3D", () => {
  it("mede distâncias entre pontos", () => {
    expect(distance3([0, 0, 0], [1, 2, 2])).toBe(3);
  });

  it("calcula a área de polígonos planos em qualquer orientação", () => {
    expect(polygonArea3(rect)).toBeCloseTo(6, 10);
    // o mesmo retângulo 2 × 3 inclinado no espaço
    const a = 0.7;
    const tilted: P3[] = [[0, 0, 0], [2, 0, 0], [2, 3 * Math.cos(a), 3 * Math.sin(a)], [0, 3 * Math.cos(a), 3 * Math.sin(a)]];
    expect(polygonArea3(tilted)).toBeCloseTo(6, 10);
    expect(polygonArea3([[0, 0, 0], [3, 0, 0], [0, 4, 0]])).toBeCloseTo(6, 10);
  });

  it("calcula o comprimento de uma polilinha aberta e fechada", () => {
    expect(polylineLength3(rect)).toBeCloseTo(7, 10);
    expect(polylineLength3(rect, true)).toBeCloseTo(10, 10);
  });

  it("calibra a escala: modelo em centímetros vira fator 0,01", () => {
    const f = scaleFromCalibration3D([0, 0, 0], [210, 0, 0], 2.1)!;
    expect(f).toBeCloseTo(0.01, 12);
    const big = rect.map((p) => [p[0] * 100, p[1] * 100, p[2] * 100] as P3);
    expect(measure3("area", big, f).areaM2).toBeCloseTo(6, 8);
    expect(measure3("area", big, f).lengthM).toBeCloseTo(10, 8);
    expect(measure3("linha", big, f).lengthM).toBeCloseTo(7, 8);
  });

  it("rejeita calibração inválida e não mede sem escala", () => {
    expect(scaleFromCalibration3D([1, 1, 1], [1, 1, 1], 2)).toBeNull();
    expect(scaleFromCalibration3D([0, 0, 0], [1, 0, 0], 0)).toBeNull();
    expect(measure3("area", rect, null)).toEqual({ areaM2: null, lengthM: null });
    expect(measure3("ponto", [[0, 0, 0]], 1)).toEqual({ areaM2: null, lengthM: null });
  });
});
