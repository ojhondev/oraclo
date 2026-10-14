"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { ensureDefaultDamageTypes } from "@/lib/damage-library";

type State = { error?: string } | null;

export async function login(_: State, form: FormData): Promise<State> {
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const [u] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!u || !u.active || !verifyPassword(password, u.passwordHash)) {
    return { error: "E-mail ou senha incorretos." };
  }
  await createSession(u.id);
  redirect("/");
}

/** Cadastro aberto: cria a organização e o primeiro usuário (admin). */
export async function signup(_: State, form: FormData): Promise<State> {
  const org = String(form.get("org") || "").trim();
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  if (!org || !name || !email) return { error: "Preencha todos os campos." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "E-mail inválido." };
  if (password.length < 8) return { error: "A senha precisa de pelo menos 8 caracteres." };

  const [exists] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (exists) return { error: "Já existe uma conta com este e-mail." };

  const [o] = await db.insert(schema.organizations).values({ name: org }).returning({ id: schema.organizations.id });
  const [u] = await db
    .insert(schema.users)
    .values({ orgId: o!.id, name, email, passwordHash: hashPassword(password), role: "admin" })
    .returning({ id: schema.users.id });
  await ensureDefaultDamageTypes();
  await createSession(u!.id);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

/** Sai e volta para a página do convite (aceitar convite estando logado em outra conta). */
export async function logoutToInvite(token: string) {
  await destroySession();
  redirect(`/convite/${encodeURIComponent(token)}`);
}
