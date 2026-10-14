import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { getOrthophoto, listDamages, loadDamageTypes, summarize } from "@/lib/orthophotos";
import type { Pt } from "@/lib/geometry";

/** Tudo que DXF e PDF precisam, já validando sessão e organização. Retorna null se não autorizado. */
export async function loadExportData(siteId: string, oid: string) {
  const user = await getUser();
  if (!user) return null;
  if (!/^[0-9a-f-]{36}$/i.test(siteId)) return null;
  const [site] = await db
    .select()
    .from(schema.sites)
    .where(and(eq(schema.sites.id, siteId), eq(schema.sites.orgId, user.orgId)))
    .limit(1);
  if (!site) return null;
  const ortho = await getOrthophoto(siteId, oid);
  const [types, damages, element, author] = await Promise.all([
    loadDamageTypes(user.orgId),
    listDamages(oid),
    ortho.elementId
      ? db.select({ name: schema.elements.name }).from(schema.elements).where(eq(schema.elements.id, ortho.elementId)).then((r) => r[0] ?? null)
      : Promise.resolve(null),
    db
      .select({ name: schema.users.name, professionalId: schema.users.professionalId })
      .from(schema.users)
      .where(eq(schema.users.id, user.id))
      .then((r) => r[0]!),
  ]);
  const typeById = new Map(types.map((t) => [t.id, t]));
  return {
    user,
    author,
    site,
    ortho,
    element,
    types,
    typeById,
    damages: damages.filter((d) => typeById.has(d.typeId)),
    summary: summarize(damages, types),
  };
}

export type ExportData = NonNullable<Awaited<ReturnType<typeof loadExportData>>>;

export const pointsOf = (d: { geometry: { points: [number, number][] } | null }) => (d.geometry?.points ?? []) as Pt[];

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Nome de arquivo seguro, sem acentos. */
export function slug(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function fetchImage(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Não foi possível baixar a ortofoto (${res.status}).`);
  return new Uint8Array(await res.arrayBuffer());
}
