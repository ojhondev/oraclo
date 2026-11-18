import type { Metadata } from "next";
import { WHATSAPP_LABEL, whatsappUrl } from "@/lib/site/whatsapp";
import { getStories } from "@/lib/site/stories";
import { getLang } from "@/lib/site/get-lang";
import { StoryCard } from "@/components/site/blocks";
import { EngBand, EngCta, EngPageHero } from "@/components/eng/blocks";

const T = {
  pt: {
    title: "Casos",
    description: "Diagnósticos de edificações feitos com o ArchRay, o braço de diagnóstico do Estúdio Restaura.",
    lead: "Imóveis reais, do levantamento ao orçamento. Cada caso mostra os dados e as imagens usados, com os créditos.",
  },
  en: {
    title: "Cases",
    description: "Building diagnoses produced with ArchRay, Estúdio Restaura’s diagnosis arm.",
    lead: "Real buildings, from survey to budget. Each case shows the data and images used, with credits.",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const t = T[await getLang()];
  return { title: t.title, description: t.description, alternates: { canonical: "/historias" } };
}

/** Casos (v2): topo escuro, caso em destaque e demais em grade, chamada final. */
export default async function HistoriasPage() {
  const lang = await getLang();
  const en = lang === "en";
  const t = T[lang];
  const [first, ...rest] = getStories(lang);
  return (
    <>
      <EngPageHero eyebrow={t.title} title={en ? "Real buildings, measured end to end." : "Imóveis reais, medidos de ponta a ponta."} text={t.lead} object="igreja" video="fachada" />
      <EngBand tone="white">
        {first && (
          <div>
            <StoryCard story={first} large lang={lang} />
            <p className="mt-4 max-w-2xl text-[16px] leading-7 text-(--eng-mute)">{first.summary}</p>
          </div>
        )}
        {rest.length > 0 && (
          <ul className="mt-16 grid gap-8 border-t border-(--eng-ink) pt-10 md:grid-cols-3">
            {rest.map((s) => (
              <li key={s.slug}>
                <StoryCard story={s} lang={lang} />
              </li>
            ))}
          </ul>
        )}
      </EngBand>
      <EngCta
        title={en ? "Your building could be the next case." : "Seu imóvel pode ser o próximo caso."}
        cta={{ href: whatsappUrl(lang), label: WHATSAPP_LABEL[lang] }}
        object="fachada"
      />
    </>
  );
}
