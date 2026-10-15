/**
 * Orçamento automático e prioridade GUT — funções puras, usadas no editor (cliente),
 * no painel do projeto e no laudo (servidor).
 */
import type { GeometryKind } from "@/lib/db/schema";

export type PriceUnit = "m2" | "m" | "un";

export type Price = { treatment: string; unit: PriceUnit; priceCents: number; suggested: boolean };

export const unitLabels: Record<PriceUnit, string> = { m2: "m²", m: "m", un: "un." };

export const unitFor = (g: GeometryKind): PriceUnit => (g === "area" ? "m2" : g === "linha" ? "m" : "un");

/**
 * Valores SUGERIDOS (hipótese de partida, R$ por unidade, mão de obra + material) para o
 * escritório ajustar na Biblioteca. Não são tabela oficial (SINAPI etc.).
 */
export const SUGGESTED_PRICES: Record<string, { treatment: string; reais: number }> = {
  FIS: { treatment: "Abertura em V, tratamento e selagem da fissura", reais: 45 },
  TRI: { treatment: "Tratamento de trinca com tela e argamassa compatível", reais: 85 },
  RAC: { treatment: "Grampeamento e costura da alvenaria", reais: 260 },
  DEF: { treatment: "Avaliação estrutural e reforço localizado", reais: 420 },
  UMA: { treatment: "Barreira química contra capilaridade + reboco de sacrifício", reais: 230 },
  UMD: { treatment: "Correção da origem (cobertura/calhas) e recomposição do revestimento", reais: 160 },
  EFL: { treatment: "Escovação a seco e dessalinização com compressas", reais: 55 },
  DES: { treatment: "Consolidação do reboco", reais: 120 },
  PRB: { treatment: "Recomposição de reboco com argamassa de cal", reais: 150 },
  DPT: { treatment: "Remoção de pintura solta e repintura (2 demãos)", reais: 38 },
  SUJ: { treatment: "Limpeza com hidrojateamento de baixa pressão", reais: 28 },
  BIO: { treatment: "Limpeza com biocida e escovação", reais: 42 },
  VEG: { treatment: "Remoção da vegetação com raiz e selagem do ponto", reais: 180 },
  XIL: { treatment: "Descupinização e consolidação da madeira", reais: 210 },
  PAS: { treatment: "Limpeza e instalação de repelente de aves", reais: 35 },
  APO: { treatment: "Substituição/enxerto da peça de madeira", reais: 480 },
  COR: { treatment: "Remoção da oxidação, conversor e pintura anticorrosiva", reais: 95 },
  VID: { treatment: "Reposição do vidro", reais: 320 },
  LAC: { treatment: "Reintegração do elemento faltante", reais: 650 },
  INA: { treatment: "Remoção da intervenção e recomposição compatível", reais: 190 },
  PIC: { treatment: "Remoção de pichação e proteção antipichação", reais: 65 },
  INS: { treatment: "Reorganização/embutimento da instalação", reais: 75 },
};

type TypeLike = { id: string; code: string; geometry: GeometryKind };
type OrgPrice = { typeId: string; treatment: string; unit: PriceUnit; priceCents: number };

/** Preço efetivo por tipo: o do escritório, senão o sugerido. */
export function priceMap(types: TypeLike[], orgPrices: OrgPrice[]) {
  const own = new Map(orgPrices.map((p) => [p.typeId, p]));
  const map: Record<string, Price> = {};
  for (const t of types) {
    const p = own.get(t.id);
    if (p) map[t.id] = { treatment: p.treatment, unit: p.unit, priceCents: p.priceCents, suggested: false };
    else {
      const s = SUGGESTED_PRICES[t.code];
      map[t.id] = { treatment: s?.treatment ?? "", unit: unitFor(t.geometry), priceCents: Math.round((s?.reais ?? 0) * 100), suggested: true };
    }
  }
  return map;
}

type DamageLike = { typeId: string; areaM2: number | null; lengthM: number | null };

/** Quantidade do dano na unidade do preço (null = sem escala, não dá para orçar). */
export function quantity(d: DamageLike, unit: PriceUnit) {
  if (unit === "un") return 1;
  const q = unit === "m2" ? d.areaM2 : d.lengthM;
  return q == null ? null : q;
}

export function damageCostCents(d: DamageLike, prices: Record<string, Price>) {
  const p = prices[d.typeId];
  if (!p) return null;
  const q = quantity(d, p.unit);
  return q == null ? null : Math.round(q * p.priceCents);
}

/** Orçamento somado por tipo de dano. */
export function budget(list: DamageLike[], prices: Record<string, Price>) {
  const rows = new Map<string, { typeId: string; qty: number; count: number; cents: number; missing: number }>();
  let total = 0;
  let missing = 0;
  for (const d of list) {
    const p = prices[d.typeId];
    if (!p) continue;
    const r = rows.get(d.typeId) ?? { typeId: d.typeId, qty: 0, count: 0, cents: 0, missing: 0 };
    r.count++;
    const q = quantity(d, p.unit);
    if (q == null) {
      r.missing++;
      missing++;
    } else {
      r.qty += q;
      const c = Math.round(q * p.priceCents);
      r.cents += c;
      total += c;
    }
    rows.set(d.typeId, r);
  }
  return { rows: [...rows.values()].sort((a, b) => b.cents - a.cents), totalCents: total, missing };
}

export const fmtBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: cents >= 100_000 ? 0 : 2 });

/* ───────────── Matriz GUT (Gravidade × Urgência × Tendência) ───────────── */

export const SEVERITY_G = { baixa: 2, media: 3, alta: 4, critica: 5 } as const;

export const URGENCY_LABELS: Record<number, string> = {
  1: "Pode esperar",
  2: "Pouco urgente",
  3: "O mais breve possível",
  4: "Urgente",
  5: "Ação imediata",
};
export const TREND_LABELS: Record<number, string> = {
  1: "Não vai piorar",
  2: "Piora a longo prazo",
  3: "Piora a médio prazo",
  4: "Piora a curto prazo",
  5: "Piora rapidamente",
};

export function gut(d: { severity: keyof typeof SEVERITY_G; urgency: number; trend: number }) {
  return SEVERITY_G[d.severity] * d.urgency * d.trend;
}

/** Faixa de prioridade a partir do GUT (1–125). */
export function priority(score: number) {
  if (score >= 64) return { level: 1, label: "Prioridade 1 — imediata" };
  if (score >= 27) return { level: 2, label: "Prioridade 2 — curto prazo" };
  if (score >= 12) return { level: 3, label: "Prioridade 3 — médio prazo" };
  return { level: 4, label: "Prioridade 4 — monitorar" };
}
