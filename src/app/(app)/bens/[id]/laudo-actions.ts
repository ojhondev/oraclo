"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { editors, requireUser } from "@/lib/auth";
import { getSite } from "@/lib/sites";
import { campaignKey, laudoDraftSchema } from "@/lib/laudo-text";

const { reportDrafts, campaigns } = schema;

/** Salva (ou limpa, se vazio) o rascunho do laudo de um projeto, por vistoria. */
export async function saveLaudoDraft(siteId: string, campaignId: string | null, input: unknown) {
  const user = await requireUser(editors);
  await getSite(user.orgId, siteId);
  if (campaignId) {
    if (!/^[0-9a-f-]{36}$/i.test(campaignId)) return { error: "Vistoria inválida." };
    const [c] = await db.select({ id: campaigns.id }).from(campaigns).where(and(eq(campaigns.id, campaignId), eq(campaigns.siteId, siteId))).limit(1);
    if (!c) return { error: "Vistoria não encontrada." };
  }
  const parsed = laudoDraftSchema.safeParse(input);
  if (!parsed.success) return { error: "Algum texto passou do tamanho permitido." };
  const key = campaignKey(campaignId);
  try {
    if (Object.keys(parsed.data).length === 0) {
      await db.delete(reportDrafts).where(and(eq(reportDrafts.siteId, siteId), eq(reportDrafts.campaignKey, key)));
    } else {
      await db
        .insert(reportDrafts)
        .values({ siteId, campaignKey: key, content: parsed.data, updatedBy: user.id })
        .onConflictDoUpdate({ target: [reportDrafts.siteId, reportDrafts.campaignKey], set: { content: parsed.data, updatedBy: user.id, updatedAt: new Date() } });
    }
  } catch {
    return { error: "Não foi possível salvar o rascunho agora. Tente de novo em instantes." };
  }
  revalidatePath(`/bens/${siteId}`);
  return { ok: true as const };
}
