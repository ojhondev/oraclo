import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getLang } from "@/lib/site/get-lang";
import { SITE } from "@/lib/site/site-copy";
import { fmtPostDate, getPosts } from "@/lib/updates";
import { Illo } from "@/components/site/illo";

export async function generateMetadata(): Promise<Metadata> {
  const t = SITE[await getLang()].tech;
  return { title: t.metaTitle, description: t.statement };
}

/** Tecnologia (na estrutura da página Research da Anthropic): frase, frentes, seções e publicações. */
export default async function TechPage() {
  const lang = await getLang();
  const t = SITE[lang].tech;
  const posts = getPosts(lang);
  const featured = posts[0]!;

  return (
    <>
      <section className="px-4 pt-12 pb-20 sm:px-6 sm:pt-16 sm:pb-28 lg:px-8">
        <h1 className="max-w-[1100px] text-[30px] leading-[1.15] text-muted-foreground sm:text-[44px]">{t.statement}</h1>
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
      <section className="px-4 pt-20 sm:px-6 sm:pt-28 lg:px-8">
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
                    <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-[var(--site-clay)]" />
                    {b}
                  </li>
                ))}
              </ul>
              {it.more && (
                <Link href={it.more.href} className="mt-6 inline-flex items-center gap-1 text-[14.5px] font-medium hover:underline hover:underline-offset-4">
                  {it.more.label} <ArrowRight className="size-4" />
                </Link>
              )}
            </div>
          </article>
        ))}
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
