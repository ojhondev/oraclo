import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { editors, requireUser } from "@/lib/auth";
import { getSite } from "@/lib/sites";
import { db, schema } from "@/lib/db";
import { PageBody, PageHeader } from "@/components/page-header";
import { UploadForm } from "./upload-form";

export const metadata: Metadata = { title: "Enviar ortofoto" };

export default async function NewOrthophotoPage({ params }: PageProps<"/bens/[id]/ortofotos/nova">) {
  const { id } = await params;
  const user = await requireUser(editors);
  const site = await getSite(user.orgId, id);
  const elements = await db
    .select({ id: schema.elements.id, name: schema.elements.name })
    .from(schema.elements)
    .where(eq(schema.elements.siteId, id))
    .orderBy(asc(schema.elements.sortOrder), asc(schema.elements.createdAt));
  return (
    <>
      <PageHeader
        eyebrow={site.name}
        title="Enviar ortofoto"
        description="A imagem em escala onde você vai desenhar o mapa de danos. Ela pode vir do Oraclo, de outro software de fotogrametria ou do laser."
      />
      <PageBody>
        <UploadForm siteId={site.id} orgId={user.orgId} elements={elements} />
      </PageBody>
    </>
  );
}
