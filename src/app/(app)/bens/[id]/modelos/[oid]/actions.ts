"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { editors, requireUser } from "@/lib/auth";
import { getSite } from "@/lib/sites";
import { scaleFromCalibration3D, type P3 } from "@/lib/geometry3d";
import type { ModelScale } from "@/lib/model-formats";

const { outputs, sites, processingJobs, motorHeartbeat } = schema;

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

const CLOUD_FORMATS = ["las", "laz"];

/** Pede ao motor que prepare a nuvem para o navegador (níveis de detalhe), sem reprocessar a captura. */
export async function optimizeCloud(siteId: string, outputId: string): Promise<{ error?: string }> {
  const user = await requireUser();
  if (!editors.includes(user.role)) return { error: "Sem permissão para otimizar a nuvem." };
  await getSite(user.orgId, siteId);
  if (!/^[0-9a-f-]{36}$/i.test(outputId)) return { error: "Nuvem inválida." };
  const [row] = await db
    .select({ captureId: outputs.captureId, format: outputs.format, meta: outputs.meta })
    .from(outputs)
    .where(and(eq(outputs.id, outputId), eq(outputs.siteId, siteId)))
    .limit(1);
  if (!row) return { error: "Nuvem não encontrada." };
  if ((row.meta as { potree?: string } | null)?.potree) return {};
  if (!CLOUD_FORMATS.includes(row.format)) return { error: "Só nuvens LAS ou LAZ podem ser otimizadas." };
  if (!row.captureId) return { error: "Esta nuvem não está ligada a uma vistoria. Importe-a de novo pela aba Modelo 3D." };
  const [running] = await db
    .select({ id: processingJobs.id })
    .from(processingJobs)
    .where(and(eq(processingJobs.outputId, outputId), inArray(processingJobs.status, ["na_fila", "rodando"])))
    .limit(1);
  if (running) return {};
  await db.insert(processingJobs).values({ captureId: row.captureId, outputId, quality: "otimizar", stage: "otimizacao" });
  revalidatePath(`/bens/${siteId}`);
  return {};
}

/** Situação da otimização, consultada pela tela enquanto o motor trabalha. */
export async function optimizeStatus(siteId: string, outputId: string) {
  const user = await requireUser();
  await getSite(user.orgId, siteId);
  const [row] = await db
    .select({ meta: outputs.meta })
    .from(outputs)
    .where(and(eq(outputs.id, outputId), eq(outputs.siteId, siteId)))
    .limit(1);
  const [job] = await db
    .select({ status: processingJobs.status, progress: processingJobs.progress, error: processingJobs.error })
    .from(processingJobs)
    .where(eq(processingJobs.outputId, outputId))
    .orderBy(desc(processingJobs.createdAt))
    .limit(1);
  const [beat] = await db.select().from(motorHeartbeat).limit(1);
  return {
    ready: !!(row?.meta as { potree?: string } | null)?.potree,
    job: job ?? null,
    motorOnline: !!beat && Date.now() - beat.lastSeen.getTime() < 2 * 60_000,
  };
}
