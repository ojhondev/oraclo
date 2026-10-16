/**
 * Documentação do ArchRay (página /docs): o fluxo inteiro em etapas, em linguagem simples,
 * com prints reais das telas (public/docs, gerados do projeto de demonstração).
 */

export type DocShot = { src: string; alt: string; caption: string };
export type DocStep = {
  id: string;
  title: string;
  /** Uma frase: para que serve esta etapa. */
  lead: string;
  /** O que fazer, em ordem. */
  steps: string[];
  shot?: DocShot;
  tips?: string[];
  /** Problemas comuns e como resolver. */
  issues?: { q: string; a: string }[];
};

export const DOC_FLOW = ["Projeto", "Vistoria", "Vista em escala", "Danos", "Prioridade", "Orçamento", "Laudo"];

export const DOC_STEPS: DocStep[] = [
  {
    id: "conta",
    title: "Crie a conta e entre",
    lead: "Cada escritório tem a sua organização no ArchRay. Quem cria a conta vira administrador e depois convida a equipe.",
    steps: [
      "Clique em Começar grátis (ou Criar conta) no topo do site.",
      "Informe seu nome, o nome do escritório, o e-mail e uma senha.",
      "Pronto: você cai na tela inicial, com a busca de projetos e o atalho para a demonstração guiada.",
    ],
    shot: { src: "/docs/01-inicio.jpg", alt: "Tela inicial do ArchRay com a busca de projetos e o cartão da demonstração guiada", caption: "Tela inicial: busque um projeto, crie um novo ou comece a demonstração guiada." },
    tips: ["Foi convidado por alguém? Use o link do convite: a conta já entra na organização certa.", "Esqueceu a senha? Use Esqueci minha senha na tela de entrada."],
  },
  {
    id: "projeto",
    title: "Cadastre o projeto (o imóvel)",
    lead: "Projeto é o imóvel: uma casa, um prédio, uma igreja, um galpão. Tudo o que você fizer fica guardado dentro dele.",
    steps: [
      "Clique em Novo, no menu à esquerda.",
      "Preencha o nome, o tipo de imóvel e o endereço. Proteção (tombamento) e época são opcionais.",
      "Salve e cadastre as áreas: as partes do imóvel, como Fachada principal, Térreo ou Cobertura. Há atalhos com as áreas típicas.",
    ],
    shot: { src: "/docs/02-novo-projeto.jpg", alt: "Formulário de novo projeto", caption: "Novo projeto: nome, tipo e endereço bastam para começar." },
    tips: ["Áreas ajudam a organizar o orçamento: o painel mostra o custo de cada área separadamente."],
  },
  {
    id: "painel",
    title: "Entenda o painel do projeto e as vistorias",
    lead: "O painel é a página do imóvel. Ele junta os números de todas as vistas e é de onde você cria vistas e gera o laudo.",
    steps: [
      "No topo: Editar ficha, Nova vista e Gerar laudo.",
      "Os cartões mostram danos apontados, área afetada, fissuras, orçamento e quantos danos têm prioridade imediata.",
      "Em Vistorias, crie uma vistoria para cada visita ao imóvel (ex.: Vistoria inicial). Ela agrupa as vistas, os danos e as fotos daquela data.",
    ],
    shot: { src: "/docs/03-painel.jpg", alt: "Painel do projeto com indicadores, vistas e vistorias", caption: "Painel do projeto: indicadores no topo, vistas à esquerda, vistorias à direita." },
    tips: ["Use o filtro de vistoria (Todas / nome da vistoria) para ver os números de uma visita só — e gerar o laudo dela."],
  },
  {
    id: "retificar",
    title: "Transforme uma foto da fachada em vista em escala",
    lead: "Uma foto comum tem perspectiva: nada pode ser medido nela. Retificar é corrigir a perspectiva e colocar a imagem em escala, para que cada pixel valha uma medida real.",
    steps: [
      "Fotografe a fachada o mais de frente possível, com a parede inteira no quadro.",
      "No painel do projeto, clique em Nova vista e escolha Fachada (foto retificada).",
      "Escolha a foto. Arraste os 4 pontos brancos até os 4 cantos de um retângulo real da parede: a fachada inteira, uma janela grande ou um painel.",
      "Meça com trena a largura e a altura desse mesmo retângulo e digite os valores em metros.",
      "Use a lupa (aparece ao arrastar um ponto) e as setas do teclado para o ajuste fino: cada ponto no canto exato.",
      "Para laudos, ative a precisão profissional: marque uma medida de conferência (uma porta medida com trena) e 2 ou 3 linhas retas (cornija, prumada) para corrigir a lente. O painel mostra o erro real em cm e a precisão estimada.",
      "Confira a prévia. Escolha Só o retângulo ou Parede inteira (a vista se estende além do retângulo; ajuste as margens).",
      "Clique em Retificar e abrir no editor. A imagem sai plana, em escala, e já abre pronta para apontar danos.",
    ],
    shot: { src: "/docs/04-retificar.jpg", alt: "Tela de retificação com os quatro cantos marcados sobre a foto da igreja", caption: "Cantos sobre a fachada, linha reta para a lente (azul), medida de conferência (amarela) e a precisão estimada." },
    tips: [
      "A precisão estimada (com 95% de confiança) fica guardada na vista e sai no laudo. Com uma medida de conferência ela deixa de ser estimativa e passa a ser medida.",
      "Pontos de controle extras (5 ou mais no total) fazem o ajuste por mínimos quadrados e mostram o erro de cada ponto — útil em fachadas longas.",
      "Quanto mais de frente a foto, melhor o resultado. Fotos muito inclinadas perdem detalhe no lado mais distante.",
      "Tem planta, corte ou uma ortofoto pronta (drone, fotogrametria)? Use Planta baixa ou Imagem em escala em vez de Fachada.",
    ],
    issues: [
      { q: "A imagem saiu torta ou esticada.", a: "Algum ponto ficou fora do canto real, ou largura e altura foram trocadas. Volte, ajuste os pontos e confira as medidas." },
      { q: "Marquises e beirais aparecem deslocados.", a: "É esperado: a correção vale para o plano da parede. Elementos salientes ficam um pouco fora do lugar." },
    ],
  },
  {
    id: "danos",
    title: "Aponte os danos na vista",
    lead: "Cada dano é desenhado sobre a imagem como área, linha ou ponto. As medidas saem sozinhas, em m², metros ou unidades.",
    steps: [
      "Na Biblioteca de danos, à esquerda, escolha o tipo: fissura, umidade, perda de reboco, sujidade, vegetação…",
      "Áreas e linhas: clique para marcar os pontos ao redor do dano. Duplo clique ou Enter conclui; Backspace desfaz o último ponto; Esc cancela.",
      "Pontos (como vegetação ou excrementos): um clique marca cada ocorrência.",
      "Clique num dano para editar o tipo, a gravidade, a causa e a recomendação, ou arraste os vértices brancos para ajustar o desenho.",
    ],
    shot: { src: "/docs/05-editor.jpg", alt: "Editor do mapa de danos com a biblioteca, a fachada e o painel de orçamento", caption: "Editor: biblioteca à esquerda, a vista no centro, quantitativos e orçamento à direita." },
    tips: [
      "Roda do mouse dá zoom; arrastar com o botão esquerdo (ou espaço + arrastar) move a imagem.",
      "Os botões no topo recolhem a biblioteca e o painel de orçamento, para a imagem ocupar a tela toda.",
    ],
  },
  {
    id: "contorno-ia",
    title: "Contorne manchas com a IA",
    lead: "O Contorno IA desenha o dano por você com um clique. Ele roda no seu navegador: nada é enviado para fora e não há custo.",
    steps: [
      "Escolha um dano de área na biblioteca e clique na varinha (Contorno IA), na barra sobre a imagem.",
      "Modo Mancha: segue a cor — ideal para umidade, sujidade, biodeterioração e pintura descascada. Modo Elemento: usa a IA de recorte — ideal para danos com borda nítida, como lacunas, perda de reboco e vidros.",
      "Clique sobre o dano. Clique de novo para incluir mais partes; Shift + clique exclui o que não é dano.",
      "No modo Mancha, ajuste a tolerância (ou use as teclas − e +) até o contorno ficar justo. Clique em Salvar dano (ou Enter).",
    ],
    shot: { src: "/docs/07-contorno-ia.jpg", alt: "Contorno IA no modo Mancha contornando a pintura descascada", caption: "Modo Mancha: um clique na pintura descascada e o contorno sai pronto; a tolerância ajusta o alcance." },
    tips: ["Aproxime o zoom antes de clicar: a IA analisa a parte visível da imagem, então mais zoom = mais detalhe.", "Na primeira vez, o modo Elemento baixa o modelo de IA (alguns MB). Depois fica guardado no navegador."],
  },
  {
    id: "gut",
    title: "Defina a prioridade (matriz GUT)",
    lead: "Nem tudo precisa ser tratado agora. A matriz GUT multiplica Gravidade × Urgência × Tendência e diz o que vem primeiro.",
    steps: [
      "Clique num dano (na imagem ou na lista à direita).",
      "Escolha a Gravidade (baixa a crítica), a Urgência (1 a 5) e a Tendência (1 a 5).",
      "O ArchRay calcula a nota de 1 a 125 e a faixa: de 64 para cima é prioridade 1 (imediata); de 27 a 63, curto prazo; de 12 a 26, médio prazo; abaixo de 12, monitorar.",
    ],
    shot: { src: "/docs/06-dano-gut.jpg", alt: "Painel de um dano com gravidade, urgência, tendência, GUT e custo", caption: "Dano selecionado: GUT 64 = prioridade 1, com o custo do tratamento logo abaixo." },
    tips: ["A lista de prioridades do painel do projeto e a tabela do laudo seguem a nota GUT, da maior para a menor."],
  },
  {
    id: "orcamento",
    title: "Ajuste a tabela de preços e leia o orçamento",
    lead: "Cada tipo de dano tem um tratamento e um preço. O orçamento é a quantidade medida × o preço — automático, enquanto você desenha.",
    steps: [
      "Abra Danos e preços, no menu.",
      "Para cada tipo de dano, confira o tratamento, o valor e a unidade (m² para áreas, metro para linhas, unidade para pontos).",
      "Altere o que for preciso e salve. A tabela vale para todos os projetos do escritório.",
    ],
    shot: { src: "/docs/08-precos.jpg", alt: "Tabela de danos e preços do escritório", caption: "Danos e preços: tratamento, valor e unidade de cada tipo de dano." },
    tips: ["Os valores marcados como sugeridos são só um ponto de partida. Revise-os antes de mandar um orçamento a um cliente."],
  },
  {
    id: "laudo",
    title: "Gere o laudo, a prancha e o DXF",
    lead: "Com os danos apontados, os documentos saem prontos — sem montar nada no editor de texto ou no CAD.",
    steps: [
      "Laudo: no painel do projeto, clique em Gerar laudo. O PDF (A4) traz capa, identificação, metodologia, cada vista com os danos, a tabela por prioridade GUT, o orçamento e o espaço para assinatura.",
      "Prancha PDF (A3): no editor, clique em Prancha PDF — a vista com hachuras, legenda, quantitativos, escala gráfica e carimbo.",
      "DXF: no editor, clique em DXF. Vem em metros, uma camada por tipo de dano, com a imagem de fundo (mantenha os arquivos do ZIP na mesma pasta).",
    ],
    shot: { src: "/docs/11-painel-acoes.jpg", alt: "Botões Editar ficha, Nova vista e Gerar laudo", caption: "Gerar laudo fica no topo do painel do projeto." },
    tips: ["Cadastre seu registro CAU ou CREA em Meu perfil para ele sair no laudo e no carimbo das pranchas."],
  },
  {
    id: "campo",
    title: "Tire as fotos de campo pelo celular",
    lead: "Na visita, a equipe registra as fotos de detalhe pelo celular, dentro da vistoria. Funciona até sem sinal.",
    steps: [
      "Abra o projeto no celular e, na vistoria, toque em Fotos com o celular (ou Enviar fotos para escolher da galeria).",
      "Fotografe os detalhes dos danos e as paredes de frente — essas podem virar vistas retificadas depois.",
      "As fotos ficam guardadas no aparelho e sobem em segundo plano. Se o sinal cair, o envio continua quando ele voltar.",
    ],
    tips: ["No iPhone, mantenha a página aberta e a tela ligada até tudo ser enviado.", "A câmera avisa quando a foto ficou tremida."],
  },
  {
    id: "equipe",
    title: "Convide a equipe",
    lead: "Cada pessoa entra com o papel certo, e só o administrador mexe na equipe.",
    steps: [
      "Abra Equipe, no menu, e convide por e-mail.",
      "Escolha o papel: Administrador (tudo), Técnico (cria projetos, aponta danos, edita preços e gera laudos), Equipe de campo (só envia fotos) ou Leitor (só vê e baixa).",
      "A pessoa recebe o link do convite e cria a própria senha.",
    ],
    shot: { src: "/docs/09-equipe.jpg", alt: "Tela de equipe com convites e papéis", caption: "Equipe: convites, papéis e acessos." },
  },
  {
    id: "demonstracao",
    title: "Pratique com a demonstração guiada",
    lead: "A melhor forma de aprender é fazendo. A demonstração guiada leva você pelo fluxo inteiro num caso real — a Igreja do Carmo, na Horta (Açores) — em 10 missões.",
    steps: [
      "Na tela inicial do app, clique em Aprenda na prática: demonstração guiada (ou em Ajuda › Demonstração guiada).",
      "O ArchRay cria um projeto de demonstração com a foto real de 2010. Um painel mostra a missão atual e destaca o botão certo em cada tela.",
      "Cada missão só conta quando você faz a ação de verdade: retificar, apontar danos, usar a IA, ajustar a GUT, ver os preços e gerar o laudo. Cada uma vale XP.",
      "No fim, clique em Refazer do zero: tudo o que foi feito na demonstração é apagado e você recomeça da missão 1 — quantas vezes quiser.",
    ],
    shot: { src: "/docs/10-missoes.jpg", alt: "Painel de missões da demonstração guiada sobre o editor", caption: "Missão 5 de 10: o painel explica o que fazer e destaca a varinha do Contorno IA." },
    tips: ["A demonstração não mexe nos seus outros projetos. Pode sair a qualquer momento (o X do painel) e voltar depois."],
  },
];

export const DOC_GLOSSARY: { term: string; def: string }[] = [
  { term: "Projeto", def: "O imóvel: casa, prédio, igreja, galpão." },
  { term: "Área", def: "Uma parte do imóvel: fachada norte, térreo, cobertura, nave…" },
  { term: "Vistoria", def: "Uma visita ao imóvel numa data. Agrupa as vistas, os danos e as fotos daquele dia." },
  { term: "Vista", def: "A imagem em escala onde os danos são apontados: fachada retificada, planta ou imagem em escala." },
  { term: "Retificar", def: "Corrigir a perspectiva de uma foto e colocá-la em escala real." },
  { term: "mm/pixel", def: "A escala da vista: quantos milímetros reais cada pixel da imagem representa." },
  { term: "Matriz GUT", def: "Gravidade × Urgência × Tendência, de 1 a 125. Define a prioridade de cada dano." },
  { term: "Prancha", def: "A folha A3 em PDF com a vista, os danos hachurados, a legenda e o carimbo." },
  { term: "DXF", def: "Arquivo de desenho para AutoCAD e outros programas de CAD." },
];

export const DOC_FAQ: { q: string; a: string }[] = [
  { q: "Preciso instalar alguma coisa?", a: "Não. O ArchRay roda no navegador, no computador e no celular — inclusive a IA de contorno." },
  { q: "Preciso de drone ou laser?", a: "Não. Uma foto de celular e uma trena bastam para a fachada retificada. Se você já tem ortofoto ou modelo 3D, também dá para usar." },
  { q: "As medidas são confiáveis?", a: "Elas dependem da foto e da medida de trena usada na retificação. Para orçamento, confira uma medida conhecida no editor (botão de escala) antes de enviar ao cliente." },
  { q: "Os preços sugeridos são uma tabela oficial?", a: "Não. São valores de partida para você começar. Ajuste em Danos e preços para a sua região e o seu método." },
  { q: "Meus dados ficam visíveis para outros escritórios?", a: "Não. Cada organização só acessa os próprios projetos." },
];
