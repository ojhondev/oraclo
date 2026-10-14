import "server-only";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/** Itens recentes para a barra lateral: bens e mapas de danos da organização. */
export async function listRecent(orgId: string) {
  const [sites, maps] = await Promise.all([
    db
      .select({ id: schema.sites.id, name: schema.sites.name })
      .from(schema.sites)
      .where(eq(schema.sites.orgId, orgId))
      .orderBy(desc(schema.sites.updatedAt))
      .limit(6),
    db
      .select({ id: schema.orthophotos.id, siteId: schema.orthophotos.siteId, name: schema.orthophotos.name })
      .from(schema.orthophotos)
      .innerJoin(schema.sites, eq(schema.sites.id, schema.orthophotos.siteId))
      .where(eq(schema.sites.orgId, orgId))
      .orderBy(desc(schema.orthophotos.createdAt))
      .limit(6),
  ]);
  return { sites, maps };
}

export type Recent = Awaited<ReturnType<typeof listRecent>>;
