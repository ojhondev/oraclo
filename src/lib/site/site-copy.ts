/**
 * Copy do site público (estrutura inspirada na Anthropic): menus, início, Tecnologia, Empresa e
 * Compromissos, em português e inglês. Tom técnico, com a tecnologia própria no centro.
 * Regra: só afirmar o que o produto faz de verdade — nada de métricas, prazos ou clientes inventados.
 */
import type { Lang } from "./lang";
import type { IlloName } from "@/components/site/illo";

type Link = { href: string; label: string; hint?: string };
type Menu = { label: string; href?: string; items?: Link[] };

export type Tech = {
  id: string;
  name: string;
  status: string;
  illo: IlloName;
  summary: string;
  bullets: string[];
  more?: Link;
};

const pt = {
  nav: {
    left: [
      { label: "Index", href: "/index" },
      {
        label: "Tecnologia",
        items: [
          { href: "/tecnologia", label: "Visão geral", hint: "O motor do ArchRay" },
          { href: "/tecnologia#retificacao", label: "Retificação métrica" },
          { href: "/tecnologia#deteccao", label: "Detecção automática" },
          { href: "/tecnologia#contorno", label: "Contorno IA" },
          { href: "/tecnologia#comparacao", label: "Comparação de vistorias" },
          { href: "/tecnologia#laudo", label: "Laudo, pranchas e DXF" },
          { href: "/docs", label: "Documentação" },
        ],
      },
      {
        label: "Setores",
        items: [
          { href: "/empresas", label: "Todos os setores" },
          { href: "/empresas#arquitetura", label: "Arquitetura e restauro" },
          { href: "/empresas#engenharia", label: "Engenharia estrutural e patologia" },
          { href: "/empresas#inspecao", label: "Inspeção predial e condomínios" },
          { href: "/empresas#construtoras", label: "Construtoras e retrofit" },
          { href: "/empresas#patrimonio", label: "Patrimônio histórico" },
          { href: "/empresas#publico", label: "Poder público" },
          { href: "/empresas#gestao", label: "Gestão de imóveis e facilities" },
          { href: "/empresas#pericias", label: "Perícias e seguros" },
        ],
      },
      { label: "Compromissos", href: "/compromissos" },
    ] as Menu[],
    right: [
      {
        label: "Empresa",
        items: [
          { href: "/empresa", label: "Sobre o ArchRay" },
          { href: "/historias", label: "Casos" },
          { href: "/contato", label: "Contato" },
          { href: "https://estudiorestaura.com.br", label: "Estúdio Restaura ↗" },
        ],
      },
      {
        label: "Acessar",
        items: [
          { href: "/contato", label: "Solicitar diagnóstico", hint: "Um arquiteto responde" },
          { href: "/login", label: "Área do cliente", hint: "Projetos, mapas e laudos" },
        ],
      },
    ] as Menu[],
    open: "Abrir o ArchRay",
    menu: "Menu",
    language: "Idioma",
  },

  home: {
    metaTitle: "ArchRay — Laudo com Mapa de Danos com IA assistida",
    metaDescription:
      "O ArchRay converte fotos de fachada em desenho técnico em escala, mede cada patologia e entrega orçamento e laudo. Tecnologia própria do Estúdio Restaura.",
    lead: "Laudo com Mapa de Danos com IA assistida.",
    manifesto:
      "Vistoriamos, retificamos e mapeamos cada dano de fachadas com tecnologia própria — e entregamos quantitativos, orçamento do tratamento e laudo com prioridades, prontos para decidir, aprovar e começar a obra.",
    featureTitle: "Reinventamos o mapa de danos",
    featureText:
      "Retificação métrica, detecção automática e comparação entre vistorias num motor próprio, que roda no navegador. A máquina mede; o arquiteto decide.",
    featureCta: "Conheça a tecnologia",
    cardsLabel: "Nossa tecnologia",
    cards: [
      {
        tag: "Motor",
        title: "Retificação métrica",
        text: "Da foto em perspectiva ao plano em escala: correção de lente por linhas retas, ajuste por mínimos quadrados e precisão estimada em cada vista.",
        rows: [
          ["Precisão", "declarada (95%)", "/tecnologia#retificacao"],
          ["Método", "Documentação", "/docs#retificar"],
        ],
        cta: "Ler sobre",
        href: "/tecnologia#retificacao",
      },
      {
        tag: "Visão computacional",
        title: "Detecção automática",
        text: "Um primeiro olhar sobre a fachada inteira: fissuras, manchas, biodeterioração e perda de reboco sugeridas para revisão. Nada entra no laudo sem um arquiteto aceitar.",
        rows: [
          ["Revisão", "humana, dano a dano", "/compromissos#revisao"],
          ["Publicação", "Index", "/index/deteccao-automatica-de-danos"],
        ],
        cta: "Ler anúncio",
        href: "/index/deteccao-automatica-de-danos",
      },
      {
        tag: "Monitoramento",
        title: "Comparação de vistorias",
        text: "A mesma fachada em duas datas, alinhada por perspectiva: o que surgiu, o que cresceu e o que foi tratado, contado por tipo de dano.",
        rows: [
          ["Alinhamento", "homografia por pontos", "/tecnologia#comparacao"],
          ["Publicação", "Index", "/index/comparar-vistorias"],
        ],
        cta: "Ler anúncio",
        href: "/index/comparar-vistorias",
      },
    ],
    learnLabel: "Saiba mais",
    learn: [
      { tag: "Empresa", title: "O ArchRay e o Estúdio Restaura", text: "Por que um escritório de restauro construiu a própria tecnologia de diagnóstico.", href: "/empresa", illo: "arco" as IlloName },
      { tag: "Compromissos", title: "Medir antes de afirmar", text: "Precisão declarada, revisão humana e dados sob controle de quem contrata.", href: "/compromissos", illo: "escala" as IlloName },
      { tag: "Caso", title: "Igreja do Carmo, Horta", text: "Um diagnóstico completo, da foto em perspectiva à prancha em escala.", href: "/historias/carmo-da-horta", illo: "fachada" as IlloName },
      { tag: "Documentação", title: "Do briefing ao laudo", text: "O fluxo do ArchRay passo a passo, com as telas reais.", href: "/docs", illo: "laudo" as IlloName },
    ],
  },

  tech: {
    metaTitle: "Tecnologia",
    statement:
      "Construímos o motor que transforma uma foto de fachada em diagnóstico: ele retifica, mede, sugere, compara e documenta — e deixa a decisão com o arquiteto.",
    frontsLabel: "Frentes do motor",
    featuredLabel: "Em destaque",
    readMore: "Ler mais",
    sectionsLabel: "Como funciona",
    postsLabel: "Publicações",
    postsCount: (n: number) => `${n} ${n === 1 ? "publicação" : "publicações"}`,
    items: [
      {
        id: "retificacao",
        name: "Retificação métrica",
        status: "Em produção",
        illo: "retifica",
        summary: "Leva a foto tirada em perspectiva para um plano em escala, com a incerteza calculada e registrada.",
        bullets: [
          "Homografia por mínimos quadrados (DLT normalizada) a partir dos quatro cantos e de pontos de controle extras.",
          "Distorção radial da lente estimada pelas linhas retas da própria foto.",
          "Medidas de conferência mostram o erro real; a precisão (95%) fica gravada na vista e aparece no laudo.",
          "Processamento no navegador, em Web Worker, com superamostragem adaptativa.",
        ],
        more: { href: "/docs#retificar", label: "Ver na documentação" },
      },
      {
        id: "deteccao",
        name: "Detecção automática",
        status: "Em produção",
        illo: "deteccao",
        summary: "Varre a vista inteira e sugere danos para revisão: um primeiro olhar, nunca a palavra final.",
        bullets: [
          "Fissuras por morfologia (black-hat) e teste de vale dos dois lados, que descarta juntas, frisos e fios.",
          "Manchas comparadas ao reboco limpo da própria fachada, com textura relativa, para não confundir sombra com dano.",
          "Vãos de janelas e portas reconhecidos e excluídos da análise.",
          "Cada sugestão traz confiança; aceitas viram danos, rejeitadas viram exemplos para treinar a próxima versão.",
        ],
        more: { href: "/index/deteccao-automatica-de-danos", label: "Ler o anúncio" },
      },
      {
        id: "contorno",
        name: "Contorno IA",
        status: "Em produção",
        illo: "contorno",
        summary: "Um clique sobre o dano e o contorno sai pronto, para o arquiteto ajustar.",
        bullets: [
          "Modo Elemento: segmentação por modelo de visão (SlimSAM) rodando no navegador, com WebGPU quando disponível.",
          "Modo Mancha: crescimento de região por cor no espaço Lab, com tolerância ajustável.",
          "Pontos positivos e negativos e caixa de recorte para refinar o resultado.",
        ],
      },
      {
        id: "comparacao",
        name: "Comparação de vistorias",
        status: "Em produção",
        illo: "comparar",
        summary: "Coloca duas datas no mesmo referencial e conta o que mudou em cada dano.",
        bullets: [
          "Alinhamento por pares de pontos homólogos: similaridade, afim ou homografia, com erro por ponto.",
          "Visualização em cortina ou lado a lado, deformada direto na tela (CSS matrix3d).",
          "Danos casados por posição e categoria: novos, cresceram, estáveis, diminuíram ou não aparecem.",
        ],
        more: { href: "/index/comparar-vistorias", label: "Ler o anúncio" },
      },
      {
        id: "laudo",
        name: "Laudo, pranchas e DXF",
        status: "Em produção",
        illo: "laudo",
        summary: "O que foi medido vira documento: prioridade, custo e desenho técnico.",
        bullets: [
          "Prioridade de cada dano pela matriz GUT e orçamento pela tabela de tratamentos do escritório.",
          "Laudo A4 editável, prancha A3 com legenda e DXF com uma camada por tipo de dano.",
          "Margem de erro das medidas e declaração automática de uso de IA no laudo.",
        ],
        more: { href: "/docs#laudo", label: "Ver na documentação" },
      },
    ] satisfies Tech[],
  },

  company: {
    metaTitle: "Empresa",
    title: "Diagnóstico de edificações com tecnologia própria",
    lead:
      "O ArchRay é o braço de diagnóstico do Estúdio Restaura: arquitetos de restauro que construíram as ferramentas de que precisavam para medir, orçar e documentar danos com rigor.",
    cta: "Fale com a gente",
    founder: {
      label: "Quem está por trás",
      title: "Por que o ArchRay existe",
      paragraphs: [
        "O ArchRay foi idealizado por Jhonatan Ribeiro Alves, no Estúdio Restaura, a partir de um problema recorrente nos projetos de restauro: o mapa de danos — base do diagnóstico, do orçamento e da prestação de contas — ainda é produzido manualmente, entre fotografias, CAD, planilhas e editores de texto, e precisa ser refeito a cada mudança de escopo.",
        "Ao avaliar as ferramentas disponíveis, a equipe não encontrou uma solução que reunisse, em português, a legenda de patologias usada no Brasil e o rigor métrico exigido por um laudo técnico. O ArchRay foi desenvolvido para preencher essa lacuna.",
        "O princípio que orienta o produto é claro: a tecnologia mede, sugere e organiza; a decisão é do profissional responsável. Cada medida é apresentada com escala e margem de erro, e nenhum dano integra o laudo sem revisão humana.",
        "O objetivo é devolver a arquitetos e engenheiros o tempo dedicado ao que exige julgamento técnico: compreender a edificação e definir a melhor intervenção.",
      ],
      name: "Jhonatan Ribeiro Alves",
      role: "Estúdio Restaura · ArchRay",
      photoAlt: "Retrato de Jhonatan Ribeiro Alves",
    },
    purposeLabel: "Nosso propósito",
    purpose: [
      ["Medir com rigor", "Toda área e todo comprimento vêm de uma vista em escala, com a margem de erro declarada."],
      ["Tecnologia a serviço do restauro", "Desenvolvemos o motor dentro de um escritório que vive a obra, para resolver os problemas reais do diagnóstico."],
      ["O arquiteto decide", "A IA sugere e acelera; quem valida cada dano e assina o laudo é o profissional."],
      ["Leve e acessível", "O processamento roda no navegador, sem servidores caros nem cobrança por fachada processada."],
    ],
    teamTitle: "Como trabalhamos",
    teamText: "Do primeiro contato ao laudo, cada etapa tem método e ferramenta própria.",
    team: [
      ["Vistoria", "Levantamento fotográfico em campo e medidas de referência para a escala."],
      ["Retificação", "Cada fachada vira um plano em escala, com a precisão registrada."],
      ["Mapeamento", "Danos desenhados, sugeridos pela IA e revisados por arquitetos de restauro."],
      ["Laudo", "Quantitativos, orçamento, prioridades GUT, pranchas e DXF."],
    ],
    valuesTitle: "O que valorizamos",
    valuesText: "Diagnóstico decide obra e dinheiro. Estes princípios guiam como construímos e como entregamos.",
    values: [
      ["Medir antes de afirmar.", "Nenhum número sai sem uma escala e um método por trás."],
      ["Mostrar a incerteza.", "Precisão e confiança aparecem junto do resultado, não escondidas."],
      ["A decisão é humana.", "Ferramentas propõem; arquitetos validam e respondem pelo laudo."],
      ["Construir o que falta.", "Quando a ferramenta certa não existe, nós a desenvolvemos."],
      ["Cuidar do patrimônio e dos dados.", "Imagens e informações do cliente são tratadas com sigilo e só com consentimento."],
    ],
    finalTitle: "Conte qual é o imóvel. Um arquiteto responde.",
    finalCta: "Solicitar diagnóstico",
  },

  commitments: {
    metaTitle: "Compromissos",
    statement:
      "Um diagnóstico só vale o quanto se pode confiar nele. Estes são os compromissos que o ArchRay assume em cada vista, cada dano e cada laudo.",
    items: [
      {
        id: "precisao",
        illo: "escala" as IlloName,
        title: "Precisão declarada",
        text: "Cada vista retificada guarda a precisão estimada (95%) e o erro das medidas de conferência. Áreas e comprimentos vêm com margem de erro, e o laudo traz essas informações.",
      },
      {
        id: "revisao",
        illo: "contorno" as IlloName,
        title: "Humano no circuito",
        text: "Sugestões da IA nunca viram dano sozinhas. Todo dano registra a origem (desenho manual, contorno IA ou detecção automática), a confiança e quem validou.",
      },
      {
        id: "transparencia",
        illo: "laudo" as IlloName,
        title: "Transparência no laudo",
        text: "Quando a IA ajuda, o laudo diz quanto: uma declaração automática informa quantos danos tiveram apoio da IA e que todos foram revisados pelo profissional responsável.",
      },
      {
        id: "dados",
        illo: "camadas" as IlloName,
        title: "Dados sob controle",
        text: "A análise das imagens roda no navegador. Usar danos validados para treinar a IA depende de autorização da organização, desligada por padrão e revogável a qualquer momento.",
      },
    ],
  },

  footer: {
    blurb:
      "O ArchRay é o braço de diagnóstico do Estúdio Restaura: laudo com mapa de danos, orçamento e pranchas, com tecnologia própria.",
  },
};

type Copy = typeof pt;

const en: Copy = {
  nav: {
    left: [
      { label: "Index", href: "/index" },
      {
        label: "Technology",
        items: [
          { href: "/tecnologia", label: "Overview", hint: "The ArchRay engine" },
          { href: "/tecnologia#retificacao", label: "Metric rectification" },
          { href: "/tecnologia#deteccao", label: "Automatic detection" },
          { href: "/tecnologia#contorno", label: "AI outline" },
          { href: "/tecnologia#comparacao", label: "Survey comparison" },
          { href: "/tecnologia#laudo", label: "Reports, sheets and DXF" },
          { href: "/docs", label: "Documentation" },
        ],
      },
      {
        label: "Sectors",
        items: [
          { href: "/empresas", label: "All sectors" },
          { href: "/empresas#arquitetura", label: "Architecture and restoration" },
          { href: "/empresas#engenharia", label: "Structural engineering and pathology" },
          { href: "/empresas#inspecao", label: "Building inspection" },
          { href: "/empresas#construtoras", label: "Contractors and retrofit" },
          { href: "/empresas#patrimonio", label: "Heritage" },
          { href: "/empresas#publico", label: "Public sector" },
          { href: "/empresas#gestao", label: "Property and facilities" },
          { href: "/empresas#pericias", label: "Surveys and insurance" },
        ],
      },
      { label: "Commitments", href: "/compromissos" },
    ],
    right: [
      {
        label: "Company",
        items: [
          { href: "/empresa", label: "About ArchRay" },
          { href: "/historias", label: "Cases" },
          { href: "/contato", label: "Contact" },
          { href: "https://estudiorestaura.com.br", label: "Estúdio Restaura ↗" },
        ],
      },
      {
        label: "Access",
        items: [
          { href: "/contato", label: "Request a diagnosis", hint: "An architect replies" },
          { href: "/login", label: "Client area", hint: "Projects, maps and reports" },
        ],
      },
    ],
    open: "Open ArchRay",
    menu: "Menu",
    language: "Language",
  },

  home: {
    metaTitle: "ArchRay — Condition reports with AI-assisted damage mapping",
    metaDescription:
      "ArchRay turns facade photos into scaled technical drawings, measures every defect and delivers the budget and the report. In-house technology by Estúdio Restaura.",
    lead: "Condition reports with AI-assisted damage mapping.",
    manifesto:
      "We survey, rectify and map every damage on facades with in-house technology — and deliver quantities, a treatment budget and a prioritised report, ready to decide, approve and start the works.",
    featureTitle: "We reinvented the damage map",
    featureText:
      "Metric rectification, automatic detection and survey comparison in an engine of our own that runs in the browser. The machine measures; the architect decides.",
    featureCta: "Explore the technology",
    cardsLabel: "Our technology",
    cards: [
      {
        tag: "Engine",
        title: "Metric rectification",
        text: "From a perspective photo to a scaled plane: lens correction from straight lines, least-squares fitting and estimated precision on every view.",
        rows: [
          ["Precision", "stated (95%)", "/tecnologia#retificacao"],
          ["Method", "Documentation", "/docs#retificar"],
        ],
        cta: "Read more",
        href: "/tecnologia#retificacao",
      },
      {
        tag: "Computer vision",
        title: "Automatic detection",
        text: "A first look over the whole facade: cracks, stains, biological growth and render loss suggested for review. Nothing reaches the report until an architect accepts it.",
        rows: [
          ["Review", "human, one by one", "/compromissos#revisao"],
          ["Post", "Index", "/index/deteccao-automatica-de-danos"],
        ],
        cta: "Read announcement",
        href: "/index/deteccao-automatica-de-danos",
      },
      {
        tag: "Monitoring",
        title: "Survey comparison",
        text: "The same facade on two dates, aligned by perspective: what appeared, what grew and what was treated, counted by damage type.",
        rows: [
          ["Alignment", "point-based homography", "/tecnologia#comparacao"],
          ["Post", "Index", "/index/comparar-vistorias"],
        ],
        cta: "Read announcement",
        href: "/index/comparar-vistorias",
      },
    ],
    learnLabel: "Learn more",
    learn: [
      { tag: "Company", title: "ArchRay and Estúdio Restaura", text: "Why a restoration studio built its own diagnosis technology.", href: "/empresa", illo: "arco" },
      { tag: "Commitments", title: "Measure before you claim", text: "Stated precision, human review and data under the client's control.", href: "/compromissos", illo: "escala" },
      { tag: "Case", title: "Carmo Church, Horta", text: "A complete diagnosis, from the perspective photo to the scaled sheet.", href: "/historias/carmo-da-horta", illo: "fachada" },
      { tag: "Documentation", title: "From briefing to report", text: "The ArchRay workflow step by step, with real screens.", href: "/docs", illo: "laudo" },
    ],
  },

  tech: {
    metaTitle: "Technology",
    statement:
      "We built the engine that turns a facade photo into a diagnosis: it rectifies, measures, suggests, compares and documents — and leaves the decision to the architect.",
    frontsLabel: "Engine components",
    featuredLabel: "Featured",
    readMore: "Read more",
    sectionsLabel: "How it works",
    postsLabel: "Posts",
    postsCount: (n: number) => `${n} ${n === 1 ? "post" : "posts"}`,
    items: [
      {
        id: "retificacao",
        name: "Metric rectification",
        status: "In production",
        illo: "retifica",
        summary: "Takes a photo shot in perspective to a scaled plane, with its uncertainty computed and recorded.",
        bullets: [
          "Least-squares homography (normalised DLT) from the four corners plus extra control points.",
          "Radial lens distortion estimated from the straight lines in the photo itself.",
          "Check measurements show the real error; the 95% precision is stored with the view and shown in the report.",
          "Runs in the browser, in a Web Worker, with adaptive supersampling.",
        ],
        more: { href: "/docs#retificar", label: "See the documentation" },
      },
      {
        id: "deteccao",
        name: "Automatic detection",
        status: "In production",
        illo: "deteccao",
        summary: "Scans the whole view and suggests damage for review: a first look, never the final word.",
        bullets: [
          "Cracks found by morphology (black-hat) and a two-sided valley test that discards joints, mouldings and wires.",
          "Stains compared with the facade's own clean render, using relative texture so shadows aren't mistaken for damage.",
          "Window and door openings recognised and left out.",
          "Each suggestion carries a confidence; accepted ones become damage, rejected ones train the next version.",
        ],
        more: { href: "/index/deteccao-automatica-de-danos", label: "Read the announcement" },
      },
      {
        id: "contorno",
        name: "AI outline",
        status: "In production",
        illo: "contorno",
        summary: "One click on the damage and the outline is ready for the architect to adjust.",
        bullets: [
          "Element mode: segmentation by a vision model (SlimSAM) running in the browser, with WebGPU when available.",
          "Stain mode: colour-based region growing in Lab space, with adjustable tolerance.",
          "Positive and negative points and a crop box to refine the result.",
        ],
      },
      {
        id: "comparacao",
        name: "Survey comparison",
        status: "In production",
        illo: "comparar",
        summary: "Puts two dates in the same frame and counts what changed in each damage.",
        bullets: [
          "Alignment from pairs of matching points: similarity, affine or homography, with per-point error.",
          "Curtain or side-by-side view, warped directly on screen (CSS matrix3d).",
          "Damage matched by position and category: new, grew, stable, shrank or not visible.",
        ],
        more: { href: "/index/comparar-vistorias", label: "Read the announcement" },
      },
      {
        id: "laudo",
        name: "Reports, sheets and DXF",
        status: "In production",
        illo: "laudo",
        summary: "What was measured becomes a document: priority, cost and technical drawing.",
        bullets: [
          "Each damage prioritised by the GUT matrix and priced from the office's treatment table.",
          "Editable A4 report, A3 sheet with legend and DXF with one layer per damage type.",
          "Measurement error margins and an automatic AI-use statement in the report.",
        ],
        more: { href: "/docs#laudo", label: "See the documentation" },
      },
    ],
  },

  company: {
    metaTitle: "Company",
    title: "Building diagnosis with in-house technology",
    lead:
      "ArchRay is Estúdio Restaura's diagnosis arm: restoration architects who built the tools they needed to measure, price and document damage rigorously.",
    cta: "Talk to us",
    founder: {
      label: "Who is behind it",
      title: "Why ArchRay exists",
      paragraphs: [
        "ArchRay was conceived by Jhonatan Ribeiro Alves at Estúdio Restaura, in response to a recurring problem in restoration projects: the damage map — the basis of the diagnosis, the budget and the accountability — is still produced by hand, across photographs, CAD, spreadsheets and word processors, and has to be redone every time the scope changes.",
        "Reviewing the tools available, the team found no solution that combined, in Portuguese, the damage legend used in Brazil with the metric rigour a technical report requires. ArchRay was developed to fill that gap.",
        "The principle behind the product is clear: technology measures, suggests and organises; the decision belongs to the professional in charge. Every measurement comes with its scale and error margin, and no damage enters the report without human review.",
        "The goal is to give architects and engineers back the time that calls for technical judgement: understanding the building and defining the best intervention.",
      ],
      name: "Jhonatan Ribeiro Alves",
      role: "Estúdio Restaura · ArchRay",
      photoAlt: "Portrait of Jhonatan Ribeiro Alves",
    },
    purposeLabel: "Our purpose",
    purpose: [
      ["Measure rigorously", "Every area and length comes from a scaled view, with the error margin stated."],
      ["Technology serving restoration", "We develop the engine inside a studio that lives on site, to solve diagnosis's real problems."],
      ["The architect decides", "AI suggests and speeds things up; the professional validates each damage and signs the report."],
      ["Light and accessible", "Processing runs in the browser, with no expensive servers and no per-facade fees."],
    ],
    teamTitle: "How we work",
    teamText: "From first contact to the report, each step has its own method and tool.",
    team: [
      ["Survey", "On-site photography and reference measurements for scale."],
      ["Rectification", "Each facade becomes a scaled plane, with its precision recorded."],
      ["Mapping", "Damage drawn, suggested by AI and reviewed by restoration architects."],
      ["Report", "Quantities, budget, GUT priorities, sheets and DXF."],
    ],
    valuesTitle: "What we value",
    valuesText: "A diagnosis decides works and money. These principles guide how we build and how we deliver.",
    values: [
      ["Measure before you claim.", "No number goes out without a scale and a method behind it."],
      ["Show the uncertainty.", "Precision and confidence appear next to the result, not hidden."],
      ["The decision is human.", "Tools propose; architects validate and answer for the report."],
      ["Build what's missing.", "When the right tool doesn't exist, we develop it."],
      ["Care for heritage and data.", "Client images and information are kept confidential and used only with consent."],
    ],
    finalTitle: "Tell us about the building. An architect will reply.",
    finalCta: "Request a diagnosis",
  },

  commitments: {
    metaTitle: "Commitments",
    statement:
      "A diagnosis is only worth as much as you can trust it. These are the commitments ArchRay makes on every view, every damage and every report.",
    items: [
      {
        id: "precisao",
        illo: "escala",
        title: "Stated precision",
        text: "Each rectified view stores its estimated precision (95%) and the error of its check measurements. Areas and lengths come with error margins, and the report includes them.",
      },
      {
        id: "revisao",
        illo: "contorno",
        title: "Human in the loop",
        text: "AI suggestions never become damage on their own. Every damage records its origin (manual drawing, AI outline or automatic detection), its confidence and who validated it.",
      },
      {
        id: "transparencia",
        illo: "laudo",
        title: "Transparency in the report",
        text: "When AI helps, the report says how much: an automatic statement gives how many damages had AI support and that all were reviewed by the professional in charge.",
      },
      {
        id: "dados",
        illo: "camadas",
        title: "Data under control",
        text: "Image analysis runs in the browser. Using validated damage to train the AI requires the organisation's permission, off by default and revocable at any time.",
      },
    ],
  },

  footer: {
    blurb: "ArchRay is Estúdio Restaura's diagnosis arm: condition reports with damage mapping, budgets and drawings, built on in-house technology.",
  },
};

export const SITE: Record<Lang, Copy> = { pt, en };
