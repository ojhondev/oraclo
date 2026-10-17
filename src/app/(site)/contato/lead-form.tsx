"use client";

import { useActionState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import type { Lang } from "@/lib/site/lang";
import { requestDiagnosis, type LeadState } from "./actions";

const L = {
  pt: {
    name: "Nome",
    email: "E-mail",
    phone: "Telefone / WhatsApp",
    company: "Empresa ou instituição",
    building: "Imóvel",
    buildingPh: "Ex.: igreja do séc. XVIII, prédio de 8 andares, casarão…",
    city: "Cidade / UF",
    goal: "Objetivo",
    goals: [
      ["restauro", "Restauro"],
      ["inspecao", "Inspeção predial / laudo"],
      ["retrofit", "Retrofit ou reforma"],
      ["compra", "Compra ou avaliação do imóvel"],
      ["patrimonio", "Monitoramento de patrimônio"],
      ["outro", "Outro"],
    ],
    message: "Conte um pouco sobre o imóvel",
    messagePh: "Número de fachadas, área aproximada, prazo, acesso, o que já existe (plantas, fotos)…",
    optional: "opcional",
    send: "Solicitar diagnóstico",
    sending: "Enviando…",
    privacy: "Usamos estes dados só para responder ao seu pedido.",
    okTitle: "Pedido recebido.",
    okText: "Um arquiteto do Estúdio Restaura vai ler e responder pelo e-mail informado.",
  },
  en: {
    name: "Name",
    email: "Email",
    phone: "Phone / WhatsApp",
    company: "Company or institution",
    building: "Building",
    buildingPh: "E.g. 18th-century church, 8-storey block, historic house…",
    city: "City / state",
    goal: "Goal",
    goals: [
      ["restauro", "Restoration"],
      ["inspecao", "Building inspection / report"],
      ["retrofit", "Retrofit or refurbishment"],
      ["compra", "Purchase or property assessment"],
      ["patrimonio", "Heritage monitoring"],
      ["outro", "Other"],
    ],
    message: "Tell us a little about the building",
    messagePh: "Number of facades, approximate area, timeline, access, what already exists (plans, photos)…",
    optional: "optional",
    send: "Request a diagnosis",
    sending: "Sending…",
    privacy: "We only use this information to reply to your request.",
    okTitle: "Request received.",
    okText: "An Estúdio Restaura architect will read it and reply to the email you provided.",
  },
};

const input =
  "h-11 w-full rounded-xl border bg-background px-3.5 text-[15px] outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground/40";

export function LeadForm({ lang }: { lang: Lang }) {
  const t = L[lang];
  const [state, action, pending] = useActionState<LeadState, FormData>(requestDiagnosis, null);

  if (state && "ok" in state) {
    return (
      <div className="rounded-2xl border bg-card p-8" role="status">
        <span className="grid size-10 place-items-center rounded-full bg-foreground text-background">
          <Check className="size-5" />
        </span>
        <p className="mt-5 text-[22px] font-medium tracking-[-0.01em]">{t.okTitle}</p>
        <p className="mt-2 text-[15.5px] leading-7 text-muted-foreground">{t.okText}</p>
      </div>
    );
  }

  const label = (text: string, opt?: boolean) => (
    <span className="text-[13.5px] font-medium">
      {text}
      {opt && <span className="ml-1 font-normal text-muted-foreground">({t.optional})</span>}
    </span>
  );

  return (
    <form action={action} className="grid gap-4 rounded-2xl border bg-card p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5">
          {label(t.name)}
          <input name="name" required autoComplete="name" className={input} />
        </label>
        <label className="grid gap-1.5">
          {label(t.email)}
          <input name="email" type="email" required autoComplete="email" className={input} />
        </label>
        <label className="grid gap-1.5">
          {label(t.phone, true)}
          <input name="phone" type="tel" autoComplete="tel" className={input} />
        </label>
        <label className="grid gap-1.5">
          {label(t.company, true)}
          <input name="company" autoComplete="organization" className={input} />
        </label>
        <label className="grid gap-1.5">
          {label(t.building, true)}
          <input name="building" placeholder={t.buildingPh} className={input} />
        </label>
        <label className="grid gap-1.5">
          {label(t.city, true)}
          <input name="city" autoComplete="address-level2" className={input} />
        </label>
      </div>
      <label className="grid gap-1.5">
        {label(t.goal)}
        <select name="goal" defaultValue="restauro" className={`${input} appearance-none`}>
          {t.goals.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5">
        {label(t.message, true)}
        <textarea name="message" rows={5} placeholder={t.messagePh} className={`${input} h-auto py-3 leading-6`} />
      </label>
      {/* armadilha para robôs: escondida de pessoas e leitores de tela */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      {state && "error" in state && <p className="text-[14px] text-red-500">{state.error}</p>}
      <div className="flex flex-wrap items-center gap-4 pt-1">
        <button type="submit" disabled={pending} className="inline-flex h-11 items-center gap-1.5 rounded-full bg-foreground px-6 text-[15px] font-medium text-background hover:opacity-85 disabled:opacity-60">
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {pending ? t.sending : t.send}
          {!pending && <ArrowRight className="size-4" />}
        </button>
        <span className="text-[12.5px] text-muted-foreground">{t.privacy}</span>
      </div>
    </form>
  );
}
