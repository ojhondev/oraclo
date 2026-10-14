"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { and, eq, sql } from "drizzle-orm";
import { del } from "@vercel/blob";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { capturers, editors, requireUser } from "@/lib/auth";
import { getSite } from "@/lib/sites";
import { getCapture } from "@/lib/captures";
import { formatOf, type OutputMeta } from "@/lib/model-formats";

const { captures, captureFiles, controlDistances, campaigns, sites, qualityReports } = schema;

async function guard(siteId: string, captureId: string, roles = capturers) {
  const user = await requireUser(roles);
  await getSite(user.orgId, siteId);
  const row = await getCapture(siteId, captureId);
  return { user, ...row };
}

function refresh(siteId: string, captureId?: string) {
  revalidatePath(`/bens/${siteId}`);
  if (captureId) revalidatePath(`/bens/${siteId}/capturas/${captureId}`);
}

/** Descrição curta do aparelho a partir do user-agent (vai na ficha da captura). */
function deviceFrom(ua: string) {
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  const android = ua.match(/Android [\d.]+; ([^;)]+)/);
  if (android) return android[1]!.trim();
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows";
  return null;
}

/** Abre uma nova captura (fotos) numa campanha e leva para a tela de captura. */
export async function startCapture(siteId: string, campaignId: string, form: FormData) {
  const user = await requireUser(capturers);
  await getSite(user.orgId, siteId);
  const [camp] = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.siteId, siteId)))
    .limit(1);
  if (!camp) throw new Error("Campanha não encontrada.");
  const raw = String(form.get("elementId") || "");
  let elementId: string | null = null;
  if (/^[0-9a-f-]{36}$/i.test(raw)) {
    const [el] = await db
      .select({ id: schema.elements.id })
      .from(schema.elements)
      .where(and(eq(schema.elements.id, raw), eq(schema.elements.siteId, siteId)));
    elementId = el?.id ?? null;
  }
  const ua = (await headers()).get("user-agent") ?? "";
  const [c] = await db
    .insert(captures)
    .values({ campaignId, elementId, mode: "fotos", status: "rascunho", device: deviceFrom(ua), createdBy: user.id })
    .returning({ id: captures.id });
  await db.update(sites).set({ updatedAt: new Date() }).where(eq(sites.id, siteId));
  refresh(siteId);
  redirect(`/bens/${siteId}/capturas/${c!.id}`);
}

export async function saveChecklist(siteId: string, captureId: string, checklist: Record<string, boolean>) {
  await guard(siteId, captureId);
  const clean = z.record(z.string().max(40), z.boolean()).parse(checklist);
  await db.update(captures).set({ checklist: clean }).where(eq(captures.id, captureId));
}

export async function saveNotes(siteId: string, captureId: string, notes: string) {
  await guard(siteId, captureId);
  await db.update(captures).set({ notes: notes.trim().slice(0, 4000) || null }).where(eq(captures.id, captureId));
}

const distanceSchema = z.object({
  targetA: z.string().trim().min(1, "Informe o alvo A.").max(20),
  targetB: z.string().trim().min(1, "Informe o alvo B.").max(20),
  measuredMm: z.number().int().positive("Distância inválida.").max(1_000_000),
});

export async function addDistance(siteId: string, captureId: string, input: z.input<typeof distanceSchema>) {
  await guard(siteId, captureId);
  const data = distanceSchema.parse(input);
  const [d] = await db.insert(controlDistances).values({ ...data, captureId }).returning();
  refresh(siteId, captureId);
  return d!;
}

export async function deleteDistance(siteId: string, captureId: string, distanceId: string) {
  await guard(siteId, captureId);
  await db.delete(controlDistances).where(and(eq(controlDistances.id, distanceId), eq(controlDistances.captureId, captureId)));
  refresh(siteId, captureId);
}

const fileSchema = z.object({
  clientId: z.string().min(8).max(64),
  url: z.string().url(),
  pathname: z.string(),
  filename: z.string().max(200),
  contentType: z.string().max(60),
  bytes: z.number().int().nonnegative(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  sharpness: z.number().min(0).nullable(),
  pass: z.number().int().min(1).max(2).nullable(),
  takenAt: z.string().datetime().nullable(),
});

/** Registra uma foto já enviada ao storage. Idempotente por clientId (retomadas de envio). */
export async function registerFile(siteId: string, captureId: string, input: z.input<typeof fileSchema>) {
  const { user, capture } = await guard(siteId, captureId);
  const f = fileSchema.parse(input);
  const host = new URL(f.url).hostname;
  if (!host.endsWith(".blob.vercel-storage.com") || !f.pathname.startsWith(`orgs/${user.orgId}/sites/${siteId}/capturas/${captureId}/`)) {
    throw new Error("Arquivo inválido.");
  }
  await db
    .insert(captureFiles)
    .values({
      captureId,
      kind: "foto",
      storageKey: f.pathname,
      url: f.url,
      filename: f.filename,
      contentType: f.contentType,
      bytes: f.bytes,
      width: f.width,
      height: f.height,
      sharpness: f.sharpness,
      pass: f.pass,
      clientId: f.clientId,
      takenAt: f.takenAt ? new Date(f.takenAt) : null,
    })
    .onConflictDoNothing({ target: [captureFiles.captureId, captureFiles.clientId] });
  await db
    .update(captures)
    .set({
      fileCount: sql`(select count(*) from ${captureFiles} where ${captureFiles.captureId} = ${captureId})`,
      totalBytes: sql`(select coalesce(sum(${captureFiles.bytes}), 0) from ${captureFiles} where ${captureFiles.captureId} = ${captureId})`,
      ...(capture.status === "rascunho" && { status: "enviando" as const }),
    })
    .where(eq(captures.id, captureId));
  return { ok: true };
}

export async function deleteFile(siteId: string, captureId: string, fileId: string) {
  await guard(siteId, captureId, editors);
  const [f] = await db
    .delete(captureFiles)
    .where(and(eq(captureFiles.id, fileId), eq(captureFiles.captureId, captureId)))
    .returning({ url: captureFiles.url });
  if (f?.url) await del(f.url).catch(() => {});
  await db
    .update(captures)
    .set({
      fileCount: sql`(select count(*) from ${captureFiles} where ${captureFiles.captureId} = ${captureId})`,
      totalBytes: sql`(select coalesce(sum(${captureFiles.bytes}), 0) from ${captureFiles} where ${captureFiles.captureId} = ${captureId})`,
    })
    .where(eq(captures.id, captureId));
  refresh(siteId, captureId);
}

/** Equipe de campo terminou: manda para processamento (feito pela equipe do Oraclo no piloto). */
export async function submitCapture(siteId: string, captureId: string) {
  const { capture } = await guard(siteId, captureId);
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(captureFiles)
    .where(eq(captureFiles.captureId, captureId));
  if (!n) throw new Error("Envie pelo menos uma foto antes de concluir.");
  if (n < 20) throw new Error(`Só ${n} fotos enviadas. Para gerar o 3D, faça pelo menos 20 (o ideal são centenas).`);
  if (capture.status === "processando" || capture.status === "concluida") return;
  await db.update(captures).set({ status: "na_fila", submittedAt: new Date() }).where(eq(captures.id, captureId));
  refresh(siteId, captureId);
}

/** Status do processamento — no piloto, atualizado à mão pelo administrador. */
export async function setCaptureStatus(siteId: string, captureId: string, status: (typeof schema.captureStatusEnum.enumValues)[number]) {
  await guard(siteId, captureId, ["admin"]);
  const s = z.enum(schema.captureStatusEnum.enumValues).parse(status);
  await db.update(captures).set({ status: s }).where(eq(captures.id, captureId));
  refresh(siteId, captureId);
}

export async function deleteCapture(siteId: string, captureId: string) {
  await guard(siteId, captureId, editors);
  const files = await db.select({ url: captureFiles.url }).from(captureFiles).where(eq(captureFiles.captureId, captureId));
  const urls = files.map((f) => f.url).filter((u): u is string => !!u);
  for (let i = 0; i < urls.length; i += 100) await del(urls.slice(i, i + 100)).catch(() => {});
  await db.delete(captures).where(eq(captures.id, captureId));
  await db.update(sites).set({ updatedAt: new Date() }).where(eq(sites.id, siteId));
  refresh(siteId);
  redirect(`/bens/${siteId}`);
}

/* ───────────── Resultado do processamento ───────────── */

const outputSchema = z.object({
  url: z.string().url(),
  pathname: z.string(),
  name: z.string().min(1).max(200),
  bytes: z.number().int().nonnegative(),
  pointCount: z.number().int().nonnegative().nullable().optional(),
});

/** Registra um arquivo de resultado (nuvem, malha, relatório) já enviado ao storage. */
export async function registerOutput(siteId: string, captureId: string, input: z.input<typeof outputSchema>) {
  const { user } = await guard(siteId, captureId, editors);
  const o = outputSchema.parse(input);
  const fmt = formatOf(o.name);
  if (!fmt) throw new Error("Formato não aceito. Use E57, LAS, LAZ, PLY, XYZ, PTS, GLB, OBJ, FBX, ZIP ou PDF.");
  if (!new URL(o.url).hostname.endsWith(".blob.vercel-storage.com") || !o.pathname.startsWith(`orgs/${user.orgId}/sites/${siteId}/capturas/${captureId}/resultado/`)) {
    throw new Error("Arquivo inválido.");
  }
  const meta: OutputMeta = { viewable: fmt.viewable, upAxis: fmt.upAxis };
  const [row] = await db
    .insert(schema.outputs)
    .values({
      siteId,
      captureId,
      kind: fmt.kind,
      format: fmt.ext,
      name: o.name,
      storageKey: o.pathname,
      url: o.url,
      bytes: o.bytes,
      pointCount: o.pointCount ?? null,
      meta,
    })
    .returning();
  await db.update(sites).set({ updatedAt: new Date() }).where(eq(sites.id, siteId));
  refresh(siteId, captureId);
  return row!;
}

export async function deleteOutput(siteId: string, captureId: string, outputId: string) {
  await guard(siteId, captureId, editors);
  const [o] = await db
    .delete(schema.outputs)
    .where(and(eq(schema.outputs.id, outputId), eq(schema.outputs.captureId, captureId)))
    .returning({ url: schema.outputs.url });
  if (o?.url) await del(o.url).catch(() => {});
  refresh(siteId, captureId);
}

const reportSchema = z.object({
  photosUsed: z.number().int().nonnegative(),
  photosDiscarded: z.number().int().nonnegative(),
  reprojectionErrorPx: z.number().nonnegative().nullable(),
  distances: z.array(z.object({ id: z.string().uuid(), modelMm: z.number().int().positive().nullable() })),
});

/** Limite do selo "apto para levantamento cadastral" (PRD §4). */
const APPROVAL_MM = 30;

/**
 * Relatório de qualidade: a equipe informa o que o software de fotogrametria mediu,
 * inclusive o comprimento de cada distância de controle no modelo; o Oraclo calcula
 * os resíduos, o erro médio quadrático e o selo de aptidão.
 */
export async function saveQualityReport(siteId: string, captureId: string, input: z.input<typeof reportSchema>) {
  await guard(siteId, captureId, editors);
  const r = reportSchema.parse(input);
  const rows = await db.select().from(controlDistances).where(eq(controlDistances.captureId, captureId));
  const residuals: number[] = [];
  for (const d of rows) {
    const m = r.distances.find((x) => x.id === d.id)?.modelMm ?? null;
    const residual = m == null ? null : m - d.measuredMm;
    if (residual != null) residuals.push(residual);
    await db.update(controlDistances).set({ modelMm: m, residualMm: residual }).where(eq(controlDistances.id, d.id));
  }
  const rms = residuals.length ? Math.sqrt(residuals.reduce((a, x) => a + x * x, 0) / residuals.length) : null;
  const max = residuals.length ? Math.max(...residuals.map(Math.abs)) : null;
  const values = {
    photosUsed: r.photosUsed,
    photosDiscarded: r.photosDiscarded,
    reprojectionErrorPx: r.reprojectionErrorPx,
    rmsResidualMm: rms,
    maxResidualMm: max,
    approved: max != null && residuals.length >= 3 && max <= APPROVAL_MM,
  };
  const [existing] = await db.select({ id: qualityReports.id }).from(qualityReports).where(eq(qualityReports.captureId, captureId));
  if (existing) await db.update(qualityReports).set(values).where(eq(qualityReports.id, existing.id));
  else await db.insert(qualityReports).values({ ...values, captureId });
  refresh(siteId, captureId);
  return values;
}

/** Publica o resultado: captura concluída (aparece para o cliente como pronta). */
export async function publishResult(siteId: string, captureId: string) {
  await guard(siteId, captureId, editors);
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.outputs)
    .where(eq(schema.outputs.captureId, captureId));
  if (!n) throw new Error("Envie pelo menos um arquivo de resultado antes de publicar.");
  await db.update(captures).set({ status: "concluida" }).where(eq(captures.id, captureId));
  refresh(siteId, captureId);
}
