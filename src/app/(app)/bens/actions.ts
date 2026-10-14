"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { editors, requireUser } from "@/lib/auth";
import { getSite } from "@/lib/sites";
import { todayISO } from "@/lib/format";

const { sites, elements, campaigns } = schema;

type State = { error?: string } | null;

const opt = z
  .string()
  .trim()
  .transform((v) => (v === "" || v === "__none" ? null : v))
  .nullable();

const siteSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do bem."),
  // selects do Radix só enviam valor depois da hidratação — usa o padrão se vier vazio
  kind: z.enum(schema.siteKindEnum.enumValues).catch("igreja"),
  protection: z.enum(schema.protectionEnum.enumValues).catch("nenhuma"),
  protectionBody: opt,
  processNumber: opt,
  period: opt,
  address: opt,
  city: opt,
  state: opt,
  description: opt,
});

function parseSite(form: FormData) {
  return siteSchema.safeParse(Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)])));
}

export async function createSite(_: State, form: FormData): Promise<State> {
  const user = await requireUser(editors);
  const parsed = parseSite(form);
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  const [s] = await db.insert(sites).values({ ...parsed.data, orgId: user.orgId }).returning({ id: sites.id });
  revalidatePath("/");
  redirect(`/bens/${s!.id}`);
}

export async function updateSite(id: string, _: State, form: FormData): Promise<State> {
  const user = await requireUser(editors);
  await getSite(user.orgId, id);
  const parsed = parseSite(form);
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  await db.update(sites).set({ ...parsed.data, updatedAt: new Date() }).where(eq(sites.id, id));
  revalidatePath("/", "layout");
  redirect(`/bens/${id}`);
}

export async function deleteSite(id: string) {
  const user = await requireUser(["admin"]);
  await getSite(user.orgId, id);
  await db.delete(sites).where(eq(sites.id, id));
  revalidatePath("/");
  redirect("/");
}

async function touch(siteId: string) {
  await db.update(sites).set({ updatedAt: new Date() }).where(eq(sites.id, siteId));
  revalidatePath(`/bens/${siteId}`);
  revalidatePath("/");
}

export async function addElement(siteId: string, _: State, form: FormData): Promise<State> {
  const user = await requireUser(editors);
  await getSite(user.orgId, siteId);
  const parsed = z
    .object({ name: z.string().trim().min(2, "Dê um nome à parte do bem."), kind: z.enum(schema.elementKindEnum.enumValues).catch("fachada") })
    .safeParse({ name: form.get("name"), kind: form.get("kind") });
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  await db.insert(elements).values({ ...parsed.data, siteId });
  await touch(siteId);
  return null;
}

/** Atalho: cria de uma vez as partes típicas de uma igreja. */
export async function addChurchTemplate(siteId: string) {
  const user = await requireUser(editors);
  await getSite(user.orgId, siteId);
  const tpl: { name: string; kind: (typeof schema.elementKindEnum.enumValues)[number] }[] = [
    { name: "Fachada principal", kind: "fachada" },
    { name: "Fachadas laterais", kind: "fachada" },
    { name: "Fachada posterior", kind: "fachada" },
    { name: "Nave", kind: "interior" },
    { name: "Capela-mor", kind: "interior" },
    { name: "Sacristia", kind: "interior" },
    { name: "Coro", kind: "interior" },
    { name: "Torre sineira", kind: "torre" },
    { name: "Cobertura", kind: "cobertura" },
    { name: "Retábulo-mor", kind: "elemento_artistico" },
    { name: "Forro da nave", kind: "elemento_artistico" },
  ];
  await db.insert(elements).values(tpl.map((t, i) => ({ ...t, siteId, sortOrder: i })));
  await touch(siteId);
}

export async function deleteElement(siteId: string, elementId: string) {
  const user = await requireUser(editors);
  await getSite(user.orgId, siteId);
  await db.delete(elements).where(and(eq(elements.id, elementId), eq(elements.siteId, siteId)));
  await touch(siteId);
}

export async function addCampaign(siteId: string, _: State, form: FormData): Promise<State> {
  const user = await requireUser(editors);
  await getSite(user.orgId, siteId);
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Dê um nome à campanha."),
      purpose: z.enum(schema.purposeEnum.enumValues).catch("levantamento"),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
      notes: opt,
    })
    .safeParse({
      name: form.get("name"),
      purpose: form.get("purpose"),
      date: String(form.get("date") || todayISO()),
      notes: String(form.get("notes") ?? ""),
    });
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  await db.insert(campaigns).values({ ...parsed.data, siteId, createdBy: user.id });
  await touch(siteId);
  return null;
}

export async function deleteCampaign(siteId: string, campaignId: string) {
  const user = await requireUser(editors);
  await getSite(user.orgId, siteId);
  await db.delete(campaigns).where(and(eq(campaigns.id, campaignId), eq(campaigns.siteId, siteId)));
  await touch(siteId);
}
