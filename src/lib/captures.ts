import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db";

const { captures, campaigns, elements, captureFiles, controlDistances, outputs, qualityReports } = schema;

/** Marca das capturas feitas enviando fotos que já existiam (em vez da câmera do celular). */
export const IMPORT_DEVICE = "Importação de fotos";

export type Capture = typeof captures.$inferSelect;
export type CaptureFile = typeof captureFiles.$inferSelect;
export type ControlDistance = typeof controlDistances.$inferSelect;

/** Captura de um bem já validado (getSite) — 404 se não pertencer a ele. */
export async function getCapture(siteId: string, captureId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(captureId)) notFound();
  const [row] = await db
    .select({ capture: captures, campaign: campaigns, elementName: elements.name })
    .from(captures)
    .innerJoin(campaigns, eq(campaigns.id, captures.campaignId))
    .leftJoin(elements, eq(elements.id, captures.elementId))
    .where(and(eq(captures.id, captureId), eq(campaigns.siteId, siteId)))
    .limit(1);
  if (!row) notFound();
  return row;
}

export async function getCaptureDetail(siteId: string, captureId: string) {
  const base = await getCapture(siteId, captureId);
  const [files, distances, results, reports] = await Promise.all([
    db.select().from(captureFiles).where(eq(captureFiles.captureId, captureId)).orderBy(asc(captureFiles.createdAt)),
    db.select().from(controlDistances).where(eq(controlDistances.captureId, captureId)),
    db.select().from(outputs).where(eq(outputs.captureId, captureId)).orderBy(desc(outputs.createdAt)),
    db.select().from(qualityReports).where(eq(qualityReports.captureId, captureId)).limit(1),
  ]);
  return { ...base, files, distances, results, report: reports[0] ?? null };
}

/** Itens do roteiro de campo (PRD §4 / protocolo de captura v1). */
export const CHECKLIST = [
  { key: "alvos", label: "Alvos impressos colados (4 a 6), visíveis de vários ângulos" },
  { key: "luz", label: "Luz uniforme — sem contraluz nem sombra dura" },
  { key: "obstaculos", label: "Obstáculos removidos da frente (andaimes, carros, pessoas)" },
  { key: "bateria", label: "Bateria e espaço no celular conferidos" },
] as const;
