import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { AuthShell } from "../login/auth-shell";

export const metadata: Metadata = { title: "Acesso por convite" };

/** Cadastro fechado: o ArchRay é, por enquanto, de uso interno do Estúdio Restaura. */
export default async function SignupPage() {
  if (await getUser()) redirect("/");
  return (
    <AuthShell
      eyebrow="Acesso por convite"
      title="Uso interno, por enquanto."
      description="O ArchRay é a ferramenta de diagnóstico do Estúdio Restaura. Por enquanto, novas contas são criadas só por convite da nossa equipe."
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            Entrar
          </Link>
        </>
      }
    >
      <div className="grid gap-3 text-center text-[14.5px] leading-6">
        <p className="text-muted-foreground">Recebeu um convite? Abra o link que chegou por e-mail ou WhatsApp para criar a sua senha.</p>
        <p className="text-muted-foreground">Quer um diagnóstico do seu imóvel? Fale com um arquiteto do Estúdio Restaura.</p>
        <Link href="/contato" className="mt-2 inline-flex h-11 items-center justify-center rounded-[10px] bg-foreground px-5 font-medium text-background hover:opacity-85">
          Solicitar diagnóstico
        </Link>
      </div>
    </AuthShell>
  );
}
