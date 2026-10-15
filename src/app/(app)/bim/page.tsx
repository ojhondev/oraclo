import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, Plus } from "lucide-react";
import { editors, requireUser } from "@/lib/auth";
import { listOrgOrders } from "@/lib/bim-orders";
import { Button } from "@/components/ui/button";
import { EmptyState, PageBody, PageHeader } from "@/components/page-header";
import { BimOrderList } from "@/components/bim-order-list";

export const metadata: Metadata = { title: "Modelos BIM" };

export default async function BimOrdersPage() {
  const user = await requireUser();
  const rows = await listOrgOrders(user.orgId);
  return (
    <>
      <PageHeader
        eyebrow={user.orgName}
        title="Modelos BIM"
        description="Peça o modelo BIM a partir da nuvem de pontos e acompanhe orçamento, modelagem, entregas e revisões."
        actions={
          editors.includes(user.role) && (
            <Button asChild>
              <Link href="/bim/novo">
                <Plus /> Solicitar modelo BIM
              </Link>
            </Button>
          )
        }
      />
      <PageBody>
        {rows.length === 0 ? (
          <EmptyState icon={Boxes} title="Nenhum pedido de modelo BIM ainda">
            Escolha o projeto, a área em m², o nível de detalhe (LOD), as disciplinas e os formatos (Revit, Archicad, IFC). A equipe envia o orçamento para você aprovar.
          </EmptyState>
        ) : (
          <BimOrderList rows={rows} />
        )}
      </PageBody>
    </>
  );
}
