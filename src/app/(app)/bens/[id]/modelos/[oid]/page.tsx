import type { Metadata } from "next";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { editors, requireUser } from "@/lib/auth";
import { getSite } from "@/lib/sites";
import { db, schema } from "@/lib/db";
import type { OutputMeta } from "@/lib/model-formats";
import { ModelViewer } from "./viewer";

export const metadata: Metadata = { title: "Modelo 3D" };

export default async function ModelPage({ params }: PageProps<"/bens/[id]/modelos/[oid]">) {
  const { id, oid } = await params;
  const user = await requireUser();
  await getSite(user.orgId, id);
  if (!/^[0-9a-f-]{36}$/i.test(oid)) notFound();
  const [output] = await db
    .select()
    .from(schema.outputs)
    .where(and(eq(schema.outputs.id, oid), eq(schema.outputs.siteId, id)))
    .limit(1);
  if (!output?.url) notFound();
  const elements = await db
    .select({ value: schema.elements.id, label: schema.elements.name })
    .from(schema.elements)
    .where(eq(schema.elements.siteId, id))
    .orderBy(asc(schema.elements.sortOrder), asc(schema.elements.createdAt));
  return (
    <ModelViewer
      siteId={id}
      orgId={user.orgId}
      output={{ id: output.id, name: output.name, url: output.url, format: output.format, meta: (output.meta ?? null) as OutputMeta | null }}
      elements={elements}
      canEdit={editors.includes(user.role)}
    />
  );
}
