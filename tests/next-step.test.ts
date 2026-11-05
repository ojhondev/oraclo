import { describe, expect, it } from "vitest";
import { nextStep } from "@/lib/next-step";

const base = { captures: 0, models: 0, vistas: 0, damages: 0 };

describe("nextStep", () => {
  it("segue a ordem natural do trabalho", () => {
    expect(nextStep(base).id).toBe("capturar");
    expect(nextStep({ ...base, captures: 1 }).id).toBe("vista");
    expect(nextStep({ ...base, captures: 1, vistas: 1 }).id).toBe("danos");
    expect(nextStep({ captures: 1, models: 1, vistas: 1, damages: 5 }).id).toBe("laudo");
  });

  it("orienta a usar o modelo quando ele já existe", () => {
    expect(nextStep({ ...base, captures: 1, models: 1 }).title).toBe("Gere a imagem da fachada");
  });

  it("não exige captura de quem já tem uma imagem pronta", () => {
    expect(nextStep({ ...base, vistas: 2 }).id).toBe("danos");
  });

  it("conta o progresso em quatro passos", () => {
    expect(nextStep(base)).toMatchObject({ done: 0, total: 4 });
    expect(nextStep({ captures: 1, models: 0, vistas: 1, damages: 5 })).toMatchObject({ done: 3, total: 4 });
  });
});
