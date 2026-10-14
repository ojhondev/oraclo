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
    summary: "Do celular à prancha do mapa de danos, num lugar só.",
    routes: [/^\/$/],
    blocks: [
      { p: "Levantar um bem histórico e entregar o mapa de danos costuma exigir laser scanner (caro e com fila), dias redesenhando no CAD e medindo áreas à mão. O Oraclo encurta esse caminho:" },
      {
        list: [
          "Captura com o celular, guiada por roteiro — ou com as fotos e modelos 3D que você já tem.",
          "Modelo 3D com relatório de qualidade: você sabe se a precisão serve para levantamento cadastral.",
          "Ortofoto em escala gerada direto do modelo, sem calibrar nada.",
          "Mapa de danos com biblioteca padronizada: áreas e comprimentos calculados na hora.",
          "Prancha em PDF e DXF com legenda, quantitativos, escala e carimbo — no formato que órgãos de proteção e editais pedem.",
        ],
      },
      { tip: "O diagnóstico continua sendo do profissional. O Oraclo cuida do levantamento, das medidas e da papelada." },
    ],
  },
  {
    id: "primeiros-passos",
    category: "Começar",
    title: "Primeiros passos",
    summary: "O fluxo completo, do cadastro à prancha.",
    routes: [/^\/$/],
    blocks: [
      {
        steps: [
          "Cadastre o bem em Novo (nome, tipo, proteção, endereço).",
          "Divida o bem em partes — há um atalho com as partes típicas de uma igreja.",
          "Crie uma campanha (ex.: Levantamento inicial) e escolha: Capturar com celular, Enviar fotos ou Importar modelo 3D.",
          "Depois do processamento, abra o modelo em 3D e gere a ortofoto da fachada.",
          "Desenhe os danos sobre a ortofoto e baixe a prancha em PDF e o DXF.",
        ],
      },
    ],
  },
  {
    id: "cadastrar-bem",
    category: "Bens",
    title: "Cadastrar um bem e suas partes",
    summary: "Ficha do bem, proteção legal e partes (fachadas, nave, retábulos…).",
    routes: [/^\/bens\/novo/, /^\/bens\/[^/]+$/],
    blocks: [
      { p: "Em Novo, informe o nome, o tipo, o período, o nível de proteção, o órgão (IPHAN, CONDEPHAAT, IEPHA…) e o endereço. Esses dados vão para o carimbo das pranchas." },
      { p: "Na página do bem, em Partes do bem, cadastre fachadas, ambientes e elementos artísticos. Cada captura, ortofoto e dano fica ligado a uma parte." },
      { tip: "Use Usar as partes típicas de uma igreja para criar fachadas, nave, capela-mor, sacristia, coro, torre, cobertura, retábulo-mor e forro de uma vez." },
    ],
  },
  {
    id: "campanhas",
    category: "Bens",
    title: "Campanhas",
    summary: "Cada ida a campo ou etapa de obra, com suas capturas.",
    routes: [/^\/bens\/[^/]+$/],
    blocks: [
      { p: "Uma campanha agrupa o que foi levantado numa data e com um objetivo: levantamento inicial, monitoramento, registro de obra. Assim o histórico do bem fica organizado e comparável." },
    ],
  },
  {
    id: "captura-celular",
    category: "Capturas",
    title: "Capturar com o celular",
    summary: "Roteiro de campo, medidas de controle e as duas voltas de fotos.",
    routes: [/\/capturas\//, /^\/capturas/],
    blocks: [
      { p: "Abra o Oraclo no celular (dica: Adicionar à tela inicial), entre no bem, escolha a campanha e toque em Capturar com celular." },
      {
        steps: [
          "Roteiro: cole 4 a 6 alvos impressos visíveis de vários ângulos, confira luz, obstáculos e bateria.",
          "Medidas de controle: com trena a laser, meça 3 a 10 distâncias entre pares de alvos. É o que dá escala ao 3D e mede o erro.",
          "Volta 1, de longe: enquadre o conjunto e ande em arco, com cerca de 70% de sobreposição entre uma foto e a próxima.",
          "Volta 2, de perto: detalhes, ornamentos e danos. Feche o percurso onde começou.",
          "Concluir: quando todas as fotos tiverem subido, envie para processamento (mínimo de 20 fotos; o ideal são centenas).",
        ],
      },
      { tip: "A câmera guiada avisa quando a imagem está tremida. Foto em alta abre a câmera do próprio celular, na resolução máxima." },
    ],
  },
  {
    id: "enviar-fotos",
    category: "Capturas",
    title: "Enviar fotos que você já tem",
    summary: "Fotos de câmera, drone ou celular tiradas antes.",
    routes: [/\/capturas\//, /^\/bens\/[^/]+$/],
    blocks: [
      { p: "Na campanha, escolha Enviar fotos e arraste as imagens para a área indicada — centenas de uma vez. Não há roteiro de campo; as medidas de controle são opcionais." },
      { tip: "Para virar 3D, as fotos precisam se sobrepor bastante (cada parte do bem aparecendo em várias fotos, de ângulos diferentes)." },
    ],
  },
  {
    id: "importar-modelo",
    category: "Capturas",
    title: "Importar modelo 3D",
    summary: "Nuvem de laser, drone ou de outro software.",
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
      { p: "As fotos são guardadas no próprio celular e enviadas em segundo plano, duas por vez. Se o sinal cair ou a página recarregar, o envio continua de onde parou, sem duplicar." },
      { tip: "No iPhone o envio pausa com a tela apagada ou em outro app. Mantenha a página aberta até a barra mostrar tudo enviado." },
    ],
  },
  {
    id: "processamento",
    category: "Processamento",
    title: "Depois de concluir a captura",
    summary: "Das fotos ao modelo 3D.",
    routes: [/\/capturas\//, /^\/capturas/],
    blocks: [
      { p: "A captura vai para Aguardando processamento. Nesta fase do Oraclo, a equipe processa as fotos (fotogrametria), envia a nuvem de pontos e a malha e preenche o relatório de qualidade. Ao publicar, a captura fica Concluída e o modelo aparece em Modelos 3D." },
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
      { p: "Para cada medida de controle, o relatório compara a trena com o comprimento no modelo e mostra o erro. O selo Apto para levantamento cadastral aparece quando há pelo menos 3 medidas e nenhum erro passa de 30 mm." },
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
    summary: "Imagem plana e em escala da fachada, em três cliques.",
    routes: [/\/modelos\//],
    blocks: [
      {
        steps: [
          "No visualizador, escolha Gerar ortofoto.",
          "Clique no canto inferior esquerdo da fachada, no canto inferior direito e num ponto na altura do topo.",
          "Ajuste a resolução (mm por pixel) e quanto incluir à frente e atrás da parede — isso corta chão, árvores e o que estiver na frente.",
          "Gerar e abrir no mapa de danos: a imagem já chega com a escala certa.",
        ],
      },
    ],
  },
  {
    id: "mapa-danos",
    category: "Mapa de danos",
    title: "Desenhar danos",
    summary: "Áreas, linhas e pontos sobre a ortofoto.",
    routes: [/\/ortofotos\//, /^\/mapas/],
    blocks: [
      {
        steps: [
          "Escolha o tipo de dano na biblioteca, à esquerda.",
          "Áreas e linhas: clique para marcar os pontos; duplo clique ou Enter para concluir; Backspace desfaz; Esc cancela.",
          "Pontos: um clique marca.",
          "Clique num dano para mudar tipo, gravidade, causa, recomendação e observações, ou arraste os vértices para ajustar.",
        ],
      },
      { tip: "Os quantitativos (m², m e unidades) aparecem à direita e podem ser ocultados por tipo." },
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
    summary: "A legenda sai sozinha a partir dos danos desenhados.",
    routes: [/^\/biblioteca/, /\/ortofotos\//],
    blocks: [
      { p: "O Oraclo traz uma biblioteca padronizada de danos (fissuração, umidade, revestimento, biológicos, madeira, metal, perdas e ações humanas), cada um com código, cor e hachura." },
      { p: "Você não monta legenda: ao exportar, a prancha e o DXF trazem só os tipos usados, com os quantitativos de cada um." },
    ],
  },
  {
    id: "exportar",
    category: "Mapa de danos",
    title: "Exportar prancha PDF e DXF",
    summary: "Para o órgão de proteção, o edital e o AutoCAD.",
    routes: [/\/ortofotos\//, /^\/mapas/],
    blocks: [
      { list: ["Prancha PDF (A3): ortofoto com os danos, legenda, quantitativos, escala gráfica e carimbo com o bem e o responsável técnico.", "DXF (ZIP): desenho em metros, uma camada por tipo de dano com hachuras, rótulos e a ortofoto como imagem de fundo. Mantenha os arquivos do ZIP na mesma pasta."] },
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
      { list: ["Administrador: tudo, inclusive equipe e excluir bens.", "Técnico: cadastra, captura, desenha danos e exporta.", "Equipe de campo: só faz capturas.", "Leitor: só visualiza e baixa."] },
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
