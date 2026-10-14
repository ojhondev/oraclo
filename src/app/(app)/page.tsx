import type { Metadata } from "next";
import Link from "next/link";
import { Landmark, MapPin, Plus, ShieldCheck } from "lucide-react";
import { requireUser, editors } from "@/lib/auth";
import { listSites } from "@/lib/sites";
import { siteKinds, protectionLevels } from "@/lib/labels";
import { fmtDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageBody, PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Bens" };

export default async function SitesPage() {
  const user = await requireUser();
  const sites = await listSites(user.orgId);
  const canEdit = editors.includes(user.role);

  return (
    <>
      <PageHeader
        eyebrow={user.orgName}
        title="Bens"
        description="O patrimônio que sua equipe documenta: capturas, nuvens de pontos e mapas de danos."
        actions={
          canEdit && (
            <Button asChild>
              <Link href="/bens/novo">
                <Plus /> Cadastrar bem
              </Link>
            </Button>
          )
        }
      />
      <PageBody>
        {sites.length === 0 ? (
          <EmptyState icon={Landmark} title="Nenhum bem cadastrado">
            Comece cadastrando a igreja, casarão ou conjunto que vai documentar. Depois divida em partes
            (fachadas, nave, retábulos) e registre as capturas.
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {sites.map((s) => (
              <Link
                key={s.id}
                href={`/bens/${s.id}`}
                className="group overflow-hidden rounded-xl border bg-card transition-colors hover:border-brand/40"
              >
                <div className="relative h-28 bg-[#16181b]">
                  <div className="dot-field absolute inset-0 opacity-50 [mask-image:linear-gradient(to_top,transparent,black)]" />
                  <Badge variant="secondary" className="absolute top-3 left-3 bg-white/90">
                    {siteKinds[s.kind]}
                  </Badge>
                  {s.protection !== "nenhuma" && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[11px] font-medium text-white">
                      <ShieldCheck className="size-3" /> {s.protectionBody || protectionLevels[s.protection]}
                    </span>
                  )}
                </div>
                <div className="grid gap-2 p-4">
                  <h2 className="font-serif text-xl leading-tight group-hover:text-brand">{s.name}</h2>
                  {(s.city || s.state) && (
                    <p className="flex items-center gap-1 text-[13px] text-muted-foreground">
                      <MapPin className="size-3.5" /> {[s.city, s.state].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
                    <span><b className="font-medium text-foreground">{s.elementCount}</b> partes</span>
                    <span><b className="font-medium text-foreground">{s.campaignCount}</b> campanhas</span>
                    <span><b className="font-medium text-foreground">{s.damageCount}</b> danos</span>
                    <span className="ml-auto">atualizado {fmtDate(s.updatedAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </PageBody>
    </>
  );
}
