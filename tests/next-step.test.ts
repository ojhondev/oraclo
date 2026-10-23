import { describe, expect, it } from "vitest";
import { nextStep } from "@/lib/next-step";

describe("próximo passo do projeto", () => {
  const base = { elements: 0, campaigns: 0, vistas: 0, damages: 0 };

  it("segue a ordem áreas → vistoria → vista → danos → laudo", () => {
    expect(nextStep(base).id).toBe("areas");
    expect(nextStep({ ...base, elements: 2 }).id).toBe("vistoria");
    expect(nextStep({ ...base, elements: 2, campaigns: 1 }).id).toBe("vista");
    expect(nextStep({ ...base, elements: 2, campaigns: 1, vistas: 1 }).id).toBe("danos");
    expect(nextStep({ elements: 2, campaigns: 1, vistas: 1, damages: 5 }).id).toBe("laudo");
  });

  it("informa o progresso", () => {
    expect(nextStep(base)).toMatchObject({ done: 0, total: 5 });
    expect(nextStep({ elements: 2, campaigns: 1, vistas: 1, damages: 5 })).toMatchObject({ done: 4, total: 5 });
  });

  it("o primeiro requisito que falta decide, mesmo com os seguintes presentes", () => {
    expect(nextStep({ elements: 0, campaigns: 3, vistas: 4, damages: 9 }).id).toBe("areas");
  });
});
