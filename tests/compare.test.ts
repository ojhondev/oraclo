import { describe, expect, it } from "vitest";
import { alignmentRms, compareDamages, fitAlignment, mapPoints, toMatrix3d, type CmpType, type Pair } from "@/lib/compare";
import { apply, type Pt } from "@/lib/rectify";

const types = new Map<string, CmpType>([
  ["fis", { id: "fis", code: "FIS", category: "Fissuração", geometry: "linha" }],
  ["tri", { id: "tri", code: "TRI", category: "Fissuração", geometry: "linha" }],
  ["uma", { id: "uma", code: "UMA", category: "Umidade", geometry: "area" }],
  ["bio", { id: "bio", code: "BIO", category: "Biológico", geometry: "area" }],
]);
const rect = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

describe("alinhamento entre vistas", () => {
  it("recupera uma similaridade com 2 pares", () => {
    // B = A girada 90°, metade da escala, deslocada
    const toB = (p: Pt): Pt => [100 + p[1] * 0.5, 50 - p[0] * 0.5];
    const pairs: Pair[] = [[0, 0], [400, 300]].map((a) => ({ a: a as Pt, b: toB(a as Pt) }));
    const H = fitAlignment(pairs);
    const q = apply(H, toB([250, 120]));
    expect(q[0]).toBeCloseTo(250, 6);
    expect(q[1]).toBeCloseTo(120, 6);
  });

  it("recupera uma afim com 3 pares e uma perspectiva com 4+", () => {
    const Ht = [1.1, 0.05, 30, -0.02, 0.95, 12, 0.0002, -0.0001, 1];
    const pts: Pt[] = [[0, 0], [800, 0], [800, 600], [0, 600], [400, 300]];
    const pairs = pts.map((b) => ({ a: apply(Ht, b), b }));
    const H4 = fitAlignment(pairs);
    expect(alignmentRms(H4, pairs)).toBeLessThan(1e-6);
    const affine = [1.2, 0.1, 5, -0.1, 0.9, 7, 0, 0, 1];
    const pairs3 = pts.slice(0, 3).map((b) => ({ a: apply(affine, b), b }));
    const H3 = fitAlignment(pairs3);
    const q = apply(H3, [123, 456]);
    const t = apply(affine, [123, 456]);
    expect(q[0]).toBeCloseTo(t[0], 6);
    expect(q[1]).toBeCloseTo(t[1], 6);
  });

  it("gera um matrix3d de CSS com a homografia em ordem de colunas", () => {
    expect(toMatrix3d([2, 0, 10, 0, 2, 20, 0, 0, 1])).toBe("matrix3d(2,0,0,0,0,2,0,0,0,0,1,0,10,20,0,1)");
  });
});

describe("diferenças entre vistorias", () => {
  const W = 1000;
  const H = 800;
  const ident = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const footB = mapPoints(ident, rect(0, 0, W, H));

  it("classifica novo, cresceu, estável, diminuiu e sumiu", () => {
    const a = [
      { id: "a-umid", typeId: "uma", points: rect(100, 500, 200, 100) },
      { id: "a-bio", typeId: "bio", points: rect(600, 100, 100, 100) },
      { id: "a-fis", typeId: "fis", points: [[400, 100], [450, 300]] as Pt[] },
      { id: "a-tratado", typeId: "uma", points: rect(800, 600, 80, 80) },
    ];
    const b = [
      { id: "b-umid", typeId: "uma", points: rect(100, 450, 300, 150) }, // cresceu
      { id: "b-bio", typeId: "bio", points: rect(610, 110, 90, 90) }, // estável (81%)
      { id: "b-fis", typeId: "tri", points: [[400, 100], [450, 300]] as Pt[] }, // virou trinca = agravou
      { id: "b-novo", typeId: "bio", points: rect(200, 100, 60, 60) }, // novo
    ];
    const r = compareDamages({ a, b, types, W, H, footB });
    expect(r.b.get("b-umid")!.status).toBe("cresceu");
    expect(r.b.get("b-bio")!.status).toBe("estavel");
    expect(r.b.get("b-fis")!.status).toBe("cresceu");
    expect(r.b.get("b-fis")!.typeChanged).toBe(true);
    expect(r.b.get("b-novo")!.status).toBe("novo");
    expect(r.a.get("a-tratado")!.status).toBe("sumiu");
    expect(r.counts).toEqual({ novo: 1, cresceu: 2, estavel: 1, diminuiu: 0, sumiu: 1 });
  });

  it("ignora o que fica fora da área comum às duas vistas", () => {
    const halfB = rect(0, 0, W / 2, H); // a vista depois só mostra a metade esquerda
    const a = [{ id: "fora", typeId: "uma", points: rect(800, 300, 100, 100) }];
    const r = compareDamages({ a, b: [], types, W, H, footB: halfB });
    expect(r.a.size).toBe(0);
    expect(r.inA.size).toBe(0);
  });
});
