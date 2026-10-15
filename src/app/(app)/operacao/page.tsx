import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, Users } from "lucide-react";
import { requireOps } from "@/lib/auth";
import { listQueue } from "@/lib/bim-orders";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState, PageBody, PageHeader } from "@/components/page-header";
import { BimOrderList } from "@/components/bim-order-list";
import type { BimStatus } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Operação BIM" };

const FILTERS: { key: string; label: string; statuses?: BimStatus[] }[] = [
  { key: "abertos", label: "Em aberto", statuses: ["solicitado", "orcado", "aprovado", "em_modelagem", "em_revisao_interna", "revisao_solicitada", "entregue"] },
  { key: "orcar", label: "Para orçar", statuses: ["solicitado"] },
  { key: "fila", label: "Na fila", statuses: ["aprovado"] },
  { key: "producao", label: "Em produção", statuses: ["em_modelagem", "em_revisao_interna", "revisao_solicitada"] },
  { key: "entregues", label: "Entregues", statuses: ["entregue"] },
  { key: "concluidos", label: "Concluídos", statuses: ["concluido"] },
  { key: "todos", label: "Todos" },
];

export default async function OpsPage({ searchParams }: PageProps<"/operacao">) {
  const user = await requireOps(true);
  const { f } = await searchParams;
  const filter = FILTERS.find((x) => x.key === f) ?? FILTERS[0]!;
  const [rows, all] = await Promise.all([listQueue(user, filter.statuses), listQueue(user)]);
  const count = (x: (typeof FILTERS)[number]) => (x.statuses ? all.filter((r) => x.statuses!.includes(r.status)).length : all.length);
  const partner = user.platformRole === "parceiro";

  return (
    <>
      <PageHeader
        eyebrow="Operação Oraclo"
        title={partner ? "Meus pedidos de modelagem" : "Pedidos de modelo BIM"}
        description={partner ? "Pedidos atribuídos a você: baixe a base, modele e envie a versão para conferência." : "Todos os pedidos dos clientes: orçar, atribuir à equipe ou a parceiros, conferir e entregar."}
        actions={
          !partner && (
            <Button variant="outline" asChild>
              <Link href="/operacao/parceiros">
                <Users /> Equipe e parceiros
              </Link>
            </Button>
          )
        }
      />
      <PageBody className="grid gap-4">
        <nav className="flex flex-wrap gap-1.5">
          {FILTERS.map((x) => (
            <Link
              key={x.key}
              href={x.key === "abertos" ? "/operacao" : `/operacao?f=${x.key}`}
              className={cn("rounded-full border px-3 py-1.5 text-[13px] transition-colors", x.key === filter.key ? "border-foreground bg-foreground text-background" : "hover:bg-muted")}
            >
              {x.label} <span className="opacity-60">{count(x)}</span>
            </Link>
          ))}
        </nav>
        {rows.length === 0 ? (
          <EmptyState icon={Boxes} title="Nenhum pedido aqui" />
        ) : (
          <BimOrderList rows={rows} showOrg showAssignee={!partner} hidePrice={partner} />
        )}
      </PageBody>
    </>
  );
}
