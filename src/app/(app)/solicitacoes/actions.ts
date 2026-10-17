"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireOps } from "@/lib/auth";
import { db, schema } from "@/lib/db";

const LEAD_STATUSES = ["novo", "em_contato", "proposta", "fechado", "descartado"] as const;

export async function setLeadStatus(id: string, status: string) {
  await requireOps();
  if (!(LEAD_STATUSES as readonly string[]).includes(status)) return;
  await db.update(schema.leads).set({ status }).where(eq(schema.leads.id, id));
  revalidatePath("/solicitacoes");
}
