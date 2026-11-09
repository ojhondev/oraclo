import { article, IMG } from "./helper";

const CAT = "Tecnologia";

export const TECNOLOGIA = [
  article({
    slug: "fotogrametria-arquitetura",
    title: "Fotogrametria na arquitetura: como funciona e para que serve",
    seoTitle: "Fotogrametria na arquitetura: como funciona",
    summary: "Como a fotogrametria transforma fotos ou vídeo em modelo 3D, nuvem de pontos e imagens em escala, e como ela é usada em levantamentos, mapas de danos e restauro.",
    category: CAT,
    ...IMG.retificada,
    keywords: ["fotogrametria", "fotogrametria arquitetura", "fotogrametria o que é", "fotogrametria para levantamento", "modelo 3D por fotos"],
    intro: [
      "A **fotogrametria** é a técnica de medir objetos a partir de imagens. Com várias fotos de um mesmo objeto, tiradas de pontos diferentes, um software calcula a posição de cada câmera e reconstrói a geometria em 3D. Na arquitetura, ela permite levantar fachadas, interiores e até cidades sem encostar nelas.",
    ],
    sections: [
      {
        id: "como-funciona",
        title: "Como funciona, em quatro passos",
        blocks: [
          {
            list: [
              "**Encontrar pontos em comum:** o software detecta milhares de detalhes (cantos, texturas) que aparecem em mais de uma imagem.",
              "**Calcular as câmeras:** a partir desses pontos, estima onde estava e para onde apontava a câmera em cada foto.",
              "**Densificar:** com as câmeras conhecidas, calcula a profundidade de cada pixel e gera uma [nuvem de pontos](/index/nuvem-de-pontos) densa.",
              "**Gerar produtos:** malha 3D com textura, [ortofotos](/index/ortofoto-fachada-retificacao) e medidas.",
            ],
          },
        ],
      },
      {
        id: "escala",
        title: "O detalhe que todo mundo esquece: a escala",
        blocks: [
          { p: "Fotos sozinhas não dizem o tamanho real do objeto: o modelo sai na forma certa, mas em escala arbitrária. A escala vem de GPS de boa precisão, de pontos de controle medidos ou de uma referência de tamanho conhecido. Veja como resolver em [escala em fotogrametria](/index/escala-fotogrametria-marcador)." },
          { callout: "Um modelo 3D sem escala é bonito, mas não serve para orçar nem para laudo." },
        ],
      },
      {
        id: "usos",
        title: "Usos na arquitetura",
        blocks: [
          {
            list: [
              "Levantamento de fachadas para projetos e [mapas de danos](/index/mapa-de-danos).",
              "Documentação do estado de conservação de bens históricos.",
              "Acompanhamento de obras e comparação entre etapas.",
              "Base para modelagem e reforma (veja [modelo 3D da edificação](/index/modelo-3d-edificacao-reforma)).",
            ],
          },
        ],
      },
      {
        id: "captura",
        title: "Boas práticas de captura",
        blocks: [
          {
            list: [
              "Muita sobreposição entre imagens: cada trecho deve aparecer em várias fotos.",
              "Mover a câmera de lado, em vez de girar parado no lugar.",
              "Luz difusa, sem sombras duras nem contraluz.",
              "Evitar céu, vidros e superfícies espelhadas no centro do quadro.",
              "Incluir uma referência de escala.",
            ],
          },
          { p: "Com o celular, dá para fazer a captura por vídeo: veja [levantamento arquitetônico com celular](/index/levantamento-arquitetonico-celular)." },
        ],
      },
      {
        id: "limites",
        title: "Limites",
        blocks: [
          { p: "Superfícies lisas e sem textura, vidros e reflexos geram falhas. Partes altas vistas só do chão ficam mais pobres. Para esses casos, há o [laser scanner](/index/levantamento-arquitetonico-celular), drones ou capturas complementares." },
          { p: "O ArchRay usa fotogrametria de código aberto (OpenDroneMap) para processar a captura em vídeo feita pelo celular e entrega modelo 3D, nuvem de pontos e imagem em escala dentro da própria plataforma." },
        ],
      },
    ],
    faq: [
      { q: "Fotogrametria é precisa?", a: "Pode ser bastante precisa quando a captura é bem feita e há uma boa referência de escala. A precisão real deve ser conferida comparando medidas do modelo com medidas de trena." },
      { q: "Qual a diferença entre fotogrametria e laser scanner?", a: "A fotogrametria calcula a geometria a partir de imagens; o laser scanner mede distâncias diretamente com laser. O scanner costuma ser mais preciso em superfícies difíceis, mas é bem mais caro." },
    ],
  }),

  article({
    slug: "nuvem-de-pontos",
    title: "Nuvem de pontos: o que é e para que serve na arquitetura",
    seoTitle: "Nuvem de pontos: o que é e para que serve",
    summary: "O que é uma nuvem de pontos, como ela é gerada (laser scanner ou fotogrametria), formatos comuns e como visualizar e usar milhões de pontos sem travar o computador.",
    category: CAT,
    ...IMG.vista,
    keywords: ["nuvem de pontos", "nuvem de pontos o que é", "nuvem de pontos arquitetura", "arquivo LAS", "point cloud"],
    intro: [
      "Uma **nuvem de pontos** é um conjunto de milhões de pontos no espaço, cada um com coordenadas X, Y e Z e, normalmente, uma cor. Juntos, eles formam uma réplica digital da superfície medida: uma fachada, um interior, um terreno.",
    ],
    sections: [
      {
        id: "como-gerar",
        title: "Como é gerada",
        blocks: [
          {
            table: {
              head: ["Origem", "Como funciona", "Observações"],
              rows: [
                ["Laser scanner", "Mede distâncias com laser em todas as direções", "Alta precisão, equipamento caro"],
                ["Fotogrametria", "Calcula a profundidade a partir de várias imagens", "Equipamento barato (câmera ou celular); depende da textura"],
                ["LiDAR em celulares", "Sensor de profundidade de curto alcance", "Bom para interiores e objetos próximos"],
              ],
            },
          },
          { p: "Veja como a [fotogrametria](/index/fotogrametria-arquitetura) transforma fotos em nuvem de pontos." },
        ],
      },
      {
        id: "formatos",
        title: "Formatos comuns",
        blocks: [
          {
            list: [
              "**LAS / LAZ:** padrão da indústria; o LAZ é a versão comprimida.",
              "**E57:** comum em laser scanners, guarda também as posições de captura.",
              "**PLY, XYZ, PTS:** formatos simples, de texto ou binários.",
            ],
          },
        ],
      },
      {
        id: "usos",
        title: "Para que serve",
        blocks: [
          {
            list: [
              "Medir qualquer distância, altura ou área depois da visita.",
              "Gerar [ortofotos de fachada](/index/ortofoto-fachada-retificacao) em escala para o [mapa de danos](/index/mapa-de-danos).",
              "Documentar deformações e prumo, importantes em edifícios antigos.",
              "Servir de base para modelagem 3D e projetos (veja [modelo 3D da edificação](/index/modelo-3d-edificacao-reforma)).",
            ],
          },
        ],
      },
      {
        id: "visualizar",
        title: "Como abrir sem travar",
        blocks: [
          { p: "Uma nuvem de centenas de megabytes trava qualquer navegador se for carregada inteira. A solução é organizá-la em níveis de detalhe (uma estrutura chamada octree): o visualizador baixa primeiro uma versão grossa e vai refinando só a região que aparece na tela, como num mapa online." },
          { callout: "É assim que uma nuvem de milhões de pontos abre em segundos no navegador: carregando só o que você está vendo." },
          { p: "No ArchRay, as nuvens geradas ou importadas são otimizadas automaticamente nesse formato e abertas direto na plataforma, com vistas prontas, medição e geração de ortofoto." },
        ],
      },
    ],
    faq: [
      { q: "Nuvem de pontos e modelo 3D são a mesma coisa?", a: "Não. A nuvem é um conjunto de pontos soltos; o modelo 3D (malha) liga esses pontos em superfícies, geralmente com textura de foto. Os dois são gerados no mesmo processo e têm usos diferentes." },
      { q: "Como abrir arquivo LAS?", a: "Há programas gratuitos de desktop para abrir LAS. No ArchRay, basta importar o arquivo no projeto: ele é otimizado para abrir no navegador." },
    ],
  }),

  article({
    slug: "levantamento-arquitetonico-celular",
    title: "Levantamento arquitetônico com celular: vídeo, fotos ou laser scanner?",
    seoTitle: "Levantamento arquitetônico com celular x laser scanner",
    summary: "Comparativo entre levantamento por vídeo no celular, fotos com câmera e laser scanner: custo, precisão, tempo de campo e quando cada um faz sentido.",
    category: CAT,
    ...IMG.fachada,
    keywords: ["levantamento arquitetônico com celular", "levantamento com laser scanner", "levantamento de fachada", "escaneamento 3D de edificações"],
    intro: [
      "Até pouco tempo, levantar uma fachada em 3D exigia laser scanner ou uma câmera profissional e horas de processamento. Hoje, o celular grava vídeo com qualidade suficiente para gerar modelo 3D e nuvem de pontos. Mas cada método tem seu lugar.",
    ],
    sections: [
      {
        id: "comparativo",
        title: "Comparativo",
        blocks: [
          {
            table: {
              head: ["Critério", "Vídeo no celular", "Fotos com câmera", "Laser scanner"],
              rows: [
                ["Custo do equipamento", "Baixo", "Médio", "Alto"],
                ["Tempo em campo", "Curto (filmar caminhando)", "Médio", "Médio a longo (várias estações)"],
                ["Precisão", "Boa com escala bem resolvida", "Boa a muito boa", "Muito alta"],
                ["Superfícies lisas e vidros", "Falhas", "Falhas", "Melhor desempenho"],
                ["Cor e textura", "Sim", "Sim, com mais qualidade", "Depende do equipamento"],
                ["Operador", "Leigo guiado", "Técnico treinado", "Técnico especializado"],
              ],
            },
          },
        ],
      },
      {
        id: "video",
        title: "Por que vídeo funciona",
        blocks: [
          { p: "No vídeo, cada trecho da fachada aparece em dezenas de quadros, o que garante a sobreposição de que a [fotogrametria](/index/fotogrametria-arquitetura) precisa. O desafio é escolher os quadros nítidos: com o movimento, muitos saem tremidos." },
          { p: "O ArchRay resolve isso na hora da gravação: guarda só o quadro mais nítido de cada instante, descarta os tremidos e orienta o operador na tela ('mais devagar', 'muito céu no quadro', 'passada 2: mire para cima'). O vídeo inteiro nem precisa ser enviado." },
        ],
      },
      {
        id: "quando",
        title: "Quando usar cada um",
        blocks: [
          {
            list: [
              "**Vídeo no celular:** fachadas de até alguns pavimentos, vistorias frequentes, mapas de danos e acompanhamento de obra.",
              "**Câmera profissional:** quando se precisa de máxima qualidade de imagem, por exemplo em painéis decorativos e pinturas murais.",
              "**Laser scanner:** interiores complexos, estruturas com muitos vidros, levantamentos com precisão milimétrica exigida em contrato.",
            ],
          },
          { callout: "Não é concorrência: muitas equipes combinam scanner para a geometria e fotos para a textura e os danos." },
        ],
      },
      {
        id: "dicas",
        title: "Dicas para filmar uma fachada",
        blocks: [
          {
            list: [
              "Ande de lado, paralelo à fachada; não gire parado.",
              "Faça duas passadas: uma com a câmera reta e outra mais afastada, mirando a parte alta.",
              "Contorne as quinas em arco.",
              "Prefira dia nublado.",
              "Inclua um [marcador de escala](/index/escala-fotogrametria-marcador).",
            ],
          },
          { p: "Com a captura feita, o próximo passo é gerar a [nuvem de pontos](/index/nuvem-de-pontos) e a [ortofoto da fachada](/index/ortofoto-fachada-retificacao)." },
        ],
      },
    ],
    faq: [
      { q: "O celular substitui o laser scanner?", a: "Em muitos levantamentos de fachada para mapa de danos, a captura por vídeo é suficiente e muito mais barata. Para precisão milimétrica, superfícies sem textura ou interiores complexos, o scanner continua sendo a melhor escolha." },
      { q: "Precisa de iPhone com LiDAR?", a: "Não para a fotogrametria por vídeo: qualquer celular com boa câmera serve. O LiDAR ajuda em objetos próximos e no cálculo automático de escala, mas tem alcance curto." },
    ],
  }),

  article({
    slug: "ortofoto-fachada-retificacao",
    title: "Ortofoto de fachada e retificação de imagem: o que são e como fazer",
    seoTitle: "Ortofoto de fachada e retificação: o que são",
    summary: "A diferença entre foto comum, foto retificada e ortofoto de fachada, por que a escala importa e como gerar uma imagem em escala para o mapa de danos.",
    category: CAT,
    ...IMG.retificada,
    keywords: ["ortofoto de fachada", "retificação de imagem", "foto retificada fachada", "ortomosaico fachada", "imagem em escala"],
    intro: [
      "Uma foto comum de fachada tem perspectiva: o que está mais longe parece menor, e linhas paralelas convergem. Para medir sobre a imagem, é preciso corrigir essa distorção. É o que fazem a **retificação** e a **ortofoto**.",
    ],
    sections: [
      {
        id: "diferenca",
        title: "Foto, foto retificada e ortofoto",
        blocks: [
          {
            table: {
              head: ["Tipo", "Como é feita", "Mede corretamente?"],
              rows: [
                ["Foto comum", "Uma câmera, com perspectiva", "Não"],
                ["Foto retificada", "Uma foto corrigida para um plano, a partir de medidas de referência", "Sim, no plano da parede"],
                ["Ortofoto", "Projeção ortogonal do modelo 3D ou da nuvem de pontos", "Sim, inclusive com relevo"],
              ],
            },
          },
        ],
      },
      {
        id: "retificacao",
        title: "Retificação: rápida e eficaz para paredes planas",
        blocks: [
          { p: "Com quatro pontos de medida conhecida no plano da fachada (por exemplo, os cantos de um retângulo medido com trena), o software calcula a transformação que remove a perspectiva. O resultado é uma imagem em que cada pixel corresponde a uma medida real." },
          { p: "Bons programas também corrigem a distorção da lente e informam a precisão obtida. No ArchRay, a retificação calcula a incerteza em milímetros a partir de pontos de conferência." },
          { callout: "Elementos salientes, como marquises e beirais, saem levemente deslocados na retificação, porque ela corrige um único plano." },
        ],
      },
      {
        id: "ortofoto",
        title: "Ortofoto: quando a fachada tem relevo",
        blocks: [
          { p: "A ortofoto é gerada a partir do [modelo 3D ou da nuvem de pontos](/index/nuvem-de-pontos) da [fotogrametria](/index/fotogrametria-arquitetura): é como fotografar a fachada com uma câmera infinitamente distante, sem perspectiva. Saliências e reentrâncias ficam no lugar certo." },
          { p: "A resolução é definida em milímetros por pixel. Quanto menor o valor, mais detalhe, e maior o arquivo." },
        ],
      },
      {
        id: "mapa",
        title: "A base do mapa de danos",
        blocks: [
          { p: "Seja retificada ou ortofoto, essa imagem em escala é a base do [mapa de danos](/index/mapa-de-danos): é sobre ela que os danos são desenhados e medidos. Veja o passo a passo em [mapa de danos em fachada](/index/mapa-de-danos-fachada-passo-a-passo)." },
          { p: "A escala da ortofoto depende da escala do modelo. Sem uma referência de medida, as áreas não valem; veja [escala em fotogrametria](/index/escala-fotogrametria-marcador)." },
        ],
      },
    ],
    faq: [
      { q: "Qual a diferença entre ortofoto e ortomosaico?", a: "Os termos são usados quase como sinônimos. Ortomosaico costuma se referir à ortofoto montada a partir de muitas imagens, como em levantamentos com drone." },
      { q: "Dá para retificar uma foto sem medidas?", a: "Dá para corrigir a perspectiva, mas sem pelo menos uma medida real a imagem não terá escala. Para medir, é preciso uma referência." },
    ],
  }),

  article({
    slug: "escala-fotogrametria-marcador",
    title: "Escala em fotogrametria: marcadores, barras e calibração com trena",
    seoTitle: "Escala em fotogrametria: marcador e calibração",
    summary: "Por que modelos de fotogrametria saem sem medida real, quais as formas de dar escala (GPS, pontos de controle, marcadores, barra de escala, trena) e como conferir a precisão.",
    category: CAT,
    ...IMG.vista,
    keywords: ["escala fotogrametria", "marcador de escala", "barra de escala fotogrametria", "alvos codificados", "calibrar escala modelo 3D"],
    intro: [
      "A fotogrametria reconstrói a forma de um objeto com grande fidelidade, mas não sabe o seu tamanho. Um prédio e uma maquete fotografados do mesmo jeito geram o mesmo modelo. A **escala** precisa vir de fora, e sem ela medidas, áreas e orçamentos não valem.",
    ],
    sections: [
      {
        id: "opcoes",
        title: "Formas de dar escala ao modelo",
        blocks: [
          {
            table: {
              head: ["Método", "Precisão", "Automático?"],
              rows: [
                ["GPS do celular", "Baixa para fachadas (erro de metros)", "Sim"],
                ["Pontos de controle medidos (topografia)", "Alta", "Não"],
                ["Marcador impresso (alvos codificados)", "Alta", "Sim"],
                ["Barra de escala com dois alvos", "Alta, lida de mais longe", "Sim"],
                ["Medida com trena + calibração", "Alta", "Não"],
                ["Sensores de realidade aumentada (app nativo)", "Boa", "Sim"],
              ],
            },
          },
        ],
      },
      {
        id: "marcador",
        title: "Como funcionam os marcadores",
        blocks: [
          { p: "Marcadores codificados, como os ArUco usados em realidade aumentada e robótica, são quadrados preto e branco que um programa reconhece automaticamente nas imagens, inclusive qual é cada um. Sabendo o tamanho real impresso, o software mede o marcador no modelo e calcula a escala." },
          { p: "Uma barra de escala leva a ideia adiante: dois alvos a uma distância grande e conhecida, por exemplo 1 metro. Como a distância é maior, um pequeno erro de detecção pesa menos no resultado." },
          { callout: "Medidas independentes que concordam entre si são o que dá confiança na escala, e é por isso que bons sistemas conferem uma contra a outra." },
        ],
      },
      {
        id: "archray",
        title: "Como o ArchRay faz",
        blocks: [
          { p: "O ArchRay oferece para impressão uma folha com dois marcadores ([archray.com.br/marcador](/marcador)) e uma barra de escala de 1 m em duas folhas. Depois da fotogrametria, o motor encontra os marcadores nos quadros, mede-os pelas posições das câmeras e aplica a escala ao modelo e à nuvem. Ele compara as medidas independentes (lados dos quadrados e distância entre eles) e avisa quando divergem: 'escala duvidosa, confira com trena'." },
          { p: "Se o marcador não aparecer, o modelo fica marcado como 'sem escala' e abre num passo a passo de três cliques para calibrar com uma medida de trena, como a largura de uma porta." },
        ],
      },
      {
        id: "conferir",
        title: "Sempre confira",
        blocks: [
          { p: "Qualquer que seja o método, compare duas ou três medidas do modelo com medidas de trena em campo. Esse teste simples revela a precisão real do levantamento e deve ser registrado no [laudo](/index/laudo-de-fachada). Com a escala certa, as áreas do [mapa de danos](/index/mapa-de-danos) e o [orçamento](/index/orcamento-recuperacao-fachada) passam a valer." },
          { p: "Dicas de captura com marcador: cole a folha lisa na altura da cintura, comece a gravação perto dela e deixe-a aparecer em vários quadros, de ângulos diferentes. Veja mais em [levantamento com celular](/index/levantamento-arquitetonico-celular)." },
        ],
      },
    ],
    faq: [
      { q: "Por que meu modelo 3D saiu com medidas erradas?", a: "Provavelmente porque não havia referência de escala. Sem GPS preciso, pontos de controle, marcador ou medida conhecida, a fotogrametria gera o modelo em escala arbitrária." },
      { q: "Posso imprimir o marcador em qualquer impressora?", a: "Sim, desde que em tamanho real (100%, sem ajustar à página). Confira com trena a régua impressa na folha: ela deve medir exatamente 10 cm." },
    ],
  }),

  article({
    slug: "inteligencia-artificial-inspecao-predial",
    title: "Inteligência artificial na inspeção predial: o que já funciona",
    seoTitle: "IA na inspeção predial e mapa de danos",
    summary: "O que a inteligência artificial e a visão computacional já fazem bem na inspeção de fachadas, onde ainda erram e por que o profissional continua no controle.",
    category: CAT,
    ...IMG.tablet,
    keywords: ["inteligência artificial inspeção predial", "IA mapa de danos", "detecção automática de fissuras", "visão computacional construção civil"],
    intro: [
      "Detectar fissuras, manchas e descolamentos automaticamente em imagens de fachada é um dos usos mais promissores da inteligência artificial na construção. Mas há muita promessa no mercado. Vale separar o que já funciona do que ainda está amadurecendo.",
    ],
    sections: [
      {
        id: "o-que-funciona",
        title: "O que já funciona bem",
        blocks: [
          {
            list: [
              "**Sugestão de danos:** apontar regiões candidatas (manchas, áreas esverdeadas, fissuras) para o profissional revisar.",
              "**Contorno assistido:** com um clique, delimitar com precisão a borda de uma mancha ou área de perda.",
              "**Avisos de qualidade da imagem:** sombra dura, pouca resolução, área estourada.",
              "**Organização:** classificar, somar e priorizar o que foi confirmado.",
            ],
          },
        ],
      },
      {
        id: "limites",
        title: "Onde a IA ainda erra",
        blocks: [
          {
            list: [
              "Confundir arquitetura com dano: juntas, frisos, sombras e ornamentos parecem fissuras ou manchas.",
              "Variação de cor natural de materiais antigos interpretada como sujidade.",
              "Generalizar mal: um modelo calibrado num tipo de edifício pode falhar em outro.",
              "Não enxerga a causa: identifica o sintoma, mas o diagnóstico é técnico (veja [manifestações patológicas em fachadas](/index/manifestacoes-patologicas-fachadas)).",
            ],
          },
          { callout: "IA boa na inspeção é a que sugere e explica, e deixa a decisão com o profissional." },
        ],
      },
      {
        id: "archray",
        title: "Como o ArchRay usa (com transparência)",
        blocks: [
          { p: "A detecção atual do ArchRay usa visão computacional clássica: segmenta a fachada em superfícies, mede desvios em relação ao padrão de cada superfície e descarta formas típicas de arquitetura. Cada sugestão vem com a justificativa e nunca vira dano sozinha: o profissional aceita ou rejeita." },
          { p: "O contorno assistido usa um modelo de segmentação de terceiros, rodando no próprio navegador. Um modelo próprio, treinado com mapas reais revisados por profissionais e com consentimento das organizações, está em desenvolvimento e ainda não está em produção." },
        ],
      },
      {
        id: "futuro",
        title: "O que vem pela frente",
        blocks: [
          { p: "O que mais acelera a IA na inspeção são dados de qualidade: mapas de danos revisados por especialistas. Cada vistoria bem feita melhora os modelos. Veja o fluxo completo em [mapa de danos](/index/mapa-de-danos) e a comparação entre ferramentas em [AutoCAD ou software](/index/mapa-de-danos-autocad-ou-software)." },
        ],
      },
    ],
    faq: [
      { q: "A IA consegue fazer o laudo sozinha?", a: "Não com responsabilidade. Ela acelera o levantamento e a organização dos dados, mas o diagnóstico e a assinatura do laudo são do profissional habilitado." },
      { q: "A detecção automática funciona em qualquer fachada?", a: "Funciona melhor em superfícies lisas e bem iluminadas. Fachadas muito decoradas, com sombras duras ou imagens de baixa resolução geram mais sugestões erradas, e o sistema avisa quando isso acontece." },
    ],
  }),

  article({
    slug: "modelo-3d-edificacao-reforma",
    title: "Modelo 3D da edificação: usos na reforma, no restauro e na manutenção",
    seoTitle: "Modelo 3D de edificação: usos na reforma e restauro",
    summary: "Para que serve um modelo 3D da edificação existente: medir depois da visita, planejar a obra, documentar o estado e acompanhar a evolução dos danos.",
    category: CAT,
    ...IMG.igreja2010,
    keywords: ["modelo 3D edificação", "modelo 3D para reforma", "levantamento 3D de edificações", "gêmeo digital edificação"],
    intro: [
      "Ter um modelo 3D da edificação existente muda a forma de trabalhar: as dúvidas que antes exigiam nova visita ao local passam a ser resolvidas no computador. Com captura por celular, esse modelo deixou de ser exclusivo de grandes projetos.",
    ],
    sections: [
      {
        id: "usos",
        title: "Usos práticos",
        blocks: [
          {
            list: [
              "**Medir depois da visita:** alturas, vãos e áreas, a qualquer momento.",
              "**Gerar imagens em escala:** [ortofotos de cada fachada](/index/ortofoto-fachada-retificacao) para o [mapa de danos](/index/mapa-de-danos).",
              "**Planejar acesso e obra:** prever andaimes, áreas de isolamento, logística.",
              "**Documentar:** registrar o estado da edificação antes de uma intervenção.",
              "**Comunicar:** mostrar ao cliente ou aos condôminos o que será feito.",
            ],
          },
        ],
      },
      {
        id: "malha-nuvem",
        title: "Malha ou nuvem de pontos?",
        blocks: [
          { p: "A malha com textura é ótima para visualizar e apresentar. A [nuvem de pontos](/index/nuvem-de-pontos) é melhor para medir e gerar ortofotos com fidelidade. A [fotogrametria](/index/fotogrametria-arquitetura) gera as duas no mesmo processo." },
        ],
      },
      {
        id: "tempo",
        title: "O modelo como linha do tempo",
        blocks: [
          { p: "Capturas repetidas ao longo dos anos transformam o modelo num registro da evolução do edifício: dá para ver o que surgiu, cresceu ou foi tratado. Veja como no guia de [monitoramento de danos](/index/monitoramento-danos-comparar-vistorias)." },
          { callout: "O modelo 3D de hoje é o documento de comparação da próxima vistoria." },
        ],
      },
      {
        id: "cuidados",
        title: "Cuidados",
        blocks: [
          {
            list: [
              "Confirme a [escala](/index/escala-fotogrametria-marcador) antes de medir.",
              "Lembre que vidros e superfícies lisas podem ter falhas.",
              "Partes altas vistas só do chão ficam com menos detalhe.",
            ],
          },
          { p: "No ArchRay, o modelo abre em pé, com vistas prontas (frente, lado, topo), medição e geração de ortofoto, tudo no navegador." },
        ],
      },
    ],
    faq: [
      { q: "Preciso de um software caro para ter o modelo 3D?", a: "Não necessariamente. A fotogrametria a partir de vídeo de celular gera modelos úteis para levantamento de fachadas e mapa de danos, com custo baixo." },
      { q: "Modelo 3D serve para BIM?", a: "Pode servir de referência para modelar em BIM, mas a nuvem ou a malha não são um modelo BIM: o BIM tem elementos com informação (paredes, janelas), que precisam ser modelados." },
    ],
  }),
];
