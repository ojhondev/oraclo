"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { editors, requireUser } from "@/lib/auth";
import { getSite } from "@/lib/sites";
import { scaleFromCalibration3D, type P3 } from "@/lib/geometry3d";
import type { ModelScale } from "@/lib/model-formats";

const { outputs, sites } = schema;

const p3 = z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]);

const scaleSchema = z.object({
  a: p3,
  b: p3,
  meters: z.number().positive().max(10_000),
});

/** Calibra a escala do modelo: dois pontos (unidades do modelo) e a distância real entre eles. */
export async function saveModelScale(siteId: string, outputId: string, input: z.input<typeof scaleSchema>) {
  const user = await requireUser();
  if (!editors.includes(user.role)) return { error: "Sem permissão para calibrar o modelo." };
  await getSite(user.orgId, siteId);
  if (!/^[0-9a-f-]{36}$/i.test(outputId)) return { error: "Modelo inválido." };
  const parsed = scaleSchema.safeParse(input);
  if (!parsed.success) return { error: "Informe uma distância real maior que zero." };
  const { a, b, meters } = parsed.data;
  const factor = scaleFromCalibration3D(a as P3, b as P3, meters);
  if (!factor) return { error: "Os dois pontos estão no mesmo lugar. Escolha pontos distantes." };

  const [row] = await db
    .select({ meta: outputs.meta })
    .from(outputs)
    .where(and(eq(outputs.id, outputId), eq(outputs.siteId, siteId)))
    .limit(1);
  if (!row) return { error: "Modelo não encontrado." };
  const scale: ModelScale = { factor, meters, a, b, at: new Date().toISOString() };
  await db
    .update(outputs)
    .set({ meta: { ...(row.meta ?? {}), scale } })
    .where(and(eq(outputs.id, outputId), eq(outputs.siteId, siteId)));
  await db.update(sites).set({ updatedAt: new Date() }).where(eq(sites.id, siteId));
  revalidatePath(`/bens/${siteId}/modelos/${outputId}`);
  return { ok: true as const, scale };
}

/** Remove a calibração e volta a tratar o arquivo como se já estivesse em metros. */
export async function clearModelScale(siteId: string, outputId: string) {
  const user = await requireUser();
  if (!editors.includes(user.role)) return { error: "Sem permissão para calibrar o modelo." };
  await getSite(user.orgId, siteId);
  if (!/^[0-9a-f-]{36}$/i.test(outputId)) return { error: "Modelo inválido." };
  const [row] = await db
    .select({ meta: outputs.meta })
    .from(outputs)
    .where(and(eq(outputs.id, outputId), eq(outputs.siteId, siteId)))
    .limit(1);
  if (!row) return { error: "Modelo não encontrado." };
  const { scale: _removed, ...rest } = (row.meta ?? {}) as Record<string, unknown>;
  void _removed;
  await db.update(outputs).set({ meta: rest }).where(and(eq(outputs.id, outputId), eq(outputs.siteId, siteId)));
  revalidatePath(`/bens/${siteId}/modelos/${outputId}`);
  return { ok: true as const };
}
