import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { CadastroEditor } from "./editor";

export const metadata: Metadata = { title: "Laboratório · Desenho da fachada" };

export default async function LabCadastroVistaPage({ params }: { params: Promise<{ oid: string }> }) {
  const user = await requireUser(["admin"]);
  const { oid } = await params;
  const { orthophotos: o, sites: s } = schema;
  const [vista] = await db
    .select({ id: o.id, name: o.name, url: o.url, mm: o.mmPerPixel, w: o.widthPx, h: o.heightPx, site: s.name })
    .from(o)
    .innerJoin(s, eq(s.id, o.siteId))
    .where(and(eq(o.id, oid), eq(s.orgId, user.orgId)))
    .limit(1);
  if (!vista || !vista.mm) notFound();
  return <CadastroEditor vista={{ id: vista.id, name: vista.name, site: vista.site, url: vista.url, mmPerPixel: vista.mm, width: vista.w, height: vista.h }} />;
}
