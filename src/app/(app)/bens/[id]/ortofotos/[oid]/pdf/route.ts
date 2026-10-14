import { loadExportData, fetchImage, slug } from "@/lib/exports/common";
import { buildPdf } from "@/lib/exports/pdf";

/** Prancha A3 do mapa de danos em PDF. */
export async function GET(_: Request, ctx: RouteContext<"/bens/[id]/ortofotos/[oid]/pdf">) {
  const { id, oid } = await ctx.params;
  const data = await loadExportData(id, oid);
  if (!data) return new Response("Não autorizado", { status: 401 });
  const bytes = await buildPdf(data, await fetchImage(data.ortho.url));
  const name = `${slug(`${data.site.name}-${data.ortho.name}`) || "mapa-de-danos"}-prancha.pdf`;
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
