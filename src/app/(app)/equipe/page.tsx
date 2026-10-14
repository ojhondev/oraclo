import type { Metadata } from "next";
import { and, asc, desc, eq, gt, isNull } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { emailEnabled } from "@/lib/email";
import { daysUntil } from "@/lib/format";
import { PageBody, PageHeader } from "@/components/page-header";
import { InviteForm, InviteRow, MemberRow } from "./team";

export const metadata: Metadata = { title: "Equipe" };

export default async function TeamPage() {
  const me = await requireUser();
  const isAdmin = me.role === "admin";
  const { users, invitations } = schema;
  const [members, invites] = await Promise.all([
    db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role, active: users.active, professionalId: users.professionalId })
      .from(users)
      .where(eq(users.orgId, me.orgId))
      .orderBy(desc(users.active), asc(users.name)),
    isAdmin
      ? db
          .select({ id: invitations.id, email: invitations.email, role: invitations.role, expiresAt: invitations.expiresAt })
          .from(invitations)
          .where(and(eq(invitations.orgId, me.orgId), isNull(invitations.acceptedAt), isNull(invitations.revokedAt), gt(invitations.expiresAt, new Date())))
          .orderBy(desc(invitations.createdAt))
      : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeader eyebrow={me.orgName} title="Equipe" description="Quem acessa os bens, capturas e mapas de danos desta organização." />
      <PageBody className="grid max-w-4xl gap-5">
        {isAdmin && (
          <section className="grid gap-3 rounded-2xl border bg-card p-5">
            <div>
              <h2 className="text-[17px] font-medium">Convidar pessoa</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                A pessoa recebe um link para criar a senha e entra direto nesta organização.
                {!emailEnabled() && " O envio de e-mail ainda não está configurado: o link aparece aqui para você copiar e mandar (WhatsApp, por exemplo)."}
              </p>
            </div>
            <InviteForm />
            <dl className="grid gap-1 text-[12.5px] text-muted-foreground sm:grid-cols-2">
              <div><dt className="inline font-medium text-foreground">Administrador</dt> — tudo, inclusive equipe e excluir bens.</div>
              <div><dt className="inline font-medium text-foreground">Técnico</dt> — cadastra, captura, desenha danos e exporta.</div>
              <div><dt className="inline font-medium text-foreground">Equipe de campo</dt> — só faz capturas (fotos e medidas).</div>
              <div><dt className="inline font-medium text-foreground">Leitor</dt> — só visualiza e baixa.</div>
            </dl>
          </section>
        )}

        <section className="rounded-2xl border bg-card">
          <h2 className="border-b px-5 py-3 text-[15px] font-medium">Membros ({members.filter((m) => m.active).length})</h2>
          <ul className="divide-y">
            {members.map((m) => (
              <MemberRow key={m.id} member={m} isMe={m.id === me.id} canManage={isAdmin} />
            ))}
          </ul>
        </section>

        {isAdmin && invites.length > 0 && (
          <section className="rounded-2xl border bg-card">
            <h2 className="border-b px-5 py-3 text-[15px] font-medium">Convites pendentes ({invites.length})</h2>
            <ul className="divide-y">
              {invites.map((i) => (
                <InviteRow key={i.id} invite={{ id: i.id, email: i.email, role: i.role, daysLeft: daysUntil(i.expiresAt) }} />
              ))}
            </ul>
          </section>
        )}
      </PageBody>
    </>
  );
}
