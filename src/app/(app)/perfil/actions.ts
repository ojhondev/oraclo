"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";

type State = { error?: string; ok?: string } | null;

const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome."),
  professionalId: z
    .string()
    .trim()
    .max(60, "Registro muito longo.")
    .transform((v) => v || null),
});

export async function updateProfile(_: State, form: FormData): Promise<State> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({ name: form.get("name"), professionalId: String(form.get("professionalId") ?? "") });
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  await db.update(schema.users).set(parsed.data).where(eq(schema.users.id, user.id));
  revalidatePath("/", "layout");
  return { ok: "Perfil salvo. As próximas pranchas já saem com estes dados." };
}

export async function changePassword(_: State, form: FormData): Promise<State> {
  const user = await requireUser();
  const current = String(form.get("current") || "");
  const next = String(form.get("next") || "");
  if (next.length < 8) return { error: "A nova senha precisa de pelo menos 8 caracteres." };
  const [u] = await db.select({ hash: schema.users.passwordHash }).from(schema.users).where(eq(schema.users.id, user.id));
  if (!u || !verifyPassword(current, u.hash)) return { error: "Senha atual incorreta." };
  await db.update(schema.users).set({ passwordHash: hashPassword(next) }).where(eq(schema.users.id, user.id));
  return { ok: "Senha alterada." };
}
