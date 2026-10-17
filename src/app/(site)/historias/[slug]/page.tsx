import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { STORIES, fmtStoryDate, getStories } from "@/lib/site/stories";
import { CARMO } from "@/lib/site/carmo";
import { fmtBRL } from "@/lib/pricing";
import { getLang } from "@/lib/site/get-lang";
import { damageName, fmtNum, prioLabel } from "@/lib/site/i18n-data";
import { DamageMap } from "@/components/site/damage-map";

const T = {
  pt: {
    back: "Casos",
    stats: ["Danos mapeados", "Área afetada", "Orçamento estimado", "Prioridade alta (GUT ≥ 64)"],
    building: "O imóvel",
    buildingP: [
      "A Igreja de Nossa Senhora do Carmo, na cidade da Horta (ilha do Faial, Açores), foi o primeiro templo carmelita português erguido fora do continente. As obras começaram em 1698 e só terminaram em 1797; o convento anexo é de 1651. Hoje o conjunto é Imóvel de Interesse Público.",
      "Depois de décadas fechada, a igreja quase ruiu no sismo de 9 de julho de 1998. O restauro parou por falta de verba e só foi retomado quase vinte anos depois, com a reabertura em 2018. As fotos de 2010 mostram exatamente o estado que um mapa de danos precisa registrar: manchas, colonização biológica, desagregação da pedra, pintura descolando e vegetação nas cornijas.",
    ],
    how: "Como montamos o diagnóstico",
    howP: [
      "Usamos só duas fotos públicas de 27 de agosto de 2010. A fachada da igreja foi retificada no próprio ArchRay: quatro cliques nos cantos e as medidas estimadas de 18 × 18,7 m. A fachada do pátio do convento, quase frontal, foi calibrada pela largura de um vão de janela.",
      "Os danos de área foram contornados com o Contorno IA, que roda no navegador; os de vegetação foram marcados como pontos. Cada dano recebeu gravidade, urgência e tendência, e o orçamento saiu da tabela de preços sugerida.",
    ],
    note: "As medidas são estimadas — ninguém foi a campo. Num trabalho real, uma cota medida com trena calibra a vista em segundos e todas as áreas e custos se recalculam.",
    conventAlt: "Convento do Carmo com os danos mapeados",
    conventCap: "Convento — fachada do pátio (2010), 7 danos.",
    churchAlt: "Fachada da igreja retificada com os danos mapeados",
    churchCap: "Fachada principal retificada (2010), 4 danos.",
    prio: "Prioridades e orçamento",
    cols: ["Dano", "Quantidade", "Prioridade (GUT)", "Custo"],
    unit: "1 un.",
    total: "Total",
    beforeAlt: "Igreja do Carmo em 2010, antes do restauro",
    beforeCap: "2010 — antes do restauro.",
    afterAlt: "Igreja do Carmo em 2021, restaurada",
    afterCap: "2021 — restaurada e reaberta ao culto.",
    sources: "Fontes e créditos",
    wiki: "História do imóvel: Wikipedia (pt), “Igreja de Nossa Senhora do Carmo (Horta)”.",
    cta: "Solicitar diagnóstico do seu imóvel",
  },
  en: {
    back: "Cases",
    stats: ["Damages mapped", "Affected area", "Estimated budget", "High priority (GUT ≥ 64)"],
    building: "The building",
    buildingP: [
      "The Church of Our Lady of Carmo, in the town of Horta (Faial Island, Azores), was the first Portuguese Carmelite church built outside the mainland. Construction began in 1698 and was only finished in 1797; the adjoining convent dates from 1651. Today the complex is listed as a Property of Public Interest.",
      "After decades closed, the church nearly collapsed in the earthquake of 9 July 1998. The restoration stopped for lack of funds and only resumed almost twenty years later, with the reopening in 2018. The 2010 photos show exactly the condition a damage map needs to record: stains, biological colonisation, stone disaggregation, peeling paint and plants growing on the cornices.",
    ],
    how: "How we built the diagnosis",
    howP: [
      "We used only two public photos from 27 August 2010. The church facade was rectified in ArchRay itself: four clicks on the corners and estimated dimensions of 18 × 18.7 m. The convent's courtyard facade, almost straight-on, was calibrated by the width of a window opening.",
      "Area damage was outlined with AI outlining, which runs in the browser; plant growth was marked as points. Each damage was given a severity, urgency and trend, and the budget came from the suggested price table.",
    ],
    note: "The measurements are estimates — nobody went on site. On a real job, one dimension measured with a tape calibrates the view in seconds and every area and cost is recalculated.",
    conventAlt: "Carmo Convent with the damage mapped",
    conventCap: "Convent — courtyard facade (2010), 7 damages.",
    churchAlt: "Rectified church facade with the damage mapped",
    churchCap: "Rectified main facade (2010), 4 damages.",
    prio: "Priorities and budget",
    cols: ["Damage", "Quantity", "Priority (GUT)", "Cost"],
    unit: "1 unit",
    total: "Total",
    beforeAlt: "Carmo Church in 2010, before the restoration",
    beforeCap: "2010 — before the restoration.",
    afterAlt: "Carmo Church in 2021, restored",
    afterCap: "2021 — restored and reopened for worship.",
    sources: "Sources and credits",
    wiki: "Building history: Wikipedia (pt), “Igreja de Nossa Senhora do Carmo (Horta)”.",
    cta: "Request a diagnosis of your building",
  },
};

export function generateStaticParams() {
  return STORIES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/historias/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const s = getStories(await getLang()).find((x) => x.slug === slug);
  return s ? { title: s.title, description: s.summary } : {};
}

export default async function StoryPage({ params }: PageProps<"/historias/[slug]">) {
  const { slug } = await params;
  const lang = await getLang();
  const t = T[lang];
  const story = getStories(lang).find((s) => s.slug === slug);
  if (!story || slug !== "carmo-da-horta") notFound();

  const all = [...CARMO.convento.damages, ...CARMO.igreja.damages];
  const areaTotal = all.reduce((s, d) => s + (d.areaM2 ?? 0), 0);
  const urgent = all.filter((d) => d.gut >= 64).length;
  const sorted = [...all].sort((a, b) => b.gut - a.gut);
  const localize = <D extends { code: string; name: string }>(ds: D[]) => ds.map((d) => ({ ...d, name: damageName(d.code, d.name, lang) }));
  const convento = { ...CARMO.convento, damages: localize(CARMO.convento.damages) };
  const igreja = { ...CARMO.igreja, damages: localize(CARMO.igreja.damages) };

  return (
    <article className="pb-24">
      <header className="px-4 pt-14 sm:px-6 sm:pt-20 lg:px-8">
        <Link href="/historias" className="inline-flex items-center gap-1.5 text-[14px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> {t.back}
        </Link>
        <p className="site-fade-in mt-8 text-[14px]">
          <span className="font-medium">{story.segment}</span>
          <span className="ml-2 text-muted-foreground">{fmtStoryDate(story.date, lang)}</span>
        </p>
        <h1 className="site-fade-in mt-3 max-w-[22ch] text-[36px] leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-[64px]" style={{ "--d": "120ms" } as React.CSSProperties}>
          {story.title}
        </h1>
        <p className="site-fade-in mt-5 max-w-2xl text-[17px] leading-8 text-muted-foreground sm:text-[19px]" style={{ "--d": "240ms" } as React.CSSProperties}>
          {story.summary}
        </p>
      </header>

      <div className="site-fade-in relative mt-12 aspect-[16/9] overflow-hidden bg-secondary sm:mx-6 sm:rounded-lg lg:mx-8" style={{ "--d": "360ms" } as React.CSSProperties}>
        <div className="absolute inset-0" data-parallax="0.1">
          <Image src={story.cover} alt={story.coverAlt} fill priority sizes="100vw" className="object-cover" />
        </div>
      </div>

      {/* números */}
      <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden border-y bg-border sm:grid-cols-4">
        {[
          [t.stats[0]!, String(all.length)],
          [t.stats[1]!, `${fmtNum(areaTotal, 1, lang)} m²`],
          [t.stats[2]!, fmtBRL(CARMO.totalCents)],
          [t.stats[3]!, String(urgent)],
        ].map(([k, v]) => (
          <div key={k} className="bg-background px-4 py-6 sm:px-6 lg:px-8" data-reveal>
            <dt className="text-[13px] text-muted-foreground">{k}</dt>
            <dd className="mt-1 text-[26px] font-medium tracking-[-0.02em] tabular-nums sm:text-[32px]">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-16 px-4 pt-20 sm:px-6 lg:grid-cols-[1fr_minmax(0,680px)_1fr] lg:px-8">
        <div className="hidden lg:block" />
        <div className="grid gap-6 text-[17px] leading-8" data-reveal>
          <h2 className="text-[26px] leading-tight font-medium tracking-[-0.02em]">{t.building}</h2>
          {t.buildingP.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <h2 className="mt-6 text-[26px] leading-tight font-medium tracking-[-0.02em]">{t.how}</h2>
          {t.howP.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <p className="rounded-lg border bg-[var(--site-elev)] p-5 text-[15px] leading-7">{t.note}</p>
        </div>
        <div className="hidden lg:block" />
      </div>

      {/* vistas */}
      <div className="mt-20 grid gap-6 px-4 sm:px-6 lg:grid-cols-[1.35fr_1fr] lg:px-8">
        <figure data-reveal="fade">
          <div className="overflow-hidden rounded-lg bg-[#1a1a1a]">
            <DamageMap {...convento} alt={t.conventAlt} className="block h-auto w-full" />
          </div>
          <figcaption className="mt-2 text-[13px] text-muted-foreground">{t.conventCap}</figcaption>
        </figure>
        <figure data-reveal="fade" data-reveal-delay={200}>
          <div className="overflow-hidden rounded-lg bg-[#1a1a1a]">
            <DamageMap {...igreja} alt={t.churchAlt} className="block h-auto w-full" />
          </div>
          <figcaption className="mt-2 text-[13px] text-muted-foreground">{t.churchCap}</figcaption>
        </figure>
      </div>

      {/* prioridades */}
      <div className="mt-20 px-4 sm:px-6 lg:px-8" data-reveal>
        <h2 className="text-[26px] leading-tight font-medium tracking-[-0.02em]">{t.prio}</h2>
        <div className="mt-6 overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[560px] text-[14px]">
            <thead className="bg-secondary text-left text-[12.5px] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">{t.cols[0]}</th>
                <th className="px-3 py-3 text-right font-medium">{t.cols[1]}</th>
                <th className="px-3 py-3 font-medium">{t.cols[2]}</th>
                <th className="px-4 py-3 text-right font-medium">{t.cols[3]}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: d.color }} />
                      {damageName(d.code, d.name, lang)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{d.areaM2 != null ? `${fmtNum(d.areaM2, 2, lang)} m²` : t.unit}</td>
                  <td className="px-3 py-3 tabular-nums">
                    {d.gut} · <span className="text-muted-foreground">{prioLabel(d.gut, lang)}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtBRL(d.costCents)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-secondary font-medium">
                <td className="px-4 py-3" colSpan={3}>
                  {t.total}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{fmtBRL(CARMO.totalCents)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* depois */}
      <div className="mt-20 grid gap-6 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <figure data-reveal>
          <div className="relative aspect-[3/2] overflow-hidden rounded-lg bg-secondary">
            <Image src="/site/carmo-igreja-2010.jpg" alt={t.beforeAlt} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <figcaption className="mt-2 text-[13px] text-muted-foreground">{t.beforeCap}</figcaption>
        </figure>
        <figure data-reveal data-reveal-delay={150}>
          <div className="relative aspect-[3/2] overflow-hidden rounded-lg bg-secondary">
            <Image src="/site/carmo-igreja-2021.jpg" alt={t.afterAlt} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <figcaption className="mt-2 text-[13px] text-muted-foreground">{t.afterCap}</figcaption>
        </figure>
      </div>

      <footer className="mt-20 border-t px-4 pt-8 sm:px-6 lg:px-8">
        <p className="text-[13px] font-medium">{t.sources}</p>
        <ul className="mt-2 grid gap-1 text-[13px] leading-6 text-muted-foreground">
          {story.credits.map((c) => (
            <li key={c}>{c}</li>
          ))}
          <li>{t.wiki}</li>
        </ul>
        <Link href="/contato" className="mt-10 inline-flex h-11 items-center rounded-full bg-foreground px-6 text-[15px] font-medium text-background hover:opacity-85">
          {t.cta}
        </Link>
      </footer>
    </article>
  );
}
