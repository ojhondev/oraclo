import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { editors, requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { getSite } from "@/lib/sites";
import { getOrthophoto, listDamages, listPendingSuggestions, loadDamageTypes } from "@/lib/orthophotos";
import { loadPrices } from "@/lib/prices";
import { DamageMapEditor } from "./editor";

export async function generateMetadata({ params }: PageProps<"/bens/[id]/ortofotos/[oid]">): Promise<Metadata> {
  const { id, oid } = await params;
  const user = await requireUser();
  await getSite(user.orgId, id);
  const o = await getOrthophoto(id, oid);
  return { title: `Mapa de danos · ${o.name}` };
}

export default async function OrthophotoEditorPage({ params, searchParams }: PageProps<"/bens/[id]/ortofotos/[oid]">) {
  const { id, oid } = await params;
  const { dano } = await searchParams;
  const user = await requireUser();
  const site = await getSite(user.orgId, id);
  const ortho = await getOrthophoto(id, oid);
  const [types, damages, suggestions, people] = await Promise.all([
    loadDamageTypes(user.orgId),
    listDamages(oid),
    listPendingSuggestions(oid),
    db.select({ id: schema.users.id, name: schema.users.name }).from(schema.users).where(eq(schema.users.orgId, user.orgId)),
  ]);
  const prices = await loadPrices(user.orgId, types);
  return (
    <DamageMapEditor
      siteId={site.id}
      siteName={site.name}
      ortho={ortho}
      types={types}
      initialDamages={damages}
      initialSuggestions={suggestions}
      people={Object.fromEntries(people.map((p) => [p.id, p.name]))}
      canEdit={editors.includes(user.role)}
      prices={prices}
      initialSelected={typeof dano === "string" && damages.some((d) => d.id === dano) ? dano : null}
    />
  );
}
