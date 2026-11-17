import type { Metadata } from "next";
import { Check } from "lucide-react";
import { getLang } from "@/lib/site/get-lang";
import { LeadForm } from "./lead-form";
import { ContourObject } from "@/components/eng/contour-object";

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
  return { title: t.title, description: t.description, alternates: { canonical: "/contato" } };
}

/** Contato (v2): faixa escura com o texto e o objeto em curvas de nível, formulário em cartão branco. */
export default async function ContatoPage() {
  const lang = await getLang();
  const t = T[lang];
  return (
    <section className="eng-hero eng-dark relative -mt-[68px] bg-black px-4 pt-[140px] pb-24 text-white sm:px-6 lg:px-8">
      <div className="grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
        <div>
          <p className="eng-eyebrow text-white/60">{t.kicker}</p>
          <h1 className="mt-6 max-w-[15ch] text-[clamp(38px,5vw,72px)] leading-[1.03] tracking-[-0.03em]">{t.h1}</h1>
          <p className="mt-6 max-w-[46ch] text-[17px] leading-7 text-white/70">{t.lead}</p>
          <div className="mt-12 border-t border-white/20 pt-8">
            <p className="eng-eyebrow text-white/55">{t.nextTitle}</p>
            <ol className="mt-6 grid gap-4">
              {t.next.map((n, i) => (
                <li key={n} className="grid grid-cols-[32px_1fr] gap-2 text-[15.5px] leading-6 text-white/85">
                  <span className="font-mono text-[11px] leading-6 text-white/45">{String(i + 1).padStart(2, "0")}</span>
                  <span>{n}</span>
                </li>
              ))}
            </ol>
            <p className="mt-8 inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.05em] text-white/50 uppercase">
              <Check className="size-3.5" /> ArchRay · Estúdio Restaura
            </p>
          </div>
          <ContourObject names={["celular"]} className="mt-10 hidden h-[220px] w-auto text-white/80 lg:block" />
        </div>
        <div className="self-start rounded-[16px] bg-white p-2 text-black sm:p-3">
          <LeadForm lang={lang} />
        </div>
      </div>
    </section>
  );
}
