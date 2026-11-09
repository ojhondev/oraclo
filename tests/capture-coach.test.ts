import { describe, expect, it } from "vitest";
import { coach, lookOf, TARGET_FRAMES } from "@/lib/capture-coach";

const W = 32, H = 24;
const img = (f: (x: number, y: number) => number) => Array.from({ length: W * H }, (_, i) => f(i % W, Math.floor(i / W)));

describe("leitura da imagem", () => {
  it("reconhece escuro, céu e parede lisa", () => {
    expect(lookOf(img(() => 20)).dark).toBe(true);
    expect(lookOf(img((x, y) => (y < 8 ? 235 : 90 + ((x * 37 + y * 11) % 60)))).sky).toBe(true);
    expect(lookOf(img(() => 150)).flat).toBe(true);
  });
  it("fachada com detalhe passa limpa", () => {
    const l = lookOf(img((x, y) => 70 + ((x * 37 + y * 53) % 90)));
    expect(l).toEqual({ dark: false, sky: false, flat: false });
  });
});

describe("treinador", () => {
  const ok = { dark: false, sky: false, flat: false };
  it("segue o roteiro pelas passadas", () => {
    expect(coach({ kept: 2, verdicts: [], look: ok, fast: false }).title).toMatch(/Comece/);
    expect(coach({ kept: 30, verdicts: [], look: ok, fast: false }).title).toMatch(/Passada 1/);
    expect(coach({ kept: 100, verdicts: [], look: ok, fast: false }).title).toMatch(/Passada 2/);
    expect(coach({ kept: 150, verdicts: [], look: ok, fast: false }).title).toMatch(/quinas/);
    expect(coach({ kept: TARGET_FRAMES, verdicts: [], look: ok, fast: false }).tone).toBe("done");
  });
  it("problemas vêm antes do roteiro, do mais grave", () => {
    expect(coach({ kept: 30, verdicts: [], look: { ...ok, dark: true }, fast: true }).title).toBe("Mais devagar");
    expect(coach({ kept: 30, verdicts: ["parado", "parado", "parado"], look: ok, fast: false }).title).toBe("Continue andando");
    expect(coach({ kept: 30, verdicts: [], look: { ...ok, sky: true }, fast: false }).title).toMatch(/céu/);
  });
});
