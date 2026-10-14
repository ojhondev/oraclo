import { and, asc, eq } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";

/**
 * Lista de URLs das fotos de uma captura (texto, uma por linha) para a equipe baixar
 * tudo de uma vez — ex.: `wget -i lista.txt` ou `curl` em lote — e processar no
 * RealityScan/COLMAP. Inclui as medidas de controle no cabeçalho.
 */
export async function GET(_: Request, ctx: RouteContext<"/bens/[id]/capturas/[cid]/lista">) {
  const { id, cid } = await ctx.params;
  const user = await getUser();
  if (!user || user.role !== "admin") return new Response("Não autorizado", { status: 401 });
  const ok = /^[0-9a-f-]{36}$/i;
  if (!ok.test(id) || !ok.test(cid)) return new Response("Não encontrado", { status: 404 });
  const [row] = await db
    .select({ siteName: schema.sites.name })
    .from(schema.captures)
    .innerJoin(schema.campaigns, eq(schema.campaigns.id, schema.captures.campaignId))
    .innerJoin(schema.sites, eq(schema.sites.id, schema.campaigns.siteId))
    .where(and(eq(schema.captures.id, cid), eq(schema.sites.id, id), eq(schema.sites.orgId, user.orgId)))
    .limit(1);
  if (!row) return new Response("Não encontrado", { status: 404 });
  const [files, distances] = await Promise.all([
    db.select({ url: schema.captureFiles.url }).from(schema.captureFiles).where(eq(schema.captureFiles.captureId, cid)).orderBy(asc(schema.captureFiles.takenAt)),
    db.select().from(schema.controlDistances).where(eq(schema.controlDistances.captureId, cid)),
  ]);
  const header = [
    `# Oraclo — captura ${cid} — ${row.siteName}`,
    `# ${files.length} fotos`,
    ...distances.map((d) => `# controle ${d.targetA}-${d.targetB}: ${d.measuredMm} mm`),
  ];
  const body = [...header, ...files.map((f) => f.url).filter(Boolean)].join("\n") + "\n";
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="captura-${cid.slice(0, 8)}-fotos.txt"`,
      "Cache-Control": "no-store",
    },
  });
}
