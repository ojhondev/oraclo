import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "../login/auth-shell";
import { ForgotForm } from "../login/account-forms";

export const metadata: Metadata = { title: "Esqueci minha senha" };

export default function ForgotPage() {
  return (
    <AuthShell
      eyebrow="Acesso"
      title="Esqueceu a senha?"
      description="Informe o e-mail da sua conta e enviaremos um link para criar uma nova."
      footer={<>Lembrou? <Link href="/login" className="font-medium text-foreground underline underline-offset-4">Voltar ao login</Link></>}
    >
      <ForgotForm />
    </AuthShell>
  );
}
