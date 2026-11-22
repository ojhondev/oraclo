import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, isNotNull, and } from "drizzle-orm";
import { FlaskConical } from "lucide-react";
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

  return (
    <>
      <PageHeader
        eyebrow="Laboratório · experimental"
        title="Levantamento cadastral"
        description="Escolha uma vista em escala. Prefira as geradas da nuvem de pontos: elas mostram a fachada exatamente de frente, sem a distorção de molduras e recuos que uma foto retificada tem."
      />
      <PageBody>
        {rows.length === 0 ? (
          <EmptyState icon={FlaskConical} title="Nenhuma vista em escala">
            Crie uma vista calibrada num projeto (fachada retificada ou gerada da nuvem) para testar aqui.
          </EmptyState>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {rows.map((r) => (
              <li key={r.id}>
                <Link href={`/lab/cadastro/${r.id}`} className="group block overflow-hidden rounded-xl border bg-card transition-colors hover:border-foreground/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.url} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
                  <div className="grid gap-0.5 p-3 leading-tight">
                    <span className="truncate text-[14px] font-medium">{r.name}</span>
                    <span className="truncate text-[12.5px] text-muted-foreground">
                      {r.site} · {((r.w * (r.mm ?? 0)) / 1000).toFixed(1).replace(".", ",")} × {((r.h * (r.mm ?? 0)) / 1000).toFixed(1).replace(".", ",")} m
                      {r.fromCloud ? " · da nuvem de pontos" : ""}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </>
  );
}
