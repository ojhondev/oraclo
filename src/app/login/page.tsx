import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { AuthShell } from "./auth-shell";
import { LoginForm } from "./auth-forms";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage() {
  if (await getUser()) redirect("/");
  return (
    <AuthShell
      eyebrow="Documentação de patrimônio"
      title="Bem-vindo de volta."
      description="Seus bens, capturas, nuvens de pontos e mapas de danos."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-medium text-foreground underline underline-offset-4">
            Criar conta
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
