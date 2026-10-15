import { asc, eq } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { accessOf } from "@/lib/bim-orders";

/** Lista de URLs das fotos da base do pedido + medidas de controle (para a equipe/parceiro baixar em lote). */
export async function GET(_: Request, ctx: RouteContext<"/bim/[id]/base">) {
  const { id } = await ctx.params;
  const user = await getUser();
  if (!user || !/^[0-9a-f-]{36}$/i.test(id)) return new Response("Não autorizado", { status: 401 });
  const [o] = await db.select().from(schema.bimOrders).where(eq(schema.bimOrders.id, id)).limit(1);
  const access = o ? accessOf(user, o) : null;
  if (!o || !access || access === "cliente" || !o.captureId) return new Response("Não encontrado", { status: 404 });
  const [files, distances] = await Promise.all([
    db.select({ url: schema.captureFiles.url }).from(schema.captureFiles).where(eq(schema.captureFiles.captureId, o.captureId)).orderBy(asc(schema.captureFiles.takenAt)),
    db.select().from(schema.controlDistances).where(eq(schema.controlDistances.captureId, o.captureId)),
  ]);
  const body = [
    `# Oraclo — pedido BIM #${o.number} — base da modelagem`,
    `# ${files.length} imagens`,
    ...distances.map((d) => `# controle ${d.targetA}-${d.targetB}: ${d.measuredMm} mm`),
    ...files.map((f) => f.url).filter(Boolean),
  ].join("\n");
  return new Response(body + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Content-Disposition": `attachment; filename="pedido-${o.number}-base.txt"`, "Cache-Control": "no-store" },
  });
}
