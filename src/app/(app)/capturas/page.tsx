import type { Metadata } from "next";
import Link from "next/link";
import { Box, Camera, Images } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { captureStatusCounts, listAllCaptures } from "@/lib/overview";
import { IMPORT_DEVICE } from "@/lib/captures";
import { captureStatuses } from "@/lib/labels";
import { fmtBytes, fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageBody, PageHeader } from "@/components/page-header";
import type { CaptureStatus } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Capturas" };

const FILTERS: { key: string; label: string; statuses?: CaptureStatus[] }[] = [
  { key: "todas", label: "Todas" },
  { key: "andamento", label: "Em campo", statuses: ["rascunho", "enviando"] },
  { key: "fila", label: "Aguardando processamento", statuses: ["na_fila"] },
  { key: "processando", label: "Processando", statuses: ["processando"] },
  { key: "concluidas", label: "Concluídas", statuses: ["concluida"] },
  { key: "falhas", label: "Com falha", statuses: ["falhou"] },
];

export default async function CapturesPage({ searchParams }: PageProps<"/capturas">) {
  const user = await requireUser();
  const { status } = await searchParams;
  const filter = FILTERS.find((f) => f.key === status) ?? FILTERS[0]!;
  const [rows, counts] = await Promise.all([listAllCaptures(user.orgId, filter.statuses), captureStatusCounts(user.orgId)]);
  const countOf = (f: (typeof FILTERS)[number]) =>
    f.statuses ? f.statuses.reduce((a, s) => a + (counts[s] ?? 0), 0) : Object.values(counts).reduce((a, n) => a + (n ?? 0), 0);

  return (
    <>
      <PageHeader
        eyebrow={user.orgName}
        title="Capturas"
        description="Fotos de campo, fotos enviadas e modelos importados de todos os bens — e o que está esperando processamento."
      />
      <PageBody className="grid gap-4">
        <nav className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={f.key === "todas" ? "/capturas" : `/capturas?status=${f.key}`}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                f.key === filter.key ? "border-foreground bg-foreground text-background" : "hover:bg-muted",
              )}
            >
              {f.label} <span className="opacity-60">{countOf(f)}</span>
            </Link>
          ))}
        </nav>
        {rows.length === 0 ? (
          <EmptyState icon={Camera} title="Nenhuma captura aqui">
            Abra um bem, crie uma campanha e escolha Capturar com celular, Enviar fotos ou Importar modelo 3D.
          </EmptyState>
        ) : (
          <ul className="divide-y rounded-2xl border bg-card">
            {rows.map((c) => {
              const Icon = c.mode === "laser" ? Box : c.device === IMPORT_DEVICE ? Images : Camera;
              const origin =
                c.mode === "laser" ? "Modelo importado" : c.device === IMPORT_DEVICE ? "Fotos enviadas" : `Celular${c.device ? ` · ${c.device}` : ""}`;
              return (
                <li key={c.id}>
                  <Link href={`/bens/${c.siteId}/capturas/${c.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-muted/50">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
                      <Icon className="size-4" />
                    </span>
                    <span className="grid min-w-0 flex-1 leading-tight">
                      <span className="truncate text-[14.5px]">
                        {c.siteName}
                        {c.elementName && <span className="text-muted-foreground"> · {c.elementName}</span>}
                      </span>
                      <span className="truncate text-[12.5px] text-muted-foreground">
                        {c.campaignName} · {origin} · {fmtDate(c.createdAt)}
                      </span>
                    </span>
                    {c.mode !== "laser" && (
                      <span className="text-[13px] text-muted-foreground tabular-nums">
                        {c.fileCount} fotos · {fmtBytes(c.totalBytes)}
                      </span>
                    )}
                    <Badge variant={c.status === "concluida" ? "default" : "secondary"}>{captureStatuses[c.status]}</Badge>
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
