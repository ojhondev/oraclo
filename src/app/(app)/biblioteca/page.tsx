import type { Metadata } from "next";
import { asc, eq, isNull, or } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { ensureDefaultDamageTypes } from "@/lib/damage-library";
import { geometryKinds } from "@/lib/labels";
import { PageBody, PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Biblioteca de danos" };

export default async function LibraryPage() {
  const user = await requireUser();
  const t = schema.damageTypes;
  const load = () =>
    db.select().from(t).where(or(isNull(t.orgId), eq(t.orgId, user.orgId))).orderBy(asc(t.sortOrder), asc(t.name));
  let types = await load();
  if (types.length === 0) {
    await ensureDefaultDamageTypes();
    types = await load();
  }
  const categories = [...new Set(types.map((x) => x.category))];

  return (
    <>
      <PageHeader
        eyebrow="Mapa de danos"
        title="Biblioteca de danos"
        description="Legenda padronizada usada no mapa de danos, nas pranchas em PDF e nas camadas do DXF."
      />
      <PageBody className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        {categories.map((cat) => (
          <section key={cat} className="rounded-xl border bg-card">
            <h2 className="border-b px-5 py-3 font-serif text-xl">{cat}</h2>
            <ul className="divide-y">
              {types
                .filter((x) => x.category === cat)
                .map((x) => (
                  <li key={x.id} className="flex items-start gap-3 px-5 py-3">
                    <span
                      className="mt-0.5 size-5 shrink-0 rounded-[4px] border"
                      style={{ background: x.geometry === "linha" ? `linear-gradient(transparent 45%, ${x.color} 45% 60%, transparent 60%)` : x.color }}
                      aria-hidden
                    />
                    <div className="grid min-w-0 flex-1 gap-0.5">
                      <span className="flex flex-wrap items-center gap-2 text-[13.5px] font-medium">
                        {x.name}
                        <code className="rounded bg-muted px-1.5 text-[11px] font-normal text-muted-foreground">{x.code}</code>
                      </span>
                      {x.description && <span className="text-[12.5px] text-muted-foreground">{x.description}</span>}
                    </div>
                    <Badge variant="outline" className="shrink-0">{geometryKinds[x.geometry]}</Badge>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </PageBody>
    </>
  );
}
