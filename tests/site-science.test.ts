import { describe, expect, it } from "vitest";
import { SCIENCE } from "@/lib/site/science";
import { SITE } from "@/lib/site/site-copy";

// O site vende o serviço: método interno (bibliotecas, algoritmos) não aparece no conteúdo público.
const SEGREDOS = /opendronemap|slimsam|hessian|felzenszwalb|\bDLT\b|webgpu|matrix3d|web worker|douglas|homograph|homografia/i;

describe("conteúdo técnico do site", () => {
  for (const lang of ["pt", "en"] as const) {
    it(`${lang}: Nossa Tecnologia não expõe método interno`, () => {
      const texto = JSON.stringify({ tech: SITE[lang].tech, sci: SCIENCE[lang] });
      expect(texto).not.toMatch(SEGREDOS);
    });

    it(`${lang}: tabelas de comparação completas`, () => {
      const s = SCIENCE[lang];
      for (const row of s.transform.rows) expect(row).toHaveLength(3);
      for (const row of s.diff.rows) expect(row).toHaveLength(4);
    });
  }
});
