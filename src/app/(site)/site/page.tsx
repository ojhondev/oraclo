import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getLang } from "@/lib/site/get-lang";
import { SITE } from "@/lib/site/site-copy";
import { SCIENCE } from "@/lib/site/science";
import { AppShowcase } from "@/components/site/app-showcase";
import { Illo, type IlloName } from "@/components/site/illo";

// Servida em "/" para quem não está logado (reescrita em src/proxy.ts).
export async function generateMetadata(): Promise<Metadata> {
  const t = SITE[await getLang()].home;
  return { title: { absolute: t.metaTitle }, description: t.metaDescription };
}

/** Quadros da colagem em volta do destaque: posição (% da faixa), lado (px) e ritmo da flutuação. */
const TILES: { name: IlloName; x: number; y: number; s: number; t: number }[] = [
  { name: "grade", x: 2, y: 8, s: 92, t: 9 },
  { name: "fissura", x: 9, y: 40, s: 104, t: 11 },
  { name: "pontos", x: 3, y: 72, s: 84, t: 10 },
  { name: "escala", x: 18, y: 4, s: 76, t: 12 },
  { name: "arco", x: 20, y: 70, s: 96, t: 8 },
  { name: "camadas", x: 31, y: 84, s: 70, t: 13 },
  { name: "retifica", x: 30, y: 2, s: 80, t: 9 },
  { name: "deteccao", x: 66, y: 3, s: 84, t: 10 },
  { name: "gut", x: 79, y: 14, s: 96, t: 9 },
  { name: "contorno", x: 89, y: 42, s: 92, t: 12 },
  { name: "comparar", x: 77, y: 70, s: 100, t: 11 },
  { name: "fachada", x: 64, y: 84, s: 74, t: 9 },
  { name: "laudo", x: 92, y: 80, s: 70, t: 14 },
];

export default async function SiteHome() {
  const lang = await getLang();
  const t = SITE[lang].home;
  const sci = SCIENCE[lang].home;

  return (
    <>
      {/* manifesto: abertura em negrito sem serifa e continuação em serifa, no mesmo parágrafo */}
      <section className="px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-20 lg:px-8">
        <h1 className="a-serif a-fluid [--a:27] [--b:48] leading-[1.22] tracking-[-0.02em]">
          <span className="a-lead">{t.lead}</span> <span className="text-foreground/85">{t.manifesto}</span>
        </h1>
      </section>

      {/* simulação do app em abas */}
      <AppShowcase lang={lang} />

      {/* destaque com colagem de ilustrações */}
      <section className="relative overflow-hidden bg-[var(--site-band)]" aria-labelledby="destaque">
        <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
          {TILES.map((tile, i) => (
            <div
              key={tile.name}
              className="a-float absolute overflow-hidden rounded-[4px] shadow-[0_1px_2px_rgb(20_20_19/0.08)]"
              style={
                {
                  left: `${tile.x}%`,
                  top: `${tile.y}%`,
                  width: tile.s,
                  height: tile.s,
                  "--t": `${tile.t}s`,
                  "--dy": `${i % 2 ? 9 : -11}px`,
                  "--dx": `${i % 3 ? -4 : 5}px`,
                } as React.CSSProperties
              }
            >
              <Illo name={tile.name} />
            </div>
          ))}
        </div>
        {/* no celular, uma fileira de quadros acima do texto */}
        <div className="flex justify-center gap-3 px-4 pt-12 md:hidden" aria-hidden>
          {(["retifica", "fissura", "comparar", "laudo"] as const).map((n) => (
            <div key={n} className="size-16 overflow-hidden rounded-[4px]">
              <Illo name={n} />
            </div>
          ))}
        </div>
        <div className="relative mx-auto max-w-[600px] px-6 py-16 text-center md:py-44">
          <h2 id="destaque" className="a-fluid [--a:38] [--b:54] leading-[1.06]" data-reveal>
            {t.featureTitle}
          </h2>
          <p className="mx-auto mt-5 max-w-[46ch] text-[16px] leading-[1.6] text-muted-foreground sm:text-[17px]" data-reveal data-reveal-delay={100}>
            {t.featureText}
          </p>
          <div className="mt-8" data-reveal data-reveal-delay={180}>
            <Link href="/tecnologia" className="a-btn a-btn-sm">
              {t.featureCta}
            </Link>
          </div>
        </div>
      </section>

      {/* três cartões, como os lançamentos de modelos */}
      <section className="px-4 pt-6 sm:px-6 lg:px-8" aria-label={t.cardsLabel}>
        <ul className="grid gap-4 lg:grid-cols-3">
          {t.cards.map((c, i) => (
            <li key={c.title} className="a-card flex flex-col p-6 sm:p-8" data-reveal data-reveal-delay={i * 90}>
              <p className="a-tag">{c.tag}</p>
              <h3 className="a-title mt-3 text-[22px] leading-snug">{c.title}</h3>
              <p className="mt-3 text-[15px] leading-6 text-muted-foreground">{c.text}</p>
              <dl className="mt-auto pt-8 text-[14px]">
                {c.rows.map(([label, value, href]) => (
                  <div key={label} className="border-t py-3">
                    <Link href={href} className="group flex items-center justify-between gap-3">
                      <dt>{label}</dt>
                      <dd className="inline-flex items-center gap-1 text-muted-foreground group-hover:text-foreground">
                        {value} <ArrowRight className="size-3.5" />
                      </dd>
                    </Link>
                  </div>
                ))}
              </dl>
              <Link href={c.href} className="a-btn-2 mt-2 w-full">
                {c.cta} <ArrowRight className="size-4" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* o que é o ArchRay: o caminho do vídeo ao laudo e o antes e depois */}
      <section className="site-ink mt-20 px-4 py-16 sm:mt-24 sm:px-6 sm:py-24 lg:px-8" aria-labelledby="o-que-e">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div data-reveal>
            <p className="a-label">{sci.label}</p>
            <h2 id="o-que-e" className="mt-4 a-fluid [--a:32] [--b:46] leading-[1.1]">
              {sci.title}
            </h2>
          </div>
          <p className="a-serif self-end text-[19px] leading-[1.5] sm:text-[22px]" data-reveal data-reveal-delay={100}>
            {sci.text}
          </p>
        </div>
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {sci.steps.map((step, i) => (
            <li key={step.title} className="a-card flex min-w-0 flex-col p-5" data-reveal data-reveal-delay={i * 70}>
              <p className="a-label">0{i + 1}</p>
              <h3 className="a-title mt-3 text-[18px] leading-snug">{step.title}</h3>
              <p className="mt-2 text-[14px] leading-6 text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-14 grid gap-px overflow-hidden rounded-[8px] border md:grid-cols-2">
          {[
            { label: sci.beforeLabel, rows: sci.compare.map((c) => c[0]), after: false },
            { label: sci.afterLabel, rows: sci.compare.map((c) => c[1]), after: true },
          ].map((col) => (
            <div key={col.label} className={col.after ? "bg-[var(--site-pill)] p-6 sm:p-8" : "p-6 sm:p-8"}>
              <p className="a-label">{col.label}</p>
              <ul className="mt-4 grid gap-3">
                {col.rows.map((row) => (
                  <li key={row} className={col.after ? "text-[18px] leading-snug font-medium" : "text-[18px] leading-snug text-muted-foreground"}>
                    {row}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link href="/tecnologia#transformacao" className="a-btn-2 a-btn-sm">
            {sci.cta} <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* saiba mais: quatro cartões com ilustração */}
      <section className="px-4 pt-20 pb-8 sm:px-6 sm:pt-24 lg:px-8">
        <div className="border-y py-3">
          <h2 className="text-[13.5px] font-bold">{t.learnLabel}</h2>
        </div>
        <ul className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {t.learn.map((l, i) => (
            <li key={l.title} data-reveal data-reveal-delay={i * 80}>
              <Link href={l.href} className="group block">
                <p className="a-tag">{l.tag}</p>
                <div className="mt-3 aspect-[4/5] overflow-hidden rounded-[8px]">
                  <div className="size-full transition-transform duration-700 group-hover:scale-[1.03]">
                    <Illo name={l.illo} />
                  </div>
                </div>
                <h3 className="a-title mt-4 text-[21px] leading-snug group-hover:underline group-hover:underline-offset-4">{l.title}</h3>
                <p className="mt-2 text-[14.5px] leading-6 text-muted-foreground">{l.text}</p>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-16 text-center text-[14px] text-muted-foreground">
          <Link href="/contato" className="inline-flex items-center gap-1 font-medium text-foreground hover:underline hover:underline-offset-4">
            {lang === "en" ? "Request a diagnosis" : "Solicitar diagnóstico"} <ArrowUpRight className="size-3.5" />
          </Link>
        </p>
      </section>
    </>
  );
}
