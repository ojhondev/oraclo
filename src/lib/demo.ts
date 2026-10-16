import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { del, list } from "@vercel/blob";
import { db, schema } from "@/lib/db";

/**
 * Projeto de demonstração do tour guiado: a Igreja do Carmo (Horta, Açores) com a foto real de 2010,
 * em domínio público. Cada organização tem no máximo um; reiniciar apaga tudo (vistas, danos e
 * arquivos) e recria o projeto vazio, para refazer o tour da missão 1.
 */
export const DEMO = {
  name: "Demonstração · Igreja do Carmo (Horta)",
  photo: "/demo/carmo-fachada-2010.jpg",
  photoW: 2400,
  photoH: 1607,
  /** Cantos da fachada da igreja na foto (SE, SD, ID, IE), em pixels da foto de 2400 px. */
  targets: [
    [501, 267],
    [1474, 477],
    [1584, 1497],
    [449, 1590],
  ] as [number, number][],
  widthM: 18,
  heightM: 18.7,
  /** guia da linha reta da lente: a cornija sob as torres */
  lineGuide: [
    [635, 296],
    [1388, 458],
  ] as [[number, number], [number, number]],
  /** conferência: largura da porta central (bordas medidas na própria foto) */
  check: { a: [1043, 1397] as [number, number], b: [1137, 1393] as [number, number], meters: 1.55, label: "largura da porta central" },
  vistaName: "Fachada principal (demonstração)",
  credit: "Foto: José Luís Ávila Silveira / Pedro Noronha e Costa, 27/08/2010 — domínio público (Wikimedia Commons).",
};

export async function findDemo(orgId: string) {
  const [site] = await db
    .select({ id: schema.sites.id })
    .from(schema.sites)
    .where(and(eq(schema.sites.orgId, orgId), eq(schema.sites.isDemo, true)))
    .limit(1);
  return site?.id ?? null;
}

/** Cria (se ainda não existe) o projeto de demonstração da organização e devolve o id. */
export async function ensureDemo(orgId: string, userId: string) {
  const found = await findDemo(orgId);
  if (found) return found;
  const [site] = await db
    .insert(schema.sites)
    .values({
      orgId,
      isDemo: true,
      name: DEMO.name,
      kind: "igreja",
      address: "Largo do Carmo, Horta, ilha do Faial",
      city: "Horta",
      state: "Açores (Portugal)",
      lat: 38.538811,
      lng: -28.628828,
      protection: "estadual",
      protectionBody: "Região Autónoma dos Açores — Imóvel de Interesse Público",
      period: "Séculos XVII–XVIII",
      description: [
        "PROJETO DE DEMONSTRAÇÃO do tour guiado do ArchRay. Pode ser apagado e recriado a qualquer momento em Ajuda › Demonstração guiada.",
        "Caso real: Igreja de Nossa Senhora do Carmo, na Horta (Açores), fotografada em 2010, antes da restauração. As medidas da fachada (18 × 18,7 m) são estimadas.",
        DEMO.credit,
      ].join("\n\n"),
    })
    .returning({ id: schema.sites.id });
  await db.insert(schema.elements).values([
    { siteId: site!.id, name: "Fachada principal", kind: "fachada", sortOrder: 0 },
    { siteId: site!.id, name: "Torres sineiras", kind: "torre", sortOrder: 1 },
  ]);
  await db.insert(schema.campaigns).values({
    siteId: site!.id,
    name: "Vistoria de demonstração",
    purpose: "levantamento",
    date: "2010-08-27",
    notes: DEMO.credit,
    createdBy: userId,
  });
  return site!.id;
}

/** Apaga o projeto de demonstração (com os arquivos enviados) e cria um novo, vazio. */
export async function resetDemo(orgId: string, userId: string) {
  const old = await findDemo(orgId);
  if (old) {
    try {
      let cursor: string | undefined;
      do {
        const page = await list({ prefix: `orgs/${orgId}/sites/${old}/`, cursor, limit: 1000 });
        if (page.blobs.length) await del(page.blobs.map((b) => b.url));
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
    } catch {
      // sem acesso ao armazenamento: o banco é limpo mesmo assim (arquivos órfãos saem na limpeza periódica)
    }
    await db.delete(schema.sites).where(eq(schema.sites.id, old));
  }
  return ensureDemo(orgId, userId);
}

export type DemoStatus = {
  siteId: string | null;
  vistaId: string | null;
  damages: number;
  areas: number;
  points: number;
  gutEdited: boolean;
};

/** Progresso do tour lido do banco: o que a pessoa já fez no projeto de demonstração. */
export async function demoStatus(orgId: string): Promise<DemoStatus> {
  const siteId = await findDemo(orgId);
  const empty = { siteId, vistaId: null, damages: 0, areas: 0, points: 0, gutEdited: false };
  if (!siteId) return empty;
  const vistas = await db
    .select({ id: schema.orthophotos.id })
    .from(schema.orthophotos)
    .where(eq(schema.orthophotos.siteId, siteId))
    .orderBy(schema.orthophotos.createdAt);
  if (!vistas.length) return empty;
  const ds = await db
    .select({ urgency: schema.damages.urgency, trend: schema.damages.trend, severity: schema.damages.severity, geometry: schema.damageTypes.geometry })
    .from(schema.damages)
    .innerJoin(schema.damageTypes, eq(schema.damageTypes.id, schema.damages.typeId))
    .where(inArray(schema.damages.orthophotoId, vistas.map((v) => v.id)));
  return {
    siteId,
    vistaId: vistas[0]!.id,
    damages: ds.length,
    areas: ds.filter((d) => d.geometry === "area").length,
    points: ds.filter((d) => d.geometry === "ponto").length,
    gutEdited: ds.some((d) => d.urgency !== 3 || d.trend !== 3 || d.severity !== "media"),
  };
}
