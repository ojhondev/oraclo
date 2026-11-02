import type { Metadata } from "next";
import Link from "next/link";
import { getStories } from "@/lib/site/stories";
import { getLang } from "@/lib/site/get-lang";
import type { Lang } from "@/lib/site/lang";
import { SectionHead, StoryCard } from "@/components/site/blocks";
import { Illo, type IlloName } from "@/components/site/illo";

type Segment = { id: string; illo: IlloName; title: string; who: string; pain: string; gain: string[] };

const T = {
  pt: {
    title: "Setores que atendemos",
    description:
      "Diagnóstico de danos em edificações para arquitetura, engenharia, inspeção predial, construtoras, patrimônio, poder público, gestão de imóveis e perícias — com tecnologia própria do Estúdio Restaura.",
    kicker: "Setores que atendemos",
    h1: "Diagnóstico de danos para quem decide a obra",
    lead:
      "De um escritório de arquitetura a uma carteira de prédios públicos: vistoriamos, mapeamos cada dano e entregamos quantitativos, orçamento e laudo prontos para a sua decisão.",
    cta: "Solicitar diagnóstico",
    cta2: "Conheça a tecnologia",
    segmentsLabel: "Oito frentes",
    segments: [
      {
        id: "arquitetura",
        illo: "arco",
        title: "Arquitetura e restauro",
        who: "Escritórios de arquitetura, restauradores e ateliês",
        pain: "O mapa de danos é a base do projeto de intervenção, mas leva dias entre CAD, planilha e editor de texto — e muda a cada visita.",
        gain: [
          "Fachada retificada a partir de foto, em escala",
          "Hachuras e legenda por tipo de dano, prontas para a prancha",
          "DXF em metros, com uma camada por tipo de dano",
        ],
      },
      {
        id: "engenharia",
        illo: "fissura",
        title: "Engenharia estrutural e patologia",
        who: "Engenheiros, calculistas e consultores de patologia",
        pain: "Fissuras, trincas e deformações precisam de registro preciso — posição, comprimento e evolução — para embasar a investigação e o projeto de reforço.",
        gain: [
          "Fissuras, trincas e rachaduras medidas em metros na vista em escala",
          "Comparação entre vistorias para acompanhar a evolução de cada dano",
          "Registro visual de apoio: ensaios e análise estrutural seguem com o engenheiro",
        ],
      },
      {
        id: "inspecao",
        illo: "gut",
        title: "Inspeção predial e condomínios",
        who: "Inspetores, síndicos e administradoras",
        pain: "É preciso saber o que corrigir primeiro, com documentação clara para a assembleia e para o histórico do prédio.",
        gain: [
          "Prioridade de cada dano pela matriz GUT",
          "Fotos de campo pelo celular, organizadas por vistoria",
          "Laudo em PDF com vistas, prioridades e recomendações",
        ],
      },
      {
        id: "construtoras",
        illo: "camadas",
        title: "Construtoras e retrofit",
        who: "Construtoras, incorporadoras e empresas de reforma",
        pain: "Antes de orçar a obra é preciso quantificar: quantos m² de reboco, quantos metros de fissura, quantas esquadrias.",
        gain: [
          "Quantitativos por tipo de dano, por área e por projeto",
          "Orçamento pela tabela de preços da sua empresa",
          "Vistoria de pós-obra comparada com a de antes",
        ],
      },
      {
        id: "patrimonio",
        illo: "fachada",
        title: "Patrimônio histórico",
        who: "Dioceses, museus, fundações e órgãos de preservação",
        pain: "Imóveis protegidos precisam de estado de conservação documentado e comparável ao longo dos anos.",
        gain: [
          "Projetos com proteção, órgão e processo registrados",
          "Vistorias datadas e comparação entre elas",
          "Laudo de estado de conservação pronto para arquivar",
        ],
      },
      {
        id: "publico",
        illo: "grade",
        title: "Poder público",
        who: "Prefeituras, secretarias, escolas e prédios públicos",
        pain: "Com muitos imóveis e pouca equipe, é preciso decidir onde investir primeiro — com um critério que se possa explicar.",
        gain: [
          "O mesmo método de prioridade em todos os imóveis",
          "Orçamento estimado por imóvel para planejar o investimento",
          "Relatórios padronizados para toda a carteira",
        ],
      },
      {
        id: "gestao",
        illo: "comparar",
        title: "Gestão de imóveis e facilities",
        who: "Gestoras patrimoniais, indústrias, redes e varejo",
        pain: "Manter vários imóveis exige acompanhar o estado de cada um e planejar a manutenção antes que o dano cresça.",
        gain: [
          "Histórico de vistorias por imóvel",
          "Comparação que mostra o que surgiu, cresceu ou foi tratado",
          "Prioridades e custos para o plano de manutenção",
        ],
      },
      {
        id: "pericias",
        illo: "escala",
        title: "Perícias, seguros e vistorias cautelares",
        who: "Peritos, seguradoras, advogados e vizinhos de obra",
        pain: "Antes de uma obra vizinha ou depois de um sinistro, é preciso registrar com data e medida o estado em que o imóvel estava.",
        gain: [
          "Vistorias datadas, com fotos e vistas em escala",
          "Danos medidos e descritos, com a origem de cada registro",
          "Comparação entre o antes e o depois do evento",
        ],
      },
    ] satisfies Segment[],
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
    description:
      "Building damage diagnosis for architecture, engineering, building inspection, contractors, heritage, the public sector, property management and surveys — with Estúdio Restaura's in-house technology.",
    kicker: "Sectors we serve",
    h1: "Damage diagnosis for those who decide the works",
    lead:
      "From an architecture practice to a portfolio of public buildings: we survey, map every damage and deliver quantities, a budget and a report ready for your decision.",
    cta: "Request a diagnosis",
    cta2: "Explore the technology",
    segmentsLabel: "Eight fronts",
    segments: [
      {
        id: "arquitetura",
        illo: "arco",
        title: "Architecture and restoration",
        who: "Architecture practices, restorers and studios",
        pain: "The damage map is the basis of the intervention design, but it takes days across CAD, spreadsheets and word processors — and changes after every visit.",
        gain: ["Rectified facades from photos, to scale", "Hatching and a legend per damage type, ready for the drawing", "DXF in metres, with one layer per damage type"],
      },
      {
        id: "engenharia",
        illo: "fissura",
        title: "Structural engineering and pathology",
        who: "Engineers, structural designers and pathology consultants",
        pain: "Cracks and deformations need precise records — position, length and evolution — to support the investigation and the strengthening design.",
        gain: [
          "Fine, medium and wide cracks measured in metres on the scaled view",
          "Comparison between surveys to follow each damage over time",
          "Visual supporting record: tests and structural analysis stay with the engineer",
        ],
      },
      {
        id: "inspecao",
        illo: "gut",
        title: "Building inspection and condominiums",
        who: "Inspectors, building managers and management companies",
        pain: "You need to know what to fix first, with clear documentation for the owners' meeting and the building's history.",
        gain: ["GUT-matrix priority on every damage", "Field photos by phone, organised by survey", "PDF report with views, priorities and recommendations"],
      },
      {
        id: "construtoras",
        illo: "camadas",
        title: "Contractors and retrofit",
        who: "Contractors, developers and refurbishment firms",
        pain: "Before pricing the works you need quantities: how many m² of render, how many metres of cracks, how many windows.",
        gain: ["Quantities by damage type, by area and by project", "Budget from your company's price table", "Post-works survey compared with the one before"],
      },
      {
        id: "patrimonio",
        illo: "fachada",
        title: "Heritage",
        who: "Dioceses, museums, foundations and preservation agencies",
        pain: "Protected buildings need a documented state of conservation that can be compared over the years.",
        gain: ["Projects with protection status, agency and case number recorded", "Dated surveys and comparison between them", "Condition report ready to file"],
      },
      {
        id: "publico",
        illo: "grade",
        title: "Public sector",
        who: "City halls, departments, schools and public buildings",
        pain: "With many buildings and a small team, you need to decide where to invest first — with criteria you can explain.",
        gain: ["The same priority method across every building", "Estimated budget per building to plan investment", "Standardised reports for the whole portfolio"],
      },
      {
        id: "gestao",
        illo: "comparar",
        title: "Property and facilities management",
        who: "Asset managers, industry, chains and retail",
        pain: "Looking after many buildings means tracking each one's condition and planning maintenance before damage grows.",
        gain: ["Survey history per building", "Comparison showing what appeared, grew or was treated", "Priorities and costs for the maintenance plan"],
      },
      {
        id: "pericias",
        illo: "escala",
        title: "Expert surveys, insurance and pre-works surveys",
        who: "Experts, insurers, lawyers and neighbours of works",
        pain: "Before neighbouring works or after an incident, you need a dated, measured record of the building's condition.",
        gain: ["Dated surveys, with photos and scaled views", "Damage measured and described, with the origin of each record", "Comparison between before and after the event"],
      },
    ] satisfies Segment[],
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

export async function generateMetadata(): Promise<Metadata> {
  const t = T[await getLang()];
  return { title: t.title, description: t.description };
}

/** Setores atendidos, no padrão das páginas internas da Anthropic: título, grade de setores, método e casos. */
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

      {/* índice rápido dos setores */}
      <nav className="px-4 sm:px-6 lg:px-8" aria-label={t.segmentsLabel}>
        <div className="flex flex-wrap gap-1.5 border-t pt-5">
          {t.segments.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="a-pill">
              {s.title}
            </a>
          ))}
        </div>
      </nav>

      {/* grade de setores: cartão bege com ilustração, dor e entregas */}
      <section className="grid gap-4 px-4 pt-8 sm:px-6 md:grid-cols-2 lg:px-8">
        {t.segments.map((s, i) => (
          <article key={s.id} id={s.id} className="a-card grid scroll-mt-24 overflow-hidden sm:grid-cols-[180px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)]" data-reveal data-reveal-delay={(i % 2) * 80}>
            <div className="aspect-[16/9] sm:aspect-auto">
              <Illo name={s.illo} />
            </div>
            <div className="flex min-w-0 flex-col p-6 sm:p-7">
              <p className="a-label">0{i + 1}</p>
              <h2 className="mt-3 text-[22px] leading-tight sm:text-[24px]">{s.title}</h2>
              <p className="mt-1 text-[13.5px] text-muted-foreground">{s.who}</p>
              <p className="mt-4 text-[15px] leading-6">{s.pain}</p>
              <ul className="mt-4 border-t text-[14px] leading-6">
                {s.gain.map((g) => (
                  <li key={g} className="flex gap-2.5 border-b py-2">
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
