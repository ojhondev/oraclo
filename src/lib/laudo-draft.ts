import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { campaignKey, type LaudoDraft } from "@/lib/laudo-text";

/**
 * Rascunho salvo do laudo de um projeto (já validado com getSite). Tolerante a falhas: se a tabela ainda
 * não existir ou o banco não responder, devolve null e o laudo sai com o texto padrão.
 */
export async function getLaudoDraft(siteId: string, campaignId: string | null): Promise<LaudoDraft | null> {
  try {
    const [row] = await db
      .select({ content: schema.reportDrafts.content })
      .from(schema.reportDrafts)
      .where(and(eq(schema.reportDrafts.siteId, siteId), eq(schema.reportDrafts.campaignKey, campaignKey(campaignId))))
      .limit(1);
    return row?.content ?? null;
  } catch {
    return null;
  }
}
