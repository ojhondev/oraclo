import type { Metadata } from "next";
import Link from "next/link";
import { Layers } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listAllMaps } from "@/lib/overview";
import { fmtMmPerPixel } from "@/lib/geometry";
import { EmptyState, PageBody, PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Mapas de danos" };

export default async function MapsPage() {
  const user = await requireUser();
  const rows = await listAllMaps(user.orgId);
  return (
    <>
      <PageHeader
        eyebrow={user.orgName}
        title="Mapas de danos"
        description="Ortofotos em escala de todos os projetos, com os danos desenhados. Cada uma exporta prancha em PDF e DXF."
      />
      <PageBody>
        {rows.length === 0 ? (
          <EmptyState icon={Layers} title="Nenhum mapa de danos ainda">
            Gere uma ortofoto a partir de um modelo 3D ou envie uma imagem em escala na página do projeto.
          </EmptyState>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {rows.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/bens/${m.siteId}/ortofotos/${m.id}`}
                  className="group block overflow-hidden rounded-2xl border bg-card transition-colors hover:border-foreground/30"
                >
                  <div className="aspect-[4/3] bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt="" loading="lazy" className="size-full object-contain" />
                  </div>
                  <div className="grid gap-0.5 p-3 leading-tight">
                    <span className="truncate text-[14.5px] group-hover:underline">{m.name}</span>
                    <span className="truncate text-[12.5px] text-muted-foreground">
                      {m.siteName}
                      {m.elementName && ` · ${m.elementName}`}
                    </span>
                    <span className="text-[12.5px] text-muted-foreground">
                      {m.damageCount} danos · {fmtMmPerPixel(m.mmPerPixel)}
                      {m.fromModel && " · do modelo 3D"}
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
