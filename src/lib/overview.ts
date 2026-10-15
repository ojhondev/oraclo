import "server-only";
import { count, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

const { sites, elements, orthophotos, damages } = schema;

/** Vistas de todos os projetos da organização, com o nº de danos de cada uma. */
export async function listAllMaps(orgId: string) {
  return db
    .select({
      id: orthophotos.id,
      siteId: sites.id,
      siteName: sites.name,
      elementName: elements.name,
      name: orthophotos.name,
      kind: orthophotos.kind,
      url: orthophotos.url,
      mmPerPixel: orthophotos.mmPerPixel,
      createdAt: orthophotos.createdAt,
      damageCount: count(damages.id),
    })
    .from(orthophotos)
    .innerJoin(sites, eq(sites.id, orthophotos.siteId))
    .leftJoin(elements, eq(elements.id, orthophotos.elementId))
    .leftJoin(damages, eq(damages.orthophotoId, orthophotos.id))
    .where(eq(sites.orgId, orgId))
    .groupBy(orthophotos.id, sites.id, elements.name)
    .orderBy(desc(orthophotos.createdAt));
}
