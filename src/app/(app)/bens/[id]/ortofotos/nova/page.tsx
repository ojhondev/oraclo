import type { Metadata } from "next";
import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { editors, requireUser } from "@/lib/auth";
import { getSite } from "@/lib/sites";
import { db, schema } from "@/lib/db";
import { PageBody, PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";
import { UploadForm } from "./upload-form";
import { Rectifier } from "./rectifier";
import { DEMO } from "@/lib/demo";

export const metadata: Metadata = { title: "Nova vista" };

const TIPOS = [
  { id: "fachada", label: "Fachada (foto retificada)", hint: "Foto comum + 4 cantos + medidas reais → imagem plana em escala." },
  { id: "planta", label: "Planta baixa", hint: "Planta, corte ou elevação em imagem; calibre por uma cota." },
  { id: "imagem", label: "Imagem em escala", hint: "Ortofoto pronta de drone, fotogrametria ou laser." },
] as const;

export default async function NewVistaPage({ params, searchParams }: PageProps<"/bens/[id]/ortofotos/nova">) {
  const { id } = await params;
  const sp = await searchParams;
  const tipo = TIPOS.find((t) => t.id === sp.tipo)?.id ?? "fachada";
  const vistoria = typeof sp.vistoria === "string" ? sp.vistoria : null;
  const user = await requireUser(editors);
  const site = await getSite(user.orgId, id);
  const [elements, campaigns] = await Promise.all([
    db
      .select({ id: schema.elements.id, name: schema.elements.name })
      .from(schema.elements)
      .where(eq(schema.elements.siteId, id))
      .orderBy(asc(schema.elements.sortOrder), asc(schema.elements.createdAt)),
    db
      .select({ id: schema.campaigns.id, name: schema.campaigns.name })
      .from(schema.campaigns)
      .where(eq(schema.campaigns.siteId, id))
      .orderBy(desc(schema.campaigns.date), desc(schema.campaigns.createdAt)),
  ]);
  const defaultCampaignId = campaigns.find((c) => c.id === vistoria)?.id ?? campaigns[0]?.id ?? null;
  const qs = vistoria ? `&vistoria=${vistoria}` : "";

  return (
    <>
      <PageHeader
        eyebrow={site.name}
        title="Nova vista"
        description="A imagem em escala do imóvel onde você aponta os danos. Escolha de onde ela vem."
      />
      <PageBody>
        <div className="mb-6 grid gap-2 sm:grid-cols-3">
          {TIPOS.map((t) => (
            <Link
              key={t.id}
              href={`/bens/${site.id}/ortofotos/nova?tipo=${t.id}${qs}`}
              className={cn(
                "rounded-xl border px-4 py-3 transition-colors",
                t.id === tipo ? "border-foreground bg-card" : "text-muted-foreground hover:border-foreground/40",
              )}
            >
              <div className="text-sm font-medium text-foreground">{t.label}</div>
              <div className="mt-0.5 text-[12px]">{t.hint}</div>
            </Link>
          ))}
        </div>
        {tipo === "fachada" ? (
          <Rectifier
            siteId={site.id}
            orgId={user.orgId}
            elements={elements}
            campaigns={campaigns}
            defaultCampaignId={defaultCampaignId}
            demo={
              site.isDemo
                ? { src: DEMO.photo, targets: DEMO.targets, name: DEMO.vistaName, widthM: DEMO.widthM, heightM: DEMO.heightM, credit: DEMO.credit, lineGuide: DEMO.lineGuide, check: DEMO.check }
                : undefined
            }
          />
        ) : (
          <UploadForm
            key={tipo}
            kind={tipo}
            siteId={site.id}
            orgId={user.orgId}
            elements={elements}
            campaigns={campaigns}
            defaultCampaignId={defaultCampaignId}
          />
        )}
      </PageBody>
    </>
  );
}
