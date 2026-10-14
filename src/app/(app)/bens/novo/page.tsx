import type { Metadata } from "next";
import { editors, requireUser } from "@/lib/auth";
import { PageBody, PageHeader } from "@/components/page-header";
import { createSite } from "../actions";
import { SiteForm } from "../site-form";

export const metadata: Metadata = { title: "Novo bem" };

export default async function NewSitePage() {
  await requireUser(editors);
  return (
    <>
      <PageHeader eyebrow="Bens" title="Cadastrar bem" description="Igreja, casarão, conjunto ou monumento a documentar." />
      <PageBody>
        <SiteForm action={createSite} cancelHref="/" />
      </PageBody>
    </>
  );
}
