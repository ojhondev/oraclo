import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { loadDamageTypes } from "@/lib/orthophotos";
import { loadPrices } from "@/lib/prices";
import { budget, damageCostCents, gut, priority } from "@/lib/pricing";

const { orthophotos, damages, elements, campaigns } = schema;

/**
 * Diagnóstico de um projeto (já validado com getSite): vistas, danos com custo e GUT,
 * indicadores e agregados. Base do painel e do laudo. `campaignId` filtra por vistoria.
 */
export async function loadDiagnosis(orgId: string, siteId: string, campaignId?: string | null) {
  const [types, vistasAll, dmgAll, els, camps] = await Promise.all([
    loadDamageTypes(orgId),
    db.select().from(orthophotos).where(eq(orthophotos.siteId, siteId)).orderBy(asc(orthophotos.createdAt)),
    db.select().from(damages).where(eq(damages.siteId, siteId)).orderBy(asc(damages.createdAt)),
    db.select({ id: elements.id, name: elements.name }).from(elements).where(eq(elements.siteId, siteId)),
    db
      .select({ id: campaigns.id, name: campaigns.name, date: campaigns.date, purpose: campaigns.purpose })
      .from(campaigns)
      .where(eq(campaigns.siteId, siteId))
      .orderBy(desc(campaigns.date), desc(campaigns.createdAt)),
  ]);
  const prices = await loadPrices(orgId, types);
  const typeById = new Map(types.map((t) => [t.id, t]));
  const elName = new Map(els.map((e) => [e.id, e.name]));
  const campaign = campaignId ? camps.find((c) => c.id === campaignId) ?? null : null;

  const vistas = campaign ? vistasAll.filter((v) => v.campaignId === campaign.id) : vistasAll;
  const vistaIds = new Set(vistas.map((v) => v.id));
  const vistaName = new Map(vistas.map((v) => [v.id, v.name]));
  const list = dmgAll
    .filter((d) => d.orthophotoId && vistaIds.has(d.orthophotoId) && typeById.has(d.typeId))
    .map((d) => {
      const score = gut(d);
      return {
        ...d,
        type: typeById.get(d.typeId)!,
        vistaName: vistaName.get(d.orthophotoId!) ?? "",
        elementName: d.elementId ? elName.get(d.elementId) ?? null : null,
        costCents: damageCostCents(d, prices),
        gut: score,
        priority: priority(score),
      };
    });

  const orc = budget(list, prices);
  const byType = orc.rows.map((r) => ({ ...r, type: typeById.get(r.typeId)!, price: prices[r.typeId]! }));
  const bySeverity = (["critica", "alta", "media", "baixa"] as const).map((s) => ({
    severity: s,
    count: list.filter((d) => d.severity === s).length,
  }));
  const byPriority = [1, 2, 3, 4].map((level) => ({
    level,
    count: list.filter((d) => d.priority.level === level).length,
    cents: list.filter((d) => d.priority.level === level).reduce((s, d) => s + (d.costCents ?? 0), 0),
  }));
  const elementMap = new Map<string, { name: string; count: number; cents: number }>();
  for (const d of list) {
    const key = d.elementName ?? "Sem área";
    const r = elementMap.get(key) ?? { name: key, count: 0, cents: 0 };
    r.count++;
    r.cents += d.costCents ?? 0;
    elementMap.set(key, r);
  }

  const vistaStats = vistas.map((v) => {
    const ds = list.filter((d) => d.orthophotoId === v.id);
    return {
      ...v,
      elementName: v.elementId ? elName.get(v.elementId) ?? null : null,
      damageCount: ds.length,
      costCents: ds.reduce((s, d) => s + (d.costCents ?? 0), 0),
    };
  });

  return {
    types,
    prices,
    campaigns: camps,
    campaign,
    vistas: vistaStats,
    damages: list,
    kpis: {
      damages: list.length,
      areaM2: list.reduce((s, d) => s + (d.type.geometry === "area" ? d.areaM2 ?? 0 : 0), 0),
      cracksM: list.reduce((s, d) => s + (d.type.geometry === "linha" ? d.lengthM ?? 0 : 0), 0),
      totalCents: orc.totalCents,
      missing: orc.missing,
      urgent: list.filter((d) => d.priority.level === 1).length,
    },
    byType,
    bySeverity,
    byPriority,
    byElement: [...elementMap.values()].sort((a, b) => b.cents - a.cents),
    priorities: [...list].sort((a, b) => b.gut - a.gut || (b.costCents ?? 0) - (a.costCents ?? 0)),
  };
}

export type Diagnosis = Awaited<ReturnType<typeof loadDiagnosis>>;
