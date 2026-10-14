import type { Metadata } from "next";
import { editors, requireUser } from "@/lib/auth";
import { getSite } from "@/lib/sites";
import { PageBody, PageHeader } from "@/components/page-header";
import { ConfirmButton } from "@/components/confirm-button";
import { deleteSite, updateSite } from "../../actions";
import { SiteForm } from "../../site-form";

export const metadata: Metadata = { title: "Editar projeto" };

export default async function EditSitePage({ params }: PageProps<"/bens/[id]/editar">) {
  const { id } = await params;
  const user = await requireUser(editors);
  const site = await getSite(user.orgId, id);
  return (
    <>
      <PageHeader
        eyebrow={site.name}
        title="Editar projeto"
        actions={
          user.role === "admin" && (
            <ConfirmButton
              action={deleteSite.bind(null, id)}
              title="Excluir este projeto?"
              description="Áreas, campanhas, capturas, modelos e danos registrados serão apagados. Não dá para desfazer."
              label="Excluir projeto"
            />
          )
        }
      />
      <PageBody>
        <SiteForm action={updateSite.bind(null, id)} site={site} cancelHref={`/bens/${id}`} />
      </PageBody>
    </>
  );
}
