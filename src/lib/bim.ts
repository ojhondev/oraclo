/**
 * Pedido de modelo BIM: opções, rótulos e a ESTIMATIVA automática de preço e prazo.
 * Os valores são hipóteses iniciais (PRD §11) — o operador sempre confirma ou ajusta
 * o orçamento antes do cliente aprovar.
 */
import type { BimStatus } from "@/lib/db/schema";

export const LODS = {
  "200": { label: "LOD 200", summary: "Volumes, paredes, pisos, coberturas e aberturas com dimensões aproximadas.", perM2: 8 },
  "300": { label: "LOD 300", summary: "Elementos com dimensões, posições e tipos definidos (portas, janelas, escadas, pilares).", perM2: 14 },
  "350": { label: "LOD 350", summary: "LOD 300 + interfaces entre sistemas e detalhes construtivos relevantes.", perM2: 22 },
} as const;
export type Lod = keyof typeof LODS;

export const DISCIPLINES = {
  arquitetura: { label: "Arquitetura", summary: "Paredes, pisos, forros, coberturas, esquadrias, escadas.", factor: 0 },
  estrutura: { label: "Estrutura", summary: "Pilares, vigas, lajes e fundações aparentes.", factor: 0.35 },
  mep: { label: "Instalações aparentes (MEP)", summary: "Tubulações, eletrocalhas, dutos e equipamentos visíveis.", factor: 0.5 },
} as const;
export type Discipline = keyof typeof DISCIPLINES;

export const FORMATS = {
  rvt: { label: "Revit (RVT)", native: true },
  pln: { label: "Archicad (PLN)", native: true },
  ifc: { label: "IFC aberto", native: false },
} as const;
export type Format = keyof typeof FORMATS;

export const MIN_PRICE_CENTS = 120_000;

/** Estimativa: preço por m² do LOD × disciplinas, +20% se forem dois formatos nativos; IFC sem custo. */
export function estimate(input: { areaM2: number; lod: Lod; disciplines: string[]; formats: string[] }) {
  const area = Math.max(0, input.areaM2 || 0);
  const lod = LODS[input.lod] ?? LODS["200"];
  const disc = input.disciplines.reduce((a, d) => a + (DISCIPLINES[d as Discipline]?.factor ?? 0), 1);
  const natives = input.formats.filter((f) => FORMATS[f as Format]?.native).length;
  const formatFactor = natives >= 2 ? 1.2 : 1;
  const cents = Math.max(MIN_PRICE_CENTS, Math.round(area * lod.perM2 * disc * formatFactor * 100));
  const lodDays = input.lod === "200" ? 1 : input.lod === "300" ? 1.5 : 2;
  const days = Math.ceil(4 + (area / 500) * 2 * lodDays * (1 + (input.disciplines.length - 1) * 0.3));
  return { cents, days };
}

export const fmtMoney = (cents: number | null | undefined) =>
  cents == null ? "—" : (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const bimStatuses: Record<BimStatus, string> = {
  solicitado: "Aguardando orçamento",
  orcado: "Orçamento enviado",
  aprovado: "Na fila de modelagem",
  em_modelagem: "Em modelagem",
  em_revisao_interna: "Conferência interna",
  entregue: "Entregue — aguardando aceite",
  revisao_solicitada: "Revisão solicitada",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

/** Etapas mostradas na linha de progresso do pedido. */
export const BIM_STEPS: { label: string; statuses: BimStatus[] }[] = [
  { label: "Pedido", statuses: ["solicitado"] },
  { label: "Orçamento", statuses: ["orcado"] },
  { label: "Modelagem", statuses: ["aprovado", "em_modelagem", "em_revisao_interna", "revisao_solicitada"] },
  { label: "Entrega", statuses: ["entregue"] },
  { label: "Concluído", statuses: ["concluido"] },
];

export const DELIVERY_EXTENSIONS = ".rvt,.rfa,.pln,.pla,.ifc,.ifczip,.zip,.pdf,.dwg,.dxf,.nwc,.nwd";
