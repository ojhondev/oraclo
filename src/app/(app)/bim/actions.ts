"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, max } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { editors, requireUser, type SessionUser } from "@/lib/auth";
import { getSite } from "@/lib/sites";
import { DISCIPLINES, estimate, fmtMoney, FORMATS, LODS } from "@/lib/bim";
import { accessOf, notify, notifyOperators, requesterEmail, type BimOrder } from "@/lib/bim-orders";
import type { BimStatus } from "@/lib/db/schema";
import { todayISO } from "@/lib/format";

const { bimOrders, bimEvents, bimDeliveries, bimDeliveryFiles, users } = schema;
type Result = { error?: string; ok?: string } | null;

async function loadOrder(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Pedido inválido.");
  const [o] = await db.select().from(bimOrders).where(eq(bimOrders.id, id)).limit(1);
  if (!o) throw new Error("Pedido não encontrado.");
  return o;
}

/** O usuário age como cliente: é da organização do pedido e pode editar. */
const isClient = (user: SessionUser, o: BimOrder) => o.orgId === user.orgId && editors.includes(user.role);

async function setStatus(o: BimOrder, user: SessionUser, status: BimStatus, extra: Partial<typeof bimOrders.$inferInsert> = {}, note?: string, internal = false) {
  await db.update(bimOrders).set({ status, updatedAt: new Date(), ...extra }).where(eq(bimOrders.id, o.id));
  await db.insert(bimEvents).values({ orderId: o.id, userId: user.id, kind: "status", body: note ?? null, internal, meta: { from: o.status, to: status } });
  refresh(o.id);
}

function refresh(id: string) {
  revalidatePath(`/bim/${id}`);
  revalidatePath("/bim");
  revalidatePath("/operacao");
}

/** Soma dias úteis (seg–sex) a uma data ISO — o prazo do orçamento é em dias úteis. */
const addBusinessDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  let left = days;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return d.toISOString().slice(0, 10);
};

/* ───────────── cliente ───────────── */

const orderSchema = z.object({
  siteId: z.string().uuid("Escolha o projeto."),
  captureId: z.string().uuid().nullable(),
  areaM2: z.number({ message: "Informe a área." }).positive("Informe a área em m².").max(5_000_000),
  lod: z.enum(Object.keys(LODS) as [string, ...string[]]),
  disciplines: z.array(z.enum(Object.keys(DISCIPLINES) as [string, ...string[]])).min(1, "Escolha ao menos uma disciplina."),
  formats: z.array(z.enum(Object.keys(FORMATS) as [string, ...string[]])).min(1, "Escolha ao menos um formato."),
  softwareVersions: z.string().trim().max(200).nullable(),
  desiredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  notes: z.string().trim().max(4000).nullable(),
});

export async function createOrder(_: Result, form: FormData): Promise<Result> {
  const user = await requireUser(editors);
  const str = (k: string) => {
    const v = String(form.get(k) ?? "").trim();
    return v && v !== "__none" ? v : null;
  };
  const parsed = orderSchema.safeParse({
    siteId: str("siteId"),
    captureId: str("captureId"),
    areaM2: Number(String(form.get("areaM2") ?? "").replace(/\./g, "").replace(",", ".")),
    lod: str("lod") ?? "200",
    disciplines: form.getAll("disciplines").map(String),
    formats: form.getAll("formats").map(String),
    softwareVersions: str("softwareVersions"),
    desiredDate: str("desiredDate"),
    notes: str("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  const d = parsed.data;
  const site = await getSite(user.orgId, d.siteId);
  if (d.captureId) {
    const [c] = await db
      .select({ id: schema.captures.id })
      .from(schema.captures)
      .innerJoin(schema.campaigns, eq(schema.campaigns.id, schema.captures.campaignId))
      .where(and(eq(schema.captures.id, d.captureId), eq(schema.campaigns.siteId, site.id)));
    if (!c) d.captureId = null;
  }
  const est = estimate({ areaM2: d.areaM2, lod: d.lod as keyof typeof LODS, disciplines: d.disciplines, formats: d.formats });
  const [o] = await db
    .insert(bimOrders)
    .values({ ...d, lod: d.lod as "200" | "300" | "350", orgId: user.orgId, estimateCents: est.cents, requestedBy: user.id })
    .returning();
  await db.insert(bimEvents).values({ orderId: o!.id, userId: user.id, kind: "status", body: "Pedido criado.", meta: { to: "solicitado" } });
  await notifyOperators(
    `Novo pedido BIM #${o!.number}`,
    `${user.orgName} pediu ${LODS[d.lod as keyof typeof LODS].label} de ${d.areaM2.toLocaleString("pt-BR")} m² para "${site.name}". Estimativa: ${fmtMoney(est.cents)}.`,
    o!.id,
  );
  refresh(o!.id);
  redirect(`/bim/${o!.id}`);
}

export async function approveQuote(orderId: string): Promise<Result> {
  const user = await requireUser();
  const o = await loadOrder(orderId);
  if (!isClient(user, o)) return { error: "Só a equipe do cliente aprova o orçamento." };
  if (o.status !== "orcado") return { error: "Não há orçamento aguardando aprovação." };
  const due = o.deliveryDays ? addBusinessDays(todayISO(), o.deliveryDays) : null;
  await setStatus(o, user, "aprovado", { approvedAt: new Date(), dueDate: due }, "Orçamento aprovado.");
  await notifyOperators(`Pedido BIM #${o.number} aprovado`, `O cliente aprovou o orçamento de ${fmtMoney(o.priceCents)}. Prazo: ${due ?? "a definir"}.`, o.id);
  return { ok: "Orçamento aprovado. O pedido entrou na fila de modelagem." };
}

export async function cancelOrder(orderId: string, reason: string): Promise<Result> {
  const user = await requireUser();
  const o = await loadOrder(orderId);
  const ops = user.platformRole === "operador";
  if (!ops && !(isClient(user, o) && ["solicitado", "orcado"].includes(o.status))) return { error: "Este pedido não pode mais ser cancelado por aqui." };
  await setStatus(o, user, "cancelado", {}, reason.trim() || "Pedido cancelado.");
  if (!ops) await notifyOperators(`Pedido BIM #${o.number} cancelado`, reason.trim() || "O cliente cancelou o pedido.", o.id);
  else await notify(await requesterEmail(o), `Pedido BIM #${o.number} cancelado`, reason.trim() || "O pedido foi cancelado pela equipe Oraclo.", o.id);
  return { ok: "Pedido cancelado." };
}

export async function acceptDelivery(orderId: string): Promise<Result> {
  const user = await requireUser();
  const o = await loadOrder(orderId);
  if (!isClient(user, o)) return { error: "Só a equipe do cliente aceita a entrega." };
  if (o.status !== "entregue") return { error: "Não há entrega aguardando aceite." };
  await setStatus(o, user, "concluido", { completedAt: new Date() }, "Entrega aceita. Pedido concluído.");
  await notifyOperators(`Pedido BIM #${o.number} concluído`, "O cliente aceitou a entrega.", o.id);
  return { ok: "Entrega aceita. Pedido concluído." };
}

export async function requestRevision(orderId: string, comment: string): Promise<Result> {
  const user = await requireUser();
  const o = await loadOrder(orderId);
  if (!isClient(user, o)) return { error: "Só a equipe do cliente pede revisão." };
  if (o.status !== "entregue") return { error: "Só dá para pedir revisão de uma entrega." };
  const text = comment.trim();
  if (text.length < 5) return { error: "Descreva o que precisa ser revisto." };
  await db.update(bimOrders).set({ status: "revisao_solicitada", updatedAt: new Date() }).where(eq(bimOrders.id, o.id));
  await db.insert(bimEvents).values({ orderId: o.id, userId: user.id, kind: "revisao", body: text, meta: { from: o.status, to: "revisao_solicitada" } });
  const [assignee] = o.assigneeId ? await db.select({ email: users.email }).from(users).where(eq(users.id, o.assigneeId)) : [];
  await notifyOperators(`Revisão pedida no pedido BIM #${o.number}`, text, o.id);
  if (assignee) await notify(assignee.email, `Revisão pedida no pedido BIM #${o.number}`, text, o.id);
  refresh(o.id);
  return { ok: "Revisão solicitada. A equipe vai ajustar e entregar uma nova versão." };
}

/* ───────────── todos ───────────── */

export async function addComment(orderId: string, body: string, internal: boolean): Promise<Result> {
  const user = await requireUser();
  const o = await loadOrder(orderId);
  const access = accessOf(user, o);
  if (!access) return { error: "Sem acesso." };
  const text = body.trim();
  if (!text) return { error: "Escreva o comentário." };
  const isInternal = internal && access !== "cliente";
  await db.insert(bimEvents).values({ orderId: o.id, userId: user.id, kind: "comentario", body: text.slice(0, 4000), internal: isInternal });
  await db.update(bimOrders).set({ updatedAt: new Date() }).where(eq(bimOrders.id, o.id));
  if (!isInternal) {
    if (access === "cliente") await notifyOperators(`Comentário no pedido BIM #${o.number}`, text, o.id);
    else await notify(await requesterEmail(o), `Comentário no pedido BIM #${o.number}`, text, o.id);
  }
  refresh(o.id);
  return { ok: "Comentário enviado." };
}

/* ───────────── operação ───────────── */

async function ops(orderId: string, allowPartner = false) {
  const user = await requireUser();
  const o = await loadOrder(orderId);
  const access = accessOf(user, o);
  if (access === "operador" || (allowPartner && access === "parceiro")) return { user, o, access };
  throw new Error("Sem permissão da operação.");
}

export async function sendQuote(orderId: string, _: Result, form: FormData): Promise<Result> {
  const { user, o } = await ops(orderId);
  const price = Number(String(form.get("price") ?? "").replace(/\./g, "").replace(",", "."));
  const days = Number(form.get("days"));
  const notes = String(form.get("quoteNotes") ?? "").trim() || null;
  if (!(price > 0)) return { error: "Informe o preço." };
  if (!Number.isInteger(days) || days < 1) return { error: "Informe o prazo em dias." };
  if (!["solicitado", "orcado"].includes(o.status)) return { error: "O orçamento já foi aprovado ou o pedido está encerrado." };
  const priceCents = Math.round(price * 100);
  await db.update(bimOrders).set({ status: "orcado", priceCents, deliveryDays: days, quoteNotes: notes, quotedAt: new Date(), updatedAt: new Date() }).where(eq(bimOrders.id, o.id));
  await db.insert(bimEvents).values({ orderId: o.id, userId: user.id, kind: "orcamento", body: notes, meta: { priceCents, days, from: o.status, to: "orcado" } });
  await notify(await requesterEmail(o), `Orçamento do pedido BIM #${o.number}`, `${fmtMoney(priceCents)} · entrega em ${days} dias após a aprovação.${notes ? ` ${notes}` : ""}`, o.id);
  refresh(o.id);
  return { ok: "Orçamento enviado ao cliente." };
}

export async function assignOrder(orderId: string, assigneeId: string | null): Promise<Result> {
  const { user, o } = await ops(orderId);
  let name = "ninguém";
  if (assigneeId) {
    const [a] = await db.select({ id: users.id, name: users.name, email: users.email, platformRole: users.platformRole }).from(users).where(eq(users.id, assigneeId));
    const env = (process.env.PLATFORM_OPERATORS ?? "").toLowerCase().split(",").map((s) => s.trim());
    if (!a || (!a.platformRole && !env.includes(a.email.toLowerCase()))) return { error: "Só operadores e parceiros podem receber pedidos." };
    name = a.name;
    await notify(a.email, `Pedido BIM #${o.number} atribuído a você`, "Abra o pedido para ver a base da modelagem e o escopo.", o.id);
  }
  await db.update(bimOrders).set({ assigneeId, updatedAt: new Date() }).where(eq(bimOrders.id, o.id));
  await db.insert(bimEvents).values({ orderId: o.id, userId: user.id, kind: "atribuicao", body: `Atribuído a ${name}.`, internal: true });
  refresh(o.id);
  return { ok: `Pedido atribuído a ${name}.` };
}

const OPS_STATUSES: BimStatus[] = ["aprovado", "em_modelagem", "em_revisao_interna"];

export async function setOrderStatus(orderId: string, status: BimStatus): Promise<Result> {
  const { user, o, access } = await ops(orderId, true);
  if (!OPS_STATUSES.includes(status)) return { error: "Status inválido." };
  if (access === "parceiro" && status === "aprovado") return { error: "Sem permissão." };
  if (["solicitado", "orcado", "concluido", "cancelado"].includes(o.status)) return { error: "O pedido não está em produção." };
  await setStatus(o, user, status, {}, undefined, true);
  return { ok: "Status atualizado." };
}

const deliverySchema = z.object({
  notes: z.string().trim().max(4000).nullable(),
  files: z
    .array(z.object({ name: z.string().min(1).max(200), url: z.string().url(), pathname: z.string(), bytes: z.number().int().nonnegative() }))
    .min(1, "Envie ao menos um arquivo."),
});

/** Nova versão do modelo. Do operador sai direto para o cliente; do parceiro vai para conferência interna. */
export async function createDelivery(orderId: string, input: z.input<typeof deliverySchema>): Promise<Result> {
  const { user, o, access } = await ops(orderId, true);
  if (!["aprovado", "em_modelagem", "em_revisao_interna", "revisao_solicitada", "entregue"].includes(o.status)) return { error: "O pedido não está em produção." };
  const d = deliverySchema.parse(input);
  for (const f of d.files) {
    if (!new URL(f.url).hostname.endsWith(".blob.vercel-storage.com") || !f.pathname.startsWith(`orgs/${o.orgId}/bim/${o.id}/`)) throw new Error("Arquivo inválido.");
  }
  const [{ v }] = await db.select({ v: max(bimDeliveries.version) }).from(bimDeliveries).where(eq(bimDeliveries.orderId, o.id));
  const version = (v ?? 0) + 1;
  const release = access === "operador";
  const [del] = await db.insert(bimDeliveries).values({ orderId: o.id, version, notes: d.notes, released: release, createdBy: user.id }).returning();
  await db.insert(bimDeliveryFiles).values(
    d.files.map((f) => ({ deliveryId: del!.id, name: f.name, format: (f.name.split(".").pop() ?? "").toLowerCase(), url: f.url, storageKey: f.pathname, bytes: f.bytes })),
  );
  await db.insert(bimEvents).values({ orderId: o.id, userId: user.id, kind: "entrega", body: d.notes, internal: !release, meta: { version } });
  if (release) {
    await setStatus(o, user, "entregue", { deliveredAt: new Date() }, `Versão ${version} entregue.`);
    await notify(await requesterEmail(o), `Modelo BIM do pedido #${o.number} entregue (v${version})`, "Confira os arquivos e aceite a entrega ou peça uma revisão.", o.id);
  } else {
    await setStatus(o, user, "em_revisao_interna", {}, `Versão ${version} enviada para conferência.`, true);
    await notifyOperators(`Pedido BIM #${o.number}: v${version} para conferência`, "O parceiro enviou uma nova versão. Confira e libere para o cliente.", o.id);
  }
  return { ok: release ? `Versão ${version} entregue ao cliente.` : `Versão ${version} enviada para conferência da equipe.` };
}

export async function releaseDelivery(orderId: string, deliveryId: string): Promise<Result> {
  const { user, o } = await ops(orderId);
  const [del] = await db.select().from(bimDeliveries).where(and(eq(bimDeliveries.id, deliveryId), eq(bimDeliveries.orderId, o.id)));
  if (!del) return { error: "Versão não encontrada." };
  await db.update(bimDeliveries).set({ released: true }).where(eq(bimDeliveries.id, del.id));
  await setStatus(o, user, "entregue", { deliveredAt: new Date() }, `Versão ${del.version} entregue.`);
  await notify(await requesterEmail(o), `Modelo BIM do pedido #${o.number} entregue (v${del.version})`, "Confira os arquivos e aceite a entrega ou peça uma revisão.", o.id);
  return { ok: `Versão ${del.version} liberada para o cliente.` };
}

/* ───────────── parceiros ───────────── */

export async function addPartner(_: Result, form: FormData): Promise<Result> {
  const user = await requireUser();
  if (user.platformRole !== "operador") return { error: "Só operadores gerenciam parceiros." };
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const role = String(form.get("platformRole") ?? "parceiro") === "operador" ? "operador" : "parceiro";
  const [u] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.email, email));
  if (!u) return { error: "Não há conta com esse e-mail. Peça para a pessoa criar uma conta no Oraclo primeiro." };
  await db.update(users).set({ platformRole: role }).where(eq(users.id, u.id));
  revalidatePath("/operacao/parceiros");
  return { ok: `${u.name} agora é ${role === "operador" ? "operador(a)" : "parceiro(a) modelador(a)"}.` };
}

export async function removePartner(userId: string): Promise<Result> {
  const user = await requireUser();
  if (user.platformRole !== "operador") return { error: "Só operadores gerenciam parceiros." };
  if (userId === user.id) return { error: "Você não pode remover o próprio acesso." };
  await db.update(users).set({ platformRole: null }).where(eq(users.id, userId));
  revalidatePath("/operacao/parceiros");
  return { ok: "Acesso de operação removido." };
}
