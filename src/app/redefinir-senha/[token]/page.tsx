import type { Metadata } from "next";
import Link from "next/link";
import { findReset } from "@/lib/tokens";
import { AuthShell } from "../../login/auth-shell";
import { ResetForm } from "../../login/account-forms";

export const metadata: Metadata = { title: "Nova senha", robots: { index: false } };

export default async function ResetPage({ params }: PageProps<"/redefinir-senha/[token]">) {
  const { token } = await params;
  const r = await findReset(token);
  if (!r) {
    return (
      <AuthShell eyebrow="Acesso" title="Link expirado." description="Este link de nova senha expirou ou já foi usado. Links valem por 1 hora." footer={<Link href="/login" className="font-medium text-foreground underline underline-offset-4">Voltar ao login</Link>}>
        <Link href="/esqueci-senha" className="grid h-11 place-items-center rounded-full bg-primary text-[14px] font-medium text-primary-foreground">Pedir um novo link</Link>
      </AuthShell>
    );
  }
  return (
    <AuthShell eyebrow={r.email} title={`Nova senha, ${r.name.split(" ")[0]}.`} description="Escolha uma senha com pelo menos 8 caracteres." footer={<Link href="/login" className="font-medium text-foreground underline underline-offset-4">Voltar ao login</Link>}>
      <ResetForm token={token} />
    </AuthShell>
  );
}
