import type { Metadata } from "next";
import { STORIES } from "@/lib/site/stories";
import { StoryCard } from "@/components/site/blocks";

export const metadata: Metadata = {
  title: "Histórias",
  description: "Casos reais de diagnóstico de edificações montados no ArchRay.",
};

export default function HistoriasPage() {
  const [first, ...rest] = STORIES;
  return (
    <div className="px-4 pt-14 pb-24 sm:px-8 sm:pt-20 lg:px-12">
      <h1 className="text-[44px] leading-[1.05] font-medium tracking-[-0.03em] sm:text-[60px]">Histórias</h1>
      <p className="mt-3 max-w-xl text-[17px] leading-7 text-muted-foreground">
        Imóveis reais, do levantamento ao orçamento. Cada história mostra os dados e as imagens usados, com os créditos.
      </p>
      {first && (
        <div className="mt-12 border-t pt-8">
          <StoryCard story={first} large />
          <p className="mt-3 max-w-2xl text-[15.5px] leading-7 text-muted-foreground">{first.summary}</p>
        </div>
      )}
      {rest.length > 0 && (
        <ul className="mt-14 grid gap-8 border-t pt-8 md:grid-cols-3">
          {rest.map((s) => (
            <li key={s.slug}>
              <StoryCard story={s} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
