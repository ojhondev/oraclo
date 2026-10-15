"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { appUrl, emailLayout, newToken, sendEmail } from "@/lib/email";
import { createResetFor } from "@/lib/password-reset";
import { roles } from "@/lib/labels";

const { users, invitations, organizations } = schema;

const INVITE_DAYS = 7;

type Result = { error?: string; ok?: string; link?: string } | null;

async function admin() {
  return requireUser(["admin"]);
}

/** Cria (ou renova) o token do convite e manda o e-mail. Devolve o link quando o e-mail não sai. */
async function deliverInvite(inviteId: string, inviterName: string) {
  const [inv] = await db
    .select({ id: invitations.id, email: invitations.email, role: invitations.role, orgName: organizations.name })
    .from(invitations)
    .innerJoin(organizations, eq(organizations.id, invitations.orgId))
    .where(eq(invitations.id, inviteId));
  if (!inv) throw new Error("Convite não encontrado.");
  const { token, hash } = newToken();
  await db
    .update(invitations)
    .set({ tokenHash: hash, expiresAt: new Date(Date.now() + INVITE_DAYS * 86400_000) })
    .where(eq(invitations.id, inv.id));
  const url = `${await appUrl()}/convite/${token}`;
  const { html, text } = emailLayout({
    title: `Convite para ${inv.orgName}`,
    intro: `${inviterName} convidou você para documentar patrimônio no ArchRay como ${roles[inv.role].toLowerCase()}. Crie sua senha para entrar.`,
    button: "Aceitar convite",
    url,
    footer: `O convite vale por ${INVITE_DAYS} dias. Se você não esperava este e-mail, pode ignorá-lo.`,
  });
  const r = await sendEmail({ to: inv.email, subject: `Convite para ${inv.orgName} no ArchRay`, html, text });
  return { sent: r.sent, url };
}

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  role: z.enum(schema.roleEnum.enumValues).catch("tecnico"),
});

export async function inviteMember(_: Result, form: FormData): Promise<Result> {
  const me = await admin();
  const parsed = inviteSchema.safeParse({ email: form.get("email"), role: form.get("role") });
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  const { email, role } = parsed.data;

  const [existing] = await db.select({ orgId: users.orgId }).from(users).where(eq(users.email, email)).limit(1);
  if (existing?.orgId === me.orgId) return { error: "Essa pessoa já faz parte da equipe." };
  if (existing) return { error: "Esse e-mail já tem conta no ArchRay em outra organização." };

  // um convite pendente por e-mail: revoga os anteriores
  await db
    .update(invitations)
    .set({ revokedAt: new Date() })
    .where(and(eq(invitations.orgId, me.orgId), eq(invitations.email, email), isNull(invitations.acceptedAt), isNull(invitations.revokedAt)));
  const { hash } = newToken();
  const [inv] = await db
    .insert(invitations)
    .values({ orgId: me.orgId, email, role, tokenHash: hash, invitedBy: me.id, expiresAt: new Date(Date.now() + INVITE_DAYS * 86400_000) })
    .returning({ id: invitations.id });
  const r = await deliverInvite(inv!.id, me.name);
  revalidatePath("/equipe");
  return r.sent
    ? { ok: `Convite enviado para ${email}.` }
    : { ok: `Convite criado. O envio de e-mail ainda não está configurado — copie o link e mande para ${email}:`, link: r.url };
}

export async function resendInvite(inviteId: string): Promise<Result> {
  const me = await admin();
  const [inv] = await db
    .select({ id: invitations.id, email: invitations.email })
    .from(invitations)
    .where(and(eq(invitations.id, inviteId), eq(invitations.orgId, me.orgId), isNull(invitations.acceptedAt), isNull(invitations.revokedAt)));
  if (!inv) return { error: "Convite não encontrado." };
  const r = await deliverInvite(inv.id, me.name);
  revalidatePath("/equipe");
  return r.sent ? { ok: `Convite reenviado para ${inv.email}.` } : { ok: `Novo link do convite para ${inv.email}:`, link: r.url };
}

export async function revokeInvite(inviteId: string) {
  const me = await admin();
  await db
    .update(invitations)
    .set({ revokedAt: new Date() })
    .where(and(eq(invitations.id, inviteId), eq(invitations.orgId, me.orgId)));
  revalidatePath("/equipe");
}

async function memberOf(orgId: string, userId: string) {
  const [u] = await db.select().from(users).where(and(eq(users.id, userId), eq(users.orgId, orgId))).limit(1);
  if (!u) throw new Error("Membro não encontrado.");
  return u;
}

async function activeAdmins(orgId: string, exceptId: string) {
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(users)
    .where(and(eq(users.orgId, orgId), eq(users.role, "admin"), eq(users.active, true), ne(users.id, exceptId)));
  return n;
}

export async function updateMemberRole(userId: string, role: string): Promise<Result> {
  const me = await admin();
  const r = z.enum(schema.roleEnum.enumValues).parse(role);
  const u = await memberOf(me.orgId, userId);
  if (u.role === "admin" && r !== "admin" && (await activeAdmins(me.orgId, u.id)) === 0) {
    return { error: "A organização precisa de pelo menos um administrador." };
  }
  await db.update(users).set({ role: r }).where(eq(users.id, u.id));
  revalidatePath("/", "layout");
  return { ok: `${u.name} agora é ${roles[r].toLowerCase()}.` };
}

export async function setMemberActive(userId: string, active: boolean): Promise<Result> {
  const me = await admin();
  if (userId === me.id) return { error: "Você não pode desativar a própria conta." };
  const u = await memberOf(me.orgId, userId);
  if (!active && u.role === "admin" && (await activeAdmins(me.orgId, u.id)) === 0) {
    return { error: "A organização precisa de pelo menos um administrador ativo." };
  }
  await db.update(users).set({ active }).where(eq(users.id, u.id));
  revalidatePath("/equipe");
  return { ok: active ? `${u.name} foi reativado.` : `${u.name} não consegue mais entrar.` };
}

/** Cria um link de redefinição de senha para um membro (mandado por e-mail; se não sair, o admin copia). */
export async function issueResetLink(userId: string): Promise<Result> {
  const me = await admin();
  const u = await memberOf(me.orgId, userId);
  const r = await createResetFor(u.id, u.email, u.name);
  return r.sent ? { ok: `Link de nova senha enviado para ${u.email}.` } : { ok: `Link de nova senha para ${u.name} (vale 1 hora):`, link: r.url };
}
