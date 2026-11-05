import type { Metadata } from "next";
import { getStories } from "@/lib/site/stories";
import { getLang } from "@/lib/site/get-lang";
import { StoryCard } from "@/components/site/blocks";

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
  return { title: t.title, description: t.description };
}

export default async function HistoriasPage() {
  const lang = await getLang();
  const t = T[lang];
  const [first, ...rest] = getStories(lang);
  return (
    <div className="px-4 pt-12 pb-8 sm:px-6 sm:pt-16 lg:px-8">
      <p className="a-label">{t.title}</p>
      <h1 className="mt-5 max-w-[1100px] a-fluid [--a:30] [--b:44] leading-[1.15]">{t.lead}</h1>
      {first && (
        <div className="mt-14 border-t pt-8">
          <StoryCard story={first} large lang={lang} />
          <p className="mt-3 max-w-2xl text-[15.5px] leading-7 text-muted-foreground">{first.summary}</p>
        </div>
      )}
      {rest.length > 0 && (
        <ul className="mt-14 grid gap-8 border-t pt-8 md:grid-cols-3">
          {rest.map((s) => (
            <li key={s.slug}>
              <StoryCard story={s} lang={lang} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
