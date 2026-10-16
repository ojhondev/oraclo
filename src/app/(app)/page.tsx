import type { Metadata } from "next";
import { count, desc, eq } from "drizzle-orm";
import { requireUser, editors } from "@/lib/auth";
import { listSites } from "@/lib/sites";
import { db, schema } from "@/lib/db";
import { siteKinds } from "@/lib/labels";
import { HomeSearch, type HomeMap, type HomeSite } from "./home-search";
import { DemoLauncher } from "@/components/demo-tour";

export const metadata: Metadata = { title: "Início" };

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const user = await requireUser();
  const { buscar } = await searchParams;
  const { orthophotos: o, sites: s, damages: d } = schema;
  const [rows, mapRows] = await Promise.all([
    listSites(user.orgId),
    db
      .select({ id: o.id, siteId: o.siteId, name: o.name, siteName: s.name, damageCount: count(d.id) })
      .from(o)
      .innerJoin(s, eq(s.id, o.siteId))
      .leftJoin(d, eq(d.orthophotoId, o.id))
      .where(eq(s.orgId, user.orgId))
      .groupBy(o.id, s.name)
      .orderBy(desc(o.createdAt)),
  ]);

  const sites: HomeSite[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    kind: siteKinds[r.kind],
    city: r.city,
    state: r.state,
    protection: r.protection !== "nenhuma" ? r.protectionBody || "Tombado" : null,
    elementCount: r.elementCount,
    damageCount: r.damageCount,
  }));
  const maps: HomeMap[] = mapRows;

  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] flex-col lg:min-h-svh">
      <div className="flex items-center px-4 pt-3.5 sm:px-6">
        <span className="rounded-full bg-muted px-3.5 py-1.5 text-[13.5px]">
          {user.orgName} <span className="text-muted-foreground">· Plano ateliê</span>
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-center px-4 pt-10 pb-16 sm:px-6 lg:pt-0">
        <div className="lg:-mt-[6vh]">
          <HomeSearch sites={sites} maps={maps} canEdit={editors.includes(user.role)} autoFocus={buscar === "1"} />
          {editors.includes(user.role) && (
            <div className="mx-auto mt-6 w-full max-w-[640px]">
              <DemoLauncher />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
