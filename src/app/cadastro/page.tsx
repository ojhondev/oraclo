import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { AuthShell } from "../login/auth-shell";
import { SignupForm } from "../login/auth-forms";

export const metadata: Metadata = { title: "Criar conta" };

export default async function SignupPage() {
  if (await getUser()) redirect("/");
  return (
    <AuthShell
      eyebrow="Comece agora"
      title="Crie sua conta."
      description="Para escritórios de restauro, arquitetos, dioceses e órgãos de patrimônio."
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            Entrar
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
