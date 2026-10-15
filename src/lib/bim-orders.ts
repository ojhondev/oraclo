import "server-only";
import { and, asc, desc, eq, inArray, isNotNull, ne, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import type { BimStatus } from "@/lib/db/schema";
import { appUrl, emailLayout, sendEmail } from "@/lib/email";

const { bimOrders, bimEvents, bimDeliveries, bimDeliveryFiles, sites, organizations, users, captures, outputs } = schema;

export type OrderAccess = "cliente" | "operador" | "parceiro";
export type BimOrder = typeof bimOrders.$inferSelect;

/** Quem pode ver o pedido: a organização cliente, os operadores e o parceiro atribuído. */
export function accessOf(user: SessionUser, order: Pick<BimOrder, "orgId" | "assigneeId">): OrderAccess | null {
  if (user.platformRole === "operador") return "operador";
  if (user.platformRole === "parceiro" && order.assigneeId === user.id) return "parceiro";
  if (order.orgId === user.orgId) return "cliente";
  return null;
}

/** Pedido + acesso do usuário (404 se não puder ver). */
export async function getOrderFor(user: SessionUser, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [row] = await db
    .select({ order: bimOrders, siteName: sites.name, siteCity: sites.city, orgName: organizations.name })
    .from(bimOrders)
    .innerJoin(sites, eq(sites.id, bimOrders.siteId))
    .innerJoin(organizations, eq(organizations.id, bimOrders.orgId))
    .where(eq(bimOrders.id, id))
    .limit(1);
  if (!row) notFound();
  const access = accessOf(user, row.order);
  // o operador também é cliente quando o pedido é da própria organização
  if (!access) notFound();
  return { ...row, access };
}

/** Tudo que a página do pedido mostra, filtrado pelo tipo de acesso. */
export async function getOrderDetail(user: SessionUser, id: string) {
  const base = await getOrderFor(user, id);
  const { order, access } = base;
  const ops = access !== "cliente";
  const [events, deliveries, people, baseFiles, captureRow] = await Promise.all([
    db
      .select({ e: bimEvents, userName: users.name })
      .from(bimEvents)
      .leftJoin(users, eq(users.id, bimEvents.userId))
      .where(
        and(
          eq(bimEvents.orderId, id),
          ops ? undefined : eq(bimEvents.internal, false),
          // parceiro modelador não vê valores do orçamento
          access === "parceiro" ? ne(bimEvents.kind, "orcamento") : undefined,
        ),
      )
      .orderBy(asc(bimEvents.createdAt)),
    db
      .select()
      .from(bimDeliveries)
      .where(and(eq(bimDeliveries.orderId, id), ops ? undefined : eq(bimDeliveries.released, true)))
      .orderBy(desc(bimDeliveries.version)),
    db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(inArray(users.id, [order.assigneeId, order.requestedBy].filter((x): x is string => !!x).concat(["00000000-0000-0000-0000-000000000000"]))),
    // base da modelagem: arquivos de resultado da captura escolhida (ou de todo o projeto)
    db
      .select({ id: outputs.id, name: outputs.name, format: outputs.format, bytes: outputs.bytes, url: outputs.url })
      .from(outputs)
      .where(order.captureId ? eq(outputs.captureId, order.captureId) : eq(outputs.siteId, order.siteId))
      .orderBy(desc(outputs.createdAt)),
    order.captureId
      ? db.select({ id: captures.id, mode: captures.mode, fileCount: captures.fileCount, status: captures.status }).from(captures).where(eq(captures.id, order.captureId)).then((r) => r[0] ?? null)
      : Promise.resolve(null),
  ]);
  const files = deliveries.length
    ? await db.select().from(bimDeliveryFiles).where(inArray(bimDeliveryFiles.deliveryId, deliveries.map((d) => d.id))).orderBy(asc(bimDeliveryFiles.createdAt))
    : [];
  const person = (pid: string | null) => people.find((p) => p.id === pid) ?? null;
  return {
    ...base,
    events,
    deliveries: deliveries.map((d) => ({ ...d, files: files.filter((f) => f.deliveryId === d.id) })),
    assignee: person(order.assigneeId),
    requester: person(order.requestedBy),
    baseFiles,
    capture: captureRow,
  };
}

const orderCols = {
  id: bimOrders.id,
  number: bimOrders.number,
  status: bimOrders.status,
  areaM2: bimOrders.areaM2,
  lod: bimOrders.lod,
  formats: bimOrders.formats,
  priceCents: bimOrders.priceCents,
  estimateCents: bimOrders.estimateCents,
  dueDate: bimOrders.dueDate,
  desiredDate: bimOrders.desiredDate,
  createdAt: bimOrders.createdAt,
  updatedAt: bimOrders.updatedAt,
  siteId: sites.id,
  siteName: sites.name,
  orgName: organizations.name,
  assigneeId: bimOrders.assigneeId,
};

/** Pedidos da organização cliente. */
export async function listOrgOrders(orgId: string, siteId?: string) {
  return db
    .select(orderCols)
    .from(bimOrders)
    .innerJoin(sites, eq(sites.id, bimOrders.siteId))
    .innerJoin(organizations, eq(organizations.id, bimOrders.orgId))
    .where(and(eq(bimOrders.orgId, orgId), siteId ? eq(bimOrders.siteId, siteId) : undefined))
    .orderBy(desc(bimOrders.createdAt));
}

/** Fila da operação: todos os pedidos (operador) ou só os atribuídos (parceiro). */
export async function listQueue(user: SessionUser, statuses?: BimStatus[]) {
  const rows = await db
    .select({ ...orderCols, assigneeName: users.name })
    .from(bimOrders)
    .innerJoin(sites, eq(sites.id, bimOrders.siteId))
    .innerJoin(organizations, eq(organizations.id, bimOrders.orgId))
    .leftJoin(users, eq(users.id, bimOrders.assigneeId))
    .where(
      and(
        user.platformRole === "parceiro" ? eq(bimOrders.assigneeId, user.id) : undefined,
        statuses?.length ? inArray(bimOrders.status, statuses) : undefined,
      ),
    )
    .orderBy(desc(bimOrders.updatedAt));
  return rows;
}

/** Equipe que pode receber pedidos: operadores (banco ou variável de ambiente) e parceiros. */
export async function listModelers() {
  const envEmails = (process.env.PLATFORM_OPERATORS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return db
    .select({ id: users.id, name: users.name, email: users.email, platformRole: users.platformRole, orgName: organizations.name })
    .from(users)
    .innerJoin(organizations, eq(organizations.id, users.orgId))
    .where(and(eq(users.active, true), or(isNotNull(users.platformRole), envEmails.length ? inArray(users.email, envEmails) : undefined)))
    .orderBy(asc(users.name));
}

/* ───────────── e-mails do fluxo ───────────── */

async function operatorEmails() {
  const env = (process.env.PLATFORM_OPERATORS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const rows = await db.select({ email: users.email }).from(users).where(and(eq(users.platformRole, "operador"), eq(users.active, true)));
  return [...new Set([...env, ...rows.map((r) => r.email)])];
}

export async function notify(to: string | string[] | null | undefined, title: string, intro: string, orderId: string) {
  const list = [to].flat().filter((x): x is string => !!x);
  if (!list.length) return;
  const url = `${await appUrl()}/bim/${orderId}`;
  const { html, text } = emailLayout({ title, intro, button: "Abrir o pedido", url, footer: "Você recebe este aviso porque participa deste pedido no Oraclo." });
  await Promise.all(list.map((email) => sendEmail({ to: email, subject: `Oraclo · ${title}`, html, text })));
}

export async function notifyOperators(title: string, intro: string, orderId: string) {
  await notify(await operatorEmails(), title, intro, orderId);
}

export async function requesterEmail(order: Pick<BimOrder, "requestedBy">) {
  if (!order.requestedBy) return null;
  const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, order.requestedBy));
  return u?.email ?? null;
}
