import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Plus, Video } from "lucide-react";
import { capturers, requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { EmptyState, PageBody, PageHeader } from "@/components/page-header";
import { quickCapture } from "../bens/[id]/capturas/actions";

export const metadata: Metadata = { title: "Capturar" };

/** Atalho de campo: escolher o projeto e começar a filmar, sem passar pelas vistorias. */
export default async function CapturePickerPage() {
  const user = await requireUser(capturers);
  const sites = await db
    .select({ id: schema.sites.id, name: schema.sites.name, city: schema.sites.city })
    .from(schema.sites)
    .where(eq(schema.sites.orgId, user.orgId))
    .orderBy(desc(schema.sites.updatedAt))
    .limit(40);

  return (
    <>
      <PageHeader
        eyebrow={user.orgName}
        title="Capturar"
        description="Escolha o projeto e filme a fachada. O ArchRay cria a vistoria do dia e gera o modelo 3D com a nuvem de pontos."
        actions={
          <Button variant="outline" asChild>
            <Link href="/bens/novo">
              <Plus /> Novo projeto
            </Link>
          </Button>
        }
      />
      <PageBody>
        {sites.length === 0 ? (
          <EmptyState icon={Video} title="Nenhum projeto ainda">
            Crie o primeiro projeto para começar a capturar.
          </EmptyState>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {sites.map((s) => (
              <li key={s.id}>
                <form action={quickCapture.bind(null, s.id)}>
                  <button type="submit" className="flex w-full items-center gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-foreground/40">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-background">
                      <Video className="size-5" />
                    </span>
                    <span className="grid min-w-0 leading-tight">
                      <span className="truncate text-[14.5px] font-medium">{s.name}</span>
                      {s.city && <span className="truncate text-[12.5px] text-muted-foreground">{s.city}</span>}
                    </span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </>
  );
}
