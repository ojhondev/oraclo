import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { editors, requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { IMPORT_DEVICE } from "@/lib/captures";
import { fmtDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { EmptyState, PageBody, PageHeader } from "@/components/page-header";
import { Building2 } from "lucide-react";
import { OrderForm } from "./order-form";

export const metadata: Metadata = { title: "Solicitar modelo BIM" };

export default async function NewOrderPage({ searchParams }: PageProps<"/bim/novo">) {
  const user = await requireUser(editors);
  const { projeto } = await searchParams;
  const { sites, captures, campaigns, elements } = schema;
  const siteRows = await db.select({ value: sites.id, label: sites.name }).from(sites).where(eq(sites.orgId, user.orgId)).orderBy(asc(sites.name));

  // bases possíveis: capturas concluídas (fotos/vídeo processados) e modelos importados
  const caps = siteRows.length
    ? await db
        .select({ id: captures.id, siteId: campaigns.siteId, mode: captures.mode, device: captures.device, status: captures.status, campaign: campaigns.name, date: campaigns.date, element: elements.name })
        .from(captures)
        .innerJoin(campaigns, eq(campaigns.id, captures.campaignId))
        .leftJoin(elements, eq(elements.id, captures.elementId))
        .where(and(inArray(campaigns.siteId, siteRows.map((s) => s.value)), inArray(captures.status, ["concluida", "processando", "na_fila"])))
        .orderBy(desc(captures.createdAt))
    : [];
  const basesBySite: Record<string, { value: string; label: string }[]> = {};
  for (const c of caps) {
    const kind = c.mode === "laser" ? "Modelo importado" : c.device === IMPORT_DEVICE ? "Fotos enviadas" : "Captura pelo celular";
    const st = c.status === "concluida" ? "" : " (em processamento)";
    (basesBySite[c.siteId] ??= []).push({ value: c.id, label: `${kind} · ${c.element ?? c.campaign} · ${fmtDate(c.date)}${st}` });
  }

  return (
    <>
      <PageHeader
        eyebrow="Modelos BIM"
        title="Solicitar modelo BIM"
        description="Diga o que precisa: a equipe Oraclo confere a nuvem de pontos e envia o orçamento. Entregamos em Revit, Archicad e IFC."
      />
      <PageBody>
        {siteRows.length === 0 ? (
          <EmptyState icon={Building2} title="Crie um projeto primeiro">
            O pedido de modelo BIM fica ligado a um projeto e à captura ou nuvem de pontos dele.
            <div className="mt-3">
              <Button asChild size="sm">
                <Link href="/bens/novo">Novo projeto</Link>
              </Button>
            </div>
          </EmptyState>
        ) : (
          <OrderForm sites={siteRows} basesBySite={basesBySite} defaultSiteId={siteRows.some((s) => s.value === projeto) ? (projeto as string) : undefined} />
        )}
      </PageBody>
    </>
  );
}
