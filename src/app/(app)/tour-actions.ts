"use server";

import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth";

/** Marca o tour do primeiro acesso como visto (concluído ou pulado). */
export async function markOnboarded() {
  const user = await requireUser();
  if (user.onboarded) return;
  await db.update(schema.users).set({ onboardedAt: new Date() }).where(eq(schema.users.id, user.id));
}
