import { describe, expect, it } from "vitest";
import { defaultMethodology, defaultSummary, laudoDefaults, laudoDraftSchema, paragraphs, resolveLaudo, toDraft, campaignKey, type LaudoBase } from "@/lib/laudo-text";

const facts = { damages: 3, vistas: 2, areaM2: 4.5, cracksM: 2, urgent: 1, totalCents: 123_456, missing: 0 };
const base: LaudoBase = { summaryFacts: facts, author: { name: "Ana Silva", professionalId: "CAU A123456-7" } };

describe("texto do laudo", () => {
  it("o padrão vem do diagnóstico e do perfil", () => {
    const d = laudoDefaults(base);
    expect(d.title).toBe("Laudo de estado de conservação");
    expect(d.signerName).toBe("Ana Silva");
    expect(d.signerRegistry).toBe("CAU A123456-7");
    expect(d.summary).toContain("3 danos em 2 vistas");
    expect(d.summary).toContain("4,50 m²");
    expect(d.summary).toContain("1 dano exige ação imediata");
    expect(d.scope).toBe("");
    expect(d.conclusion).toBe("");
    expect(d.methodology).toBe(defaultMethodology());
  });

  it("concorda singular e plural e avisa de danos sem escala", () => {
    expect(defaultSummary({ ...facts, damages: 1, vistas: 1, urgent: 0 })).toContain("1 dano em 1 vista");
    expect(defaultSummary({ ...facts, urgent: 0 })).toContain("Nenhum dano exige ação imediata");
    expect(defaultSummary({ ...facts, missing: 2 })).toContain("sem contar 2 dano(s)");
  });

  it("sem orçamento, o resumo padrão não fala de custo", () => {
    expect(defaultSummary(facts, true)).toContain("R$");
    expect(defaultSummary(facts, false)).not.toContain("R$");
    expect(defaultSummary(facts, false)).not.toContain("estimado");
  });

  it("o rascunho vale mais que o padrão, campo a campo", () => {
    const t = resolveLaudo({ title: "Parecer técnico", conclusion: "Intervir já.", artRrt: "RRT 123" }, base);
    expect(t.title).toBe("Parecer técnico");
    expect(t.conclusion).toBe("Intervir já.");
    expect(t.artRrt).toBe("RRT 123");
    expect(t.signerName).toBe("Ana Silva"); // não editado
    expect(t.methodology).toBe(defaultMethodology());
    expect(t.includeBudget).toBe(true);
  });

  it("campo em branco no rascunho volta ao padrão", () => {
    expect(resolveLaudo({ title: "   " }, base).title).toBe("Laudo de estado de conservação");
    expect(resolveLaudo(null, base).title).toBe("Laudo de estado de conservação");
  });

  it("guarda só o que difere do padrão", () => {
    const defaults = laudoDefaults(base);
    const values = { ...defaults, includeBudget: true, summary: "Meu resumo.", conclusion: "Conclusão." };
    expect(toDraft(values, defaults)).toEqual({ summary: "Meu resumo.", conclusion: "Conclusão." });
    expect(toDraft({ ...defaults, includeBudget: true }, defaults)).toEqual({});
    expect(toDraft({ ...defaults, includeBudget: false }, defaults)).toEqual({ includeBudget: false });
  });

  it("ida e volta: o que se salva é o que se lê", () => {
    const defaults = laudoDefaults(base);
    const draft = toDraft({ ...defaults, includeBudget: false, scope: "Objeto do laudo." }, defaults);
    const t = resolveLaudo(draft, base);
    expect(t.scope).toBe("Objeto do laudo.");
    expect(t.includeBudget).toBe(false);
    expect(t.summary).not.toContain("R$");
  });

  it("separa parágrafos por linha em branco e junta quebras simples", () => {
    expect(paragraphs("Um\ndois\n\nTrês\r\n\r\n\r\nQuatro")).toEqual(["Um dois", "Três", "Quatro"]);
    expect(paragraphs("  \n\n ")).toEqual([]);
  });

  it("valida o tamanho dos campos", () => {
    expect(laudoDraftSchema.safeParse({ title: "x".repeat(141) }).success).toBe(false);
    expect(laudoDraftSchema.safeParse({ title: "ok", includeBudget: false }).success).toBe(true);
    expect(laudoDraftSchema.safeParse({ includeBudget: "sim" }).success).toBe(false);
  });

  it("a chave do rascunho é a vistoria ou 'all'", () => {
    expect(campaignKey(null)).toBe("all");
    expect(campaignKey(undefined)).toBe("all");
    expect(campaignKey("abc")).toBe("abc");
  });
});
