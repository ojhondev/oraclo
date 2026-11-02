import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calculator, CalendarDays, FileStack, FileText, Map as MapIcon, Ruler, UserRound } from "lucide-react";
import { getPosts } from "@/lib/updates";
import { getStories } from "@/lib/site/stories";
import { CARMO } from "@/lib/site/carmo";
import { fmtBRL } from "@/lib/pricing";
import { getLang } from "@/lib/site/get-lang";
import { HOME } from "@/lib/site/home-copy";
import { damageName, fmtDateShort, fmtNum, prioLabel } from "@/lib/site/i18n-data";
import type { Lang } from "@/lib/site/lang";
import { DamageMap } from "@/components/site/damage-map";
import { PostRow, SectionHead, SegmentCard, SiteCover, StoryCard } from "@/components/site/blocks";

// Servida em "/" para quem não está logado (reescrita em src/proxy.ts).
export async function generateMetadata(): Promise<Metadata> {
  const t = HOME[await getLang()];
  return { title: { absolute: t.metaTitle }, description: t.metaDescription };
}

const DELIVER_ICONS = [MapIcon, Ruler, Calculator, FileText];
const FOLLOW_ICONS = [UserRound, CalendarDays, Calculator, FileStack];

/**
 * Quadros da colagem em volta do bloco central (como a home da Anthropic): fotos do caso,
 * telas do produto e as fotos do site, cada um num recorte. Posição em % da faixa.
 */
const TILES: { src: string; pos: string; x: number; y: number; s: number; t: number }[] = [
  { src: "/site/carmo-fachada-retificada.jpg", pos: "30% 20%", x: 3, y: 10, s: 104, t: 9 },
  { src: "/docs/12-deteccao.jpg", pos: "45% 55%", x: 11, y: 44, s: 92, t: 11 },
  { src: "/site/carmo-convento-2010.jpg", pos: "62% 40%", x: 2, y: 72, s: 84, t: 10 },
  { src: "/site/notebook-livros.jpg", pos: "50% 50%", x: 16, y: 6, s: 78, t: 12 },
  { src: "/site/carmo-igreja-2021.jpg", pos: "55% 75%", x: 20, y: 76, s: 96, t: 8 },
  { src: "/docs/13-comparar.jpg", pos: "35% 50%", x: 31, y: 2, s: 70, t: 13 },
  { src: "/site/tablet-mapa-de-danos.jpg", pos: "50% 60%", x: 66, y: 4, s: 74, t: 10 },
  { src: "/site/carmo-igreja-2010.jpg", pos: "30% 45%", x: 80, y: 12, s: 100, t: 9 },
  { src: "/docs/05-editor.jpg", pos: "60% 50%", x: 90, y: 42, s: 84, t: 12 },
  { src: "/site/arquiteta-escritorio.jpg", pos: "70% 35%", x: 78, y: 70, s: 96, t: 11 },
  { src: "/demo/carmo-fachada-2010.jpg", pos: "40% 60%", x: 64, y: 82, s: 72, t: 9 },
  { src: "/docs/06-dano-gut.jpg", pos: "75% 30%", x: 92, y: 84, s: 64, t: 14 },
];

export default async function SiteHome() {
  const lang = await getLang();
  const t = HOME[lang];
  const igr = CARMO.igreja;
  const rows = [...CARMO.convento.damages, ...igr.damages].filter((d) => d.geometry === "area").sort((a, b) => b.gut - a.gut).slice(0, 6);
  const stories = getStories(lang);
  const story = stories[0]!;
  const posts = getPosts(lang);
  const deliver = t.deliver.map(([title, text], i) => ({ icon: DELIVER_ICONS[i]!, title, text }));
  const follow = t.follow.map(([title, text], i) => ({ icon: FOLLOW_ICONS[i]!, title, text }));

  return (
    <>
      {/* manifesto: abertura em negrito sem serifa, continuação em serifa (como a Anthropic) */}
      <section className="px-4 pt-14 pb-16 sm:px-6 sm:pt-20 sm:pb-20 lg:px-8">
        <h1 className="a-serif max-w-[1240px] text-[26px] leading-[1.2] sm:text-[36px] xl:text-[44px]">
          <span className="a-lead site-fade-in block">{t.hero}</span>
          <span className="site-fade-in mt-1 block text-foreground/85" style={{ "--d": "250ms" } as React.CSSProperties}>
            {t.heroLead}
          </span>
        </h1>
        <div className="site-fade-in mt-10 flex flex-wrap items-center gap-3" style={{ "--d": "500ms" } as React.CSSProperties}>
          <Link href="/contato" className="a-btn">
            {t.request} <ArrowRight className="size-4" />
          </Link>
          <Link href="/historias/carmo-da-horta" className="a-btn-2">
            {t.seeCase}
          </Link>
          <span className="a-tag ml-1 hidden md:inline-flex">{t.kicker}</span>
        </div>
      </section>

      {/* faixa com colagem: o que o cliente recebe no centro, quadros flutuando em volta */}
      <section id="produto" className="relative scroll-mt-20 overflow-hidden bg-[var(--site-band)]" aria-label={t.deliverTitle}>
        <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
          {TILES.map((tile, i) => (
            <div
              key={tile.src}
              className="a-float absolute overflow-hidden rounded-[6px] shadow-sm"
              style={
                {
                  left: `${tile.x}%`,
                  top: `${tile.y}%`,
                  width: tile.s,
                  height: tile.s,
                  "--t": `${tile.t}s`,
                  "--dy": `${i % 2 ? 10 : -12}px`,
                  "--dx": `${i % 3 ? -4 : 5}px`,
                } as React.CSSProperties
              }
            >
              <Image src={tile.src} alt="" fill sizes="120px" className="object-cover" style={{ objectPosition: tile.pos }} />
            </div>
          ))}
        </div>
        <div className="relative mx-auto max-w-[620px] px-6 py-24 text-center sm:py-32 md:py-40">
          <h2 className="text-[40px] leading-[1.05] sm:text-[56px]" data-reveal>
            {t.deliverTitle}
          </h2>
          <p className="mx-auto mt-5 max-w-[48ch] text-[16px] leading-7 text-muted-foreground sm:text-[17px]" data-reveal data-reveal-delay={100}>
            {t.deliverText}
          </p>
          <div className="mt-8" data-reveal data-reveal-delay={180}>
            <Link href="/contato" className="a-btn a-btn-sm">
              {t.deliverCta}
            </Link>
          </div>
        </div>
      </section>

      {/* as quatro entregas, em cartões */}
      <section className="px-4 pt-6 sm:px-6 lg:px-8">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {deliver.map((p, i) => (
            <li key={p.title} className="a-card flex min-h-[190px] flex-col p-7" data-reveal data-reveal-delay={i * 90}>
              <p.icon className="size-5 text-[var(--site-clay)]" strokeWidth={1.7} />
              <p className="a-title mt-auto pt-8 text-[19px]">{p.title}</p>
              <p className="mt-1.5 text-[14.5px] leading-6 text-muted-foreground">{p.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* foto grande do notebook: cresce enquanto a pessoa rola */}
      <section className="px-4 pt-6 sm:px-6 lg:px-8">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[var(--site-band)] sm:aspect-auto sm:h-[min(100svh,1100px)] sm:min-h-[560px]">
          <div className="absolute inset-0" data-zoom="0.74,1.04">
            <div className="site-edge-fade relative mx-auto aspect-square h-full max-w-full">
              <Image src="/site/notebook-livros.jpg" alt={t.booksAlt} fill sizes="(min-width: 640px) 1100px, 100vw" className="object-cover" priority />
            </div>
          </div>
        </div>
      </section>

      {/* pessoa real, tela larga */}
      <section className="px-4 pt-6 sm:px-6 lg:px-8">
        <div className="site-ink relative overflow-hidden rounded-2xl" data-reveal="fade">
          <div className="relative aspect-[4/5] sm:aspect-[16/8] lg:aspect-[21/9]">
            <div className="absolute inset-0" data-parallax="0.1">
              <Image src="/site/arquiteta-escritorio.jpg" alt={t.personAlt} fill sizes="100vw" className="object-cover object-[70%_center]" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#141413]/85 via-[#141413]/30 to-transparent sm:bg-gradient-to-r sm:from-[#141413]/85 sm:via-[#141413]/35 sm:to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7 text-[#faf9f5] sm:inset-y-0 sm:right-auto sm:flex sm:max-w-[640px] sm:flex-col sm:justify-center sm:p-14">
              <p className="a-tag">{t.personKicker}</p>
              <p className="a-serif mt-4 text-[30px] leading-[1.12] text-balance sm:text-[46px]">{t.personTitle}</p>
              <p className="mt-4 max-w-[44ch] text-[15.5px] leading-7 text-[#faf9f5]/75">{t.personText}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/contato" className="a-btn bg-[#faf9f5]! text-[#141413]!">
                  {t.personCta} <ArrowRight className="size-4" />
                </Link>
                <Link href="/historias/carmo-da-horta" className="a-btn-2">
                  {t.personCta2}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* do campo ao cliente, com a foto do tablet */}
      <section id="campo" className="scroll-mt-20 px-4 pt-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl bg-[var(--site-band)]">
          <div className="mx-auto max-w-3xl px-6 pt-16 text-center sm:pt-24">
            <h2 className="text-[38px] leading-[1.05] sm:text-[54px]" data-reveal>
              {t.followTitle}
            </h2>
            <p className="mx-auto mt-5 max-w-[46ch] text-[16.5px] leading-7 text-muted-foreground sm:text-[17px]" data-reveal data-reveal-delay={100}>
              {t.followText}
            </p>
            <div data-reveal data-reveal-delay={180}>
              <Link href="#como-funciona" className="a-btn a-btn-sm mt-8">
                {t.followCta}
              </Link>
            </div>
          </div>
          <ul className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-x-6 gap-y-8 px-6 sm:grid-cols-4">
            {follow.map((p, i) => (
              <li key={p.title} className="text-center" data-reveal data-reveal-delay={220 + i * 90}>
                <p.icon className="mx-auto size-5 text-[var(--site-clay)]" strokeWidth={1.7} />
                <p className="a-title mt-3 text-[15.5px]">{p.title}</p>
                <p className="mt-0.5 text-[13.5px] leading-5 text-muted-foreground">{p.text}</p>
              </li>
            ))}
          </ul>
          <div className="relative mt-10 aspect-[1507/1044] w-full overflow-hidden">
            <div className="site-edge-fade-x absolute inset-0" data-zoom="0.78,1.04" style={{ transformOrigin: "50% 100%" }}>
              <Image src="/site/tablet-mapa-de-danos.jpg" alt={t.tabletAlt} fill sizes="100vw" className="object-contain object-bottom" />
            </div>
          </div>
        </div>
      </section>

      {/* como funciona: 4 etapas em cartões bege */}
      <section id="como-funciona" className="scroll-mt-20 px-4 pt-24 sm:px-6 sm:pt-32 lg:px-8">
        <p className="a-tag" data-reveal>
          {t.stepsKicker}
        </p>
        <h2 className="mt-4 max-w-[22ch] text-[34px] leading-[1.08] text-balance sm:text-[48px]" data-reveal data-reveal-delay={60}>
          {t.stepsTitle}
        </h2>
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.steps.map(([title, text], i) => (
            <li key={title} className="a-card flex min-h-[260px] flex-col p-8" data-reveal data-reveal-delay={i * 110}>
              <span className="text-[13px] text-muted-foreground tabular-nums">0{i + 1}</span>
              <h3 className="a-title mt-auto pt-10 text-[21px] leading-snug">{title}</h3>
              <p className="mt-2 text-[14.5px] leading-6 text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10" data-reveal>
          <Link href="/contato" className="a-btn">
            {t.request} <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* dores */}
      <section className="px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <h2 className="max-w-[18ch] text-[34px] leading-[1.06] text-balance sm:text-[48px]" data-reveal>
          {t.painsTitle}
        </h2>
        <p className="mt-5 max-w-xl text-[17px] leading-7 text-muted-foreground" data-reveal data-reveal-delay={100}>
          {t.painsLead}
        </p>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.pains.map(([title, text], i) => (
            <li key={title} className="a-card flex min-h-[220px] flex-col justify-between p-8" data-reveal data-reveal-delay={i * 110}>
              <span className="a-tag">0{i + 1}</span>
              <div className="pt-8">
                <h3 className="a-title text-[19px] leading-snug">{title}</h3>
                <p className="mt-2 text-[14.5px] leading-6 text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="a-serif mt-16 max-w-[30ch] text-[28px] leading-[1.2] text-balance sm:text-[42px]" data-reveal>
          <span className="a-lead">{t.painsEnd}</span> {t.painsEnd2}
        </p>
      </section>

      {/* a tecnologia por trás do serviço */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="border-y py-3" data-reveal="fade">
          <p className="text-[13px] font-bold">{t.techKicker}</p>
        </div>
        <h2 className="mt-10 max-w-[20ch] text-[34px] leading-[1.08] text-balance sm:text-[48px]" data-reveal>
          {t.techTitle}
        </h2>
        <p className="mt-5 max-w-xl text-[17px] leading-7 text-muted-foreground" data-reveal data-reveal-delay={100}>
          {t.techText}
        </p>
      </section>

      <Feature id="fachada" kicker={t.facade.kicker} title={t.facade.title} text={t.facade.text} bullets={t.facade.bullets}>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[6px]" data-reveal>
            <div className="absolute inset-0" data-parallax="0.05">
              <Image src="/site/carmo-igreja-2010.jpg" alt={t.facade.photoAlt} fill sizes="(min-width:1024px) 25vw, 45vw" className="object-cover" />
            </div>
            <span className="absolute top-2 left-2 rounded-full bg-[#141413]/75 px-2.5 py-0.5 text-[11px] text-[#faf9f5]">{t.facade.photo}</span>
          </div>
          <ArrowRight className="size-5 text-muted-foreground" />
          <div className="relative aspect-[4/4.15] overflow-hidden rounded-[6px]" data-reveal data-reveal-delay={250}>
            <Image src="/site/carmo-fachada-retificada.jpg" alt={t.facade.scaledAlt} fill sizes="(min-width:1024px) 25vw, 45vw" className="object-cover" />
            <span className="absolute top-2 left-2 rounded-full bg-[#141413]/75 px-2.5 py-0.5 text-[11px] text-[#faf9f5]">{t.facade.scaled}</span>
          </div>
        </div>
      </Feature>

      <Feature id="contorno" reverse kicker={t.ai.kicker} title={t.ai.title} text={t.ai.text} bullets={t.ai.bullets}>
        <div className="overflow-hidden rounded-[6px] bg-[#262624]" data-reveal="fade">
          <DamageMap src={CARMO.convento.src} w={CARMO.convento.w} h={CARMO.convento.h} damages={CARMO.convento.damages} alt={t.ai.alt} className="block h-auto w-full" />
        </div>
      </Feature>

      <Feature id="orcamento" kicker={t.budget.kicker} title={t.budget.title} text={t.budget.text} bullets={t.budget.bullets}>
        <div className="overflow-hidden rounded-[10px] border bg-background" data-reveal>
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
        <Link href={`/historias/${story.slug}`} className="group relative block overflow-hidden rounded-2xl" data-reveal="fade">
          <div className="relative aspect-[4/5] sm:aspect-[21/9]">
            <div className="absolute inset-0" data-parallax="0.12">
              <Image src="/site/carmo-convento-2010.jpg" alt={t.story.alt} fill sizes="100vw" className="object-cover" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#141413]/85 via-[#141413]/35 to-[#141413]/10" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-[#faf9f5] sm:p-12">
              <p className="text-[13px] text-[#faf9f5]/70">{t.story.meta}</p>
              <p className="a-serif mt-3 max-w-[28ch] text-[26px] leading-[1.15] text-balance sm:text-[44px]">{t.story.title}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-medium">
                {t.story.cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </Link>
      </section>

      {/* perguntas frequentes */}
      <section id="perguntas" className="scroll-mt-20 px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <h2 className="text-[34px] leading-[1.08] sm:text-[44px]" data-reveal>
            {t.faqTitle}
          </h2>
          <div data-reveal data-reveal-delay={100}>
            {t.faq.map(([q, a]) => (
              <details key={q} className="group border-b py-5 first:border-t">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold">
                  {q}
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--site-pill)] text-[16px] leading-none transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-[62ch] text-[15.5px] leading-7 text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Saiba mais: Index · Casos · Setores (grade editorial com linhas finas) */}
      <section className="grid gap-20 px-4 pb-24 sm:px-6 lg:px-8">
        <div>
          <SectionHead title="Index" href="/index" more={t.seeMore} />
          <ul className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {posts.slice(0, 3).map((p, i) => (
              <li key={p.slug}>
                <PostRow post={p} delay={i * 80} lang={lang} />
              </li>
            ))}
            <li>
              <Link href="/historias/carmo-da-horta" className="group block" data-reveal data-reveal-delay={240}>
                <SiteCover className="aspect-[4/3] rounded-[8px]" />
                <p className="a-tag mt-4">
                  {t.caseRowMeta} · {fmtDateShort("2026-10-15", lang)}
                </p>
                <h3 className="a-title mt-2 text-[19px] leading-snug text-balance group-hover:underline group-hover:underline-offset-4">{t.caseRow}</h3>
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

      {/* chamada final: frase em serifa */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="a-card px-6 py-20 text-center sm:py-28">
          <h2 className="a-serif mx-auto max-w-[22ch] text-[36px] leading-[1.1] text-balance sm:text-[56px]" data-reveal>
            {t.finalTitle}
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[16.5px] leading-7 text-muted-foreground" data-reveal data-reveal-delay={100}>
            {t.finalText}
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3" data-reveal data-reveal-delay={200}>
            <Link href="/contato" className="a-btn">
              {t.request} <ArrowRight className="size-4" />
            </Link>
            <Link href="/docs" className="a-btn-2">
              {t.finalCta2}
            </Link>
          </div>
        </div>
      </section>
    </>
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
    <section id={id} className="scroll-mt-20 px-4 pt-20 sm:px-6 sm:pt-28 lg:px-8">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className={reverse ? "min-w-0 lg:order-2" : "min-w-0"}>
          <p className="a-tag" data-reveal>
            {kicker}
          </p>
          <h2 className="mt-4 text-[30px] leading-[1.1] text-balance sm:text-[40px]" data-reveal data-reveal-delay={60}>
            {title}
          </h2>
          <p className="mt-5 max-w-lg text-[16.5px] leading-7 text-muted-foreground" data-reveal data-reveal-delay={120}>
            {text}
          </p>
          <ul className="mt-6 grid gap-0 border-t text-[15px]">
            {bullets.map((b, i) => (
              <li key={b} className="flex items-start gap-3 border-b py-3" data-reveal data-reveal-delay={180 + i * 60}>
                <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-[var(--site-clay)]" />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="a-card min-w-0 p-4 sm:p-8">{children}</div>
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
