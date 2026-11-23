"use server";

import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { newDoc, normalizeDoc } from "@/lib/cad/doc";
import type { CadDoc } from "@/lib/cad/types";

const { drawings, orthophotos, sites } = schema;
const MAX_BYTES = 6 * 1024 * 1024;

/** Novo desenho a partir de uma vista em escala: a imagem entra na camada "Foto", em metros. */
export async function createDrawingFromVista(orthophotoId: string) {
  const user = await requireUser(["admin"]);
  const [v] = await db
    .select({ id: orthophotos.id, name: orthophotos.name, url: orthophotos.url, mm: orthophotos.mmPerPixel, w: orthophotos.widthPx, h: orthophotos.heightPx })
    .from(orthophotos)
    .innerJoin(sites, eq(sites.id, orthophotos.siteId))
    .where(and(eq(orthophotos.id, orthophotoId), eq(sites.orgId, user.orgId)))
    .limit(1);
  if (!v?.mm) throw new Error("Vista não encontrada ou sem escala.");
  const doc = newDoc({ url: v.url, w: (v.w * v.mm) / 1000, h: (v.h * v.mm) / 1000 });
  const [row] = await db.insert(drawings).values({ orgId: user.orgId, orthophotoId: v.id, name: `Desenho · ${v.name}`, doc, createdBy: user.id }).returning({ id: drawings.id });
  redirect(`/editor/${row!.id}`);
}

/** Novo desenho em branco. */
export async function createBlankDrawing() {
  const user = await requireUser(["admin"]);
  const [row] = await db.insert(drawings).values({ orgId: user.orgId, name: "Desenho sem título", doc: newDoc(), createdBy: user.id }).returning({ id: drawings.id });
  redirect(`/editor/${row!.id}`);
}

/**
 * Salva o documento se `rev` for a versão atual no banco (senão outra aba salvou antes: conflito).
 * Devolve a nova versão.
 */
export async function saveDrawing(id: string, doc: CadDoc, rev: number): Promise<{ rev: number } | { conflict: true; rev: number } | { error: string }> {
  const user = await requireUser(["admin"]);
  const clean = normalizeDoc(doc);
  if (JSON.stringify(clean).length > MAX_BYTES) return { error: "Desenho grande demais para salvar (limite de 6 MB)." };
  const [row] = await db
    .update(drawings)
    .set({ doc: clean, rev: sql`${drawings.rev} + 1`, updatedAt: new Date() })
    .where(and(eq(drawings.id, id), eq(drawings.orgId, user.orgId), eq(drawings.rev, rev)))
    .returning({ rev: drawings.rev });
  if (row) return { rev: row.rev };
  const [cur] = await db.select({ rev: drawings.rev }).from(drawings).where(and(eq(drawings.id, id), eq(drawings.orgId, user.orgId))).limit(1);
  return cur ? { conflict: true, rev: cur.rev } : { error: "Desenho não encontrado." };
}

export async function renameDrawing(id: string, name: string) {
  const user = await requireUser(["admin"]);
  const n = name.trim().slice(0, 120);
  if (!n) return;
  await db.update(drawings).set({ name: n }).where(and(eq(drawings.id, id), eq(drawings.orgId, user.orgId)));
}

export async function deleteDrawing(id: string) {
  const user = await requireUser(["admin"]);
  await db.delete(drawings).where(and(eq(drawings.id, id), eq(drawings.orgId, user.orgId)));
  redirect("/lab/cadastro");
}
