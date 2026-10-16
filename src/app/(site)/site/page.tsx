import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calculator, CloudOff, FileText, Frame, Gauge, ListOrdered, Play, Smartphone, WandSparkles } from "lucide-react";
import { getPosts } from "@/lib/updates";
import { getStories } from "@/lib/site/stories";
import { CARMO } from "@/lib/site/carmo";
import { fmtBRL } from "@/lib/pricing";
import { getLang } from "@/lib/site/get-lang";
import { HOME } from "@/lib/site/home-copy";
import { damageName, fmtDateShort, fmtNum, prioLabel } from "@/lib/site/i18n-data";
import type { Lang } from "@/lib/site/lang";
import { DamageMap } from "@/components/site/damage-map";
import { Meta, PostRow, SectionHead, SegmentCard, SiteCover, StoryCard } from "@/components/site/blocks";

// Servida em "/" para quem não está logado (reescrita em src/proxy.ts).
export async function generateMetadata(): Promise<Metadata> {
  const t = HOME[await getLang()];
  return { title: { absolute: t.metaTitle }, description: t.metaDescription };
}

const PILLAR_ICONS = [Frame, WandSparkles, Calculator, FileText];
const FIELD_ICONS = [Smartphone, CloudOff, Gauge, ListOrdered];

export default async function SiteHome() {
  const lang = await getLang();
  const t = HOME[lang];
  const igr = CARMO.igreja;
  const rows = [...CARMO.convento.damages, ...igr.damages].filter((d) => d.geometry === "area").sort((a, b) => b.gut - a.gut).slice(0, 6);
  const stories = getStories(lang);
  const story = stories[0]!;
  const posts = getPosts(lang);
  const pillars = t.pillars.map(([title, text], i) => ({ icon: PILLAR_ICONS[i]!, title, text }));
  const field = t.field.map(([title, text], i) => ({ icon: FIELD_ICONS[i]!, title, text }));

  return (
    <>
      {/* topo: manchete grande e centralizada (como a Sana), palavras sobem em sequência */}
      <section className="px-4 pt-20 pb-14 text-center sm:px-6 sm:pt-28 lg:px-8">
        <h1 className="site-rise mx-auto max-w-[15ch] text-[44px] leading-[1.02] font-medium tracking-[-0.045em] text-balance sm:text-[84px]" aria-label={t.hero}>
          {t.hero.split(" ").map((w, i) => (
            <span key={i} style={{ "--w": i } as React.CSSProperties} aria-hidden>
              {w}&nbsp;
            </span>
          ))}
        </h1>
        <p className="site-fade-in mx-auto mt-6 max-w-[34ch] text-[18px] leading-7 text-balance text-muted-foreground sm:text-[20px] sm:leading-8" style={{ "--d": "380ms" } as React.CSSProperties}>
          {t.heroLead}
        </p>
        <div className="site-fade-in mt-9 flex flex-wrap justify-center gap-3" style={{ "--d": "520ms" } as React.CSSProperties}>
          <Link href="/cadastro" className="inline-flex h-11 items-center rounded-full bg-foreground px-6 text-[15px] font-medium text-background hover:opacity-85">
            {t.start}
          </Link>
          <Link href="/docs#demonstracao" className="inline-flex h-11 items-center gap-1.5 rounded-full bg-secondary px-6 text-[15px] font-medium hover:bg-accent">
            <Play className="size-4" /> {t.seeDemo}
          </Link>
        </div>
      </section>

      {/* para quem é (no lugar da fileira de logos) */}
      <section className="site-marquee-mask overflow-hidden pb-16 sm:pb-24" aria-label={t.audiencesLabel}>
        <ul className="site-marquee gap-14 pr-14 text-[20px] font-medium tracking-[-0.02em] whitespace-nowrap text-foreground/45 sm:text-[24px]">
          {[...t.audiences, ...t.audiences].map((a, i) => (
            <li key={i} aria-hidden={i >= t.audiences.length}>
              {a}
            </li>
          ))}
        </ul>
      </section>

      {/* painel do produto: claro, arredondado, com a foto do notebook sobre os livros */}
      <ProductPanel id="produto" title="ArchRay" text={t.productText} cta={{ href: "#fachada", label: t.productCta }} items={pillars}>
        {/* bem grande, ocupando a tela; cresce enquanto a pessoa rola (zoom ligado à rolagem) */}
        <div className="relative mt-8 aspect-square w-full overflow-hidden sm:aspect-auto sm:h-[min(110svh,1200px)] sm:min-h-[560px]">
          <div className="absolute inset-0" data-zoom="0.72,1.06">
            {/* a caixa tem o formato da foto: o esmaecimento acompanha as bordas dela durante o zoom */}
            <div className="site-edge-fade relative mx-auto aspect-square h-full max-w-full">
              <Image src="/site/notebook-livros.jpg" alt={t.booksAlt} fill sizes="(min-width: 640px) 1200px, 100vw" className="object-cover" priority />
            </div>
          </div>
        </div>
      </ProductPanel>

      {/* pessoa real, tela larga */}
      <section className="px-3 pt-6 sm:px-4 lg:px-6">
        <div className="relative overflow-hidden rounded-[28px] bg-[#1b1b1b]" data-reveal="fade">
          <div className="relative aspect-[4/5] sm:aspect-[16/8] lg:aspect-[21/9]">
            <div className="absolute inset-0" data-parallax="0.1">
              <Image src="/site/arquiteta-escritorio.jpg" alt={t.personAlt} fill sizes="100vw" className="object-cover object-[70%_center]" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent sm:bg-gradient-to-r sm:from-black/80 sm:via-black/35 sm:to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:inset-y-0 sm:right-auto sm:flex sm:max-w-[620px] sm:flex-col sm:justify-center sm:p-14">
              <p className="text-[13.5px] text-white/70">{t.personKicker}</p>
              <p className="mt-4 text-[30px] leading-[1.08] font-medium tracking-[-0.03em] text-balance sm:text-[48px]">{t.personTitle}</p>
              <p className="mt-4 max-w-[44ch] text-[15.5px] leading-7 text-white/75">{t.personText}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/docs#demonstracao" className="inline-flex h-11 items-center gap-1.5 rounded-full bg-white px-5 text-[15px] font-medium text-black hover:bg-white/90">
                  <Play className="size-4" /> {t.personCta}
                </Link>
                <Link href="/docs" className="inline-flex h-11 items-center rounded-full bg-white/15 px-5 text-[15px] font-medium text-white backdrop-blur hover:bg-white/25">
                  {t.personCta2}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* segundo painel: do campo ao cliente, com a foto do tablet */}
      <div className="pt-6">
        <ProductPanel id="campo" title={t.fieldTitle} text={t.fieldText} cta={{ href: "/empresas", label: t.fieldCta }} items={field}>
          <div className="relative mt-10 aspect-[1507/1044] w-full overflow-hidden">
            <div className="site-edge-fade-x absolute inset-0" data-zoom="0.78,1.04" style={{ transformOrigin: "50% 100%" }}>
              <Image src="/site/tablet-mapa-de-danos.jpg" alt={t.tabletAlt} fill sizes="100vw" className="object-contain object-bottom" />
            </div>
          </div>
        </ProductPanel>
      </div>

      {/* dores */}
      <section className="px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <h2 className="max-w-[16ch] text-[38px] leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-[64px]" data-reveal>
          {t.painsTitle}
        </h2>
        <p className="mt-6 max-w-xl text-[17px] leading-7 text-muted-foreground" data-reveal data-reveal-delay={100}>
          {t.painsLead}
        </p>
        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.pains.map(([title, text], i) => (
            <li key={title} className="flex min-h-[220px] flex-col justify-between rounded-2xl border bg-[var(--site-elev)] p-6" data-reveal data-reveal-delay={i * 110}>
              <span className="text-[13px] text-muted-foreground tabular-nums">0{i + 1}</span>
              <div>
                <h3 className="text-[19px] leading-snug font-medium tracking-[-0.01em]">{title}</h3>
                <p className="mt-2 text-[14.5px] leading-6 text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-16 max-w-[28ch] text-[28px] leading-[1.15] font-medium tracking-[-0.025em] text-balance sm:text-[40px]" data-reveal>
          {t.painsEnd} <span className="text-muted-foreground">{t.painsEnd2}</span>
        </p>
      </section>

      <Feature id="fachada" kicker={t.facade.kicker} title={t.facade.title} text={t.facade.text} bullets={t.facade.bullets}>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-md" data-reveal>
            <div className="absolute inset-0" data-parallax="0.05">
              <Image src="/site/carmo-igreja-2010.jpg" alt={t.facade.photoAlt} fill sizes="(min-width:1024px) 25vw, 45vw" className="object-cover" />
            </div>
            <span className="absolute top-2 left-2 rounded-full bg-black/70 px-2.5 py-0.5 text-[11px] text-white">{t.facade.photo}</span>
          </div>
          <ArrowRight className="size-5 text-muted-foreground" />
          <div className="relative aspect-[4/4.15] overflow-hidden rounded-md" data-reveal data-reveal-delay={250}>
            <Image src="/site/carmo-fachada-retificada.jpg" alt={t.facade.scaledAlt} fill sizes="(min-width:1024px) 25vw, 45vw" className="object-cover" />
            <span className="absolute top-2 left-2 rounded-full bg-black/70 px-2.5 py-0.5 text-[11px] text-white">{t.facade.scaled}</span>
          </div>
        </div>
      </Feature>

      <Feature id="contorno" reverse kicker={t.ai.kicker} title={t.ai.title} text={t.ai.text} bullets={t.ai.bullets}>
        <div className="overflow-hidden rounded-md bg-[#1a1a1a]" data-reveal="fade">
          <DamageMap src={CARMO.convento.src} w={CARMO.convento.w} h={CARMO.convento.h} damages={CARMO.convento.damages} alt={t.ai.alt} className="block h-auto w-full" />
        </div>
      </Feature>

      <Feature id="orcamento" kicker={t.budget.kicker} title={t.budget.title} text={t.budget.text} bullets={t.budget.bullets}>
        <div className="overflow-hidden rounded-md border bg-background" data-reveal>
          <table className="w-full table-fixed text-[13px]">
            <thead className="bg-secondary text-left text-[11.5px] text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">{t.budget.cols[0]}</th>
                <th className="w-[76px] px-2 py-2.5 text-right font-medium">{t.budget.cols[1]}</th>
                <th className="w-[48px] px-2 py-2.5 text-right font-medium">{t.budget.cols[2]}</th>
                <th className="w-[96px] px-4 py-2.5 text-right font-medium">{t.budget.cols[3]}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: d.color }} />
                      <span className="truncate">{damageName(d.code, d.name, lang)}</span>
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{d.areaM2 != null ? fmtNum(d.areaM2, 2, lang) : "–"} m²</td>
                  <td className="px-2 py-2.5 text-right tabular-nums" title={prioLabel(d.gut, lang)}>
                    {d.gut}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtBRL(d.costCents)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-secondary font-medium">
                <td className="px-4 py-3" colSpan={3}>
                  {t.budget.total}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtBRL(CARMO.totalCents)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="mt-3 text-[12px] text-muted-foreground">{t.budget.note}</p>
      </Feature>

      <Feature id="laudo" reverse kicker={t.report.kicker} title={t.report.title} text={t.report.text} bullets={t.report.bullets}>
        <LaudoMock lang={lang} />
      </Feature>

      {/* história em tela cheia com paralaxe */}
      <section className="px-4 pt-24 pb-24 sm:px-6 sm:pt-32 sm:pb-32 lg:px-8">
        <Link href={`/historias/${story.slug}`} className="group relative block overflow-hidden rounded-lg" data-reveal="fade">
          <div className="relative aspect-[4/5] sm:aspect-[21/9]">
            <div className="absolute inset-0" data-parallax="0.12">
              <Image src="/site/carmo-convento-2010.jpg" alt={t.story.alt} fill sizes="100vw" className="object-cover" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-12">
              <p className="text-[13px] text-white/70">{t.story.meta}</p>
              <p className="mt-3 max-w-[26ch] text-[26px] leading-[1.12] font-medium tracking-[-0.025em] text-balance sm:text-[44px]">{t.story.title}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-medium">
                {t.story.cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </Link>
      </section>

      {/* Index · Histórias · Para empresas (padrão OpenAI) */}
      <section className="grid gap-24 px-4 pb-24 sm:px-6 lg:px-8">
        <div>
          <SectionHead title="Index" href="/index" more={t.seeMore} />
          <ul className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-2">
            {posts.slice(0, 6).map((p, i) => (
              <li key={p.slug}>
                <PostRow post={p} delay={i * 80} lang={lang} />
              </li>
            ))}
            <li>
              <Link href="/historias/carmo-da-horta" className="group grid grid-cols-[104px_1fr] items-center gap-5 sm:grid-cols-[150px_1fr]" data-reveal data-reveal-delay={100}>
                <SiteCover className="aspect-square rounded-lg" />
                <div className="min-w-0">
                  <h3 className="text-[16px] leading-snug font-medium text-balance group-hover:underline group-hover:underline-offset-4 sm:text-[17px]">{t.caseRow}</h3>
                  <div className="mt-2">
                    <Meta label={t.caseRowMeta} date={fmtDateShort("2026-10-15", lang)} />
                  </div>
                </div>
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <SectionHead title={t.stories} href="/historias" more={t.seeAll} />
          <ul className="mt-8 grid gap-8 md:grid-cols-3">
            {stories.slice(0, 3).map((s, i) => (
              <li key={s.slug} className={stories.length === 1 ? "md:col-span-3" : undefined}>
                <StoryCard story={s} large={stories.length === 1} delay={i * 100} lang={lang} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <SectionHead title={t.business} href="/empresas" more={t.seeAll} />
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {t.segments.map(([href, title, text], i) => (
              <li key={href}>
                <SegmentCard index={i} href={href} title={title} text={text} delay={i * 100} more={t.learnMore} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* chamada final */}
      <section className="px-4 pb-24 text-center sm:px-6 lg:px-8">
        <div className="border-t pt-24 sm:pt-32">
          <h2 className="mx-auto max-w-[16ch] text-[38px] leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-[64px]" data-reveal>
            {t.finalTitle}
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[16.5px] leading-7 text-muted-foreground" data-reveal data-reveal-delay={100}>
            {t.finalText}
          </p>
          <div className="mt-9 flex justify-center gap-3" data-reveal data-reveal-delay={200}>
            <Link href="/cadastro" className="inline-flex h-11 items-center rounded-full bg-foreground px-6 text-[15px] font-medium text-background hover:opacity-85">
              {t.start}
            </Link>
            <Link href="/empresas" className="inline-flex h-11 items-center rounded-full bg-secondary px-6 text-[15px] font-medium hover:bg-accent">
              {t.finalCta2}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

/** Painel claro e arredondado (como os da Sana): título, texto, botão, 4 recursos e uma foto grande. */
function ProductPanel({
  id,
  title,
  text,
  cta,
  items,
  children,
}: {
  id: string;
  title: string;
  text: string;
  cta: { href: string; label: string };
  items: { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; title: string; text: string }[];
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-16 px-3 sm:px-4 lg:px-6">
      <div className="overflow-hidden rounded-[28px] bg-[#f0f0ee] text-[#0a0a0a]">
        <div className="mx-auto max-w-3xl px-6 pt-16 text-center sm:pt-24">
          <h2 className="text-[40px] leading-[1.02] font-medium tracking-[-0.045em] sm:text-[68px]" data-reveal>
            {title}
          </h2>
          <p className="mx-auto mt-5 max-w-[46ch] text-[16.5px] leading-7 text-black/60 sm:text-[18px]" data-reveal data-reveal-delay={100}>
            {text}
          </p>
          <div data-reveal data-reveal-delay={180}>
            <Link href={cta.href} className="mt-8 inline-flex h-10 items-center gap-1.5 rounded-full bg-[#0a0a0a] px-5 text-[14.5px] font-medium text-white hover:bg-black/80">
              {cta.label} <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
        <ul className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-x-6 gap-y-8 px-6 sm:grid-cols-4">
          {items.map((p, i) => (
            <li key={p.title} className="text-center" data-reveal data-reveal-delay={220 + i * 90}>
              <p.icon className="mx-auto size-5" strokeWidth={1.6} />
              <p className="mt-3 text-[15px] font-medium">{p.title}</p>
              <p className="mt-0.5 text-[13.5px] leading-5 text-black/55">{p.text}</p>
            </li>
          ))}
        </ul>
        {children}
      </div>
    </section>
  );
}

function Feature({
  id,
  kicker,
  title,
  text,
  bullets,
  reverse,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  text: string;
  bullets: string[];
  reverse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-16 px-4 pt-24 sm:px-6 sm:pt-32 lg:px-8">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className={reverse ? "min-w-0 lg:order-2" : "min-w-0"}>
          <p className="text-[13.5px] font-medium text-muted-foreground" data-reveal>
            {kicker}
          </p>
          <h2 className="mt-3 text-[32px] leading-[1.06] font-medium tracking-[-0.035em] text-balance sm:text-[48px]" data-reveal data-reveal-delay={60}>
            {title}
          </h2>
          <p className="mt-5 max-w-lg text-[16.5px] leading-7 text-muted-foreground" data-reveal data-reveal-delay={120}>
            {text}
          </p>
          <ul className="mt-6 grid gap-2.5 text-[15px]">
            {bullets.map((b, i) => (
              <li key={b} className="flex items-start gap-2.5" data-reveal data-reveal-delay={180 + i * 60}>
                <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-foreground" />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0 rounded-lg border bg-[var(--site-elev)] p-4 sm:p-8">{children}</div>
      </div>
    </section>
  );
}

/** Folhas do laudo A4, desenhadas (sem print), com dados do case. */
function LaudoMock({ lang }: { lang: Lang }) {
  const t = HOME[lang].report;
  const v = CARMO.convento;
  return (
    <div className="relative mx-auto aspect-[4/3.4] max-w-md" data-reveal="fade">
      <div className="absolute top-6 left-10 aspect-[210/297] w-[52%] rotate-[4deg] rounded-md bg-white p-3 text-black shadow-2xl transition-transform duration-700 [.is-in_&]:rotate-[7deg]" aria-hidden>
        <div className="h-2 w-1/2 rounded bg-black/80" />
        <div className="mt-2 grid gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex gap-1">
              <span className="size-1.5 rounded-sm" style={{ background: v.damages[i % v.damages.length]!.color }} />
              <span className="h-1.5 flex-1 rounded bg-black/10" />
              <span className="h-1.5 w-6 rounded bg-black/15" />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute top-0 left-0 aspect-[210/297] w-[56%] -rotate-[3deg] rounded-md bg-white p-3 text-black shadow-2xl transition-transform duration-700 [.is-in_&]:-rotate-[5deg]">
        <p className="text-[8px] font-medium tracking-wide text-black/55 uppercase">{t.sheet}</p>
        <p className="mt-1 text-[11px] leading-tight font-medium">{t.building}</p>
        <div className="mt-2 overflow-hidden rounded-sm">
          <DamageMap src={v.src} w={v.w} h={v.h} damages={v.damages} alt="" labels={false} className="block h-auto w-full" />
        </div>
        <div className="mt-2 grid gap-1" aria-hidden>
          <div className="h-1.5 w-full rounded bg-black/10" />
          <div className="h-1.5 w-5/6 rounded bg-black/10" />
          <div className="h-1.5 w-2/3 rounded bg-black/10" />
        </div>
        <div className="mt-2 flex items-baseline justify-between border-t border-black/10 pt-1.5">
          <span className="text-[8px] text-black/55">{t.budget}</span>
          <span className="text-[10px] font-medium tabular-nums">{fmtBRL(CARMO.totalCents)}</span>
        </div>
      </div>
      <div className="absolute right-0 bottom-0 w-[46%] rounded-md bg-white p-2 text-black shadow-2xl transition-transform duration-700 [.is-in_&]:translate-y-[-6px]" aria-hidden>
        <p className="text-[8px] font-medium text-black/55">{t.drawing}</p>
        <div className="mt-1 overflow-hidden rounded-sm">
          <DamageMap src={CARMO.igreja.src} w={CARMO.igreja.w} h={CARMO.igreja.h} damages={CARMO.igreja.damages} alt="" labels={false} className="block h-auto w-full" />
        </div>
      </div>
    </div>
  );
}
