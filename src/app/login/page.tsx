import type { Metadata } from "next";
import { whatsappUrl } from "@/lib/site/whatsapp";
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
      eyebrow="Mapa de danos com IA"
      title="Bem-vindo de volta."
      description="Seus projetos, capturas, nuvens de pontos e modelos."
      footer={
        <>
          Acesso só por convite.{" "}
          <Link href={whatsappUrl("pt")} target="_blank" rel="noreferrer" className="font-medium text-foreground underline underline-offset-4">
            Orçamento no WhatsApp
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
