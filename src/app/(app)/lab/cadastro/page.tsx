import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, isNotNull, and } from "drizzle-orm";
import { FlaskConical, PenTool, Plus, ScanSearch } from "lucide-react";
import { listDrawings } from "@/lib/cad/queries";
import { createBlankDrawing, createDrawingFromVista } from "@/app/(editor)/editor/actions";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { EmptyState, PageBody, PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Laboratório · Levantamento cadastral" };

/** Laboratório (experimental, só admin): escolher uma vista em escala para gerar o desenho da fachada. */
export default async function LabCadastroPage() {
  const user = await requireUser(["admin"]);
  const { orthophotos: o, sites: s } = schema;
  const rows = await db
    .select({ id: o.id, name: o.name, kind: o.kind, url: o.url, mm: o.mmPerPixel, w: o.widthPx, h: o.heightPx, site: s.name, fromCloud: o.outputId })
    .from(o)
    .innerJoin(s, eq(s.id, o.siteId))
    .where(and(eq(s.orgId, user.orgId), isNotNull(o.mmPerPixel)))
    .orderBy(desc(o.createdAt))
    .limit(60);
  const drawings = await listDrawings(user.orgId);
  const fmtDate = (d: Date) => d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

  return (
    <>
      <PageHeader
        eyebrow="Laboratório · experimental"
        title="Levantamento cadastral"
        description="Escolha uma vista em escala. Prefira as geradas da nuvem de pontos: elas mostram a fachada exatamente de frente, sem a distorção de molduras e recuos que uma foto retificada tem."
      />
      <PageBody>
        <section className="mb-8 grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-[15px] font-medium">
              <PenTool className="size-4" /> Desenhos (ArchRay CAD)
            </h2>
            <form action={createBlankDrawing}>
              <button className="flex h-8 items-center gap-1.5 rounded-md border px-3 text-[13px] hover:bg-muted">
                <Plus className="size-4" /> Desenho em branco
              </button>
            </form>
          </div>
          {drawings.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">Nenhum desenho ainda. Comece em branco ou por uma vista abaixo (a foto entra como camada de fundo, em escala).</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {drawings.map((d) => (
                <li key={d.id}>
                  <Link href={`/editor/${d.id}`} className="grid gap-0.5 rounded-lg border bg-card p-3 leading-tight hover:border-foreground/40">
                    <span className="truncate text-[14px] font-medium">{d.name}</span>
                    <span className="truncate text-[12px] text-muted-foreground">
                      {d.vista ? `Sobre: ${d.vista} · ` : ""}editado {fmtDate(d.updatedAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <h2 className="mb-3 text-[15px] font-medium">Vistas em escala</h2>
        {rows.length === 0 ? (
          <EmptyState icon={FlaskConical} title="Nenhuma vista em escala">
            Crie uma vista calibrada num projeto (fachada retificada ou gerada da nuvem) para testar aqui.
          </EmptyState>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {rows.map((r) => (
              <li key={r.id}>
                <div className="overflow-hidden rounded-xl border bg-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.url} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
                  <div className="grid gap-0.5 p-3 leading-tight">
                    <span className="truncate text-[14px] font-medium">{r.name}</span>
                    <span className="truncate text-[12.5px] text-muted-foreground">
                      {r.site} · {((r.w * (r.mm ?? 0)) / 1000).toFixed(1).replace(".", ",")} × {((r.h * (r.mm ?? 0)) / 1000).toFixed(1).replace(".", ",")} m
                      {r.fromCloud ? " · da nuvem de pontos" : ""}
                    </span>
                  </div>
                  <div className="flex gap-2 border-t p-2">
                    <form action={createDrawingFromVista.bind(null, r.id)} className="flex-1">
                      <button className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-foreground text-[13px] text-background hover:opacity-90">
                        <PenTool className="size-3.5" /> Novo desenho
                      </button>
                    </form>
                    <Link href={`/lab/cadastro/${r.id}`} title="Detecção automática (experimental)" className="flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[13px] hover:bg-muted">
                      <ScanSearch className="size-3.5" /> Detectar
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </>
  );
}
