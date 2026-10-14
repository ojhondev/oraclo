import "server-only";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { hashToken } from "@/lib/email";

const { invitations, organizations, passwordResets, users } = schema;

const looksLikeToken = (t: string) => /^[A-Za-z0-9_-]{40,60}$/.test(t);

/** Convite válido (não aceito, não revogado, no prazo) pelo token do link. */
export async function findInvite(token: string) {
  if (!looksLikeToken(token)) return null;
  const [inv] = await db
    .select({ id: invitations.id, orgId: invitations.orgId, email: invitations.email, role: invitations.role, orgName: organizations.name })
    .from(invitations)
    .innerJoin(organizations, eq(organizations.id, invitations.orgId))
    .where(
      and(
        eq(invitations.tokenHash, hashToken(token)),
        isNull(invitations.acceptedAt),
        isNull(invitations.revokedAt),
        gt(invitations.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return inv ?? null;
}

/** Pedido de nova senha válido (não usado, no prazo) e o usuário ativo dono dele. */
export async function findReset(token: string) {
  if (!looksLikeToken(token)) return null;
  const [r] = await db
    .select({ id: passwordResets.id, userId: users.id, name: users.name, email: users.email })
    .from(passwordResets)
    .innerJoin(users, eq(users.id, passwordResets.userId))
    .where(
      and(
        eq(passwordResets.tokenHash, hashToken(token)),
        isNull(passwordResets.usedAt),
        gt(passwordResets.expiresAt, new Date()),
        eq(users.active, true),
      ),
    )
    .limit(1);
  return r ?? null;
}
