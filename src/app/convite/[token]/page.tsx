import type { Metadata } from "next";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { findInvite } from "@/lib/tokens";
import { roles } from "@/lib/labels";
import { logoutToInvite } from "../../login/actions";
import { AuthShell } from "../../login/auth-shell";
import { AcceptInviteForm } from "../../login/account-forms";

export const metadata: Metadata = { title: "Convite", robots: { index: false } };

export default async function InvitePage({ params }: PageProps<"/convite/[token]">) {
  const { token } = await params;
  const [inv, user] = await Promise.all([findInvite(token), getUser()]);

  if (!inv) {
    return (
      <AuthShell eyebrow="Convite" title="Convite inválido." description="O link expirou, já foi usado ou foi cancelado. Peça um novo convite ao administrador da equipe." footer={<Link href="/login" className="font-medium text-foreground underline underline-offset-4">Ir para o login</Link>}>
        <p className="text-[14px] text-muted-foreground">Convites valem por 7 dias.</p>
      </AuthShell>
    );
  }

  if (user) {
    return (
      <AuthShell eyebrow={inv.orgName} title="Você já está conectado." description={`Este convite é para ${inv.email}. Saia da conta atual (${user.email}) para aceitá-lo.`} footer={<Link href="/" className="font-medium text-foreground underline underline-offset-4">Voltar ao Oraclo</Link>}>
        <form action={logoutToInvite.bind(null, token)}>
          <button className="h-11 w-full rounded-full bg-primary text-[14px] font-medium text-primary-foreground">Sair e aceitar o convite</button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={`Convite · ${roles[inv.role]}`}
      title={`Entre na equipe ${inv.orgName}.`}
      description="Crie sua senha para acessar os projetos, capturas e modelos da equipe."
      footer={<>Já tem conta? <Link href="/login" className="font-medium text-foreground underline underline-offset-4">Entrar</Link></>}
    >
      <AcceptInviteForm token={token} email={inv.email} />
    </AuthShell>
  );
}
