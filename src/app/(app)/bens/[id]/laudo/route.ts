import { and, eq } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { loadDiagnosis } from "@/lib/diagnosis";
import { fetchImage, slug } from "@/lib/exports/common";
import { buildLaudo } from "@/lib/exports/laudo";
import { getLaudoDraft } from "@/lib/laudo-draft";
import { resolveLaudo } from "@/lib/laudo-text";

export const maxDuration = 60;

/** Laudo de estado de conservação em PDF (A4). `?vistoria=` restringe a uma vistoria. */
export async function GET(req: Request, ctx: RouteContext<"/bens/[id]/laudo">) {
  const { id } = await ctx.params;
  const user = await getUser();
  if (!user) return new Response("Não autorizado", { status: 401 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Não encontrado", { status: 404 });
  const [site] = await db
    .select()
    .from(schema.sites)
    .where(and(eq(schema.sites.id, id), eq(schema.sites.orgId, user.orgId)))
    .limit(1);
  if (!site) return new Response("Não encontrado", { status: 404 });

  const vistoria = new URL(req.url).searchParams.get("vistoria");
  const [dx, author] = await Promise.all([
    loadDiagnosis(user.orgId, id, vistoria),
    db
      .select({ name: schema.users.name, professionalId: schema.users.professionalId })
      .from(schema.users)
      .where(eq(schema.users.id, user.id))
      .then((r) => r[0]!),
  ]);
  const images = new Map<string, Uint8Array>();
  await Promise.all(
    dx.vistas.map(async (v) => {
      try {
        images.set(v.id, await fetchImage(v.url));
      } catch {
        // sem imagem: a vista sai só com a legenda
      }
    }),
  );
  const draft = await getLaudoDraft(id, dx.campaign?.id ?? null);
  const text = resolveLaudo(draft, { author, summaryFacts: { ...dx.kpis, vistas: dx.vistas.length } });
  const bytes = await buildLaudo({ site, dx, author, orgName: user.orgName, images, text });
  const name = `${slug(`laudo-${site.name}${dx.campaign ? `-${dx.campaign.name}` : ""}`) || "laudo"}.pdf`;
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
