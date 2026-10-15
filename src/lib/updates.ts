/**
 * Index: publicações sobre o ArchRay (novidades da plataforma). O post mais recente
 * também alimenta o banner de atualizações dentro do app.
 */

export type PostBlock =
  | { p: string }
  | { list: string[] }
  | { callout: string }
  | { table: { head: string[]; rows: string[][]; caption?: string } };

export type PostSection = { id: string; title: string; blocks: PostBlock[] };

export type Post = {
  slug: string;
  title: string;
  summary: string;
  /** ISO (aaaa-mm-dd). */
  date: string;
  category: string;
  /** Frase curta para o banner de atualizações. */
  banner: string;
  intro: string[];
  sections: PostSection[];
  author: string;
  notes?: string[];
};

export const POSTS: Post[] = [
  {
    slug: "archray-mapa-de-danos-com-ia",
    title: "ArchRay: do dano apontado ao laudo pronto",
    summary:
      "O Oraclo agora é ArchRay. Fachada retificada a partir de uma foto, orçamento automático, prioridade GUT, painel do projeto, laudo em PDF e uma área de trabalho mais limpa.",
    date: "2026-10-15",
    category: "Produto",
    banner: "O Oraclo agora é ArchRay — veja tudo o que mudou na plataforma.",
    intro: [
      "Montar um mapa de danos com quantitativos, orçamento e laudo costuma levar dias: fotos numa pasta, desenho no CAD, contas numa planilha e o texto final num editor. Cada passagem de um programa para outro é uma chance de erro e de retrabalho.",
      "Nas últimas semanas reconstruímos a plataforma em torno de uma ideia simples: o imóvel aparece na tela, você aponta os danos em cima dele, e o resto — medidas, custo, prioridade e laudo — sai sozinho. Junto com essa mudança, o produto ganhou um novo nome: ArchRay.",
    ],
    sections: [
      {
        id: "novo-nome",
        title: "Um novo nome para um novo foco",
        blocks: [
          { p: "O Oraclo nasceu como uma plataforma de levantamento 3D e modelagem BIM. Ao longo dos testes ficou claro que o valor estava em outro lugar: no diagnóstico. Quem trabalha com restauro, retrofit e inspeção predial precisa saber o que está danificado, quanto custa tratar e o que fazer primeiro — e precisa disso num documento que o cliente entenda." },
          { p: "ArchRay junta arquitetura (arch) e o olhar que atravessa a superfície (ray). O endereço e a sua conta continuam os mesmos; nada precisa ser refeito." },
          { callout: "O ArchRay é uma central visual de diagnóstico de edificações existentes: você aponta, a plataforma mede, orça, prioriza e documenta." },
        ],
      },
      {
        id: "fachada-retificada",
        title: "Fachada em escala a partir de uma foto comum",
        blocks: [
          { p: "A nova vista Fachada transforma uma foto tirada com o celular numa imagem plana e em escala. Você arrasta quatro pontos até os cantos de um retângulo real da parede — a fachada inteira, uma janela grande, um painel — e informa a largura e a altura medidas com trena. A correção de perspectiva acontece no próprio navegador, sem enviar nada para processamento e sem custo." },
          { p: "Além da fachada retificada, há mais dois tipos de vista:" },
          {
            list: [
              "Planta: plantas, cortes e elevações em imagem, calibrados no editor por uma cota conhecida.",
              "Imagem em escala: ortofotos prontas de drone, fotogrametria ou laser, com o mm por pixel informado no envio.",
            ],
          },
          { p: "Cada vista pertence a uma vistoria (a visita numa data) e, opcionalmente, a uma área do imóvel, o que permite voltar ao mesmo edifício meses depois e comparar." },
        ],
      },
      {
        id: "orcamento",
        title: "Orçamento automático do tratamento",
        blocks: [
          { p: "A antiga biblioteca de danos virou Danos e preços. Cada tipo de dano tem agora um tratamento recomendado e um preço unitário, editável pelo escritório. A unidade segue a forma do dano: áreas são cobradas por m², linhas (como fissuras) por metro e pontos por unidade." },
          { p: "No editor, o custo de cada dano e o orçamento da vista aparecem em tempo real enquanto você desenha. Os valores que vêm de fábrica são marcados como sugeridos e servem só como ponto de partida — ajuste para a sua região e o seu método." },
          {
            table: {
              head: ["Forma do dano", "Quantidade medida", "Unidade de preço"],
              rows: [
                ["Área", "m² da região desenhada", "R$/m²"],
                ["Linha", "comprimento em metros", "R$/m"],
                ["Ponto", "número de ocorrências", "R$/un"],
              ],
              caption: "O orçamento é a quantidade medida multiplicada pelo preço unitário do tratamento.",
            },
          },
        ],
      },
      {
        id: "gut",
        title: "Prioridade pela matriz GUT",
        blocks: [
          { p: "Cada dano recebe, além da gravidade, uma nota de urgência e de tendência. O produto das três (de 1 a 125) define a prioridade, com faixas fixas para que dois técnicos cheguem à mesma conclusão:" },
          {
            table: {
              head: ["GUT", "Prioridade"],
              rows: [
                ["64 a 125", "Imediata"],
                ["27 a 63", "Curto prazo"],
                ["12 a 26", "Médio prazo"],
                ["1 a 11", "Monitorar"],
              ],
            },
          },
          { p: "A gravidade vale de 2 (baixa) a 5 (crítica); urgência e tendência vão de 1 a 5." },
        ],
      },
      {
        id: "painel",
        title: "Um painel para cada projeto",
        blocks: [
          { p: "A página do projeto virou um painel de diagnóstico. No topo, os indicadores: número de danos, área afetada, extensão de fissuras, orçamento total e quantos danos têm prioridade imediata. Abaixo, as vistas em miniatura, gráficos de custo por tipo de dano, de prioridade e de gravidade, o custo por área do imóvel e a lista de prioridades — cada linha abre o dano direto na vista." },
          { p: "Um filtro por vistoria mostra os números de uma visita específica, e o botão Gerar laudo produz o documento daquela seleção." },
        ],
      },
      {
        id: "laudo",
        title: "Laudo de estado de conservação em PDF",
        blocks: [
          { p: "O laudo sai pronto, em A4, para entregar ao cliente:" },
          {
            list: [
              "Capa com os indicadores principais.",
              "Identificação do imóvel e metodologia.",
              "Resumo do diagnóstico e distribuição por prioridade.",
              "Cada vista com os danos desenhados e a legenda.",
              "Tabela de danos ordenada pela GUT, com causa e recomendação.",
              "Orçamento por tratamento e espaço para assinatura do responsável técnico.",
            ],
          },
          { p: "As pranchas A3 em PDF e a exportação DXF para o CAD continuam disponíveis em cada vista." },
        ],
      },
      {
        id: "area-de-trabalho",
        title: "Uma área de trabalho mais limpa",
        blocks: [
          { p: "No editor do mapa de danos, a biblioteca de danos e o painel de orçamento agora são recolhíveis, como a barra lateral. Com tudo recolhido, a imagem ocupa a tela inteira; um clique traz cada painel de volta, e o editor lembra da sua escolha." },
          { p: "Também simplificamos a navegação: Projetos, Mapas de danos, Danos e preços e Equipe. Saíram as telas ligadas ao antigo fluxo de BIM e fotogrametria, que não faziam mais parte do produto." },
        ],
      },
      {
        id: "campo",
        title: "Fotos de campo e modelos 3D",
        blocks: [
          { p: "Em cada vistoria você registra as fotos de detalhe pelo celular. Elas ficam guardadas no aparelho e sobem em segundo plano: se o sinal cair no meio da visita, o envio continua quando a conexão voltar. Quem já tem um modelo 3D (de um app gratuito de celular, de drone ou de laser) pode importá-lo e gerar vistas em escala de cada parede." },
        ],
      },
      {
        id: "proximos-passos",
        title: "O que vem a seguir",
        blocks: [
          { p: "A próxima etapa é a inteligência artificial no desenho: clicar sobre uma mancha e receber o contorno pronto, rodando no próprio navegador. Depois vêm sugestões de fissuras, comparação entre vistorias e tipos de dano personalizados por escritório." },
          { p: "Se algo não funcionar como você espera, ou se faltar alguma coisa no seu fluxo, use o botão Ajuda dentro da plataforma." },
        ],
      },
    ],
    author: "Equipe ArchRay",
    notes: [
      "Os preços sugeridos de fábrica são estimativas para começar a usar a plataforma, não uma tabela de referência. Revise-os em Danos e preços antes de enviar orçamentos a clientes.",
      "A retificação por quatro pontos corrige o plano da parede. Marquises, beirais e outros elementos salientes podem aparecer levemente deslocados.",
    ],
  },
];

export const latestPost = POSTS[0];

export const getPost = (slug: string) => POSTS.find((p) => p.slug === slug);

export const fmtPostDate = (iso: string, style: "long" | "short" = "long") =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: style === "long" ? "long" : "short",
    year: "numeric",
  });
