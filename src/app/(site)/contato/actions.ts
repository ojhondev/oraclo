"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { getLang } from "@/lib/site/get-lang";

export type LeadState = { ok: true } | { error: string } | null;

const GOALS = ["restauro", "inspecao", "retrofit", "compra", "patrimonio", "outro"] as const;

const leadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().max(160).optional(),
  building: z.string().trim().max(200).optional(),
  city: z.string().trim().max(120).optional(),
  goal: z.enum(GOALS).catch("outro"),
  message: z.string().trim().max(3000).optional(),
});

// limite simples por IP (em memória da instância): 5 pedidos a cada 10 minutos
const hits = new Map<string, number[]>();

/** Pedido de diagnóstico do site público: valida, barra robôs e grava em `leads`. */
export async function requestDiagnosis(_: LeadState, form: FormData): Promise<LeadState> {
  const lang = await getLang();
  const en = lang === "en";
  // campo-armadilha: pessoas não veem; robôs preenchem
  if (String(form.get("website") ?? "").trim()) return { ok: true };

  const ip = ((await headers()).get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "local";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  if (recent.length >= 5) return { error: en ? "Too many requests. Please try again in a few minutes." : "Muitos pedidos seguidos. Tente de novo em alguns minutos." };
  hits.set(ip, [...recent, now]);

  const val = (k: string) => String(form.get(k) ?? "").trim() || undefined;
  const parsed = leadSchema.safeParse({
    name: val("name"),
    email: val("email"),
    phone: val("phone"),
    company: val("company"),
    building: val("building"),
    city: val("city"),
    goal: val("goal"),
    message: val("message"),
  });
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    if (field === "email") return { error: en ? "Please enter a valid email." : "Informe um e-mail válido." };
    if (field === "name") return { error: en ? "Please enter your name." : "Informe o seu nome." };
    return { error: en ? "Please check the form fields." : "Confira os campos do formulário." };
  }
  await db.insert(schema.leads).values({ ...parsed.data, lang });
  return { ok: true };
}
