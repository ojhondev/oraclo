import katex from "katex";
import { describe, expect, it } from "vitest";
import { SCIENCE } from "@/lib/site/science";
import { SITE } from "@/lib/site/site-copy";

// Uma fórmula inválida derruba a página no servidor: todas precisam compilar, nos dois idiomas.
describe("conteúdo técnico do site", () => {
  for (const lang of ["pt", "en"] as const) {
    const s = SCIENCE[lang];

    it(`${lang}: todas as fórmulas compilam`, () => {
      const all = Object.values(s.math).flat().map((e) => e.tex);
      expect(all.length).toBeGreaterThan(10);
      for (const tex of all) expect(() => katex.renderToString(tex, { displayMode: true, throwOnError: true, strict: "ignore" })).not.toThrow();
    });

    it(`${lang}: cada frente da tecnologia tem equações`, () => {
      for (const item of SITE[lang].tech.items) expect(s.math[item.id]?.length, item.id).toBeGreaterThan(0);
    });
  }

  it("a versão em inglês não mantém termos ou decimais em português", () => {
    const tex = Object.values(SCIENCE.en.math).flat().map((e) => e.tex).join(" ");
    expect(tex).not.toMatch(/\{,\}|\{se\}|similaridade|afim|homografia/);
  });
});
