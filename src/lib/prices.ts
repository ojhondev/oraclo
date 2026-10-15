import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { GeometryKind } from "@/lib/db/schema";
import { priceMap } from "@/lib/pricing";

/** Tabela de preços efetiva da organização (preço próprio ou valor sugerido) por tipo de dano. */
export async function loadPrices(orgId: string, types: { id: string; code: string; geometry: GeometryKind }[]) {
  const own = await db
    .select({
      typeId: schema.treatmentPrices.typeId,
      treatment: schema.treatmentPrices.treatment,
      unit: schema.treatmentPrices.unit,
      priceCents: schema.treatmentPrices.priceCents,
    })
    .from(schema.treatmentPrices)
    .where(eq(schema.treatmentPrices.orgId, orgId));
  return priceMap(types, own.map((p) => ({ ...p, treatment: p.treatment ?? "" })));
}
