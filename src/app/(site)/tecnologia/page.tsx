import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getLang } from "@/lib/site/get-lang";
import { SITE } from "@/lib/site/site-copy";
import { fmtPostDate, getPosts } from "@/lib/updates";
import { SCIENCE } from "@/lib/site/science";
import { Illo } from "@/components/site/illo";
import { Formula } from "@/components/site/formula";
import { TechCarousel } from "@/components/site/tech-carousel";

export async function generateMetadata(): Promise<Metadata> {
  const t = SITE[await getLang()].tech;
  return { title: t.metaTitle, description: t.statement };
}

/** Nossa Tecnologia: a transformação (antes e depois), fundamentos em cartões, IA, diferenciais e publicações. */
export default async function TechPage() {
  const lang = await getLang();
  const t = SITE[lang].tech;
  const sci = SCIENCE[lang];
  const posts = getPosts(lang);

  return (
    <>
      <section className="px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-24 lg:px-8">
        <p className="a-label">{t.title}</p>
        <h1 className="mt-4 max-w-[16ch] text-[44px] leading-[1.03] sm:text-[72px]">{t.headline}</h1>
        <p className="a-serif mt-6 max-w-[58ch] text-[20px] leading-[1.45] text-muted-foreground sm:text-[24px]">{t.statement}</p>
      </section>

      {/* a transformação: o antes e o depois, linha a linha */}
      <section id="transformacao" className="site-ink scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div>
            <p className="a-label">{sci.transform.label}</p>
            <h2 className="mt-4 text-[32px] leading-[1.1] sm:text-[46px]">{sci.transform.title}</h2>
          </div>
          <p className="a-serif self-end text-[19px] leading-[1.5] sm:text-[22px]">{sci.transform.text}</p>
        </div>
        <div className="mt-12 border-t">
          <div className="hidden gap-6 border-b py-3 text-[13px] font-bold md:grid md:grid-cols-[1fr_1.5fr_1.8fr]">
            <span />
            <span>{sci.transform.before}</span>
            <span>{sci.transform.after}</span>
          </div>
          {sci.transform.rows.map(([topic, before, after]) => (
            <div key={topic} className="grid gap-2 border-b py-5 md:grid-cols-[1fr_1.5fr_1.8fr] md:gap-6">
              <p className="a-label md:self-center">{topic}</p>
              <p className="text-[16px] leading-6 text-muted-foreground line-through decoration-muted-foreground/40 md:no-underline md:self-center">{before}</p>
              <p className="text-[18px] leading-snug font-medium sm:text-[20px]">{after}</p>
            </div>
          ))}
        </div>
      </section>

      {/* fundamentos: cartões que passam na horizontal e se expandem */}
      <section id="fundamentos" className="scroll-mt-20 px-4 pt-20 sm:px-6 sm:pt-28 lg:px-8">
        <p className="a-label">{t.sectionsLabel}</p>
        <h2 className="mt-4 text-[32px] leading-[1.1] sm:text-[46px]">{t.sectionsTitle}</h2>
        <p className="mt-3 text-[15px] text-muted-foreground">{t.sectionsHint}</p>
        <div className="mt-8">
          <TechCarousel
            moreLabel={t.moreLabel}
            closeLabel={t.closeLabel}
            cards={t.items.map((it) => ({
              id: it.id,
              status: it.status,
              name: it.name,
              summary: it.summary,
              illo: <Illo name={it.illo} />,
              detail: (
                <>
                  <ul className="mt-4 border-t text-[14px] leading-6">
                    {it.bullets.map((b) => (
                      <li key={b} className="flex gap-3 border-b py-2.5">
                        <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-[var(--site-accent)]" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <ul className="mt-5 grid gap-4">
                    {(sci.math[it.id] ?? []).map((eq) => (
                      <li key={eq.tex} className="min-w-0">
                        <Formula tex={eq.tex} className="a-formula-box" />
                        <p className="mt-2 text-[13.5px] leading-6 text-muted-foreground">{eq.note}</p>
                      </li>
                    ))}
                  </ul>
                  {it.more && (
                    <Link href={it.more.href} className="mt-4 inline-flex items-center gap-1 text-[14px] font-medium hover:underline hover:underline-offset-4">
                      {it.more.label} <ArrowRight className="size-4" />
                    </Link>
                  )}
                </>
              ),
            }))}
          />
        </div>
      </section>

      {/* a IA em cada etapa: faixa escura para separar método de produto */}
      <section id="ia" className="site-ink mt-20 scroll-mt-20 px-4 py-16 sm:mt-28 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div>
            <p className="a-label">{sci.ai.label}</p>
            <h2 className="mt-4 text-[32px] leading-[1.1] sm:text-[46px]">{sci.ai.title}</h2>
          </div>
          <p className="a-serif self-end text-[19px] leading-[1.5] sm:text-[22px]">{sci.ai.text}</p>
        </div>
        <div className="mt-12 border-t">
          <div className="hidden gap-6 border-b py-3 text-[13px] font-bold lg:grid lg:grid-cols-[1fr_1.4fr_1.3fr_1.4fr_1.4fr]">
            {sci.ai.headers.map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
          {sci.ai.rows.map((row) => (
            <dl key={row.step} className="grid gap-3 border-b py-5 lg:grid-cols-[1fr_1.4fr_1.3fr_1.4fr_1.4fr] lg:gap-6">
              <div>
                <dt className="sr-only">{sci.ai.headers[0]}</dt>
                <dd className="a-title text-[18px] leading-snug">{row.step}</dd>
              </div>
              {[row.method, row.nature, row.role, row.human].map((v, i) => (
                <div key={i} className="min-w-0">
                  <dt className="text-[12.5px] text-muted-foreground lg:sr-only">{sci.ai.headers[i + 1]}</dt>
                  <dd className="text-[14.5px] leading-6">{v}</dd>
                </div>
              ))}
            </dl>
          ))}
        </div>
        <p className="mt-6 max-w-[80ch] text-[15px] leading-6 text-muted-foreground">{sci.ai.note}</p>
      </section>

      {/* diferenciais: no celular cada linha vira um bloco com os rótulos à vista */}
      <section id="diferenciais" className="scroll-mt-20 px-4 pt-20 sm:px-6 sm:pt-28 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div>
            <p className="a-label">{sci.diff.label}</p>
            <h2 className="mt-4 text-[32px] leading-[1.1] sm:text-[46px]">{sci.diff.title}</h2>
          </div>
          <p className="a-serif self-end text-[19px] leading-[1.5] sm:text-[22px]">{sci.diff.text}</p>
        </div>
        <div className="mt-12 border-t">
          <div className="hidden gap-6 border-b py-3 text-[13px] font-bold lg:grid lg:grid-cols-[1fr_1.4fr_1.6fr_1.6fr]">
            {sci.diff.headers.map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>
          {sci.diff.rows.map(([aspect, ...cells]) => (
            <dl key={aspect} className="grid gap-3 border-b py-5 lg:grid-cols-[1fr_1.4fr_1.6fr_1.6fr] lg:gap-6">
              <div>
                <dt className="sr-only">{sci.diff.headers[0]}</dt>
                <dd className="a-title text-[17px] leading-snug">{aspect}</dd>
              </div>
              {cells.map((v, i) => (
                <div key={i} className="min-w-0">
                  <dt className="text-[12.5px] text-muted-foreground lg:sr-only">{sci.diff.headers[i + 1]}</dt>
                  <dd className={i === 2 ? "text-[14.5px] leading-6 font-medium" : "text-[14.5px] leading-6 text-muted-foreground"}>{v}</dd>
                </div>
              ))}
            </dl>
          ))}
        </div>
        <p className="mt-6 max-w-[80ch] text-[15px] leading-6 text-muted-foreground">{sci.diff.note}</p>
      </section>

      {/* publicações */}
      <section className="px-4 pt-20 sm:px-6 sm:pt-28 lg:px-8">
        <div className="flex items-baseline justify-between border-y py-3">
          <h2 className="text-[13.5px] font-bold">{t.postsLabel}</h2>
          <span className="a-label">{t.postsCount(posts.length)}</span>
        </div>
        <ul>
          {posts.map((p) => (
            <li key={p.slug} className="border-b">
              <Link href={`/index/${p.slug}`} className="group grid gap-2 py-6 md:grid-cols-[180px_minmax(0,1fr)_minmax(0,1.3fr)] md:gap-8">
                <span className="a-tag">
                  {p.category} · {fmtPostDate(p.date, "short", lang)}
                </span>
                <span className="a-title text-[19px] leading-snug group-hover:underline group-hover:underline-offset-4">{p.title}</span>
                <span className="text-[14.5px] leading-6 text-muted-foreground">{p.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
