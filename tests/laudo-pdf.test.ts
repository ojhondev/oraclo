import { describe, expect, it, vi } from "vitest";

// o gerador de PDF importa módulos que abrem o banco; aqui só interessa o desenho do PDF
vi.mock("@/lib/db", () => ({ db: {}, schema: {} }));
vi.mock("@/lib/auth", () => ({ getUser: async () => null }));
vi.mock("@/lib/orthophotos", () => ({}));

import { PDFDocument } from "pdf-lib";
import { buildLaudo, type LaudoInput } from "@/lib/exports/laudo";
import { resolveLaudo, type LaudoDraft } from "@/lib/laudo-text";
import type { Diagnosis } from "@/lib/diagnosis";

const type = { id: "t1", code: "PRB", name: "Perda de reboco", color: "#c0392b", geometry: "area", category: "revestimento", pattern: "solido", orgId: null, description: null, sortOrder: 0 };
const price = { treatment: "Recomposição de reboco com argamassa de cal", unit: "m2", priceCents: 15_000, suggested: false };
const damage = {
  id: "d1", siteId: "s1", orthophotoId: "v1", elementId: null, typeId: "t1", type,
  geometry: { points: [[10, 10], [50, 10], [50, 40]] }, severity: "alta", urgency: 4, trend: 3,
  areaM2: 2, lengthM: null, cause: "Umidade ascendente", recommendation: "Refazer o reboco", notes: null, createdBy: null, createdAt: new Date(),
  vistaName: "Fachada principal", elementName: null, costCents: 30_000, gut: 48, priority: { level: 2, label: "Prioridade 2 — curto prazo" },
};
const dx = {
  types: [type], prices: { t1: price }, campaigns: [], campaign: null,
  vistas: [{ id: "v1", name: "Fachada principal", kind: "fachada", elementName: "Fachada", mmPerPixel: 2, damageCount: 1, costCents: 30_000, widthPx: 100, heightPx: 80, contentType: "image/jpeg", rectification: null }],
  damages: [damage],
  kpis: { damages: 1, areaM2: 2, cracksM: 0, totalCents: 30_000, missing: 0, urgent: 0 },
  byType: [{ typeId: "t1", type, price, qty: 2, count: 1, cents: 30_000, missing: 0 }],
  bySeverity: [], byPriority: [1, 2, 3, 4].map((level) => ({ level, count: level === 2 ? 1 : 0, cents: level === 2 ? 30_000 : 0 })),
  byElement: [], priorities: [damage],
} as unknown as Diagnosis;
const site = { id: "s1", orgId: "o1", name: "Casa Modelo", kind: "residencial", address: "Rua A, 10", city: "Horta", state: "AZ", protection: "nenhuma", protectionBody: null, processNumber: null, period: "1900", description: null, lat: null, lng: null, isDemo: false, createdAt: new Date(), updatedAt: new Date() } as LaudoInput["site"];
const author = { name: "Ana Silva", professionalId: "CAU A123456-7" };
const base = { author, summaryFacts: { ...dx.kpis, vistas: 1 } };

async function laudo(draft: LaudoDraft | null) {
  const bytes = await buildLaudo({ site, dx, author, orgName: "Estúdio Teste", images: new Map(), text: resolveLaudo(draft, base) });
  const doc = await PDFDocument.load(bytes);
  return { bytes, doc, raw: Buffer.from(bytes).toString("latin1") };
}

describe("PDF do laudo", () => {
  it("gera um PDF válido com o texto padrão", async () => {
    const { bytes, doc } = await laudo(null);
    expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe("%PDF-");
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(4); // capa, texto, 1 vista, danos e orçamento
    expect(doc.getTitle()).toBe("Laudo de estado de conservação — Casa Modelo");
    expect(doc.getAuthor()).toBe("Ana Silva");
  });

  it("usa o título e o responsável do rascunho", async () => {
    const { doc } = await laudo({ title: "Parecer técnico de vistoria", signerName: "Bruno Costa" });
    expect(doc.getTitle()).toBe("Parecer técnico de vistoria — Casa Modelo");
    expect(doc.getAuthor()).toBe("Bruno Costa");
  });

  it("seções opcionais aumentam o laudo; o orçamento a menos o reduz", async () => {
    const padrao = await laudo(null);
    const completo = await laudo({
      scope: "Avaliar o estado de conservação das fachadas. ".repeat(20),
      conclusion: "Recomenda-se intervenção imediata nas áreas com umidade. ".repeat(40),
      limitations: "Cobertura não inspecionada. ".repeat(15),
    });
    const semOrcamento = await laudo({ includeBudget: false });
    expect(completo.bytes.length).toBeGreaterThan(padrao.bytes.length);
    expect(completo.doc.getPageCount()).toBeGreaterThanOrEqual(padrao.doc.getPageCount());
    expect(semOrcamento.bytes.length).toBeLessThan(padrao.bytes.length);
  });

  it("não quebra com textos longos e sem nenhum dano", async () => {
    const vazio = { ...dx, damages: [], priorities: [], byType: [], vistas: [], kpis: { damages: 0, areaM2: 0, cracksM: 0, totalCents: 0, missing: 0, urgent: 0 } } as unknown as Diagnosis;
    const bytes = await buildLaudo({
      site, dx: vazio, author, orgName: "Estúdio Teste", images: new Map(),
      text: resolveLaudo({ methodology: "Parágrafo longo. ".repeat(500), conclusion: "x ".repeat(2000) }, { author, summaryFacts: { ...vazio.kpis, vistas: 0 } }),
    });
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThan(3);
  });
});
