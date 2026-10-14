"use server";

import { redirect } from "next/navigation";
import { and, count, eq, gt, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { findInvite, findReset } from "@/lib/tokens";
import { createResetFor } from "@/lib/password-reset";

type State = { error?: string; ok?: string } | null;

/** Aceita o convite: cria a conta na organização do convite e já entra. */
export async function acceptInvite(token: string, _: State, form: FormData): Promise<State> {
  const inv = await findInvite(token);
  if (!inv) return { error: "Este convite não é mais válido. Peça um novo ao administrador." };
  const name = String(form.get("name") || "").trim();
  const password = String(form.get("password") || "");
  if (name.length < 2) return { error: "Informe seu nome." };
  if (password.length < 8) return { error: "A senha precisa de pelo menos 8 caracteres." };
  const [exists] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, inv.email)).limit(1);
  if (exists) return { error: "Já existe uma conta com este e-mail. Entre com ela ou fale com o administrador." };
  const [u] = await db
    .insert(schema.users)
    .values({ orgId: inv.orgId, name, email: inv.email, passwordHash: hashPassword(password), role: inv.role })
    .returning({ id: schema.users.id });
  await db.update(schema.invitations).set({ acceptedAt: new Date() }).where(eq(schema.invitations.id, inv.id));
  await createSession(u!.id);
  redirect("/");
}

/**
 * Pede link de nova senha. A resposta é sempre a mesma, exista ou não a conta
 * (não revela quais e-mails estão cadastrados). No máximo 3 pedidos por hora por conta.
 */
export async function requestPasswordReset(_: State, form: FormData): Promise<State> {
  const email = String(form.get("email") || "").trim().toLowerCase();
  const generic = { ok: "Se existir uma conta com esse e-mail, enviamos um link para criar uma nova senha. Confira também o spam." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "E-mail inválido." };
  const [u] = await db
    .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
    .from(schema.users)
    .where(and(eq(schema.users.email, email), eq(schema.users.active, true)))
    .limit(1);
  if (!u) return generic;
  const [{ n }] = await db
    .select({ n: count() })
    .from(schema.passwordResets)
    .where(and(eq(schema.passwordResets.userId, u.id), gt(schema.passwordResets.createdAt, new Date(Date.now() - 3600_000))));
  if (n >= 3) return generic;
  await createResetFor(u.id, u.email, u.name);
  return generic;
}

/** Define a nova senha pelo link, invalida os outros links pendentes e entra. */
export async function resetPassword(token: string, _: State, form: FormData): Promise<State> {
  const r = await findReset(token);
  if (!r) return { error: "Este link expirou ou já foi usado. Peça um novo." };
  const password = String(form.get("password") || "");
  const confirm = String(form.get("confirm") || "");
  if (password.length < 8) return { error: "A senha precisa de pelo menos 8 caracteres." };
  if (password !== confirm) return { error: "As senhas não conferem." };
  await db.update(schema.users).set({ passwordHash: hashPassword(password) }).where(eq(schema.users.id, r.userId));
  await db
    .update(schema.passwordResets)
    .set({ usedAt: new Date() })
    .where(and(eq(schema.passwordResets.userId, r.userId), isNull(schema.passwordResets.usedAt)));
  await createSession(r.userId);
  redirect("/");
}
