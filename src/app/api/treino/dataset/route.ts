import { and, eq, inArray } from "drizzle-orm";
import { requireOps } from "@/lib/auth";
import { db, schema } from "@/lib/db";

const { organizations, sites, orthophotos, damages, damageSuggestions, damageTypes } = schema;

/**
 * Base de treino da detecção automática (só equipe do ArchRay), no formato do COCO:
 * imagens das vistas + danos validados (positivos) + sugestões rejeitadas (negativos),
 * apenas de organizações que autorizaram o uso. Serve para treinar um modelo de
 * segmentação próprio em GPU gratuita (Colab/Kaggle) e exportá-lo em ONNX para o navegador.
 */
export async function GET() {
  await requireOps();
  const orgs = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.trainingConsent, true));
  const empty = { info: { description: "ArchRay · danos de fachada", orgs: 0 }, images: [], categories: [], annotations: [], negatives: [] };
  if (!orgs.length) return Response.json(empty);

  const siteRows = await db.select({ id: sites.id }).from(sites).where(inArray(sites.orgId, orgs.map((o) => o.id)));
  if (!siteRows.length) return Response.json({ ...empty, info: { ...empty.info, orgs: orgs.length } });
  const siteIds = siteRows.map((s) => s.id);
  const [vistas, dmg, rejected, types] = await Promise.all([
    db
      .select({ id: orthophotos.id, url: orthophotos.url, width: orthophotos.widthPx, height: orthophotos.heightPx, mmPerPixel: orthophotos.mmPerPixel })
      .from(orthophotos)
      .where(inArray(orthophotos.siteId, siteIds)),
    db.select().from(damages).where(inArray(damages.siteId, siteIds)),
    db
      .select()
      .from(damageSuggestions)
      .where(and(inArray(damageSuggestions.siteId, siteIds), eq(damageSuggestions.status, "rejeitada"))),
    db.select({ id: damageTypes.id, code: damageTypes.code, name: damageTypes.name, geometry: damageTypes.geometry }).from(damageTypes),
  ]);
  // categorias pelo código (tipos personalizados de mesmo código caem na mesma classe)
  const codeOf = new Map(types.map((t) => [t.id, t.code]));
  const codes = [...new Set(types.map((t) => t.code))].sort();
  const catId = new Map(codes.map((c, i) => [c, i + 1]));
  const imgId = new Map(vistas.map((v, i) => [v.id, i + 1]));
  const flat = (p: [number, number][]) => p.flatMap(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
  const bbox = (p: [number, number][]) => {
    const xs = p.map((q) => q[0]);
    const ys = p.map((q) => q[1]);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return [x, y, Math.max(...xs) - x, Math.max(...ys) - y];
  };
  const ann = (rows: { id: string; orthophotoId: string | null; typeId: string; geometry: { points: [number, number][] } | null }[], extra: (r: never) => object) =>
    rows.flatMap((r) => {
      const p = r.geometry?.points ?? [];
      const image = r.orthophotoId ? imgId.get(r.orthophotoId) : undefined;
      const code = codeOf.get(r.typeId);
      if (!image || !code || !p.length) return [];
      return [{ id: r.id, image_id: image, category_id: catId.get(code)!, code, points: flat(p), bbox: bbox(p), ...extra(r as never) }];
    });
  return Response.json({
    info: { description: "ArchRay · danos de fachada", orgs: orgs.length, generatedAt: new Date().toISOString() },
    images: vistas.map((v) => ({ id: imgId.get(v.id), file_name: v.url, width: v.width, height: v.height, mm_per_pixel: v.mmPerPixel })),
    categories: codes.map((c) => ({ id: catId.get(c), name: c, geometry: types.find((t) => t.code === c)?.geometry })),
    annotations: ann(dmg, (d: (typeof dmg)[number]) => ({ source: d.source, ai_confidence: d.aiConfidence, reviewed: d.reviewedBy != null })),
    negatives: ann(rejected, (s: (typeof rejected)[number]) => ({ detector: s.detector, confidence: s.confidence })),
  });
}
