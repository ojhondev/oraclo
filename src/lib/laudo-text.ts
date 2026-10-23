/**
 * Texto do laudo — funções puras (sem banco nem PDF). O laudo tem um texto padrão gerado a partir do
 * diagnóstico; o rascunho do profissional guarda só o que ele alterou, de modo que melhorias no texto
 * padrão continuam valendo para os campos que ele não mexeu.
 */
import { z } from "zod";
import { fmtArea, fmtLength } from "@/lib/geometry";
import { fmtBRL } from "@/lib/pricing";

export const LAUDO_TITLE = "Laudo de estado de conservação";

/** Campos de texto livre editáveis (cada um com o seu limite de tamanho). */
export const TEXT_FIELDS = {
  title: 140,
  scope: 4000,
  methodology: 8000,
  summary: 4000,
  conclusion: 8000,
  limitations: 4000,
  signerName: 120,
  signerRole: 80,
  signerRegistry: 80,
  artRrt: 80,
} as const;
export type TextField = keyof typeof TEXT_FIELDS;

const text = (max: number) => z.string().max(max).optional();

export const laudoDraftSchema = z.object({
  title: text(TEXT_FIELDS.title),
  scope: text(TEXT_FIELDS.scope),
  methodology: text(TEXT_FIELDS.methodology),
  summary: text(TEXT_FIELDS.summary),
  conclusion: text(TEXT_FIELDS.conclusion),
  limitations: text(TEXT_FIELDS.limitations),
  signerName: text(TEXT_FIELDS.signerName),
  signerRole: text(TEXT_FIELDS.signerRole),
  signerRegistry: text(TEXT_FIELDS.signerRegistry),
  artRrt: text(TEXT_FIELDS.artRrt),
  /** false = o laudo sai sem a seção de orçamento. Padrão: incluir. */
  includeBudget: z.boolean().optional(),
});
export type LaudoDraft = z.infer<typeof laudoDraftSchema>;

export const FIELD_KEYS = Object.keys(TEXT_FIELDS) as TextField[];

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function defaultMethodology() {
  return [
    "Inspeção visual do imóvel com registro fotográfico. As fachadas foram fotografadas e retificadas: correção de " +
      "perspectiva por homografia ajustada por mínimos quadrados a pontos de controle medidos em campo, com correção da " +
      "distorção radial da lente quando indicada, gerando imagens ortogonais em escala conhecida. A precisão de cada vista " +
      "é estimada com 95% de confiança e, quando há medidas de conferência, verificada contra distâncias medidas com trena. " +
      "Os danos foram apontados sobre essas vistas como pontos, linhas ou áreas e classificados segundo biblioteca " +
      "padronizada; áreas e extensões foram calculadas a partir da escala de cada vista.",
    "A priorização usa a matriz GUT: Gravidade (baixa = 2, média = 3, alta = 4, crítica = 5) × Urgência (1 a 5) × " +
      "Tendência (1 a 5). Faixas: GUT a partir de 64, prioridade 1 (imediata); de 27 a 63, prioridade 2 (curto prazo); " +
      "de 12 a 26, prioridade 3 (médio prazo); abaixo de 12, prioridade 4 (monitorar).",
    "O orçamento é estimativo: quantidade medida de cada dano × preço unitário de tratamento da tabela do escritório. " +
      "Não inclui andaimes, canteiro, BDI, impostos nem serviços não visíveis na inspeção.",
  ].join("\n\n");
}

export type SummaryFacts = { damages: number; vistas: number; areaM2: number; cracksM: number; urgent: number; totalCents: number; missing: number };

export function defaultSummary(k: SummaryFacts, includeBudget = true) {
  return (
    `Foram apontados ${plural(k.damages, "dano", "danos")} em ${plural(k.vistas, "vista", "vistas")}, somando ${fmtArea(k.areaM2)} de ` +
    `área afetada e ${fmtLength(k.cracksM)} de fissuras e elementos lineares. ` +
    (k.urgent ? `${plural(k.urgent, "dano exige", "danos exigem")} ação imediata (prioridade 1).` : "Nenhum dano exige ação imediata.") +
    (includeBudget
      ? ` O tratamento completo está estimado em ${fmtBRL(k.totalCents)}` + (k.missing ? `, sem contar ${k.missing} dano(s) em vistas sem escala.` : ".")
      : "")
  );
}

export type LaudoBase = {
  summaryFacts: SummaryFacts;
  author: { name: string; professionalId: string | null };
};

/** Valores padrão de cada campo de texto. Escopo, conclusões e ressalvas começam vazios (seções omitidas). */
export function laudoDefaults(base: LaudoBase, includeBudget = true): Record<TextField, string> {
  return {
    title: LAUDO_TITLE,
    scope: "",
    methodology: defaultMethodology(),
    summary: defaultSummary(base.summaryFacts, includeBudget),
    conclusion: "",
    limitations: "",
    signerName: base.author.name,
    signerRole: "Responsável técnico",
    signerRegistry: base.author.professionalId ?? "",
    artRrt: "",
  };
}

export type LaudoText = Record<TextField, string> & { includeBudget: boolean };

/** Texto final do laudo: o rascunho (quando preenchido) vale mais que o padrão. */
export function resolveLaudo(draft: LaudoDraft | null | undefined, base: LaudoBase): LaudoText {
  const includeBudget = draft?.includeBudget !== false;
  const def = laudoDefaults(base, includeBudget);
  const out = { ...def } as Record<TextField, string>;
  for (const k of FIELD_KEYS) {
    const v = draft?.[k];
    if (typeof v === "string" && v.trim()) out[k] = v.trim();
  }
  return { ...out, includeBudget };
}

/**
 * Do formulário para o rascunho: guarda só o que difere do padrão. Campo apagado de propósito (vazio) em
 * escopo, conclusões e ressalvas volta ao padrão (vazio); nos demais, vazio também volta ao padrão.
 */
export function toDraft(values: Record<TextField, string> & { includeBudget: boolean }, defaults: Record<TextField, string>): LaudoDraft {
  const draft: LaudoDraft = {};
  for (const k of FIELD_KEYS) {
    const v = values[k].trim();
    if (v && v !== defaults[k].trim()) draft[k] = v;
  }
  if (!values.includeBudget) draft.includeBudget = false;
  return draft;
}

/** Parágrafos de um texto: linha em branco separa; quebra simples vira espaço. */
export function paragraphs(t: string) {
  return t
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.replace(/\s*\r?\n\s*/g, " ").trim())
    .filter(Boolean);
}

/** Chave do rascunho: o laudo de uma vistoria ou o de todas ("all"). */
export const campaignKey = (campaignId: string | null | undefined) => (campaignId ? campaignId : "all");
