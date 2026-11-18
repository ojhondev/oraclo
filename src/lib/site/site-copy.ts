/**
 * Copy do site público (estrutura inspirada na Anthropic): menus, início, Tecnologia, Empresa e
 * Compromissos, em português e inglês. Tom técnico, com a tecnologia própria no centro.
 * Regra: só afirmar o que o produto faz de verdade — nada de métricas, prazos ou clientes inventados.
 */
import type { Lang } from "./lang";
import { WHATSAPP_LABEL, whatsappUrl } from "./whatsapp";
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
          { href: "/tecnologia", label: "Nossa Tecnologia", hint: "O que está por trás do serviço" },
          { href: "/tecnologia#captura", label: "Modelo 3D e Nuvem de Pontos" },
          { href: "/tecnologia#retificacao", label: "Imagens Retificadas" },
          { href: "/tecnologia#deteccao", label: "Mapa de Danos com IA" },
          { href: "/tecnologia#laudo", label: "Laudo e Pranchas" },
        ],
      },
      {
        label: "Setores",
        items: [
          { href: "/empresas", label: "Todos os setores" },
          { href: "/empresas#arquitetura", label: "Arquitetura" },
          { href: "/empresas#engenharia", label: "Engenharia" },
          { href: "/empresas#construtoras", label: "Construtoras" },
          { href: "/empresas#publico", label: "Poder Público" },
          { href: "/empresas#pericias", label: "Perícias e Seguros" },
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
          { href: whatsappUrl("pt"), label: WHATSAPP_LABEL.pt, hint: "Um arquiteto responde" },
          { href: "/login", label: "Área do cliente", hint: "Projetos, mapas e laudos" },
        ],
      },
    ] as Menu[],
    open: "Abrir o ArchRay",
    menu: "Menu",
    language: "Idioma",
  },

  home: {
    metaTitle: "Levantamento 3D, Mapa de Danos e Nuvem de Pontos para Arquitetos, Engenheiros e Patrimônio | ArchRay",
    metaDescription:
      "Levantamento 3D, mapa de danos e nuvem de pontos para arquitetos, engenheiros e patrimônio histórico. Serviço do Estúdio Restaura com tecnologia própria e IA: laudo, orçamento e prioridades, sem laser scanner nem drone.",
    lead: "Levantamento 3D, mapa de danos, orçamento e laudo, sem laser scanner nem drone.",
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
    metaTitle: "Nossa Tecnologia",
    title: "Nossa Tecnologia",
    headline: "A tecnologia própria por trás do nosso serviço.",
    statement:
      "Onde o levantamento tradicional mobiliza laser scanner e drone com LiDAR, nós gravamos a fachada com o celular. O ArchRay, nosso software interno, transforma esse vídeo em modelo 3D, nuvem de pontos, imagem em escala, mapa de danos, orçamento e laudo, com cada número rastreável. Você contrata o serviço; a tecnologia é o que o torna mais simples, rápido e acessível.",
    sectionsLabel: "Fundamentos técnicos",
    sectionsTitle: "O que roda por trás de cada etapa do serviço",
    sectionsHint: "Passe o mouse ou toque em um cartão para ver como funciona.",
    moreLabel: "Ver detalhes",
    closeLabel: "Fechar",
    postsLabel: "Publicações",
    postsCount: (n: number) => `${n} ${n === 1 ? "publicação" : "publicações"}`,
    items: [
      {
        id: "captura",
        name: "Modelo 3D e nuvem de pontos",
        status: "Novo",
        illo: "pontos",
        summary: "A gravação da fachada vira modelo 3D e nuvem de pontos, em escala real.",
        bullets: [
          "Captura pelo nosso próprio aplicativo, que guia a gravação e guarda só o que interessa.",
          "Reconstrução 3D com malha texturizada e nuvem de pontos da edificação.",
          "Escala conferida automaticamente pelo marcador colado na parede, com a divergência declarada.",
        ],
      },
      {
        id: "retificacao",
        name: "Imagens retificadas",
        status: "Em produção",
        illo: "retifica",
        summary: "Cada fachada vira uma imagem em escala, pronta para medir e desenhar.",
        bullets: [
          "A foto em perspectiva é levada a um plano em verdadeira grandeza.",
          "Correção da distorção da lente feita pela própria imagem.",
          "A precisão de cada vista fica registrada e aparece no laudo.",
        ],
        more: { href: "/docs#retificar", label: "Ver na documentação" },
      },
      {
        id: "deteccao",
        name: "Mapeamento de danos com IA",
        status: "Em produção",
        illo: "deteccao",
        summary: "A IA embutida faz o mapeamento primário dos danos e a nossa equipe revisa cada um.",
        bullets: [
          "Fissuras, manchas, biodeterioração e perdas de reboco sugeridas na fachada inteira.",
          "Arquitetura não é confundida com dano: molduras, vãos e ornamentos ficam de fora.",
          "Cada sugestão traz justificativa e confiança; nada entra no laudo sem revisão.",
        ],
        more: { href: "/index/deteccao-automatica-de-danos", label: "Ler o anúncio" },
      },
      {
        id: "contorno",
        name: "Contorno assistido",
        status: "Em produção",
        illo: "contorno",
        summary: "Um clique sobre o dano e o contorno sai pronto, para a equipe ajustar.",
        bullets: [
          "Recorta elementos e manchas com precisão, direto sobre a imagem em escala.",
          "Refinamento rápido com pontos e caixa de recorte.",
          "Área e comprimento calculados na hora.",
        ],
      },
      {
        id: "comparacao",
        name: "Comparação de vistorias",
        status: "Em produção",
        illo: "comparar",
        summary: "Coloca duas datas lado a lado e mostra o que mudou em cada dano.",
        bullets: [
          "As duas vistorias são alinhadas sobre a mesma fachada.",
          "Visualização em cortina ou lado a lado.",
          "Cada dano classificado como novo, cresceu, estável, diminuiu ou tratado.",
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
          "Prioridade de cada dano pela matriz GUT e orçamento pela tabela de tratamentos.",
          "Laudo A4, prancha A3 com legenda e DXF com uma camada por tipo de dano.",
          "Margem de erro das medidas e declaração de uso de IA no laudo.",
        ],
        more: { href: "/docs#laudo", label: "Ver na documentação" },
      },
    ] satisfies Tech[],
  },

  company: {
    metaTitle: "Empresa",
    title: "Um serviço de diagnóstico de edificações, com tecnologia própria",
    lead:
      "O ArchRay é o serviço de levantamento e diagnóstico do Estúdio Restaura. Desenvolvemos a nossa própria tecnologia para entregar levantamento 3D, mapa de danos e laudo sem depender de laser scanner nem drone, de forma mais simples, rápida e acessível.",
    cta: "Fale com a gente",
    founder: {
      label: "Quem está por trás",
      title: "Por que o ArchRay existe",
      paragraphs: [
        "O ArchRay foi criado por Jhonatan Ribeiro, desenvolvedor e analista de sistemas com foco em engenharia de software, junto ao Estúdio Restaura.",
        "O propósito é ser um braço de serviço escalável do Estúdio Restaura e oferecer tecnologia e inovação com IA a um setor tradicional como a Arquitetura e a Engenharia.",
        "A tecnologia mede, sugere e organiza. A decisão continua com o profissional responsável.",
      ],
      name: "Jhonatan Ribeiro",
      role: "Desenvolvedor · Analista de sistemas · Engenharia de software",
      photoAlt: "Retrato de Jhonatan Ribeiro",
    },
    purposeLabel: "Nosso propósito",
    purpose: [
      ["Medir com rigor", "Toda área e todo comprimento vêm de uma vista em escala, com a margem de erro declarada."],
      ["Tecnologia a serviço do restauro", "Desenvolvemos o motor dentro de um escritório que vive a obra, para resolver os problemas reais do diagnóstico."],
      ["O arquiteto decide", "A IA sugere e acelera; quem valida cada dano e assina o laudo é o profissional."],
      ["Simples e acessível", "Celular e marcador de escala no lugar de laser scanner e drone: menos mobilização em campo e um orçamento que cabe em mais obras."],
    ],
    teamTitle: "Como trabalhamos",
    teamText: "Do primeiro contato ao laudo, cada etapa tem método e ferramenta própria.",
    team: [
      ["Vistoria", "Nossa equipe grava a fachada com o celular, com o marcador de escala na parede."],
      ["Levantamento 3D", "A gravação vira modelo 3D, nuvem de pontos e vistas em escala, com a precisão registrada."],
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
    finalTitle: "Conte qual é o imóvel. Mandamos o orçamento.",
    finalCta: WHATSAPP_LABEL.pt,
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
      "O ArchRay é o serviço de levantamento e diagnóstico do Estúdio Restaura: modelo 3D, mapa de danos, orçamento e laudo de fachadas, sem laser scanner nem drone.",
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
          { href: "/tecnologia", label: "Our Technology", hint: "What's behind the service" },
          { href: "/tecnologia#captura", label: "3D Model and Point Cloud" },
          { href: "/tecnologia#retificacao", label: "Rectified Images" },
          { href: "/tecnologia#deteccao", label: "AI Damage Mapping" },
          { href: "/tecnologia#laudo", label: "Reports and Sheets" },
        ],
      },
      {
        label: "Sectors",
        items: [
          { href: "/empresas", label: "All sectors" },
          { href: "/empresas#arquitetura", label: "Architecture" },
          { href: "/empresas#engenharia", label: "Engineering" },
          { href: "/empresas#construtoras", label: "Contractors" },
          { href: "/empresas#publico", label: "Public Sector" },
          { href: "/empresas#pericias", label: "Surveys and Insurance" },
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
          { href: whatsappUrl("en"), label: WHATSAPP_LABEL.en, hint: "An architect replies" },
          { href: "/login", label: "Client area", hint: "Projects, maps and reports" },
        ],
      },
    ],
    open: "Open ArchRay",
    menu: "Menu",
    language: "Language",
  },

  home: {
    metaTitle: "3D Surveys, Damage Maps and Point Clouds for Architects, Engineers and Heritage | ArchRay",
    metaDescription:
      "3D surveys, damage maps and point clouds for architects, engineers and heritage buildings. A service by Estúdio Restaura with in-house technology and AI: report, budget and priorities, without laser scanners or drones.",
    lead: "3D survey, damage map, budget and report, without laser scanners or drones.",
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
    metaTitle: "Our Technology",
    title: "Our Technology",
    headline: "The in-house technology behind our service.",
    statement:
      "Where a traditional survey mobilises a laser scanner and a LiDAR drone, we record the façade on a phone. ArchRay, our in-house software, turns that video into a 3D model, point cloud, scaled image, damage map, budget and report, with every number traceable. You hire the service; the technology is what makes it simpler, faster and more affordable.",
    sectionsLabel: "Technical foundations",
    sectionsTitle: "What runs behind each step of the service",
    sectionsHint: "Hover over or tap a card to see how it works.",
    moreLabel: "See details",
    closeLabel: "Close",
    postsLabel: "Posts",
    postsCount: (n: number) => `${n} ${n === 1 ? "post" : "posts"}`,
    items: [
      {
        id: "captura",
        name: "3D model and point cloud",
        status: "New",
        illo: "pontos",
        summary: "The façade recording becomes a 3D model and point cloud at real scale.",
        bullets: [
          "Capture with our own app, which guides the recording and keeps only what matters.",
          "3D reconstruction with a textured mesh and a point cloud of the building.",
          "Scale checked automatically by the marker on the wall, with the divergence stated.",
        ],
      },
      {
        id: "retificacao",
        name: "Rectified images",
        status: "In production",
        illo: "retifica",
        summary: "Each façade becomes a scaled image, ready to measure and draw on.",
        bullets: [
          "The perspective photo is brought to a true-size plane.",
          "Lens distortion corrected from the image itself.",
          "Each view's precision is recorded and shown in the report.",
        ],
        more: { href: "/docs#retificar", label: "See the documentation" },
      },
      {
        id: "deteccao",
        name: "AI damage mapping",
        status: "In production",
        illo: "deteccao",
        summary: "Built-in AI does the first damage mapping and our team reviews every defect.",
        bullets: [
          "Cracks, stains, biodeterioration and render loss suggested across the whole façade.",
          "Architecture is not mistaken for damage: mouldings, openings and ornaments are left out.",
          "Each suggestion carries a reason and a confidence; nothing reaches the report without review.",
        ],
        more: { href: "/index/deteccao-automatica-de-danos", label: "Read the announcement" },
      },
      {
        id: "contorno",
        name: "Assisted outline",
        status: "In production",
        illo: "contorno",
        summary: "One click on the defect and the outline is ready for the team to adjust.",
        bullets: [
          "Cuts out elements and stains precisely, right on the scaled image.",
          "Quick refinement with points and a crop box.",
          "Area and length computed instantly.",
        ],
      },
      {
        id: "comparacao",
        name: "Survey comparison",
        status: "In production",
        illo: "comparar",
        summary: "Puts two dates side by side and shows what changed in each defect.",
        bullets: [
          "Both surveys are aligned on the same façade.",
          "Curtain or side-by-side view.",
          "Each defect classed as new, grew, stable, shrank or treated.",
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
          "Each defect prioritised by the GUT matrix and priced from the treatment table.",
          "A4 report, A3 sheet with legend and DXF with one layer per damage type.",
          "Measurement error margins and an AI-use statement in the report.",
        ],
        more: { href: "/docs#laudo", label: "See the documentation" },
      },
    ],
  },

  company: {
    metaTitle: "Company",
    title: "A building diagnosis service, with in-house technology",
    lead:
      "ArchRay is Estúdio Restaura's survey and diagnosis service. We built our own technology to deliver 3D surveys, damage maps and reports without relying on laser scanners or drones, in a simpler, faster and more affordable way.",
    cta: "Talk to us",
    founder: {
      label: "Who is behind it",
      title: "Why ArchRay exists",
      paragraphs: [
        "ArchRay was created by Jhonatan Ribeiro, a developer and systems analyst focused on software engineering, together with Estúdio Restaura.",
        "Its purpose is to be a scalable service arm of Estúdio Restaura and to offer technology and AI innovation to a traditional sector such as Architecture and Engineering.",
        "Technology measures, suggests and organises. The decision stays with the professional in charge.",
      ],
      name: "Jhonatan Ribeiro",
      role: "Developer · Systems analyst · Software engineering",
      photoAlt: "Portrait of Jhonatan Ribeiro",
    },
    purposeLabel: "Our purpose",
    purpose: [
      ["Measure rigorously", "Every area and length comes from a scaled view, with the error margin stated."],
      ["Technology serving restoration", "We develop the engine inside a studio that lives on site, to solve diagnosis's real problems."],
      ["The architect decides", "AI suggests and speeds things up; the professional validates each damage and signs the report."],
      ["Simple and affordable", "A phone and a scale marker instead of a laser scanner and drone: less mobilisation on site and a budget that fits more projects."],
    ],
    teamTitle: "How we work",
    teamText: "From first contact to the report, each step has its own method and tool.",
    team: [
      ["Site visit", "Our team records the façade on a phone, with the scale marker on the wall."],
      ["3D survey", "The recording becomes a 3D model, point cloud and scaled views, with the precision recorded."],
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
    finalTitle: "Tell us about the building. We'll send a quote.",
    finalCta: WHATSAPP_LABEL.en,
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
    blurb: "ArchRay is Estúdio Restaura's survey and diagnosis service: 3D model, damage map, budget and façade report, without laser scanners or drones.",
  },
};

export const SITE: Record<Lang, Copy> = { pt, en };
