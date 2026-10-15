import type { Metadata } from "next";
import { requireOps } from "@/lib/auth";
import { listModelers } from "@/lib/bim-orders";
import { PageBody, PageHeader } from "@/components/page-header";
import { PartnerForm, PartnerRow } from "./partners";

export const metadata: Metadata = { title: "Equipe e parceiros" };

export default async function PartnersPage() {
  const me = await requireOps();
  const people = await listModelers();
  const envOps = (process.env.PLATFORM_OPERATORS ?? "").toLowerCase().split(",").map((s) => s.trim());
  return (
    <>
      <PageHeader
        eyebrow="Operação Oraclo"
        title="Equipe e parceiros"
        description="Quem pode orçar, receber e entregar pedidos de modelo BIM. A pessoa precisa ter uma conta no Oraclo."
      />
      <PageBody className="grid max-w-3xl gap-5">
        <section className="grid gap-3 rounded-2xl border bg-card p-5">
          <h2 className="text-[16px] font-medium">Adicionar</h2>
          <PartnerForm />
          <dl className="grid gap-1 text-[12.5px] text-muted-foreground">
            <div><dt className="inline font-medium text-foreground">Operador</dt> — vê todos os pedidos, orça, atribui, confere e entrega.</div>
            <div><dt className="inline font-medium text-foreground">Parceiro modelador</dt> — vê só os pedidos atribuídos a ele; envia versões para conferência (não vê preços).</div>
          </dl>
        </section>
        <section className="rounded-2xl border bg-card">
          <h2 className="border-b px-5 py-3 text-[15px] font-medium">Pessoas ({people.length})</h2>
          <ul className="divide-y">
            {people.map((p) => (
              <PartnerRow
                key={p.id}
                person={{ id: p.id, name: p.name, email: p.email, orgName: p.orgName, role: envOps.includes(p.email.toLowerCase()) ? "fixo" : (p.platformRole ?? "parceiro") }}
                isMe={p.id === me.id}
              />
            ))}
          </ul>
        </section>
      </PageBody>
    </>
  );
}
