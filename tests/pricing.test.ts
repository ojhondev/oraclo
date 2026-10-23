import { describe, expect, it } from "vitest";
import { budget, damageCostCents, gut, priceMap, priority, quantity, SUGGESTED_PRICES, unitFor, type Price } from "@/lib/pricing";

const prices: Record<string, Price> = {
  area: { treatment: "reboco", unit: "m2", priceCents: 15_000, suggested: false },
  linha: { treatment: "fissura", unit: "m", priceCents: 4_500, suggested: false },
  ponto: { treatment: "vegetação", unit: "un", priceCents: 18_000, suggested: false },
};

describe("matriz GUT", () => {
  it("multiplica gravidade × urgência × tendência", () => {
    expect(gut({ severity: "baixa", urgency: 1, trend: 1 })).toBe(2);
    expect(gut({ severity: "media", urgency: 3, trend: 3 })).toBe(27);
    expect(gut({ severity: "alta", urgency: 4, trend: 4 })).toBe(64);
    expect(gut({ severity: "critica", urgency: 5, trend: 5 })).toBe(125);
  });

  it("classifica as faixas de prioridade nos limites", () => {
    expect(priority(125).level).toBe(1);
    expect(priority(64).level).toBe(1);
    expect(priority(63).level).toBe(2);
    expect(priority(27).level).toBe(2);
    expect(priority(26).level).toBe(3);
    expect(priority(12).level).toBe(3);
    expect(priority(11).level).toBe(4);
    expect(priority(2).level).toBe(4);
  });
});

describe("orçamento", () => {
  it("escolhe a unidade pela geometria", () => {
    expect(unitFor("area")).toBe("m2");
    expect(unitFor("linha")).toBe("m");
    expect(unitFor("ponto")).toBe("un");
  });

  it("calcula a quantidade na unidade do preço", () => {
    expect(quantity({ typeId: "a", areaM2: 2, lengthM: 9 }, "m2")).toBe(2);
    expect(quantity({ typeId: "a", areaM2: 2, lengthM: 9 }, "m")).toBe(9);
    expect(quantity({ typeId: "a", areaM2: null, lengthM: null }, "un")).toBe(1);
    expect(quantity({ typeId: "a", areaM2: null, lengthM: null }, "m2")).toBeNull();
  });

  it("calcula o custo de um dano em centavos", () => {
    expect(damageCostCents({ typeId: "area", areaM2: 2.5, lengthM: null }, prices)).toBe(37_500);
    expect(damageCostCents({ typeId: "linha", areaM2: null, lengthM: 3 }, prices)).toBe(13_500);
    expect(damageCostCents({ typeId: "ponto", areaM2: null, lengthM: null }, prices)).toBe(18_000);
    expect(damageCostCents({ typeId: "area", areaM2: null, lengthM: null }, prices)).toBeNull();
    expect(damageCostCents({ typeId: "inexistente", areaM2: 1, lengthM: 1 }, prices)).toBeNull();
  });

  it("soma por tipo, ordena por custo e conta danos sem escala fora da soma", () => {
    const b = budget(
      [
        { typeId: "area", areaM2: 1, lengthM: null },
        { typeId: "area", areaM2: 2, lengthM: null },
        { typeId: "area", areaM2: null, lengthM: null },
        { typeId: "linha", areaM2: null, lengthM: 8 },
        { typeId: "ponto", areaM2: null, lengthM: null },
      ],
      prices,
    );
    expect(b.totalCents).toBe(45_000 + 36_000 + 18_000);
    expect(b.missing).toBe(1);
    expect(b.rows.map((r) => r.typeId)).toEqual(["area", "linha", "ponto"]);
    const area = b.rows.find((r) => r.typeId === "area")!;
    expect(area).toMatchObject({ qty: 3, count: 3, cents: 45_000, missing: 1 });
  });
});

describe("tabela de preços", () => {
  const types = [
    { id: "t1", code: "PRB", geometry: "area" as const },
    { id: "t2", code: "FIS", geometry: "linha" as const },
    { id: "t3", code: "ZZZ", geometry: "ponto" as const },
  ];

  it("usa o preço do escritório e, sem ele, o sugerido", () => {
    const m = priceMap(types, [{ typeId: "t1", treatment: "meu reboco", unit: "m2", priceCents: 20_000 }]);
    expect(m.t1).toMatchObject({ priceCents: 20_000, suggested: false, treatment: "meu reboco" });
    expect(m.t2).toMatchObject({ priceCents: SUGGESTED_PRICES.FIS!.reais * 100, suggested: true, unit: "m" });
  });

  it("tipo sem preço sugerido fica a zero, marcado como sugerido", () => {
    expect(priceMap(types, [])["t3"]).toMatchObject({ priceCents: 0, suggested: true, unit: "un" });
  });

  it("todo preço sugerido é positivo", () => {
    for (const [code, p] of Object.entries(SUGGESTED_PRICES)) expect(p.reais, code).toBeGreaterThan(0);
  });
});
