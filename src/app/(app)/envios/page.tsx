import type { Metadata } from "next";
import { capturers, requireUser } from "@/lib/auth";
import { PageBody, PageHeader } from "@/components/page-header";
import { EnviosClient } from "./envios-client";

export const metadata: Metadata = { title: "Envios" };

/** Envios: o que foi gravado neste aparelho e ainda não subiu. Em campo só se grava; o envio fica para cá. */
export default async function EnviosPage() {
  const user = await requireUser(capturers);
  return (
    <>
      <PageHeader
        eyebrow={user.orgName}
        title="Envios"
        description="Gravou em campo? Aqui ficam as capturas guardadas neste celular. Abra no escritório, com Wi-Fi e carregador, e deixe enviando."
      />
      <PageBody>
        <EnviosClient />
      </PageBody>
    </>
  );
}
