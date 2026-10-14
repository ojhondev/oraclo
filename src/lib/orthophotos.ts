import "server-only";
import { and, asc, count, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db";
import { ensureDefaultDamageTypes } from "@/lib/damage-library";

const { orthophotos, damages, damageTypes, elements } = schema;

export type Orthophoto = typeof orthophotos.$inferSelect;
export type Damage = typeof damages.$inferSelect;
export type DamageType = typeof damageTypes.$inferSelect;

const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);

/** Ortofotos do bem com nº de danos e nome da parte. */
export async function listOrthophotos(siteId: string) {
  const rows = await db
    .select({ o: orthophotos, elementName: elements.name })
    .from(orthophotos)
    .leftJoin(elements, eq(elements.id, orthophotos.elementId))
    .where(eq(orthophotos.siteId, siteId))
    .orderBy(desc(orthophotos.createdAt));
  if (!rows.length) return [];
  const counts = await db
    .select({ id: damages.orthophotoId, n: count() })
    .from(damages)
    .where(inArray(damages.orthophotoId, rows.map((r) => r.o.id)))
    .groupBy(damages.orthophotoId);
  const by = Object.fromEntries(counts.map((c) => [c.id, c.n]));
  return rows.map((r) => ({ ...r.o, elementName: r.elementName, damageCount: by[r.o.id] ?? 0 }));
}

/** Ortofoto de um bem já validado (getSite) — 404 se não pertencer a ele. */
export async function getOrthophoto(siteId: string, id: string) {
  if (!isUuid(id)) notFound();
  const [o] = await db
    .select()
    .from(orthophotos)
    .where(and(eq(orthophotos.id, id), eq(orthophotos.siteId, siteId)))
    .limit(1);
  if (!o) notFound();
  return o;
}

export async function listDamages(orthophotoId: string) {
  return db.select().from(damages).where(eq(damages.orthophotoId, orthophotoId)).orderBy(asc(damages.createdAt));
}

/** Biblioteca visível para a organização (padrão + personalizados). */
export async function loadDamageTypes(orgId: string) {
  const q = () =>
    db
      .select()
      .from(damageTypes)
      .where(or(isNull(damageTypes.orgId), eq(damageTypes.orgId, orgId)))
      .orderBy(asc(damageTypes.sortOrder), asc(damageTypes.name));
  let types = await q();
  if (!types.length) {
    await ensureDefaultDamageTypes();
    types = await q();
  }
  return types;
}

/** Quantitativos por tipo de dano (para legenda, prancha e DXF). */
export function summarize(list: Damage[], types: DamageType[]) {
  const byId = new Map(types.map((t) => [t.id, t]));
  const map = new Map<string, { type: DamageType; count: number; areaM2: number; lengthM: number }>();
  for (const d of list) {
    const type = byId.get(d.typeId);
    if (!type) continue;
    const row = map.get(type.id) ?? { type, count: 0, areaM2: 0, lengthM: 0 };
    row.count++;
    if (type.geometry === "area") row.areaM2 += d.areaM2 ?? 0;
    if (type.geometry === "linha") row.lengthM += d.lengthM ?? 0;
    map.set(type.id, row);
  }
  return [...map.values()].sort((a, b) => a.type.sortOrder - b.type.sortOrder);
}
