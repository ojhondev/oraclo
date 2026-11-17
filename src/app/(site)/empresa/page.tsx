import type { Metadata } from "next";
import Image from "next/image";
import { getLang } from "@/lib/site/get-lang";
import { SITE } from "@/lib/site/site-copy";
import { EngBand, EngCta, EngHead, EngPageHero, EngPinnedSteps, EngStatement, type Step } from "@/components/eng/blocks";
import type { ObjectName } from "@/components/eng/contour";

export async function generateMetadata(): Promise<Metadata> {
  const t = SITE[await getLang()].company;
  return { title: t.metaTitle, description: t.lead, alternates: { canonical: "/empresa" } };
}

const TEAM_OBJ: ObjectName[] = ["celular", "fachada", "notebook", "laudo"];

/** Empresa (v2): topo escuro, propósito, frase em painel, fundador, método preso na tela, valores e chamada final. */
export default async function CompanyPage() {
  const lang = await getLang();
  const en = lang === "en";
  const t = SITE[lang].company;
  const steps: Step[] = t.team.map(([title, text], i) => ({
    eyebrow: `${String(i + 1).padStart(2, "0")} · ${title}`,
    title,
    text,
    object: TEAM_OBJ[i % TEAM_OBJ.length]!,
  }));
  return (
    <>
      <EngPageHero eyebrow={t.metaTitle} title={t.title} text={t.lead} object="igreja" video="telhado" ctas={[{ href: "/contato", label: t.cta }]} />

      {/* propósito em quatro colunas */}
      <EngBand tone="white">
        <p className="eng-eyebrow">{t.purposeLabel}</p>
        <ul className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {t.purpose.map(([title, text], i) => (
            <li key={title} className="border-t border-(--eng-ink) pt-5" data-reveal data-reveal-delay={i * 80}>
              <p className="font-mono text-[11px] text-(--eng-mute)">{String(i + 1).padStart(2, "0")}</p>
              <h2 className="mt-4 text-[24px] leading-[1.15] tracking-[-0.01em]">{title}</h2>
              <p className="mt-3 text-[15px] leading-6 text-(--eng-mute)">{text}</p>
            </li>
          ))}
        </ul>
      </EngBand>

      <EngStatement text={t.founder.paragraphs[2] ?? t.lead} video="terreno" />

      {/* quem criou o ArchRay */}
      <EngBand tone="mist">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div data-reveal="fade">
            <div className="relative aspect-square max-w-[560px] overflow-hidden rounded-[16px] bg-(--eng-3)">
              <Image src="/site/jhonatan-ribeiro-obra.webp" alt={t.founder.photoAlt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover grayscale-[0.2]" />
            </div>
          </div>
          <div className="min-w-0 self-center">
            <p className="eng-eyebrow">{t.founder.label}</p>
            <h2 className="mt-4 text-[clamp(30px,3.8vw,52px)] leading-[1.08] tracking-[-0.025em]">{t.founder.title}</h2>
            <div className="mt-8 grid max-w-[60ch] gap-5 text-[18px] leading-[1.6] sm:text-[19px]">
              {t.founder.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <div className="mt-10 border-t border-(--eng-ink)/15 pt-5">
              <p className="text-[18px]">{t.founder.name}</p>
              <p className="mt-1 font-mono text-[11px] tracking-[0.05em] text-(--eng-mute) uppercase">{t.founder.role}</p>
            </div>
          </div>
        </div>
      </EngBand>

      <EngPinnedSteps steps={steps} eyebrow={en ? "Method" : "Método"} title={t.teamTitle} />

      {/* valores */}
      <EngBand tone="white">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <EngHead eyebrow={en ? "Values" : "Valores"} title={t.valuesTitle} text={t.valuesText} className="lg:grid-cols-1 lg:items-start" />
          <ol className="border-t border-(--eng-ink)">
            {t.values.map(([title, text], i) => (
              <li key={title} className="grid grid-cols-[44px_1fr] gap-4 border-b py-7" data-reveal data-reveal-delay={i * 60}>
                <span className="pt-2 font-mono text-[11px] text-(--eng-mute)">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="text-[24px] leading-snug tracking-[-0.01em] sm:text-[28px]">{title}</h3>
                  <p className="mt-2 text-[15px] leading-7 text-(--eng-mute)">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </EngBand>

      <EngCta title={t.finalTitle} cta={{ href: "/contato", label: t.finalCta }} object="igreja" />
    </>
  );
}
