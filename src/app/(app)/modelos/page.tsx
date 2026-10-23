import type { Metadata } from "next";
import Link from "next/link";
import { Box } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listAllModels } from "@/lib/overview";
import { fmtBytes, fmtDate } from "@/lib/format";
import type { ModelScale } from "@/lib/model-formats";
import { BetaBadge } from "@/components/beta-badge";
import { EmptyState, PageBody, PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Modelo 3D (beta)" };

export default async function ModelsPage() {
  const user = await requireUser();
  const rows = await listAllModels(user.orgId);
  return (
    <>
      <PageHeader
        eyebrow={user.orgName}
        title={
          <span className="inline-flex items-center gap-3">
            Modelo 3D <BetaBadge className="translate-y-0.5" />
          </span>
        }
        description="Módulo em teste: importe um modelo 3D (GLB, nuvem de pontos), calibre a escala e gere vistas em escala das paredes para o mapa de danos. O núcleo do ArchRay continua sendo o mapa de danos 2D."
      />
      <PageBody>
        {rows.length === 0 ? (
          <EmptyState icon={Box} title="Nenhum modelo 3D ainda">
            Abra um projeto, vá na aba Modelo 3D e importe um arquivo exportado do Scaniverse, Polycam ou de outro software.
          </EmptyState>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((m) => {
              const scale = (m.meta as { scale?: ModelScale } | null)?.scale;
              return (
                <li key={m.id} className="min-w-0">
                  <Link
                    href={`/bens/${m.siteId}/modelos/${m.id}`}
                    className="group grid gap-1 rounded-2xl border bg-card p-4 transition-colors hover:border-foreground/30"
                  >
                    <span className="flex items-center gap-2">
                      <Box className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-[14.5px] group-hover:underline">{m.name}</span>
                    </span>
                    <span className="truncate text-[12.5px] text-muted-foreground">{m.siteName}</span>
                    <span className="text-[12.5px] text-muted-foreground">
                      {m.format.toUpperCase()} · {fmtBytes(m.bytes)} · {scale ? "escala calibrada" : "sem calibração"} · {fmtDate(m.createdAt)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </PageBody>
    </>
  );
}
