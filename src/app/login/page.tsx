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
      eyebrow="Levantamento 3D e BIM"
      title="Bem-vindo de volta."
      description="Seus projetos, capturas, nuvens de pontos e modelos."
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
      <p className="mt-4 text-center text-[13.5px]">
        <Link href="/esqueci-senha" className="text-muted-foreground underline underline-offset-4 hover:text-foreground">Esqueci minha senha</Link>
      </p>
    </AuthShell>
  );
}
