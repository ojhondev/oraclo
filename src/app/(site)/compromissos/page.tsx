import type { Metadata } from "next";
import { getLang } from "@/lib/site/get-lang";
import { SITE } from "@/lib/site/site-copy";
import { Illo } from "@/components/site/illo";

export async function generateMetadata(): Promise<Metadata> {
  const t = SITE[await getLang()].commitments;
  return { title: t.metaTitle, description: t.statement };
}

/** Compromissos (na estrutura das páginas de compromissos da Anthropic): frase e um bloco por compromisso. */
export default async function CommitmentsPage() {
  const lang = await getLang();
  const t = SITE[lang].commitments;
  return (
    <>
      <section className="px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-24 lg:px-8">
        <p className="a-label">{t.metaTitle}</p>
        <h1 className="mt-5 max-w-[1100px] text-[30px] leading-[1.15] sm:text-[44px]">{t.statement}</h1>
      </section>
      <section className="grid gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:px-8">
        {t.items.map((it, i) => (
          <article key={it.id} id={it.id} className="a-card flex scroll-mt-24 flex-col overflow-hidden" data-reveal data-reveal-delay={(i % 2) * 90}>
            <div className="aspect-[16/9]">
              <Illo name={it.illo} />
            </div>
            <div className="p-6 sm:p-8">
              <p className="a-label">0{i + 1}</p>
              <h2 className="mt-3 text-[24px] leading-tight sm:text-[28px]">{it.title}</h2>
              <p className="mt-3 text-[15.5px] leading-7 text-muted-foreground">{it.text}</p>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
