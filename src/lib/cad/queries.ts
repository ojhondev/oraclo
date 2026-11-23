import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { normalizeDoc } from "./doc";

const { drawings, orthophotos } = schema;

/** Desenho da organização (ou null). */
export async function getDrawing(orgId: string, id: string) {
  const [row] = await db.select().from(drawings).where(and(eq(drawings.id, id), eq(drawings.orgId, orgId))).limit(1);
  return row ? { ...row, doc: normalizeDoc(row.doc) } : null;
}

/** Desenhos da organização, do mais recente para o mais antigo (sem o documento). */
export async function listDrawings(orgId: string) {
  return db
    .select({ id: drawings.id, name: drawings.name, updatedAt: drawings.updatedAt, orthophotoId: drawings.orthophotoId, vista: orthophotos.name })
    .from(drawings)
    .leftJoin(orthophotos, eq(orthophotos.id, drawings.orthophotoId))
    .where(eq(drawings.orgId, orgId))
    .orderBy(desc(drawings.updatedAt))
    .limit(60);
}
