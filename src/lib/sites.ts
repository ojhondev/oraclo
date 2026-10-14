import "server-only";
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db";

const { sites, elements, campaigns, captures, outputs, damages } = schema;

/** Bens da organização com contagens para os cards do painel. */
export async function listSites(orgId: string) {
  const rows = await db.select().from(sites).where(eq(sites.orgId, orgId)).orderBy(desc(sites.updatedAt));
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [els, camps, dmg] = await Promise.all([
    db.select({ siteId: elements.siteId, n: count() }).from(elements).where(inArray(elements.siteId, ids)).groupBy(elements.siteId),
    db.select({ siteId: campaigns.siteId, n: count() }).from(campaigns).where(inArray(campaigns.siteId, ids)).groupBy(campaigns.siteId),
    db.select({ siteId: damages.siteId, n: count() }).from(damages).where(inArray(damages.siteId, ids)).groupBy(damages.siteId),
  ]);
  const by = (list: { siteId: string; n: number }[]) => Object.fromEntries(list.map((r) => [r.siteId, r.n]));
  const e = by(els), c = by(camps), d = by(dmg);
  return rows.map((s) => ({ ...s, elementCount: e[s.id] ?? 0, campaignCount: c[s.id] ?? 0, damageCount: d[s.id] ?? 0 }));
}

/** Bem da organização (404 se não for dela). */
export async function getSite(orgId: string, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [site] = await db.select().from(sites).where(and(eq(sites.id, id), eq(sites.orgId, orgId))).limit(1);
  if (!site) notFound();
  return site;
}

export async function getSiteDetail(orgId: string, id: string) {
  const site = await getSite(orgId, id);
  const [els, camps, outs] = await Promise.all([
    db.select().from(elements).where(eq(elements.siteId, id)).orderBy(asc(elements.sortOrder), asc(elements.createdAt)),
    db.select().from(campaigns).where(eq(campaigns.siteId, id)).orderBy(desc(campaigns.date), desc(campaigns.createdAt)),
    db.select().from(outputs).where(eq(outputs.siteId, id)).orderBy(desc(outputs.createdAt)),
  ]);
  const caps = camps.length
    ? await db.select().from(captures).where(inArray(captures.campaignId, camps.map((c) => c.id))).orderBy(asc(captures.createdAt))
    : [];
  return {
    site,
    elements: els,
    campaigns: camps.map((c) => ({ ...c, captures: caps.filter((k) => k.campaignId === c.id) })),
    outputs: outs,
  };
}
