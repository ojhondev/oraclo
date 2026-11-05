import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getLang } from "@/lib/site/get-lang";
import { SITE } from "@/lib/site/site-copy";
import { fmtPostDate, getPosts } from "@/lib/updates";
import { SCIENCE } from "@/lib/site/science";
import { Illo } from "@/components/site/illo";
import { Formula } from "@/components/site/formula";

export async function generateMetadata(): Promise<Metadata> {
  const t = SITE[await getLang()].tech;
  return { title: t.metaTitle, description: t.statement };
}

/** Nossa Tecnologia: método, frentes com as equações, papel da IA, diferenciais, limites e publicações. */
export default async function TechPage() {
  const lang = await getLang();
  const t = SITE[lang].tech;
  const sci = SCIENCE[lang];
  const posts = getPosts(lang);
  const featured = posts[0]!;

  return (
    <>
      <section className="px-4 pt-12 pb-20 sm:px-6 sm:pt-16 sm:pb-28 lg:px-8">
        <h1 className="text-[40px] leading-[1.05] sm:text-[58px]">{t.title}</h1>
        <p className="mt-6 max-w-[1100px] text-[24px] leading-[1.2] text-muted-foreground sm:text-[36px]">{t.statement}</p>
      </section>

      {/* faixa escura: frentes do motor + publicação em destaque */}
      <section className="site-ink px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-12 xl:grid-cols-[1.5fr_1fr]">
          <div className="min-w-0">
            <p className="a-label">{t.frontsLabel}</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {t.items.map((it) => (
                <li key={it.id}>
                  <a href={`#${it.id}`} className="a-card group flex h-full flex-col p-5 transition-colors hover:bg-[var(--site-pill)]">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="a-title text-[17px]">{it.name}</span>
                    </div>
                    <span className="mt-1 text-[12.5px] text-muted-foreground">{it.status}</span>
                    <p className="mt-4 text-[14px] leading-6 text-muted-foreground">{it.summary}</p>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0 border-t pt-6 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-12">
            <p className="a-label">{t.featuredLabel}</p>
            <p className="a-tag mt-6">
              {featured.category} · {fmtPostDate(featured.date, "short", lang)}
            </p>
            <h2 className="mt-3 text-[26px] leading-tight sm:text-[30px]">{featured.title}</h2>
            <p className="mt-4 text-[15px] leading-7 text-muted-foreground">{featured.summary}</p>
            <Link href={`/index/${featured.slug}`} className="a-btn-2 a-btn-sm mt-6">
              {t.readMore} <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* uma seção por frente */}
      <section id="fundamentos" className="scroll-mt-20 px-4 pt-20 sm:px-6 sm:pt-28 lg:px-8">
        <div className="border-y py-3">
          <h2 className="text-[13.5px] font-bold">{t.sectionsLabel}</h2>
        </div>
        {t.items.map((it, i) => (
          <article key={it.id} id={it.id} className="grid scroll-mt-24 gap-8 border-b py-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <div className={i % 2 ? "lg:order-2" : undefined}>
              <div className="aspect-square max-w-[520px] overflow-hidden rounded-[8px]" data-reveal="fade">
                <Illo name={it.illo} />
              </div>
            </div>
            <div className="min-w-0 self-center">
              <p className="a-label">
                0{i + 1} · {it.status}
              </p>
              <h3 className="mt-4 text-[30px] leading-tight sm:text-[40px]">{it.name}</h3>
              <p className="a-serif mt-4 max-w-[46ch] text-[20px] leading-[1.45] sm:text-[23px]">{it.summary}</p>
              <ul className="mt-8 border-t text-[15px] leading-6">
                {it.bullets.map((b) => (
                  <li key={b} className="flex gap-3 border-b py-3">
                    <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-[var(--site-accent)]" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <p className="a-label">{sci.mathLabel}</p>
                <ul className="mt-3 grid gap-4">
                  {(sci.math[it.id] ?? []).map((eq) => (
                    <li key={eq.tex} className="min-w-0">
                      <Formula tex={eq.tex} className="a-formula-box" />
                      <p className="mt-2 text-[14px] leading-6 text-muted-foreground">{eq.note}</p>
                    </li>
                  ))}
                </ul>
              </div>
              {it.more && (
                <Link href={it.more.href} className="mt-6 inline-flex items-center gap-1 text-[14.5px] font-medium hover:underline hover:underline-offset-4">
                  {it.more.label} <ArrowRight className="size-4" />
                </Link>
              )}
            </div>
          </article>
        ))}
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

      {/* limites declarados */}
      <section id="limites" className="scroll-mt-20 px-4 pt-20 sm:px-6 sm:pt-28 lg:px-8">
        <p className="a-label">{sci.limits.label}</p>
        <h2 className="mt-4 text-[32px] leading-[1.1] sm:text-[46px]">{sci.limits.title}</h2>
        <ul className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 xl:grid-cols-4">
          {sci.limits.items.map(([title, text]) => (
            <li key={title} className="border-t pt-4">
              <h3 className="a-title text-[17px]">{title}</h3>
              <p className="mt-2 text-[14.5px] leading-6 text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
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
