import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getLang } from "@/lib/site/get-lang";
import { SITE } from "@/lib/site/site-copy";
import { Illo, type IlloName } from "@/components/site/illo";

export async function generateMetadata(): Promise<Metadata> {
  const t = SITE[await getLang()].company;
  return { title: t.metaTitle, description: t.lead };
}

const TEAM_ILLOS: IlloName[] = ["fachada", "retifica", "contorno", "laudo"];

/** Empresa (na estrutura da página Company da Anthropic). */
export default async function CompanyPage() {
  const lang = await getLang();
  const t = SITE[lang].company;
  return (
    <>
      {/* título em duas colunas: negrito à esquerda, serifa e botão à direita */}
      <section className="grid gap-8 px-4 pt-14 pb-16 sm:px-6 sm:pt-20 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <h1 className="a-fluid [--a:40] [--b:60] leading-[1.05]">{t.title}</h1>
        <div className="lg:pt-3">
          <p className="a-serif text-[21px] leading-[1.45] sm:text-[24px]">{t.lead}</p>
          <Link href="/contato" className="a-btn a-btn-sm mt-6">
            {t.cta}
          </Link>
        </div>
      </section>

      {/* propósito em quatro colunas */}
      <section className="px-4 sm:px-6 lg:px-8">
        <p className="a-label">{t.purposeLabel}</p>
        <ul className="mt-4 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {t.purpose.map(([title, text], i) => (
            <li key={title} className="border-t pt-4" data-reveal data-reveal-delay={i * 80}>
              <h2 className="a-title text-[17px]">{title}</h2>
              <p className="mt-2 text-[14.5px] leading-6 text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* quem criou o ArchRay: retrato e carta em primeira pessoa */}
      <section className="grid gap-10 px-4 pt-20 sm:px-6 sm:pt-28 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:px-8" aria-labelledby="fundador">
        <div data-reveal="fade">
          <div className="relative aspect-square max-w-[560px] overflow-hidden rounded-2xl bg-[var(--site-band)]">
            <Image src="/site/jhonatan-ribeiro-obra.webp" alt={t.founder.photoAlt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
          </div>
        </div>
        <div className="min-w-0 self-center">
          <p className="a-label">{t.founder.label}</p>
          <h2 id="fundador" className="mt-4 a-fluid [--a:32] [--b:44] leading-tight">
            {t.founder.title}
          </h2>
          <div className="a-serif mt-6 grid max-w-[60ch] gap-5 text-[19px] leading-[1.6] sm:text-[20px]">
            {t.founder.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <div className="mt-8 border-t pt-4">
            <p className="a-title text-[17px]">{t.founder.name}</p>
            <p className="mt-0.5 text-[14px] text-muted-foreground">{t.founder.role}</p>
          </div>
        </div>
      </section>

      {/* painel bege: como trabalhamos */}
      <section className="px-4 pt-20 sm:px-6 sm:pt-28 lg:px-8">
        <div className="rounded-2xl bg-[var(--site-band)] p-6 sm:p-10">
          <div className="max-w-md">
            <h2 className="a-fluid [--a:28] [--b:34] leading-tight">{t.teamTitle}</h2>
            <p className="mt-3 text-[15.5px] leading-7 text-muted-foreground">{t.teamText}</p>
          </div>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.team.map(([title, text], i) => (
              <li key={title} className="flex flex-col overflow-hidden rounded-[12px] bg-background" data-reveal data-reveal-delay={i * 90}>
                <div className="aspect-[4/3]">
                  <Illo name={TEAM_ILLOS[i]!} />
                </div>
                <div className="p-5">
                  <p className="a-label">
                    0{i + 1} / 0{t.team.length}
                  </p>
                  <h3 className="a-title mt-2 text-[18px]">{title}</h3>
                  <p className="mt-1.5 text-[14px] leading-6 text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* valores numerados */}
      <section className="grid gap-10 px-4 pt-20 sm:px-6 sm:pt-28 lg:grid-cols-[1fr_1.4fr] lg:gap-16 lg:px-8">
        <div>
          <h2 className="a-fluid [--a:30] [--b:40] leading-tight">{t.valuesTitle}</h2>
          <p className="mt-4 max-w-md text-[16px] leading-7 text-muted-foreground">{t.valuesText}</p>
        </div>
        <ol className="border-t">
          {t.values.map(([title, text], i) => (
            <li key={title} className="grid grid-cols-[40px_1fr] gap-4 border-b py-6" data-reveal data-reveal-delay={i * 60}>
              <span className="a-label pt-1.5">0{i + 1}</span>
              <div>
                <h3 className="a-serif text-[22px] leading-snug sm:text-[26px]">{title}</h3>
                <p className="mt-2 text-[15px] leading-7 text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* chamada final */}
      <section className="px-4 pt-24 sm:px-6 lg:px-8">
        <div className="a-card px-6 py-20 text-center">
          <h2 className="a-serif mx-auto max-w-[22ch] a-fluid [--a:32] [--b:46] leading-[1.15]">{t.finalTitle}</h2>
          <Link href="/contato" className="a-btn mt-8">
            {t.finalCta}
          </Link>
        </div>
      </section>
    </>
  );
}
