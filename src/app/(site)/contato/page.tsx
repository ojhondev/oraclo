import type { Metadata } from "next";
import { Check } from "lucide-react";
import { getLang } from "@/lib/site/get-lang";
import { LeadForm } from "./lead-form";

const T = {
  pt: {
    title: "Solicitar diagnóstico",
    description: "Peça um diagnóstico de danos do seu imóvel ao ArchRay, o braço de diagnóstico do Estúdio Restaura.",
    kicker: "Solicitar diagnóstico",
    h1: "Conte qual é o imóvel. Um arquiteto responde.",
    lead: "Quem lê e responde é um especialista do Estúdio Restaura, não um robô. Depois do briefing, enviamos o orçamento do diagnóstico, sem compromisso.",
    nextTitle: "O que acontece depois",
    next: [
      "Um arquiteto lê o pedido e responde pelo e-mail informado.",
      "Fazemos o briefing técnico: objetivo, fachadas, acesso e entregas.",
      "Você recebe o escopo e o orçamento do diagnóstico.",
      "Aprovado, agendamos a vistoria em campo.",
    ],
  },
  en: {
    title: "Request a diagnosis",
    description: "Request a damage diagnosis of your building from ArchRay, Estúdio Restaura's diagnosis arm.",
    kicker: "Request a diagnosis",
    h1: "Tell us about the building. An architect will reply.",
    lead: "The person who reads and replies is an Estúdio Restaura specialist, not a bot. After the briefing, we send a quote for the diagnosis, with no obligation.",
    nextTitle: "What happens next",
    next: [
      "An architect reads your request and replies to the email you provided.",
      "We hold the technical briefing: goal, facades, access and deliverables.",
      "You receive the scope and the quote for the diagnosis.",
      "Once approved, we schedule the site survey.",
    ],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const t = T[await getLang()];
  return { title: t.title, description: t.description };
}

export default async function ContatoPage() {
  const lang = await getLang();
  const t = T[lang];
  return (
    <div className="px-4 pt-16 pb-24 sm:px-6 sm:pt-24 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.25fr] lg:gap-20">
        <div>
          <p className="site-fade-in text-[14px] font-medium text-muted-foreground">{t.kicker}</p>
          <h1 className="site-fade-in mt-4 max-w-[16ch] text-[40px] leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-[60px]" style={{ "--d": "120ms" } as React.CSSProperties}>
            {t.h1}
          </h1>
          <p className="site-fade-in mt-6 max-w-[46ch] text-[17px] leading-7 text-muted-foreground" style={{ "--d": "240ms" } as React.CSSProperties}>
            {t.lead}
          </p>
          <div className="site-fade-in mt-10 border-t pt-8" style={{ "--d": "360ms" } as React.CSSProperties}>
            <p className="text-[14px] font-medium">{t.nextTitle}</p>
            <ol className="mt-4 grid gap-3">
              {t.next.map((n, i) => (
                <li key={n} className="grid grid-cols-[28px_1fr] gap-2 text-[15px] leading-6">
                  <span className="grid size-6 place-items-center rounded-full border text-[12px] text-muted-foreground tabular-nums">{i + 1}</span>
                  <span>{n}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] text-muted-foreground">
              <Check className="size-3.5" /> ArchRay · Estúdio Restaura
            </p>
          </div>
        </div>
        <div className="site-fade-in" style={{ "--d": "300ms" } as React.CSSProperties}>
          <LeadForm lang={lang} />
        </div>
      </div>
    </div>
  );
}
