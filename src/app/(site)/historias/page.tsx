import type { Metadata } from "next";
import { getStories } from "@/lib/site/stories";
import { getLang } from "@/lib/site/get-lang";
import { StoryCard } from "@/components/site/blocks";

const T = {
  pt: {
    title: "Histórias",
    description: "Casos reais de diagnóstico de edificações montados no ArchRay.",
    lead: "Imóveis reais, do levantamento ao orçamento. Cada história mostra os dados e as imagens usados, com os créditos.",
  },
  en: {
    title: "Stories",
    description: "Real building diagnosis cases built in ArchRay.",
    lead: "Real buildings, from survey to budget. Each story shows the data and images used, with credits.",
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
    <div className="px-4 pt-16 pb-24 sm:px-6 sm:pt-24 lg:px-8">
      <h1 className="site-fade-in text-[44px] leading-[1.05] font-medium tracking-[-0.04em] sm:text-[72px]">{t.title}</h1>
      <p className="site-fade-in mt-4 max-w-xl text-[17px] leading-7 text-muted-foreground" style={{ "--d": "200ms" } as React.CSSProperties}>
        {t.lead}
      </p>
      {first && (
        <div className="mt-12 border-t pt-8">
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
