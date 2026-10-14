import "server-only";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/** Bens recentes da organização, para a barra lateral. */
export async function listRecent(orgId: string) {
  const sites = await db
    .select({ id: schema.sites.id, name: schema.sites.name })
    .from(schema.sites)
    .where(eq(schema.sites.orgId, orgId))
    .orderBy(desc(schema.sites.updatedAt))
    .limit(6);
  return { sites };
}

export type Recent = Awaited<ReturnType<typeof listRecent>>;
