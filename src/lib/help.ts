/**
 * Conteúdo da central de ajuda (painel do botão "Ajuda"). Cada tópico tem blocos de
 * texto, passos e dicas; `routes` diz em quais telas ele aparece como sugestão.
 */

export type HelpBlock = { p: string } | { steps: string[] } | { list: string[] } | { tip: string };
export type HelpTopic = { id: string; category: string; title: string; summary: string; routes?: RegExp[]; blocks: HelpBlock[] };

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "por-que",
    category: "Começar",
    title: "Por que usar o ArchRay",
    summary: "Do dano apontado ao orçamento e ao laudo.",
    routes: [/^\/$/],
    blocks: [
      { p: "Montar um mapa de danos com quantitativos, orçamento e laudo costuma levar dias entre fotos, CAD, planilha e editor de texto. No ArchRay tudo acontece sobre a imagem do imóvel:" },
      {
        list: [
          "Foto comum da fachada vira imagem plana e em escala (4 cliques nos cantos + as medidas reais).",
          "Você aponta os danos como pontos, linhas ou áreas — m² e metros saem sozinhos.",
          "Cada dano tem preço de tratamento: o orçamento é automático.",
          "Gravidade, urgência e tendência (GUT) definem a prioridade de cada dano.",
          "Laudo em PDF, prancha A3 e DXF prontos para o cliente e para o CAD.",
        ],
      },
      { tip: "Tudo fica organizado por projeto, área e vistoria — dá para voltar ao imóvel e comparar." },
    ],
  },
  {
    id: "primeiros-passos",
    category: "Começar",
    title: "Primeiros passos",
    summary: "Do cadastro do imóvel ao laudo.",
    routes: [/^\/$/, /^\/bens\/[^/]+$/],
    blocks: [
      {
        steps: [
          "Crie o projeto em Novo (nome, tipo, endereço) e cadastre as áreas — há atalhos com as áreas típicas.",
          "Crie a vistoria (ex.: Vistoria inicial) com a data da visita.",
          "Em Nova vista, fotografe a fachada e retifique: marque os 4 cantos e informe largura e altura reais.",
          "Aponte os danos na vista; ajuste gravidade, urgência e tendência de cada um.",
          "No painel do projeto, confira indicadores, custos e prioridades e toque em Gerar laudo.",
        ],
      },
    ],
  },
  {
    id: "cadastrar-projeto",
    category: "Projetos",
    title: "Projetos, áreas e vistorias",
    summary: "Como os dados se organizam.",
    routes: [/^\/bens\/novo/, /^\/bens\/[^/]+$/],
    blocks: [
      { list: ["Projeto: o imóvel (casa, prédio, igreja, galpão).", "Área: uma parte dele (fachada norte, térreo, cobertura…).", "Vistoria: uma visita numa data. Agrupa as vistas, os danos e as fotos de campo daquele dia.", "Vista: a imagem em escala onde os danos são apontados."] },
      { tip: "Use o filtro de vistoria no painel do projeto para ver indicadores e gerar o laudo de uma visita específica." },
    ],
  },
  {
    id: "painel",
    category: "Projetos",
    title: "O painel do projeto",
    summary: "Indicadores, custos e prioridades num lugar só.",
    routes: [/^\/bens\/[^/]+$/],
    blocks: [
      { list: ["Indicadores: danos, área afetada, extensão de fissuras, orçamento e quantos danos são de prioridade imediata.", "Gráficos: custo por tipo de dano, prioridade GUT, gravidade e custo por área.", "Lista de prioridades: os danos com GUT mais alto primeiro — clique para abrir o dano na vista."] },
    ],
  },
  {
    id: "foto-retificada",
    category: "Vistas",
    title: "Fachada a partir de uma foto",
    summary: "Corrigir a perspectiva e colocar em escala.",
    routes: [/\/ortofotos\/nova/, /^\/bens\/[^/]+$/],
    blocks: [
      {
        steps: [
          "Fotografe a parede o mais de frente possível, com ela inteira no quadro.",
          "Em Nova vista › Fachada, escolha a foto.",
          "Arraste os 4 pontos até os cantos de um retângulo real da parede (a fachada inteira, uma janela grande, um painel).",
          "Informe a largura e a altura reais desse retângulo, medidas com trena ou trena a laser.",
          "Use a lupa (aparece ao arrastar) e as setas do teclado para colocar cada ponto exatamente no canto.",
          "Confira a prévia. Em Parede inteira, a vista se estende além do retângulo — ajuste as margens.",
          "Retificar: a imagem sai plana, em escala, e abre no editor.",
        ],
      },
      { p: "Precisão profissional (recomendado para laudos): em Conferência, marque uma medida conhecida (uma porta) e informe a trena — o erro real aparece em cm. Em Linha reta, marque 2 ou 3 arestas retas para corrigir a distorção da lente. Em Ponto de controle, acrescente pontos medidos: com 5 ou mais, o ajuste é por mínimos quadrados e mostra o erro de cada ponto." },
      { tip: "A precisão estimada (95%) vai para o editor e para o laudo. Sem conferência ela é só uma estimativa da marcação — com conferência, é medida." },
      { tip: "A correção vale para o plano da parede. Marquises, beirais e elementos salientes ficam levemente deslocados." },
    ],
  },
  {
    id: "outras-vistas",
    category: "Vistas",
    title: "Plantas e imagens em escala",
    summary: "Usar planta, ortofoto de drone ou de outro software.",
    routes: [/\/ortofotos\/nova/],
    blocks: [
      { p: "Em Nova vista › Planta baixa, envie a planta, corte ou elevação como imagem (JPG/PNG) e calibre no editor por uma cota conhecida. Em Imagem em escala, envie uma ortofoto pronta de drone, fotogrametria ou laser, informando o mm por pixel se souber." },
    ],
  },
  {
    id: "mapa-danos",
    category: "Mapa de danos",
    title: "Apontar danos",
    summary: "Áreas, linhas e pontos sobre a vista.",
    routes: [/\/ortofotos\/[^n]/, /^\/mapas/],
    blocks: [
      {
        steps: [
          "Escolha o tipo na biblioteca, à esquerda (fissura, umidade, perda de reboco…).",
          "Áreas e linhas: clique para marcar os pontos; duplo clique ou Enter para concluir; Backspace desfaz; Esc cancela.",
          "Pontos: um clique marca.",
          "Clique num dano para ajustar tipo, gravidade, urgência, tendência, causa e recomendação, ou arraste os vértices.",
        ],
      },
      { tip: "O custo do dano e o orçamento da vista aparecem à direita em tempo real." },
    ],
  },
  {
    id: "gut",
    category: "Mapa de danos",
    title: "Prioridade GUT",
    summary: "Gravidade × Urgência × Tendência.",
    routes: [/\/ortofotos\/[^n]/, /^\/bens\/[^/]+$/],
    blocks: [
      { p: "A gravidade vale de 2 (baixa) a 5 (crítica); urgência e tendência vão de 1 a 5. O produto (1 a 125) define a prioridade: a partir de 64 é imediata, de 27 a 63 curto prazo, de 12 a 26 médio prazo e abaixo de 12 monitorar." },
    ],
  },
  {
    id: "escala",
    category: "Mapa de danos",
    title: "Escala e calibração",
    summary: "Sem escala não há áreas, comprimentos nem custo.",
    routes: [/\/ortofotos\/[^n]/],
    blocks: [
      { p: "Fachadas retificadas já vêm em escala. Para plantas e imagens enviadas de fora, use o botão de escala: desenhe uma linha sobre uma medida conhecida (uma porta, uma cota) e informe a distância real, ou digite o mm por pixel. Todas as áreas e custos são recalculados." },
    ],
  },
  {
    id: "precos",
    category: "Orçamento",
    title: "Tabela de preços e orçamento",
    summary: "Cada tipo de dano com seu tratamento e preço.",
    routes: [/^\/biblioteca/, /\/ortofotos\/[^n]/],
    blocks: [
      { p: "Em Danos e preços, cada tipo de dano tem um tratamento e um preço unitário: por m² (áreas), por metro (linhas) ou por unidade (pontos). O orçamento é a quantidade medida × esse preço." },
      { tip: "Os valores marcados como sugeridos são só um ponto de partida. Ajuste para a sua realidade — vale para todos os projetos do escritório." },
    ],
  },
  {
    id: "laudo",
    category: "Orçamento",
    title: "Laudo de estado de conservação",
    summary: "O PDF para o cliente, pronto.",
    routes: [/^\/bens\/[^/]+$/],
    blocks: [
      { list: ["Capa com os indicadores, identificação do imóvel e metodologia.", "Resumo do diagnóstico e distribuição por prioridade.", "Cada vista com os danos desenhados e a legenda.", "Tabela de danos por prioridade GUT, com causa e recomendação.", "Orçamento por tratamento e espaço para assinatura do responsável técnico."] },
      { tip: "Cadastre seu registro CAU/CREA em Meu perfil para ele sair no laudo e nas pranchas." },
    ],
  },
  {
    id: "exportar",
    category: "Mapa de danos",
    title: "Exportar prancha PDF e DXF",
    summary: "Para o cliente e para o AutoCAD.",
    routes: [/\/ortofotos\/[^n]/, /^\/mapas/],
    blocks: [
      { list: ["Prancha PDF (A3): a vista com os danos, legenda, quantitativos, escala gráfica e carimbo com o projeto e o responsável técnico.", "DXF (ZIP): desenho em metros, uma camada por tipo de dano com hachuras, rótulos e a imagem de fundo. Mantenha os arquivos do ZIP na mesma pasta."] },
    ],
  },
  {
    id: "fotos-campo",
    category: "Vistoria",
    title: "Fotos de campo pelo celular",
    summary: "Registrar detalhes, mesmo sem sinal.",
    routes: [/\/capturas\//, /^\/bens\/[^/]+$/],
    blocks: [
      { p: "Em cada vistoria, use Capturar com celular ou Enviar fotos para guardar as fotos de detalhe. Elas ficam no aparelho e sobem em segundo plano: se o sinal cair, o envio continua de onde parou." },
      { tip: "No iPhone o envio pausa com a tela apagada ou em outro app. Mantenha a página aberta até tudo ser enviado." },
    ],
  },
  {
    id: "modelo-3d",
    category: "Vistas",
    title: "Modelo 3D (opcional)",
    summary: "Gerar vistas a partir de um modelo pronto.",
    routes: [/\/modelos\//],
    blocks: [
      { p: "Se você já tem um modelo 3D (de um app gratuito de celular como o Scaniverse, de drone ou de laser), importe-o pela vistoria. No visualizador dá para medir e gerar uma vista em escala de cada parede em três cliques." },
    ],
  },
  {
    id: "equipe",
    category: "Conta",
    title: "Equipe e papéis",
    summary: "Convidar pessoas e definir o que cada uma pode fazer.",
    routes: [/^\/equipe/],
    blocks: [
      { list: ["Administrador: tudo, inclusive equipe e excluir projetos.", "Técnico: cria projetos e vistas, aponta danos, edita preços e gera laudos.", "Equipe de campo: só envia fotos de campo.", "Leitor: só visualiza e baixa."] },
      { p: "Em Equipe, o administrador convida por e-mail, troca papéis, desativa acessos e gera link de nova senha." },
    ],
  },
  {
    id: "senha",
    category: "Conta",
    title: "Perfil, senha e aparência",
    summary: "Nome e registro no carimbo, senha e tema.",
    routes: [/^\/perfil/],
    blocks: [
      { p: "Em Meu perfil você ajusta o nome e o registro profissional (vão para o laudo e o carimbo) e troca a senha. Esqueceu a senha? Use Esqueci minha senha na tela de entrada ou peça um link ao administrador." },
      { p: "O tema claro, escuro ou do sistema fica em Aparência, no menu do seu nome." },
    ],
  },
];

export function suggestedTopics(pathname: string) {
  return HELP_TOPICS.filter((t) => t.routes?.some((r) => r.test(pathname))).slice(0, 3);
}
