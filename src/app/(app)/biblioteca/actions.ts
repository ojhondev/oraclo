"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { editors, requireUser } from "@/lib/auth";

const priceSchema = z.object({
  typeId: z.string().uuid(),
  treatment: z.string().trim().max(300),
  unit: z.enum(schema.priceUnitEnum.enumValues),
  reais: z.number().min(0).max(10_000_000),
});

/** Grava o preço de tratamento de um tipo de dano para a organização. */
export async function savePrice(input: z.input<typeof priceSchema>) {
  const user = await requireUser(editors);
  const data = priceSchema.parse(input);
  const t = schema.damageTypes;
  const [type] = await db
    .select({ id: t.id })
    .from(t)
    .where(and(eq(t.id, data.typeId), or(isNull(t.orgId), eq(t.orgId, user.orgId))))
    .limit(1);
  if (!type) throw new Error("Tipo de dano inválido.");
  const values = { treatment: data.treatment || null, unit: data.unit, priceCents: Math.round(data.reais * 100), updatedAt: new Date() };
  await db
    .insert(schema.treatmentPrices)
    .values({ orgId: user.orgId, typeId: data.typeId, ...values })
    .onConflictDoUpdate({ target: [schema.treatmentPrices.orgId, schema.treatmentPrices.typeId], set: values });
  revalidatePath("/biblioteca");
}

/** Volta ao valor sugerido (remove o preço próprio). */
export async function resetPrice(typeId: string) {
  const user = await requireUser(editors);
  await db
    .delete(schema.treatmentPrices)
    .where(and(eq(schema.treatmentPrices.orgId, user.orgId), eq(schema.treatmentPrices.typeId, z.string().uuid().parse(typeId))));
  revalidatePath("/biblioteca");
}
