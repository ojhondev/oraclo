"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { editors, requireUser } from "@/lib/auth";
import { getSite } from "@/lib/sites";
import { alignmentRms, fitAlignment } from "@/lib/compare";

const { orthophotos, vistaAlignments } = schema;

const pt = z.tuple([z.number().finite(), z.number().finite()]);

/** Grava (ou refaz) o alinhamento "depois → antes" entre duas vistas do projeto. */
export async function saveAlignment(siteId: string, aId: string, bId: string, input: { a: [number, number]; b: [number, number] }[]) {
  const user = await requireUser(editors);
  await getSite(user.orgId, siteId);
  const pairs = z.array(z.object({ a: pt, b: pt })).min(2).max(40).parse(input);
  if (aId === bId) throw new Error("Escolha duas vistas diferentes.");
  const both = await db
    .select({ id: orthophotos.id })
    .from(orthophotos)
    .where(and(eq(orthophotos.siteId, siteId), inArray(orthophotos.id, [aId, bId])));
  if (both.length !== 2) throw new Error("Vista não encontrada neste projeto.");
  const matrix = fitAlignment(pairs);
  if (!matrix.every(Number.isFinite)) throw new Error("Os pontos não formam um alinhamento válido. Espalhe os pares pela fachada.");
  const rmsPx = alignmentRms(matrix, pairs);
  await db
    .insert(vistaAlignments)
    .values({ siteId, aId, bId, pairs, matrix, rmsPx, createdBy: user.id })
    .onConflictDoUpdate({
      target: [vistaAlignments.aId, vistaAlignments.bId],
      set: { pairs, matrix, rmsPx, createdBy: user.id, updatedAt: new Date() },
    });
  revalidatePath(`/bens/${siteId}/comparar`);
  return { pairs, matrix, rmsPx };
}
