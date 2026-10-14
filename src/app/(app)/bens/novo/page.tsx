import type { Metadata } from "next";
import { editors, requireUser } from "@/lib/auth";
import { PageBody, PageHeader } from "@/components/page-header";
import { createSite } from "../actions";
import { SiteForm } from "../site-form";

export const metadata: Metadata = { title: "Novo projeto" };

export default async function NewSitePage() {
  await requireUser(editors);
  return (
    <>
      <PageHeader eyebrow="Projetos" title="Novo projeto" description="A edificação, obra ou instalação a levantar — reforma, retrofit, indústria ou patrimônio." />
      <PageBody>
        <SiteForm action={createSite} cancelHref="/" />
      </PageBody>
    </>
  );
}
