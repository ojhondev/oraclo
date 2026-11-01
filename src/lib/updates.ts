/**
 * Index: publicações sobre o ArchRay (novidades da plataforma). O post mais recente
 * também alimenta o banner de atualizações dentro do app.
 */

import { locale, type Lang } from "./site/lang";
import { POSTS_EN } from "./updates-en";

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
    slug: "comparar-vistorias",
    title: "Comparar vistorias: o mesmo imóvel, duas datas",
    summary:
      "Coloque a mesma fachada em duas vistorias lado a lado, alinhadas mesmo com fotos de ângulos diferentes, e veja o que surgiu, cresceu ou não aparece mais.",
    date: "2026-11-01",
    category: "Produto",
    banner: "Novo: compare duas vistorias do mesmo imóvel e veja o que mudou.",
    intro: [
      "Um mapa de danos conta como o imóvel está hoje. Para saber se ele está piorando, se a intervenção funcionou ou o que priorizar na próxima obra, é preciso comparar com a vistoria anterior. Até agora isso era feito no olho, com duas fotos abertas lado a lado.",
      "A nova tela Comparar vistorias coloca as duas datas no mesmo referencial e faz a conta: quais danos são novos, quais cresceram, quais diminuíram e quais não aparecem mais.",
    ],
    sections: [
      {
        id: "alinhar",
        title: "Alinhar fotos tiradas de jeitos diferentes",
        blocks: [
          { p: "Duas vistorias raramente têm a foto do mesmo ponto, com a mesma lente e a mesma luz. Por isso a comparação começa pelo alinhamento: você marca o mesmo ponto nas duas imagens (o canto de uma janela, de uma porta, de uma cornija), pelo menos quatro vezes, e o ArchRay calcula a correção de perspectiva que leva a vista nova para cima da antiga." },
          { p: "Com cinco pares ou mais, cada ponto mostra o próprio erro. Um par marcado no lugar errado fica destacado e pode ser removido. O alinhamento fica salvo para as próximas consultas." },
          { callout: "Tudo roda no navegador. A deformação da imagem é feita pela própria tela, sem processamento em servidor e sem custo." },
        ],
      },
      {
        id: "ver",
        title: "Cortina e lado a lado",
        blocks: [
          {
            list: [
              "Cortina: as duas datas sobrepostas, com um divisor que você arrasta para revelar uma ou outra.",
              "Lado a lado: as duas vistas com o mesmo zoom e a mesma posição; mover uma move a outra.",
              "Os danos aparecem coloridos pelo que aconteceu com eles entre uma vistoria e outra.",
            ],
          },
        ],
      },
      {
        id: "o-que-mudou",
        title: "O que mudou, em números",
        blocks: [
          {
            table: {
              head: ["Situação", "Quando"],
              rows: [
                ["Novo", "O dano só aparece na vistoria depois"],
                ["Cresceu", "Ficou mais de 20% maior, ou agravou (uma fissura que virou trinca)"],
                ["Estável", "Está nas duas vistorias com tamanho parecido"],
                ["Diminuiu", "Ficou mais de 20% menor"],
                ["Não aparece", "Só está na vistoria antes: foi tratado, ou ficou escondido por sombra ou ângulo"],
              ],
            },
          },
          { p: "Os danos são casados pela posição e pela categoria, então umidade casa com umidade e fissura casa com trinca. O painel também mostra os quantitativos de cada tipo nas duas datas, só na área que aparece nas duas vistas." },
        ],
      },
      {
        id: "cuidados",
        title: "Cuidados",
        blocks: [
          { p: "A comparação mostra o que mudou no mapa de danos, e o mapa depende do que cada foto mostra. Luz, sombra, resolução e ângulo mudam o que é visível. Antes de afirmar que um dano foi tratado ou cresceu, confira na imagem." },
        ],
      },
    ],
    author: "Equipe ArchRay",
  },
  {
    slug: "deteccao-automatica-de-danos",
    title: "Detecção automática de danos: a IA sugere, você decide",
    summary:
      "Um clique e a IA percorre a fachada procurando fissuras, manchas, biodeterioração, perda de reboco e eflorescência. Cada sugestão é revisada por você, e cada dano passa a registrar de onde veio e quem validou.",
    date: "2026-11-01",
    category: "Produto",
    banner: "Novo: detecção automática de danos — a IA sugere, você aceita ou rejeita.",
    intro: [
      "Até aqui, a IA do ArchRay trabalhava a pedido: você clicava numa mancha e ela contornava. Agora ela também faz a primeira passada sozinha. Com um clique, percorre a vista inteira e devolve sugestões tracejadas sobre a imagem.",
      "O princípio não muda: a IA propõe, o profissional decide. Nenhuma sugestão entra no orçamento, nos quantitativos ou no laudo sem ser aceita por alguém da equipe.",
    ],
    sections: [
      {
        id: "como-usar",
        title: "Como usar",
        blocks: [
          { p: "No editor do mapa de danos, use o novo botão Detectar danos na barra de ferramentas sobre a imagem. A análise roda no seu navegador e leva alguns segundos. Ao terminar, as sugestões aparecem tracejadas e listadas no painel à direita, da mais confiável para a menos confiável." },
          {
            list: [
              "Clique numa sugestão para aproximar a imagem e ver o que o detector encontrou.",
              "Enter aceita como dano, Delete rejeita, e a próxima sugestão abre sozinha.",
              "Se a classe estiver errada (umidade em vez de sujidade, por exemplo), troque antes de aceitar.",
              "O controle de confiança mínima esconde as sugestões mais duvidosas.",
            ],
          },
          { callout: "Sugestão não é dano. Ela só vira dano depois que você aceita, e daí em diante funciona como qualquer outro: vértices editáveis, GUT, custo e laudo." },
        ],
      },
      {
        id: "o-que-detecta",
        title: "O que ela procura",
        blocks: [
          {
            table: {
              head: ["Dano", "O que o detector observa"],
              rows: [
                ["Fissura", "Linha fina mais escura que a parede dos dois lados; descarta juntas, frisos e fios retos"],
                ["Umidade e sujidade", "Mancha mosqueada mais escura que o reboco limpo; a posição e a cor indicam a classe"],
                ["Biodeterioração e vegetação", "Regiões esverdeadas destoando da parede; descarta portas e janelas pintadas"],
                ["Perda de reboco", "Alvenaria aparente, avermelhada em relação ao reboco"],
                ["Eflorescência", "Manchas claras e sem cor sobre a parede"],
              ],
              caption: "Vãos (janelas e portas) são reconhecidos e ficam de fora da análise.",
            },
          },
          { p: "Esta primeira versão usa visão computacional clássica e não um modelo treinado. Ela funciona melhor em fachadas retificadas de reboco claro e erra mais em materiais muito escuros, texturas fortes e sombras. Por isso cada sugestão mostra uma confiança, que é uma estimativa do detector e não uma precisão medida." },
        ],
      },
      {
        id: "rastreabilidade",
        title: "Cada dano sabe de onde veio",
        blocks: [
          { p: "Todo dano agora registra a origem (desenho manual, contorno IA ou detecção automática), a confiança da IA quando houver, quem validou e quando. Essa informação aparece no painel do dano e, no laudo, uma declaração automática informa quantos danos tiveram apoio da IA e que todos foram revisados pelo profissional responsável." },
          { p: "A autoria e a responsabilidade técnica continuam com quem assina o laudo. A IA mapeia o que é visível na imagem e não substitui ensaios, prospecções nem análise estrutural." },
        ],
      },
      {
        id: "custo-zero",
        title: "Sem custo e sem enviar imagens",
        blocks: [
          { p: "A detecção roda inteira no navegador, como a retificação e o contorno IA. As imagens não vão para nenhum serviço externo de IA, e não há cobrança por fachada processada." },
        ],
      },
      {
        id: "treinar",
        title: "Uma IA que aprende com o restauro",
        blocks: [
          { p: "Cada sugestão aceita, corrigida ou rejeitada é um exemplo do que é, e do que não é, dano em patrimônio brasileiro. Em Equipe há uma nova opção para autorizar o uso desses exemplos no treino da próxima versão da IA. Ela vem desligada e só vale com o sim de um administrador. O objetivo é treinar um modelo próprio de segmentação, afinado para materiais e argamassas locais, que continue rodando no navegador." },
        ],
      },
    ],
    author: "Equipe ArchRay",
    notes: [
      "A detecção automática é uma ferramenta de apoio. Revise cada sugestão antes de aceitar; o que for aceito entra no orçamento e no laudo.",
      "A autorização de treino pode ser revogada a qualquer momento em Equipe, e a partir daí os dados da organização deixam de entrar na base.",
    ],
  },
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

export const getPost = (slug: string, lang: Lang = "pt") => getPosts(lang).find((p) => p.slug === slug);

/** Publicações no idioma do site público (o app usa sempre o português). */
export const getPosts = (lang: Lang): Post[] => (lang === "en" ? POSTS_EN : POSTS);

export const fmtPostDate = (iso: string, style: "long" | "short" = "long", lang: Lang = "pt") =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(locale(lang), {
    day: "numeric",
    month: style === "long" ? "long" : "short",
    year: "numeric",
  });
