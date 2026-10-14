import type { Metadata } from "next";
import Link from "next/link";
import { Box, Download, FileText } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listAllModels } from "@/lib/overview";
import { MODEL_FORMATS, type OutputMeta } from "@/lib/model-formats";
import { fmtBytes, fmtDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { EmptyState, PageBody, PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Modelos 3D" };

export default async function ModelsPage() {
  const user = await requireUser();
  const rows = await listAllModels(user.orgId);
  return (
    <>
      <PageHeader
        eyebrow={user.orgName}
        title="Modelos 3D"
        description="Nuvens de pontos e malhas de todos os bens. Abra no navegador para medir e gerar ortofotos em escala."
      />
      <PageBody>
        {rows.length === 0 ? (
          <EmptyState icon={Box} title="Nenhum modelo ainda">
            Os modelos aparecem quando uma captura é processada ou quando você importa uma nuvem ou malha (laser, drone, outro software) numa campanha.
          </EmptyState>
        ) : (
          <ul className="divide-y rounded-2xl border bg-card">
            {rows.map((o) => {
              const viewable = !!(o.meta as OutputMeta | null)?.viewable;
              const Icon = o.kind === "pdf" ? FileText : Box;
              return (
                <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
                    <Icon className="size-4" />
                  </span>
                  <span className="grid min-w-0 flex-1 leading-tight">
                    <span className="truncate text-[14.5px]">{o.name}</span>
                    <span className="truncate text-[12.5px] text-muted-foreground">
                      <Link href={`/bens/${o.siteId}`} className="hover:underline">
                        {o.siteName}
                      </Link>{" "}
                      · {MODEL_FORMATS[o.format]?.label ?? o.format.toUpperCase()} · {fmtBytes(o.bytes)} · {fmtDate(o.createdAt)}
                    </span>
                  </span>
                  <span className="flex gap-1.5">
                    {viewable && (
                      <Button size="sm" asChild>
                        <Link href={`/bens/${o.siteId}/modelos/${o.id}`}>Ver em 3D</Link>
                      </Button>
                    )}
                    {o.url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`${o.url}?download=1`}>
                          <Download /> Baixar
                        </a>
                      </Button>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </PageBody>
    </>
  );
}
