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
    title: "Por que usar o Oraclo",
    summary: "Da captura ao modelo BIM, num lugar só.",
    routes: [/^\/$/],
    blocks: [
      { p: "Levantar uma edificação para reforma, retrofit ou manutenção costuma exigir equipe com laser scanner, semanas de espera e muito retrabalho no CAD. O Oraclo encurta esse caminho:" },
      {
        list: [
          "Captura com o celular (fotos ou vídeo, guiada por roteiro), drone ou laser — ou com as fotos e nuvens que você já tem.",
          "Nuvem de pontos e modelo 3D com relatório de precisão: você sabe se o levantamento atende ao projeto.",
          "Modelo BIM em Revit (RVT), Archicad (PLN) ou IFC, modelado a partir da nuvem.",
          "No navegador: medir, gerar ortofotos em escala, desenhar mapas de danos e exportar PDF e DXF.",
        ],
      },
      { tip: "Tudo fica organizado por projeto, área e campanha — o histórico do levantamento não se perde." },
    ],
  },
  {
    id: "primeiros-passos",
    category: "Começar",
    title: "Primeiros passos",
    summary: "O fluxo completo, do projeto ao modelo.",
    routes: [/^\/$/],
    blocks: [
      {
        steps: [
          "Crie o projeto em Novo (nome, tipo, endereço).",
          "Cadastre as áreas — há atalhos com as áreas típicas de edificação, indústria/galpão e igreja/patrimônio.",
          "Crie uma campanha (ex.: Levantamento inicial) e escolha: Capturar com celular, Enviar fotos ou Importar modelo 3D.",
          "Depois do processamento, a nuvem de pontos e o modelo aparecem em Modelos 3D.",
          "Abra o modelo no navegador para medir, gerar ortofotos e baixar os arquivos.",
        ],
      },
    ],
  },
  {
    id: "pedido-bim",
    category: "Modelos BIM",
    title: "Pedir um modelo BIM",
    summary: "Da nuvem de pontos ao Revit, Archicad ou IFC.",
    routes: [/^\/bim/],
    blocks: [
      {
        steps: [
          "Em Modelos BIM (ou na página do projeto), toque em Solicitar modelo BIM.",
          "Escolha o projeto e a base: uma captura concluída ou uma nuvem importada.",
          "Informe a área em m², o nível de detalhe (LOD 200, 300 ou 350), as disciplinas e os formatos (RVT, PLN, IFC). A estimativa aparece na hora.",
          "A equipe confere a base e envia o orçamento final. Você aprova (ou recusa) na plataforma — nada é cobrado antes.",
          "Acompanhe a modelagem pelo status. Quando a versão chegar, baixe os arquivos e aceite — ou peça revisão dizendo o que ajustar.",
        ],
      },
      { tip: "LOD 200 (volumes, paredes, aberturas) funciona bem com captura por celular ou vídeo. Para LOD 300 em áreas grandes ou indústria, prefira nuvem de laser." },
    ],
  },
  {
    id: "operacao-bim",
    category: "Modelos BIM",
    title: "Operação: orçar, atribuir e entregar",
    summary: "Para a equipe Oraclo e parceiros modeladores.",
    routes: [/^\/operacao/],
    blocks: [
      { list: ["Operador: vê todos os pedidos, envia orçamento, atribui à equipe ou a um parceiro, confere e entrega.", "Parceiro: vê só os pedidos atribuídos (sem preços), baixa a base, muda o status e envia versões — que passam pela conferência da equipe antes de chegar ao cliente.", "Notas internas no histórico não aparecem para o cliente."] },
    ],
  },
  {
    id: "cadastrar-projeto",
    category: "Projetos",
    title: "Criar um projeto e suas áreas",
    summary: "Ficha do projeto e áreas (fachadas, pavimentos, cobertura…).",
    routes: [/^\/bens\/novo/, /^\/bens\/[^/]+$/],
    blocks: [
      { p: "Em Novo, informe o nome, o tipo (residencial, comercial, industrial, institucional, infraestrutura, patrimônio…), o ano e o endereço. Para patrimônio histórico aparecem também os campos de proteção legal (órgão e processo de tombamento)." },
      { p: "Na página do projeto, em Áreas, cadastre fachadas, pavimentos, ambientes, cobertura e estrutura. Cada captura, modelo e ortofoto fica ligado a uma área." },
      { tip: "Use os atalhos Edificação, Indústria / galpão ou Igreja / patrimônio para criar as áreas típicas de uma vez." },
    ],
  },
  {
    id: "campanhas",
    category: "Projetos",
    title: "Campanhas",
    summary: "Cada ida a campo ou etapa de obra, com suas capturas.",
    routes: [/^\/bens\/[^/]+$/],
    blocks: [
      { p: "Uma campanha agrupa o que foi levantado numa data e com um objetivo: levantamento inicial, monitoramento ou registro de obra (as-built por etapas). Assim o histórico do projeto fica organizado e comparável." },
    ],
  },
  {
    id: "captura-celular",
    category: "Capturas",
    title: "Capturar com o celular (fotos)",
    summary: "Roteiro de campo, medidas de controle e as duas voltas de fotos.",
    routes: [/\/capturas\//, /^\/capturas/],
    blocks: [
      { p: "Abra o Oraclo no celular (dica: Adicionar à tela inicial), entre no projeto, escolha a campanha e toque em Capturar com celular." },
      {
        steps: [
          "Roteiro: cole 4 a 6 alvos impressos visíveis de vários ângulos, confira luz, obstáculos e bateria.",
          "Medidas de controle: com trena a laser, meça 3 a 10 distâncias entre pares de alvos. É o que dá escala ao 3D e mede o erro.",
          "Volta 1, de longe: enquadre o conjunto e ande em arco, com cerca de 70% de sobreposição entre uma foto e a próxima.",
          "Volta 2, de perto: detalhes. Feche o percurso onde começou.",
          "Concluir: quando todas as fotos tiverem subido, envie para processamento (mínimo de 20 fotos; o ideal são centenas).",
        ],
      },
      { tip: "A câmera guiada avisa quando a imagem está tremida. Foto em alta abre a câmera do próprio celular, na resolução máxima." },
    ],
  },
  {
    id: "captura-video",
    category: "Capturas",
    title: "Capturar com vídeo",
    summary: "Mais rápido em campo: o celular escolhe os melhores quadros.",
    routes: [/\/capturas\//],
    blocks: [
      { p: "Na captura, troque para Vídeo e toque em Gravar vídeo (ou Escolher vídeo, se já gravou). O próprio celular percorre o vídeo, escolhe cerca de 2 a 3 quadros nítidos por segundo, descarta os tremidos e os repetidos (quando você ficou parado) e envia só esses quadros — o vídeo em si não sobe." },
      {
        list: [
          "Grave em 4K, de preferência a 60 quadros por segundo.",
          "Trave foco e exposição (segure o dedo na tela até aparecer o bloqueio).",
          "Desligue a estabilização cinematográfica / modo Ação; a normal pode ficar.",
          "Use uma lente só (1×), sem zoom.",
          "Ande devagar, mantendo a distância; desloque-se em vez de girar parado.",
          "Duas passadas (longe e perto), terminando onde começou; trechos de até 2–3 minutos.",
        ],
      },
      { tip: "Vídeo é ótimo para cobertura e para BIM em LOD 200. Para detalhes finos, complemente com algumas fotos." },
    ],
  },
  {
    id: "enviar-fotos",
    category: "Capturas",
    title: "Enviar fotos ou vídeos que você já tem",
    summary: "Fotos de câmera, drone ou celular tiradas antes.",
    routes: [/\/capturas\//, /^\/bens\/[^/]+$/],
    blocks: [
      { p: "Na campanha, escolha Enviar fotos e arraste as imagens para a área indicada — centenas de uma vez. Tem um vídeo? Use Escolher vídeo: os melhores quadros são separados automaticamente. As medidas de controle são opcionais." },
      { tip: "Para virar 3D, as imagens precisam se sobrepor bastante (cada ponto aparecendo em várias fotos, de ângulos diferentes)." },
    ],
  },
  {
    id: "importar-modelo",
    category: "Capturas",
    title: "Importar nuvem de pontos ou modelo 3D",
    summary: "Laser scanner, drone LiDAR ou outro software.",
    routes: [/\/capturas\//, /^\/modelos/],
    blocks: [
      { p: "Na campanha, escolha Importar modelo 3D e envie os arquivos: E57, LAS, LAZ, PLY, XYZ, PTS, GLB, OBJ, FBX, ZIP ou PDF, até 5 GB cada." },
      { list: ["Para ver no navegador: PLY, LAS (sem compactação), XYZ/PTS ou GLB.", "E57, LAZ, OBJ e FBX ficam disponíveis para download.", "O Oraclo considera as coordenadas em metros."] },
    ],
  },
  {
    id: "sem-sinal",
    category: "Capturas",
    title: "Sem sinal no local",
    summary: "As fotos ficam guardadas no aparelho até enviar.",
    routes: [/\/capturas\//],
    blocks: [
      { p: "Fotos e quadros de vídeo são guardados no próprio celular e enviados em segundo plano, dois por vez. Se o sinal cair ou a página recarregar, o envio continua de onde parou, sem duplicar." },
      { tip: "No iPhone o envio pausa com a tela apagada ou em outro app. Mantenha a página aberta até a barra mostrar tudo enviado." },
    ],
  },
  {
    id: "processamento",
    category: "Processamento",
    title: "Depois de concluir a captura",
    summary: "Das fotos à nuvem de pontos e ao modelo.",
    routes: [/\/capturas\//, /^\/capturas/],
    blocks: [
      { p: "A captura vai para Aguardando processamento. A equipe Oraclo processa as imagens (fotogrametria), envia a nuvem de pontos e a malha e preenche o relatório de qualidade. Ao publicar, a captura fica Concluída e o modelo aparece em Modelos 3D." },
      { p: "Acompanhe tudo em Capturas, filtrando por status." },
    ],
  },
  {
    id: "qualidade",
    category: "Processamento",
    title: "Relatório de qualidade e selo",
    summary: "Quanto o modelo erra em relação à trena.",
    routes: [/\/capturas\//],
    blocks: [
      { p: "Para cada medida de controle, o relatório compara a trena com o comprimento no modelo e mostra o erro. O selo de apto aparece quando há pelo menos 3 medidas e nenhum erro passa de 30 mm." },
    ],
  },
  {
    id: "visualizador",
    category: "Modelos 3D",
    title: "Visualizador 3D e medir",
    summary: "Navegar pela nuvem ou malha e tirar medidas.",
    routes: [/\/modelos\//, /^\/modelos/],
    blocks: [
      { list: ["Arraste para girar, botão direito para mover, roda do mouse para aproximar.", "Medir: clique em dois pontos do modelo para ver a distância em metros.", "Nuvens muito grandes são reduzidas para caber no navegador; o arquivo completo continua para download."] },
    ],
  },
  {
    id: "gerar-ortofoto",
    category: "Modelos 3D",
    title: "Gerar ortofoto a partir do modelo",
    summary: "Imagem plana e em escala de uma fachada ou parede, em três cliques.",
    routes: [/\/modelos\//],
    blocks: [
      {
        steps: [
          "No visualizador, escolha Gerar ortofoto.",
          "Clique no canto inferior esquerdo da fachada, no canto inferior direito e num ponto na altura do topo.",
          "Ajuste a resolução (mm por pixel) e quanto incluir à frente e atrás da parede — isso corta chão, árvores e o que estiver na frente.",
          "Gerar e abrir: a imagem já chega com a escala certa.",
        ],
      },
    ],
  },
  {
    id: "mapa-danos",
    category: "Mapa de danos",
    title: "Desenhar danos e patologias",
    summary: "Áreas, linhas e pontos sobre a ortofoto.",
    routes: [/\/ortofotos\//, /^\/mapas/],
    blocks: [
      {
        steps: [
          "Escolha o tipo na biblioteca, à esquerda (fissura, umidade, corrosão, perda de revestimento…).",
          "Áreas e linhas: clique para marcar os pontos; duplo clique ou Enter para concluir; Backspace desfaz; Esc cancela.",
          "Pontos: um clique marca.",
          "Clique num item para mudar tipo, gravidade, causa, recomendação e observações, ou arraste os vértices para ajustar.",
        ],
      },
      { tip: "Os quantitativos (m², m e unidades) aparecem à direita e servem de base para orçamento de reparo." },
    ],
  },
  {
    id: "escala",
    category: "Mapa de danos",
    title: "Escala e calibração",
    summary: "Sem escala não há áreas nem comprimentos.",
    routes: [/\/ortofotos\//],
    blocks: [
      { p: "Ortofotos geradas do modelo já vêm em escala. Para imagens enviadas de fora, use o botão de escala: desenhe uma linha sobre uma medida conhecida (uma porta, um alvo) e informe a distância real, ou digite o mm por pixel. Todas as áreas são recalculadas." },
    ],
  },
  {
    id: "legenda",
    category: "Mapa de danos",
    title: "Legenda e biblioteca de danos",
    summary: "A legenda sai sozinha a partir do que foi desenhado.",
    routes: [/^\/biblioteca/, /\/ortofotos\//],
    blocks: [
      { p: "A biblioteca traz tipos padronizados de dano (fissuração, umidade, revestimento, biológicos, madeira, metal, perdas e intervenções), cada um com código, cor e hachura." },
      { p: "Você não monta legenda: ao exportar, a prancha e o DXF trazem só os tipos usados, com os quantitativos de cada um." },
    ],
  },
  {
    id: "exportar",
    category: "Mapa de danos",
    title: "Exportar prancha PDF e DXF",
    summary: "Para o cliente, o orçamento e o AutoCAD.",
    routes: [/\/ortofotos\//, /^\/mapas/],
    blocks: [
      { list: ["Prancha PDF (A3): ortofoto com os danos, legenda, quantitativos, escala gráfica e carimbo com o projeto e o responsável técnico.", "DXF (ZIP): desenho em metros, uma camada por tipo de dano com hachuras, rótulos e a ortofoto como imagem de fundo. Mantenha os arquivos do ZIP na mesma pasta."] },
      { tip: "Cadastre seu registro CAU/CREA em Meu perfil para ele sair no carimbo." },
    ],
  },
  {
    id: "equipe",
    category: "Conta",
    title: "Equipe e papéis",
    summary: "Convidar pessoas e definir o que cada uma pode fazer.",
    routes: [/^\/equipe/],
    blocks: [
      { list: ["Administrador: tudo, inclusive equipe e excluir projetos.", "Técnico: cria projetos, captura, desenha e exporta.", "Equipe de campo: só faz capturas.", "Leitor: só visualiza e baixa."] },
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
      { p: "Em Meu perfil você ajusta o nome e o registro profissional (vão para o carimbo) e troca a senha. Esqueceu a senha? Use Esqueci minha senha na tela de entrada ou peça um link ao administrador." },
      { p: "O tema claro, escuro ou do sistema fica em Aparência, no menu do seu nome." },
    ],
  },
];

export function suggestedTopics(pathname: string) {
  return HELP_TOPICS.filter((t) => t.routes?.some((r) => r.test(pathname))).slice(0, 3);
}
