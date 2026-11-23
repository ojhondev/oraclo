import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDrawing } from "@/lib/cad/queries";
import { CadEditor } from "@/components/cad/cad-editor";

export const metadata: Metadata = { title: "ArchRay CAD" };

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["admin"]);
  const { id } = await params;
  const d = await getDrawing(user.orgId, id);
  if (!d) notFound();
  return <CadEditor drawing={{ id: d.id, name: d.name, doc: d.doc, rev: d.rev }} />;
}
