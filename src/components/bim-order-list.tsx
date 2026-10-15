import Link from "next/link";
import { Boxes } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { bimStatuses, fmtMoney, FORMATS, LODS, type Format, type Lod } from "@/lib/bim";
import { fmtDate } from "@/lib/format";
import type { BimStatus } from "@/lib/db/schema";

type Row = {
  id: string;
  number: number;
  status: BimStatus;
  areaM2: number;
  lod: string;
  formats: string[];
  priceCents: number | null;
  estimateCents: number | null;
  dueDate: string | null;
  createdAt: Date;
  siteName: string;
  orgName: string;
  assigneeName?: string | null;
};

/** Lista de pedidos BIM (cliente e operação). */
export function BimOrderList({ rows, showOrg = false, showAssignee = false, hidePrice = false }: { rows: Row[]; showOrg?: boolean; showAssignee?: boolean; hidePrice?: boolean }) {
  return (
    <ul className="divide-y rounded-2xl border bg-card">
      {rows.map((o) => (
        <li key={o.id}>
          <Link href={`/bim/${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-muted/50">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
              <Boxes className="size-4" />
            </span>
            <span className="grid min-w-0 flex-1 leading-tight">
              <span className="truncate text-[14.5px]">
                <span className="text-muted-foreground tabular-nums">#{o.number}</span> {o.siteName}
                {showOrg && <span className="text-muted-foreground"> · {o.orgName}</span>}
              </span>
              <span className="truncate text-[12.5px] text-muted-foreground">
                {o.areaM2.toLocaleString("pt-BR")} m² · {LODS[o.lod as Lod]?.label ?? o.lod} · {o.formats.map((f) => FORMATS[f as Format]?.label.split(" ")[0] ?? f).join(", ")} · pedido em {fmtDate(o.createdAt)}
                {o.dueDate && ` · entrega até ${fmtDate(o.dueDate)}`}
                {showAssignee && ` · ${o.assigneeName ?? "sem responsável"}`}
              </span>
            </span>
            {!hidePrice && <span className="text-[13px] tabular-nums">{fmtMoney(o.priceCents ?? o.estimateCents)}</span>}
            <Badge variant={o.status === "concluido" ? "default" : o.status === "cancelado" ? "outline" : "secondary"}>{bimStatuses[o.status]}</Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}
