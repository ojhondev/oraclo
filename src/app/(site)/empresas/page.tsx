import type { Metadata } from "next";
import Link from "next/link";
import { getStories } from "@/lib/site/stories";
import { getLang } from "@/lib/site/get-lang";
import type { Lang } from "@/lib/site/lang";
import { SectionHead, StoryCard } from "@/components/site/blocks";
import { Illo, type IlloName } from "@/components/site/illo";

type Segment = { id: string; illo: IlloName; title: string; also: string; who: string; pain: string; gain: string[]; example: { title: string; steps: string[] } };

const T = {
  pt: {
    title: "Setores que atendemos",
    description:
      "Diagnóstico de danos em edificações para arquitetura, engenharia, construtoras, poder público, perícias e seguros, com tecnologia própria do Estúdio Restaura.",
    kicker: "Setores que atendemos",
    h1: "Diagnóstico de danos para quem decide a obra",
    lead:
      "De um escritório de arquitetura a uma carteira de prédios públicos: vistoriamos, mapeamos cada dano e entregamos quantitativos, orçamento e laudo prontos para a sua decisão.",
    cta: "Solicitar diagnóstico",
    cta2: "Conheça a tecnologia",
    segmentsLabel: "Cinco setores",
    exampleLabel: "Exemplo de aplicação",
    alsoLabel: "Inclui",
    examplesNote: "Os exemplos ilustram o uso da ferramenta e não descrevem clientes reais. Para um caso real, veja Casos.",
    segments: [
      {
        id: "arquitetura",
        illo: "arco",
        title: "Arquitetura",
        also: "Restauro, ateliês e patrimônio histórico",
        who: "Escritórios de arquitetura, restauradores, dioceses, museus e fundações",
        pain: "O mapa de danos é a base do projeto de intervenção, mas leva dias entre CAD, planilha e editor de texto. Em imóveis protegidos, o estado de conservação ainda precisa ser comparável ao longo dos anos.",
        gain: [
          "Fachada retificada a partir de foto, em escala, com precisão declarada",
          "Hachuras e legenda por tipo de dano, prontas para a prancha",
          "DXF em metros, com uma camada por tipo de dano",
          "Proteção, órgão e processo registrados no projeto",
        ],
        example: {
          title: "Igreja tombada, antes do projeto de restauro",
          steps: [
            "A equipe fotografa as fachadas e toma medidas de conferência em campo.",
            "Cada fachada é retificada, e a precisão fica gravada na vista.",
            "Desplacamentos, eflorescências e biodeterioração são mapeados com sugestões revisadas pelo arquiteto.",
            "A prancha A3 e o DXF seguem para o projeto, e o laudo de estado de conservação vai para o processo no órgão de preservação.",
          ],
        },
      },
      {
        id: "engenharia",
        illo: "fissura",
        title: "Engenharia",
        also: "Patologia, engenharia estrutural, inspeção predial e condomínios",
        who: "Engenheiros, consultores de patologia, inspetores, síndicos e administradoras",
        pain: "Fissuras e deformações precisam de registro preciso de posição, comprimento e evolução. Na inspeção predial, também é preciso mostrar o que corrigir primeiro, com documentação clara para a assembleia.",
        gain: [
          "Fissuras, trincas e rachaduras medidas em metros, com margem de erro",
          "Comparação entre vistorias para acompanhar cada dano",
          "Prioridade pela matriz GUT e fotos de campo pelo celular",
          "Registro visual de apoio: ensaios e análise estrutural seguem com o engenheiro",
        ],
        example: {
          title: "Fissuras em fachada de condomínio, em monitoramento",
          steps: [
            "Na primeira vistoria, as fissuras são desenhadas e medidas na vista em escala.",
            "Meses depois, a mesma fachada é fotografada e alinhada à anterior por pontos homólogos.",
            "O ArchRay aponta o que surgiu, o que cresceu e o que ficou estável.",
            "O engenheiro decide os ensaios, e a matriz GUT organiza o plano apresentado à assembleia.",
          ],
        },
      },
      {
        id: "construtoras",
        illo: "camadas",
        title: "Construtoras",
        also: "Retrofit, incorporadoras, gestão de imóveis e facilities",
        who: "Construtoras, empresas de reforma, gestoras patrimoniais e redes com muitos imóveis",
        pain: "Antes de orçar a obra é preciso quantificar quantos m² de reboco, quantos metros de fissura e quantas esquadrias. Quem mantém vários imóveis precisa planejar antes que o dano cresça.",
        gain: [
          "Quantitativos por tipo de dano, por área e por projeto",
          "Orçamento pela tabela de preços da sua empresa",
          "Vistoria de pós-obra comparada com a de antes",
          "Histórico por imóvel para o plano de manutenção",
        ],
        example: {
          title: "Retrofit de edifício comercial, na fase de orçamento",
          steps: [
            "A construtora retifica as fachadas e mapeia os danos por área do edifício.",
            "Os quantitativos saem do próprio desenho, por tipo de dano.",
            "A tabela de preços da empresa gera o orçamento do tratamento, por área e por prioridade.",
            "Ao fim da obra, uma nova vistoria é comparada com a inicial para documentar a entrega.",
          ],
        },
      },
      {
        id: "publico",
        illo: "grade",
        title: "Poder Público",
        also: "Prefeituras, secretarias, escolas e órgãos de preservação",
        who: "Gestores de prédios públicos e equipes técnicas de obras e patrimônio",
        pain: "Com muitos imóveis e pouca equipe, é preciso decidir onde investir primeiro, com um critério que se possa explicar.",
        gain: [
          "O mesmo método de prioridade em todos os imóveis",
          "Orçamento estimado por imóvel para planejar o investimento",
          "Relatórios padronizados para toda a carteira",
          "Vistorias datadas de imóveis protegidos",
        ],
        example: {
          title: "Rede municipal de escolas, no planejamento anual",
          steps: [
            "A equipe técnica vistoria cada escola com o mesmo protocolo de fotos e medidas.",
            "Todos os danos recebem a mesma classificação GUT, com critério documentado.",
            "O orçamento estimado por imóvel mostra o investimento de cada intervenção.",
            "Os laudos padronizados dão base ao plano de obras e ao histórico de cada prédio.",
          ],
        },
      },
      {
        id: "pericias",
        illo: "escala",
        title: "Perícias e Seguros",
        also: "Vistorias cautelares e sinistros",
        who: "Peritos, seguradoras, advogados e vizinhos de obra",
        pain: "Antes de uma obra vizinha ou depois de um sinistro, é preciso registrar com data e medida o estado em que o imóvel estava.",
        gain: [
          "Vistorias datadas, com fotos e vistas em escala",
          "Danos medidos e descritos, com a origem de cada registro",
          "Comparação entre o antes e o depois do evento",
          "Motor e precisão registrados em cada medida",
        ],
        example: {
          title: "Vistoria cautelar antes de uma escavação vizinha",
          steps: [
            "Antes do início da obra, as fachadas são vistoriadas e os danos existentes são mapeados.",
            "Durante ou depois da obra, uma nova vistoria é feita no mesmo imóvel.",
            "As duas datas são alinhadas, e cada dano é classificado como novo, crescido ou estável.",
            "O perito usa o registro datado e medido como apoio ao seu parecer.",
          ],
        },
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
      "Building damage diagnosis for architecture, engineering, contractors, the public sector, surveys and insurance, with Estúdio Restaura's in-house technology.",
    kicker: "Sectors we serve",
    h1: "Damage diagnosis for those who decide the works",
    lead:
      "From an architecture practice to a portfolio of public buildings: we survey, map every damage and deliver quantities, a budget and a report ready for your decision.",
    cta: "Request a diagnosis",
    cta2: "Explore the technology",
    segmentsLabel: "Five sectors",
    exampleLabel: "Application example",
    alsoLabel: "Includes",
    examplesNote: "These examples illustrate how the tool is used and do not describe real clients. For a real case, see Cases.",
    segments: [
      {
        id: "arquitetura",
        illo: "arco",
        title: "Architecture",
        also: "Restoration, studios and heritage",
        who: "Architecture practices, restorers, dioceses, museums and foundations",
        pain: "The damage map is the basis of the intervention design, but it takes days across CAD, spreadsheets and word processors. Protected buildings also need a condition record that can be compared over the years.",
        gain: [
          "Rectified facades from photos, to scale, with stated precision",
          "Hatching and a legend per damage type, ready for the drawing",
          "DXF in metres, with one layer per damage type",
          "Protection status, agency and case number recorded on the project",
        ],
        example: {
          title: "Listed church, ahead of the restoration design",
          steps: [
            "The team photographs the facades and takes check measurements on site.",
            "Each facade is rectified, and the precision is stored with the view.",
            "Spalling, efflorescence and biodeterioration are mapped, with suggestions reviewed by the architect.",
            "The A3 sheet and DXF go to the design, and the condition report goes to the preservation agency's file.",
          ],
        },
      },
      {
        id: "engenharia",
        illo: "fissura",
        title: "Engineering",
        also: "Pathology, structural engineering, building inspection and condominiums",
        who: "Engineers, pathology consultants, inspectors and building managers",
        pain: "Cracks and deformations need precise records of position, length and evolution. Building inspection also has to show what to fix first, with clear documentation for the owners' meeting.",
        gain: [
          "Cracks measured in metres, with a margin of error",
          "Comparison between surveys to follow each damage",
          "GUT-matrix priority and field photos by phone",
          "Visual supporting record: tests and structural analysis stay with the engineer",
        ],
        example: {
          title: "Cracks on a condominium facade, under monitoring",
          steps: [
            "On the first survey, cracks are drawn and measured on the scaled view.",
            "Months later, the same facade is photographed and aligned to the earlier one by matching points.",
            "ArchRay shows what appeared, what grew and what stayed stable.",
            "The engineer decides on testing, and the GUT matrix organises the plan presented to the owners.",
          ],
        },
      },
      {
        id: "construtoras",
        illo: "camadas",
        title: "Contractors",
        also: "Retrofit, developers, property and facilities management",
        who: "Contractors, refurbishment firms, asset managers and multi-site chains",
        pain: "Before pricing the works you need quantities: how many m² of render, how many metres of cracks, how many windows. Whoever maintains many buildings needs to plan before damage grows.",
        gain: [
          "Quantities by damage type, by area and by project",
          "Budget from your company's price table",
          "Post-works survey compared with the one before",
          "History per building for the maintenance plan",
        ],
        example: {
          title: "Office building retrofit, at the pricing stage",
          steps: [
            "The contractor rectifies the facades and maps damage by area of the building.",
            "Quantities come straight from the drawing, by damage type.",
            "The company's price table generates the treatment budget, by area and priority.",
            "When the works finish, a new survey is compared with the first to document the handover.",
          ],
        },
      },
      {
        id: "publico",
        illo: "grade",
        title: "Public Sector",
        also: "City halls, departments, schools and preservation agencies",
        who: "Managers of public buildings and technical teams for works and heritage",
        pain: "With many buildings and a small team, you need to decide where to invest first, with criteria you can explain.",
        gain: [
          "The same priority method across every building",
          "Estimated budget per building to plan investment",
          "Standardised reports for the whole portfolio",
          "Dated surveys of protected buildings",
        ],
        example: {
          title: "Municipal school network, in annual planning",
          steps: [
            "The technical team surveys each school with the same photo and measurement protocol.",
            "All damage receives the same GUT classification, with documented criteria.",
            "The estimated budget per building shows the investment for each intervention.",
            "Standardised reports support the works plan and each building's history.",
          ],
        },
      },
      {
        id: "pericias",
        illo: "escala",
        title: "Surveys and Insurance",
        also: "Pre-works surveys and claims",
        who: "Experts, insurers, lawyers and neighbours of works",
        pain: "Before neighbouring works or after an incident, you need a dated, measured record of the building's condition.",
        gain: [
          "Dated surveys, with photos and scaled views",
          "Damage measured and described, with the origin of each record",
          "Comparison between before and after the event",
          "Engine and precision recorded on each measurement",
        ],
        example: {
          title: "Pre-works survey ahead of a neighbouring excavation",
          steps: [
            "Before the works start, the facades are surveyed and existing damage is mapped.",
            "During or after the works, a new survey is made on the same building.",
            "The two dates are aligned, and each damage is classed as new, grown or stable.",
            "The expert uses the dated, measured record to support their opinion.",
          ],
        },
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

/** Setores atendidos: título, cinco setores com exemplo de aplicação, método e casos. */
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

      {/* setores em largura total: ilustração, dor e entregas, e um exemplo de aplicação */}
      <section className="grid gap-4 px-4 pt-8 sm:px-6 lg:px-8">
        {t.segments.map((s, i) => (
          <article key={s.id} id={s.id} className="a-card grid scroll-mt-24 overflow-hidden md:grid-cols-[180px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)]" data-reveal>
            <div className="aspect-[16/9] md:aspect-auto">
              <Illo name={s.illo} />
            </div>
            <div className="flex min-w-0 flex-col p-6 sm:p-7">
              <p className="a-label">0{i + 1}</p>
              <h2 className="mt-3 text-[26px] leading-tight sm:text-[30px]">{s.title}</h2>
              <p className="mt-2 text-[13.5px] leading-5 text-muted-foreground">
                <span className="font-medium text-foreground">{t.alsoLabel}:</span> {s.also}
              </p>
              <p className="mt-1 text-[13.5px] leading-5 text-muted-foreground">{s.who}</p>
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
            <div className="min-w-0 border-t p-6 sm:p-7 md:col-span-2 xl:col-span-1 xl:border-t-0 xl:border-l">
              <p className="a-tag">{t.exampleLabel}</p>
              <h3 className="a-title mt-3 text-[19px] leading-snug">{s.example.title}</h3>
              <ol className="mt-4 grid gap-3 text-[14.5px] leading-6">
                {s.example.steps.map((step, n) => (
                  <li key={step} className="flex gap-3">
                    <span className="a-label mt-[3px] shrink-0">{n + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </article>
        ))}
        <p className="pt-2 text-[13.5px] leading-5 text-muted-foreground">
          {t.examplesNote}{" "}
          <Link href="/historias" className="underline underline-offset-4 hover:text-foreground">
            {t.stories}
          </Link>
        </p>
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
