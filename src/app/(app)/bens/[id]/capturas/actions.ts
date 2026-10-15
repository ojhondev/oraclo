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
import { getCapture, IMPORT_DEVICE } from "@/lib/captures";
import { formatOf, type OutputMeta } from "@/lib/model-formats";

const { captures, captureFiles, campaigns, sites } = schema;

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

/**
 * Abre uma captura numa campanha. Origem:
 *  - "celular": captura guiada em campo (roteiro, câmera, medidas)
 *  - "fotos":   envio de fotos que o escritório já tem
 *  - "modelo":  importação de um modelo 3D pronto (laser, outro software) — vai direto ao resultado
 */
export async function startCapture(siteId: string, campaignId: string, form: FormData) {
  const origem = String(form.get("origem") || "celular");
  const user = await requireUser(origem === "modelo" ? editors : capturers);
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
  const values =
    origem === "modelo"
      ? { mode: "laser" as const, status: "processando" as const, device: null }
      : origem === "fotos"
        ? { mode: "fotos" as const, status: "rascunho" as const, device: IMPORT_DEVICE }
        : { mode: "fotos" as const, status: "rascunho" as const, device: deviceFrom(ua) };
  const [c] = await db
    .insert(captures)
    .values({ campaignId, elementId, ...values, createdBy: user.id })
    .returning({ id: captures.id });
  await db.update(sites).set({ updatedAt: new Date() }).where(eq(sites.id, siteId));
  refresh(siteId);
  redirect(`/bens/${siteId}/capturas/${c!.id}`);
}

export async function saveNotes(siteId: string, captureId: string, notes: string) {
  await guard(siteId, captureId);
  await db.update(captures).set({ notes: notes.trim().slice(0, 4000) || null }).where(eq(captures.id, captureId));
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

/* ───────────── Modelo 3D importado ───────────── */

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
