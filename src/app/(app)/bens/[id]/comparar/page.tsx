import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, eq, inArray } from "drizzle-orm";
import { GitCompareArrows } from "lucide-react";
import { editors, requireUser } from "@/lib/auth";
import { getSite } from "@/lib/sites";
import { db, schema } from "@/lib/db";
import { loadDamageTypes } from "@/lib/orthophotos";
import { fmtDate } from "@/lib/format";
import { EmptyState } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { CompareView, type CmpVista } from "./compare-view";

export const metadata: Metadata = { title: "Comparar vistorias" };

export default async function ComparePage({ params, searchParams }: PageProps<"/bens/[id]/comparar">) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser();
  const site = await getSite(user.orgId, id);
  const { orthophotos: o, campaigns: c, damages: d, vistaAlignments: va } = schema;

  const rows = await db
    .select({
      id: o.id,
      name: o.name,
      url: o.url,
      width: o.widthPx,
      height: o.heightPx,
      mmPerPixel: o.mmPerPixel,
      elementId: o.elementId,
      createdAt: o.createdAt,
      campaignName: c.name,
      campaignDate: c.date,
    })
    .from(o)
    .leftJoin(c, eq(c.id, o.campaignId))
    .where(eq(o.siteId, site.id))
    .orderBy(asc(o.createdAt));

  if (rows.length < 2) {
    return (
      <div className="grid min-h-[60svh] place-items-center p-6">
        <EmptyState icon={GitCompareArrows} title="Ainda não dá para comparar">
          A comparação precisa de duas vistas do mesmo trecho em vistorias diferentes (por exemplo, a fachada antes e depois).
          <div className="mt-4">
            <Button asChild variant="outline" size="sm">
              <Link href={`/bens/${site.id}?aba=vistorias`}>Voltar às vistorias</Link>
            </Button>
          </div>
        </EmptyState>
      </div>
    );
  }

  // ordem do tempo: data da vistoria (ou do envio, sem vistoria)
  const when = (r: (typeof rows)[number]) => r.campaignDate ?? r.createdAt.toISOString().slice(0, 10);
  const vistas: CmpVista[] = [...rows]
    .sort((x, y) => when(x).localeCompare(when(y)) || x.createdAt.getTime() - y.createdAt.getTime())
    .map((r) => ({
      id: r.id,
      name: r.name,
      url: r.url,
      width: r.width,
      height: r.height,
      mmPerPixel: r.mmPerPixel,
      label: `${r.campaignName ?? "Sem vistoria"} · ${fmtDate(when(r))} — ${r.name}`,
      date: when(r),
    }));
  const byId = new Map(vistas.map((v) => [v.id, v]));

  // par padrão: a vista mais recente e, antes dela, a da mesma área em data anterior
  let b = typeof sp.b === "string" ? byId.get(sp.b) : undefined;
  let a = typeof sp.a === "string" ? byId.get(sp.a) : undefined;
  if (!b) b = vistas.at(-1)!;
  if (!a || a.id === b.id) {
    const el = rows.find((r) => r.id === b!.id)?.elementId;
    const earlier = vistas.filter((v) => v.id !== b!.id && v.date <= b!.date);
    a =
      earlier.findLast((v) => el && rows.find((r) => r.id === v.id)?.elementId === el && v.date < b!.date) ??
      earlier.findLast((v) => v.date < b!.date) ??
      vistas.find((v) => v.id !== b!.id)!;
  }

  const [types, damages, [alignment]] = await Promise.all([
    loadDamageTypes(user.orgId),
    db
      .select({ id: d.id, orthophotoId: d.orthophotoId, typeId: d.typeId, geometry: d.geometry, areaM2: d.areaM2, lengthM: d.lengthM })
      .from(d)
      .where(inArray(d.orthophotoId, [a.id, b.id])),
    db.select().from(va).where(and(eq(va.aId, a.id), eq(va.bId, b.id))),
  ]);
  const pick = (oid: string) =>
    damages
      .filter((x) => x.orthophotoId === oid && (x.geometry?.points?.length ?? 0) > 0)
      .map((x) => ({ id: x.id, typeId: x.typeId, points: x.geometry!.points, areaM2: x.areaM2, lengthM: x.lengthM }));

  return (
    <CompareView
      key={`${a.id}-${b.id}`}
      siteId={site.id}
      siteName={site.name}
      vistas={vistas}
      a={a}
      b={b}
      damagesA={pick(a.id)}
      damagesB={pick(b.id)}
      types={types.map((t) => ({ id: t.id, code: t.code, name: t.name, category: t.category, geometry: t.geometry, color: t.color }))}
      alignment={alignment ? { pairs: alignment.pairs, matrix: alignment.matrix, rmsPx: alignment.rmsPx } : null}
      canEdit={editors.includes(user.role)}
    />
  );
}
