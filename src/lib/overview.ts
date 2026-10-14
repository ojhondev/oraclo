import "server-only";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { CaptureStatus } from "@/lib/db/schema";

const { captures, campaigns, sites, elements, outputs, orthophotos, damages } = schema;

/** Todas as capturas da organização (fila de trabalho), opcionalmente por status. */
export async function listAllCaptures(orgId: string, statuses?: CaptureStatus[]) {
  return db
    .select({
      id: captures.id,
      siteId: sites.id,
      siteName: sites.name,
      elementName: elements.name,
      campaignName: campaigns.name,
      mode: captures.mode,
      device: captures.device,
      status: captures.status,
      fileCount: captures.fileCount,
      totalBytes: captures.totalBytes,
      createdAt: captures.createdAt,
      submittedAt: captures.submittedAt,
    })
    .from(captures)
    .innerJoin(campaigns, eq(campaigns.id, captures.campaignId))
    .innerJoin(sites, eq(sites.id, campaigns.siteId))
    .leftJoin(elements, eq(elements.id, captures.elementId))
    .where(and(eq(sites.orgId, orgId), statuses?.length ? inArray(captures.status, statuses) : undefined))
    .orderBy(desc(captures.createdAt));
}

export async function captureStatusCounts(orgId: string) {
  const rows = await db
    .select({ status: captures.status, n: count() })
    .from(captures)
    .innerJoin(campaigns, eq(campaigns.id, captures.campaignId))
    .innerJoin(sites, eq(sites.id, campaigns.siteId))
    .where(eq(sites.orgId, orgId))
    .groupBy(captures.status);
  return Object.fromEntries(rows.map((r) => [r.status, r.n])) as Partial<Record<CaptureStatus, number>>;
}

/** Modelos 3D e demais arquivos de resultado da organização. */
export async function listAllModels(orgId: string) {
  return db
    .select({
      id: outputs.id,
      siteId: sites.id,
      siteName: sites.name,
      name: outputs.name,
      kind: outputs.kind,
      format: outputs.format,
      bytes: outputs.bytes,
      url: outputs.url,
      meta: outputs.meta,
      createdAt: outputs.createdAt,
    })
    .from(outputs)
    .innerJoin(sites, eq(sites.id, outputs.siteId))
    .where(and(eq(sites.orgId, orgId), inArray(outputs.kind, ["nuvem", "malha", "pdf"])))
    .orderBy(desc(outputs.createdAt));
}

/** Ortofotos com o mapa de danos de cada uma. */
export async function listAllMaps(orgId: string) {
  return db
    .select({
      id: orthophotos.id,
      siteId: sites.id,
      siteName: sites.name,
      elementName: elements.name,
      name: orthophotos.name,
      url: orthophotos.url,
      mmPerPixel: orthophotos.mmPerPixel,
      fromModel: orthophotos.outputId,
      createdAt: orthophotos.createdAt,
      damageCount: count(damages.id),
    })
    .from(orthophotos)
    .innerJoin(sites, eq(sites.id, orthophotos.siteId))
    .leftJoin(elements, eq(elements.id, orthophotos.elementId))
    .leftJoin(damages, eq(damages.orthophotoId, orthophotos.id))
    .where(eq(sites.orgId, orgId))
    .groupBy(orthophotos.id, sites.id, elements.name)
    .orderBy(desc(orthophotos.createdAt));
}
