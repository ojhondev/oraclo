"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { deleteUrls, isStorageUrl } from "@/lib/storage";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { editors, requireUser } from "@/lib/auth";
import { getSite } from "@/lib/sites";
import { getOrthophoto, loadDamageTypes } from "@/lib/orthophotos";
import { measure, minPoints, scaleFromCalibration, type Pt } from "@/lib/geometry";

const { orthophotos, damages, damageSuggestions, sites } = schema;

const pt = z.tuple([z.number().finite(), z.number().finite()]);

async function touch(siteId: string, oid?: string) {
  await db.update(sites).set({ updatedAt: new Date() }).where(eq(sites.id, siteId));
  revalidatePath(`/bens/${siteId}`);
  if (oid) revalidatePath(`/bens/${siteId}/ortofotos/${oid}`);
}

/* ───────────── Ortofoto ───────────── */

const createSchema = z.object({
  name: z.string().trim().min(2, "Dê um nome à ortofoto."),
  elementId: z.string().uuid().nullable(),
  url: z.string().url(),
  pathname: z.string(),
  contentType: z.enum(["image/jpeg", "image/png"]),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  mmPerPixel: z.number().positive().nullable(),
  /** Quando gerada a partir de um modelo 3D do ArchRay. */
  outputId: z.string().uuid().nullable().optional(),
  plane: z.object({ origin: z.array(z.number()).length(3), normal: z.array(z.number()).length(3), up: z.array(z.number()).length(3) }).nullable().optional(),
  kind: z.enum(schema.vistaKindEnum.enumValues).catch("imagem").optional(),
  campaignId: z.string().uuid().nullable().optional(),
  /** Foto original (fachada retificada). */
  sourceUrl: z.string().url().nullable().optional(),
  rectification: z
    .object({
      corners: z.array(pt).length(4),
      widthM: z.number().positive(),
      heightM: z.number().positive(),
      srcW: z.number().int().positive(),
      srcH: z.number().int().positive(),
      // v2: ajuste por mínimos quadrados, lente, conferências e recorte
      version: z.number().int().optional(),
      controls: z.array(z.object({ img: pt, plane: pt })).max(50).optional(),
      checks: z.array(z.object({ a: pt, b: pt, meters: z.number().positive(), measured: z.number() })).max(50).optional(),
      lens: z
        .object({ k1: z.number(), k2: z.number().optional(), cx: z.number(), cy: z.number(), norm: z.number(), lines: z.number().int(), rmsBefore: z.number(), rmsAfter: z.number() })
        .nullable()
        .optional(),
      extent: z.array(z.number()).length(4).optional(),
      residualRmsMm: z.number().nullable().optional(),
      checkRmsMm: z.number().nullable().optional(),
      precisionMm: z.number().nonnegative().optional(),
    })
    .nullable()
    .optional(),
});

export async function createOrthophoto(siteId: string, input: z.input<typeof createSchema>) {
  const user = await requireUser(editors);
  await getSite(user.orgId, siteId);
  const data = createSchema.parse(input);
  if (!isStorageUrl(data.url) || !data.pathname.startsWith(`orgs/${user.orgId}/sites/${siteId}/`)) {
    throw new Error("Arquivo inválido.");
  }
  if (data.elementId) {
    const [el] = await db
      .select({ id: schema.elements.id })
      .from(schema.elements)
      .where(and(eq(schema.elements.id, data.elementId), eq(schema.elements.siteId, siteId)));
    if (!el) data.elementId = null;
  }
  if (data.outputId) {
    const [out] = await db
      .select({ id: schema.outputs.id })
      .from(schema.outputs)
      .where(and(eq(schema.outputs.id, data.outputId), eq(schema.outputs.siteId, siteId)));
    if (!out) data.outputId = null;
  }
  if (data.campaignId) {
    const [c] = await db
      .select({ id: schema.campaigns.id })
      .from(schema.campaigns)
      .where(and(eq(schema.campaigns.id, data.campaignId), eq(schema.campaigns.siteId, siteId)));
    if (!c) data.campaignId = null;
  }
  if (data.sourceUrl) {
    const src = new URL(data.sourceUrl);
    if (!isStorageUrl(src) || !src.pathname.slice(1).startsWith(`orgs/${user.orgId}/sites/${siteId}/`)) data.sourceUrl = null;
  }
  const [o] = await db
    .insert(orthophotos)
    .values({
      siteId,
      elementId: data.elementId,
      name: data.name,
      url: data.url,
      storageKey: data.pathname,
      contentType: data.contentType,
      widthPx: data.width,
      heightPx: data.height,
      mmPerPixel: data.mmPerPixel,
      outputId: data.outputId ?? null,
      plane: data.plane ?? null,
      kind: data.kind ?? (data.outputId ? "modelo_3d" : "imagem"),
      campaignId: data.campaignId ?? null,
      sourceUrl: data.sourceUrl ?? null,
      rectification: data.rectification ?? null,
      createdBy: user.id,
    })
    .returning({ id: orthophotos.id });
  await touch(siteId);
  redirect(`/bens/${siteId}/ortofotos/${o!.id}`);
}

export async function renameOrthophoto(siteId: string, oid: string, name: string) {
  const user = await requireUser(editors);
  await getSite(user.orgId, siteId);
  await getOrthophoto(siteId, oid);
  const clean = name.trim();
  if (clean.length < 2) return;
  await db.update(orthophotos).set({ name: clean }).where(eq(orthophotos.id, oid));
  await touch(siteId, oid);
}

/** Marca (ou desmarca) a vista como mapeamento completo: todos os danos visíveis estão marcados. */
export async function setMappingComplete(siteId: string, oid: string, complete: boolean) {
  const user = await requireUser(editors);
  await getSite(user.orgId, siteId);
  await getOrthophoto(siteId, oid);
  const set = complete ? { mappingCompleteBy: user.id, mappingCompleteAt: new Date() } : { mappingCompleteBy: null, mappingCompleteAt: null };
  await db.update(orthophotos).set(set).where(eq(orthophotos.id, oid));
  await touch(siteId, oid);
  return set.mappingCompleteAt;
}

export async function deleteOrthophoto(siteId: string, oid: string) {
  const user = await requireUser(editors);
  await getSite(user.orgId, siteId);
  const o = await getOrthophoto(siteId, oid);
  await db.delete(orthophotos).where(eq(orthophotos.id, oid));
  try {
    await deleteUrls([o.url, o.sourceUrl]);
  } catch {
    // arquivo já removido do storage — segue
  }
  await touch(siteId);
  redirect(`/bens/${siteId}`);
}

/** Recalcula áreas/comprimentos de todos os danos depois de mudar a escala. */
async function remeasureAll(orgId: string, oid: string, mmPerPixel: number | null) {
  const types = await loadDamageTypes(orgId);
  const kind = new Map(types.map((t) => [t.id, t.geometry]));
  const list = await db.select().from(damages).where(eq(damages.orthophotoId, oid));
  for (const d of list) {
    const m = measure(kind.get(d.typeId) ?? "area", (d.geometry?.points ?? []) as Pt[], mmPerPixel);
    await db.update(damages).set(m).where(eq(damages.id, d.id));
  }
}

/** Calibra a escala com uma linha de distância real conhecida. */
export async function calibrate(siteId: string, oid: string, a: Pt, b: Pt, meters: number) {
  const user = await requireUser(editors);
  await getSite(user.orgId, siteId);
  await getOrthophoto(siteId, oid);
  const [pa, pb] = [pt.parse(a), pt.parse(b)];
  const mm = scaleFromCalibration(pa, pb, z.number().positive().parse(meters));
  if (!mm) throw new Error("Calibração inválida: desenhe uma linha maior e informe a distância real.");
  await db.update(orthophotos).set({ mmPerPixel: mm, calibration: { a: pa, b: pb, meters } }).where(eq(orthophotos.id, oid));
  await remeasureAll(user.orgId, oid, mm);
  await touch(siteId, oid);
  return mm;
}

/** Define a escala diretamente (mm por pixel), p.ex. vinda do software que gerou a ortofoto. */
export async function setScale(siteId: string, oid: string, mmPerPixel: number) {
  const user = await requireUser(editors);
  await getSite(user.orgId, siteId);
  await getOrthophoto(siteId, oid);
  const mm = z.number().positive().max(10000).parse(mmPerPixel);
  await db.update(orthophotos).set({ mmPerPixel: mm, calibration: null }).where(eq(orthophotos.id, oid));
  await remeasureAll(user.orgId, oid, mm);
  await touch(siteId, oid);
  return mm;
}

/* ───────────── Danos ───────────── */

const damageSchema = z.object({
  typeId: z.string().uuid(),
  points: z.array(pt).min(1).max(5000),
  /** "ia_contorno" quando o desenho veio do Contorno IA (o usuário clicou e salvou). */
  source: z.enum(["manual", "ia_contorno"]).optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
});

export async function createDamage(siteId: string, oid: string, input: z.input<typeof damageSchema>) {
  const user = await requireUser(editors);
  await getSite(user.orgId, siteId);
  const o = await getOrthophoto(siteId, oid);
  const data = damageSchema.parse(input);
  const types = await loadDamageTypes(user.orgId);
  const type = types.find((t) => t.id === data.typeId);
  if (!type) throw new Error("Tipo de dano inválido.");
  if (data.points.length < minPoints(type.geometry)) throw new Error("Pontos insuficientes para este tipo de dano.");
  const points = type.geometry === "ponto" ? data.points.slice(0, 1) : data.points;
  const [d] = await db
    .insert(damages)
    .values({
      siteId,
      orthophotoId: oid,
      elementId: o.elementId,
      typeId: type.id,
      geometry: { points },
      ...measure(type.geometry, points, o.mmPerPixel),
      source: data.source ?? "manual",
      aiConfidence: data.source === "ia_contorno" ? data.confidence ?? null : null,
      // quem desenhou (ou salvou o contorno da IA) é quem validou
      reviewedBy: user.id,
      reviewedAt: new Date(),
      createdBy: user.id,
    })
    .returning();
  await touch(siteId, oid);
  return d!;
}

const updateSchema = z.object({
  typeId: z.string().uuid().optional(),
  points: z.array(pt).min(1).max(5000).optional(),
  severity: z.enum(schema.severityEnum.enumValues).optional(),
  urgency: z.number().int().min(1).max(5).optional(),
  trend: z.number().int().min(1).max(5).optional(),
  cause: z.string().max(2000).nullable().optional(),
  recommendation: z.string().max(2000).nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
});

export async function updateDamage(siteId: string, oid: string, damageId: string, input: z.input<typeof updateSchema>) {
  const user = await requireUser(editors);
  await getSite(user.orgId, siteId);
  const o = await getOrthophoto(siteId, oid);
  const data = updateSchema.parse(input);
  const [cur] = await db
    .select()
    .from(damages)
    .where(and(eq(damages.id, damageId), eq(damages.orthophotoId, oid)))
    .limit(1);
  if (!cur) throw new Error("Dano não encontrado.");
  const types = await loadDamageTypes(user.orgId);
  const type = types.find((t) => t.id === (data.typeId ?? cur.typeId));
  if (!type) throw new Error("Tipo de dano inválido.");
  const points = (data.points ?? cur.geometry?.points ?? []) as Pt[];
  const [d] = await db
    .update(damages)
    .set({
      typeId: type.id,
      geometry: { points },
      ...measure(type.geometry, points, o.mmPerPixel),
      ...(data.severity && { severity: data.severity }),
      ...(data.urgency && { urgency: data.urgency }),
      ...(data.trend && { trend: data.trend }),
      ...(data.cause !== undefined && { cause: data.cause || null }),
      ...(data.recommendation !== undefined && { recommendation: data.recommendation || null }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
    })
    .where(eq(damages.id, damageId))
    .returning();
  await touch(siteId, oid);
  return d!;
}

export async function deleteDamage(siteId: string, oid: string, damageId: string) {
  const user = await requireUser(editors);
  await getSite(user.orgId, siteId);
  await getOrthophoto(siteId, oid);
  await db.delete(damages).where(and(eq(damages.id, damageId), eq(damages.orthophotoId, oid)));
  await touch(siteId, oid);
}

/* ───────────── Detecção automática (sugestões da IA) ───────────── */

const suggestionSchema = z.object({
  typeId: z.string().uuid(),
  points: z.array(pt).min(1).max(2000),
  confidence: z.number().min(0).max(1),
  detector: z.string().max(60),
  reason: z.string().max(400).optional(),
});

/** Troca as sugestões pendentes da vista pelas de uma nova detecção (aceitas e rejeitadas ficam). */
export async function saveSuggestions(siteId: string, oid: string, input: z.input<typeof suggestionSchema>[]) {
  const user = await requireUser(editors);
  await getSite(user.orgId, siteId);
  await getOrthophoto(siteId, oid);
  const list = z.array(suggestionSchema).max(300).parse(input);
  const types = new Map((await loadDamageTypes(user.orgId)).map((t) => [t.id, t]));
  await db.delete(damageSuggestions).where(and(eq(damageSuggestions.orthophotoId, oid), eq(damageSuggestions.status, "pendente")));
  const rows = list
    .filter((s) => types.has(s.typeId) && s.points.length >= minPoints(types.get(s.typeId)!.geometry))
    .map((s) => ({
      siteId,
      orthophotoId: oid,
      typeId: s.typeId,
      geometry: { points: s.points },
      confidence: s.confidence,
      detector: s.detector,
      reason: s.reason ?? null,
      createdBy: user.id,
    }));
  if (!rows.length) return [];
  return db.insert(damageSuggestions).values(rows).returning();
}

/**
 * Aceita sugestões: cada uma vira um dano (origem "ia_deteccao", com a confiança e quem validou).
 * `typeIds` troca a classe sugerida antes de aceitar.
 */
export async function acceptSuggestions(siteId: string, oid: string, ids: string[], typeIds: Record<string, string> = {}) {
  const user = await requireUser(editors);
  await getSite(user.orgId, siteId);
  const o = await getOrthophoto(siteId, oid);
  const want = z.array(z.string().uuid()).min(1).max(300).parse(ids);
  const pending = await db
    .select()
    .from(damageSuggestions)
    .where(and(eq(damageSuggestions.orthophotoId, oid), eq(damageSuggestions.status, "pendente"), inArray(damageSuggestions.id, want)));
  const types = new Map((await loadDamageTypes(user.orgId)).map((t) => [t.id, t]));
  const now = new Date();
  const created: (typeof damages.$inferSelect)[] = [];
  for (const s of pending) {
    const override = typeIds[s.id];
    let type = types.get(override ?? s.typeId) ?? types.get(s.typeId);
    // troca de classe só entre tipos da mesma geometria (área, linha, ponto)
    if (type && override && type.geometry !== types.get(s.typeId)?.geometry) type = types.get(s.typeId);
    if (!type) continue;
    const points = (type.geometry === "ponto" ? s.geometry.points.slice(0, 1) : s.geometry.points) as Pt[];
    const [d] = await db
      .insert(damages)
      .values({
        siteId,
        orthophotoId: oid,
        elementId: o.elementId,
        typeId: type.id,
        geometry: { points },
        ...measure(type.geometry, points, o.mmPerPixel),
        source: "ia_deteccao",
        aiConfidence: s.confidence,
        aiDetector: s.detector.split(":")[0] ?? s.detector,
        reviewedBy: user.id,
        reviewedAt: now,
        createdBy: user.id,
      })
      .returning();
    await db
      .update(damageSuggestions)
      .set({ status: "aceita", damageId: d!.id, reviewedBy: user.id, reviewedAt: now })
      .where(eq(damageSuggestions.id, s.id));
    created.push(d!);
  }
  await touch(siteId, oid);
  return created;
}

/** Rejeita sugestões (ficam guardadas como "não é dano" para o treino da IA). */
export async function rejectSuggestions(siteId: string, oid: string, ids: string[]) {
  const user = await requireUser(editors);
  await getSite(user.orgId, siteId);
  await getOrthophoto(siteId, oid);
  const want = z.array(z.string().uuid()).min(1).max(300).parse(ids);
  await db
    .update(damageSuggestions)
    .set({ status: "rejeitada", reviewedBy: user.id, reviewedAt: new Date() })
    .where(and(eq(damageSuggestions.orthophotoId, oid), eq(damageSuggestions.status, "pendente"), inArray(damageSuggestions.id, want)));
}
