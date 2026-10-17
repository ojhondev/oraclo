import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { requireOps } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { PageBody, PageHeader } from "@/components/page-header";
import { LeadStatus } from "./lead-status";

export const metadata: Metadata = { title: "Solicitações" };

const GOALS: Record<string, string> = {
  restauro: "Restauro",
  inspecao: "Inspeção predial",
  retrofit: "Retrofit / reforma",
  compra: "Compra / avaliação",
  patrimonio: "Monitoramento de patrimônio",
  outro: "Outro",
};

/** Pedidos de diagnóstico feitos pelo site público (só a equipe do ArchRay vê). */
export default async function LeadsPage() {
  await requireOps();
  const leads = await db.select().from(schema.leads).orderBy(desc(schema.leads.createdAt)).limit(500);
  const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
  const open = leads.filter((l) => l.status === "novo").length;

  return (
    <>
      <PageHeader
        title="Solicitações"
        description={`Pedidos de diagnóstico feitos pelo site. ${open ? `${open} ${open === 1 ? "novo" : "novos"}.` : "Nenhum pedido novo."}`}
      />
      <PageBody>
        {leads.length === 0 ? (
          <p className="rounded-xl border bg-card p-6 text-[14px] text-muted-foreground">Ainda não chegou nenhum pedido. O formulário fica em /contato no site.</p>
        ) : (
          <ul className="grid gap-3">
            {leads.map((l) => (
              <li key={l.id} className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_auto] sm:p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <p className="text-[16px] font-medium">{l.name}</p>
                    <a href={`mailto:${l.email}`} className="text-[14px] underline underline-offset-4">
                      {l.email}
                    </a>
                    {l.phone && <span className="text-[14px] text-muted-foreground">{l.phone}</span>}
                    <span className="text-[12.5px] text-muted-foreground">
                      {fmt.format(l.createdAt)} · {l.lang === "en" ? "inglês" : "português"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13.5px] text-muted-foreground">
                    {[GOALS[l.goal ?? "outro"], l.building, l.city, l.company].filter(Boolean).join(" · ")}
                  </p>
                  {l.message && <p className="mt-2 text-[14px] leading-6 whitespace-pre-line">{l.message}</p>}
                </div>
                <LeadStatus id={l.id} status={l.status} />
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </>
  );
}
