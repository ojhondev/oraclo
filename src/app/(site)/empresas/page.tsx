import type { Metadata } from "next";
import Link from "next/link";
import { getStories } from "@/lib/site/stories";
import { getLang } from "@/lib/site/get-lang";
import type { Lang } from "@/lib/site/lang";
import { SectionHead, StoryCard } from "@/components/site/blocks";
import { Illo, type IlloName } from "@/components/site/illo";

const T = {
  pt: {
    title: "Setores que atendemos",
    description: "Diagnóstico de danos para restauro, inspeção predial, retrofit e patrimônio — feito por arquitetos de restauro do Estúdio Restaura, com tecnologia própria.",
    kicker: "Setores que atendemos",
    h1: "Diagnóstico de danos para quem decide a obra",
    lead: "Restauro, inspeção, retrofit ou patrimônio: fazemos a vistoria, mapeamos cada dano e entregamos quantitativos, orçamento e laudo prontos para a sua decisão.",
    cta: "Solicitar diagnóstico",
    cta2: "Conheça a tecnologia",
    segments: [
      {
        id: "restauro",
        title: "Estúdios de restauro",
        pain: "O mapa de danos é o que vende a obra, mas leva dias entre CAD, planilha e editor de texto — e o orçamento muda a cada visita.",
        gain: ["Fachada retificada a partir de foto, sem levantamento caro", "Hachuras e legenda por tipo de dano, como na prancha tradicional", "Orçamento do tratamento sai junto com o mapa"],
      },
      {
        id: "inspecao",
        title: "Inspeção predial e patologia",
        pain: "Vistorias de condomínio e cautelares pedem rapidez, rastreabilidade e prioridade clara do que corrigir primeiro.",
        gain: ["Prioridade pela matriz GUT em cada dano", "Fotos de campo pelo celular, organizadas por vistoria", "Laudo em PDF com vistas, tabela de prioridades e recomendações"],
      },
      {
        id: "retrofit",
        title: "Retrofit e manutenção",
        pain: "Antes de orçar a obra é preciso quantificar: quantos m² de reboco, quantos metros de fissura, quantas esquadrias.",
        gain: ["Áreas e comprimentos medidos na vista em escala", "Quantitativos por tipo de dano, por área e por projeto", "DXF em metros para seguir no CAD"],
      },
      {
        id: "patrimonio",
        title: "Patrimônio — dioceses, museus e órgãos",
        pain: "Imóveis protegidos precisam de estado de conservação documentado e de comparação entre visitas ao longo dos anos.",
        gain: ["Projetos com proteção, órgão e processo registrados", "Vistorias datadas para comparar antes e agora", "Laudo de estado de conservação pronto para arquivar"],
      },
    ],
    teamTitle: "Como trabalhamos com você",
    team: [
      ["Um especialista por imóvel", "Um arquiteto do Estúdio Restaura acompanha o diagnóstico do briefing à entrega."],
      ["Vistoria em campo", "Fotografamos e medimos no local, com medidas de conferência para garantir a escala."],
      ["Precisão medida", "Cada vista sai com a precisão estimada em cm — e esse número vai para o laudo."],
      ["Acesso online para a sua equipe", "Você e o seu time acompanham vistas, danos, orçamento e laudo numa área própria."],
      ["Entregáveis prontos para o projeto", "Laudo em PDF, prancha A3 e DXF em metros, com uma camada por tipo de dano."],
      ["Sigilo e dados separados", "Os dados do seu imóvel ficam numa área só sua, com acesso por convite."],
    ],
    stories: "Casos",
    seeAll: "Ver tudo",
    finalTitle: "Conte qual é o imóvel. Um arquiteto responde.",
    finalText: "Descreva o imóvel e o objetivo. Depois do briefing, enviamos o orçamento do diagnóstico, sem compromisso.",
    finalCta: "Solicitar diagnóstico",
  },
  en: {
    title: "Sectors we serve",
    description: "Damage diagnosis for restoration, building inspection, retrofit and heritage — produced by Estúdio Restaura's restoration architects, with in-house technology.",
    kicker: "Sectors we serve",
    h1: "Damage diagnosis for those who decide the works",
    lead: "Restoration, inspection, retrofit or heritage: we survey the building, map every damage and deliver quantities, a budget and a report ready for your decision.",
    cta: "Request a diagnosis",
    cta2: "Explore the technology",
    segments: [
      {
        id: "restauro",
        title: "Restoration studios",
        pain: "The damage map is what sells the job, but it takes days across CAD, spreadsheets and word processors — and the budget changes after every visit.",
        gain: ["Rectified facades from photos, without an expensive survey", "Hatching and a legend per damage type, like a traditional drawing", "The treatment budget comes out together with the map"],
      },
      {
        id: "inspecao",
        title: "Building inspection and pathology",
        pain: "Condominium and pre-works inspections call for speed, traceability and a clear priority for what to fix first.",
        gain: ["GUT-matrix priority on every damage", "Field photos by phone, organised by survey", "PDF report with views, a priority table and recommendations"],
      },
      {
        id: "retrofit",
        title: "Retrofit and maintenance",
        pain: "Before pricing the works you need quantities: how many m² of render, how many metres of cracks, how many windows.",
        gain: ["Areas and lengths measured on the scaled view", "Quantities by damage type, by area and by project", "DXF in metres to carry on in CAD"],
      },
      {
        id: "patrimonio",
        title: "Heritage — dioceses, museums and agencies",
        pain: "Protected buildings need a documented state of conservation and comparisons between visits over the years.",
        gain: ["Projects with protection status, agency and case number recorded", "Dated surveys to compare before and now", "Condition report ready to file"],
      },
    ],
    teamTitle: "How we work with you",
    team: [
      ["One specialist per building", "An Estúdio Restaura architect follows the diagnosis from briefing to delivery."],
      ["Site survey", "We photograph and measure on site, with check measurements to guarantee the scale."],
      ["Measured precision", "Every view comes with its estimated precision in cm — and that number goes into the report."],
      ["Online access for your team", "You and your team follow views, damage, budget and report in your own area."],
      ["Deliverables ready for design", "PDF report, A3 drawing and DXF in metres, with one layer per damage type."],
      ["Confidential, separated data", "Your building's data stays in an area of its own, with access by invitation."],
    ],
    stories: "Cases",
    seeAll: "See all",
    finalTitle: "Tell us about the building. An architect will reply.",
    finalText: "Describe the building and your goal. After the briefing, we send a quote for the diagnosis, with no obligation.",
    finalCta: "Request a diagnosis",
  },
} satisfies Record<Lang, unknown>;

const SEGMENT_ILLOS: IlloName[] = ["arco", "gut", "escala", "fachada"];

export async function generateMetadata(): Promise<Metadata> {
  const t = T[await getLang()];
  return { title: t.title, description: t.description };
}

/** Setores atendidos, no padrão das páginas internas da Anthropic. */
export default async function EmpresasPage() {
  const lang = await getLang();
  const t = T[lang];
  const stories = getStories(lang);
  return (
    <>
      {/* título em duas colunas */}
      <section className="grid gap-8 px-4 pt-12 pb-16 sm:px-6 sm:pt-16 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div>
          <p className="a-label">{t.kicker}</p>
          <h1 className="mt-5 text-[40px] leading-[1.05] sm:text-[58px]">{t.h1}</h1>
        </div>
        <div className="lg:pt-10">
          <p className="a-serif text-[21px] leading-[1.45] sm:text-[24px]">{t.lead}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/contato" className="a-btn a-btn-sm">
              {t.cta}
            </Link>
            <Link href="/tecnologia" className="a-btn-2 a-btn-sm">
              {t.cta2}
            </Link>
          </div>
        </div>
      </section>

      {/* um bloco por setor, com ilustração */}
      <section className="px-4 sm:px-6 lg:px-8">
        {t.segments.map((s, i) => (
          <article key={s.id} id={s.id} className="grid scroll-mt-24 gap-8 border-t py-14 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
            <div className="aspect-square max-w-[420px] overflow-hidden rounded-[8px]" data-reveal="fade">
              <Illo name={SEGMENT_ILLOS[i]!} />
            </div>
            <div className="min-w-0 self-center" data-reveal data-reveal-delay={100}>
              <p className="a-label">0{i + 1}</p>
              <h2 className="mt-4 text-[30px] leading-tight sm:text-[40px]">{s.title}</h2>
              <p className="a-serif mt-4 max-w-[52ch] text-[20px] leading-[1.45] sm:text-[22px]">{s.pain}</p>
              <ul className="mt-8 border-t text-[15px] leading-6">
                {s.gain.map((g) => (
                  <li key={g} className="flex gap-3 border-b py-3">
                    <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-[var(--site-accent)]" />
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>

      {/* como trabalhamos: colunas com linha fina no topo */}
      <section className="px-4 pt-20 sm:px-6 sm:pt-28 lg:px-8">
        <h2 className="text-[30px] leading-tight sm:text-[40px]">{t.teamTitle}</h2>
        <ul className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {t.team.map(([title, text], i) => (
            <li key={title} className="border-t pt-4" data-reveal data-reveal-delay={(i % 3) * 80}>
              <p className="a-label">0{i + 1}</p>
              <h3 className="a-title mt-3 text-[17px]">{title}</h3>
              <p className="mt-2 text-[14.5px] leading-6 text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-4 pt-20 sm:px-6 sm:pt-28 lg:px-8">
        <SectionHead title={t.stories} href="/historias" more={t.seeAll} />
        <ul className="mt-8 grid gap-8 md:grid-cols-3">
          {stories.map((s) => (
            <li key={s.slug} className={stories.length === 1 ? "md:col-span-3" : undefined}>
              <StoryCard story={s} large={stories.length === 1} lang={lang} />
            </li>
          ))}
        </ul>
      </section>

      <section className="px-4 pt-24 sm:px-6 lg:px-8">
        <div className="a-card px-6 py-20 text-center">
          <h2 className="a-serif mx-auto max-w-[22ch] text-[32px] leading-[1.15] sm:text-[46px]">{t.finalTitle}</h2>
          <p className="mx-auto mt-4 max-w-md text-[16px] leading-7 text-muted-foreground">{t.finalText}</p>
          <Link href="/contato" className="a-btn mt-8">
            {t.finalCta}
          </Link>
        </div>
      </section>
    </>
  );
}
