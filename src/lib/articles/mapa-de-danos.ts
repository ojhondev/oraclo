import { article, ER } from "./helper";

const CAT = "Mapa de danos";

export const MAPA_DE_DANOS = [
  article({
    slug: "mapa-de-danos",
    title: "Mapa de danos: o que é, para que serve e como fazer",
    seoTitle: "Mapa de danos: o que é e como fazer (guia completo)",
    summary:
      "Guia completo sobre mapa de danos: definição, quando ele é exigido, o que precisa conter, etapas de elaboração e como a tecnologia reduz dias de trabalho para horas.",
    category: CAT,
    keywords: ["mapa de danos", "o que é mapa de danos", "como fazer mapa de danos", "mapeamento de danos", "mapa de danos fachada"],
    intro: [
      "O **mapa de danos** é o documento gráfico que registra, sobre desenhos ou imagens em escala de uma edificação, onde está cada manifestação patológica, de que tipo ela é e qual a sua extensão. É a base de qualquer decisão séria de manutenção, reforma ou restauro: sem saber o que existe, onde e quanto, não há orçamento confiável nem prioridade bem definida.",
      "Neste guia você entende o que é um mapa de danos, quando ele é necessário, o que um bom mapa precisa ter e como fazê-lo, do levantamento ao laudo.",
    ],
    sections: [
      {
        id: "o-que-e",
        title: "O que é um mapa de danos",
        blocks: [
          { p: "É a representação, em planta, corte, elevação ou imagem retificada, de todos os danos visíveis de um elemento construído: fissuras, trincas, manchas de umidade, eflorescências, desplacamentos, biodeterioração, perdas de material e assim por diante. Cada dano recebe uma cor ou hachura padronizada, descrita numa [legenda](/index/legenda-mapa-de-danos)." },
          { p: "Mais do que um desenho, o mapa é um instrumento de medição. Um mapa bem feito permite responder perguntas objetivas: quantos metros quadrados de reboco precisam ser refeitos? Quantos metros lineares de fissura serão tratados? Qual fachada está em pior estado?" },
          { callout: "Um mapa de danos sem escala é uma ilustração. Com escala, ele vira quantitativo, orçamento e prioridade." },
        ],
      },
      {
        id: "para-que-serve",
        title: "Para que serve",
        blocks: [
          {
            list: [
              "**Diagnóstico:** organizar a leitura das [manifestações patológicas](/index/manifestacoes-patologicas-fachadas) e ajudar a identificar as causas.",
              "**Orçamento:** gerar quantitativos por tipo de dano e por elemento, base do [orçamento de recuperação](/index/orcamento-recuperacao-fachada).",
              "**Priorização:** combinar gravidade, urgência e tendência numa [matriz GUT](/index/matriz-gut-manutencao-predial).",
              "**Aprovação:** instruir projetos de restauro em órgãos de preservação, quando o bem é protegido.",
              "**Monitoramento:** comparar o estado do edifício ao longo do tempo e verificar se a intervenção funcionou.",
            ],
          },
        ],
      },
      {
        id: "quando",
        title: "Quando o mapa de danos é necessário",
        blocks: [
          { p: "Ele aparece em praticamente todo trabalho de recuperação de fachadas, em laudos de [inspeção predial](/index/inspecao-predial-nbr-16747), em perícias e, de forma central, em projetos de restauro de bens tombados, em que os órgãos de preservação costumam pedir o levantamento do estado de conservação antes de aprovar qualquer intervenção." },
          { p: "Também é a primeira etapa recomendada antes de contratar uma obra de fachada: sem ele, o orçamento vira estimativa por verba, e a obra costuma terminar com aditivos." },
        ],
      },
      {
        id: "o-que-precisa-ter",
        title: "O que um bom mapa de danos precisa ter",
        blocks: [
          {
            list: [
              "Base em escala real (elevação desenhada, ortofoto ou foto retificada), com a escala indicada.",
              "Identificação de cada elemento (fachada, pano, pilar, esquadria) e da vistoria (data, responsável).",
              "Legenda padronizada, com cores e hachuras consistentes entre todas as pranchas.",
              "Quantitativos por tipo de dano: área, comprimento ou unidades.",
              "Registro fotográfico de apoio, ligado às regiões do mapa.",
              "Observações sobre causas prováveis e recomendações, que alimentam o [laudo](/index/laudo-de-fachada).",
            ],
          },
        ],
      },
      {
        id: "como-fazer",
        title: "Como fazer um mapa de danos, passo a passo",
        blocks: [
          { p: "O método tradicional tem cinco etapas: levantamento fotográfico, montagem da base em escala, vetorização dos danos (normalmente no CAD), cálculo dos quantitativos em planilha e redação do laudo. O passo a passo detalhado está no guia [mapa de danos em fachada](/index/mapa-de-danos-fachada-passo-a-passo)." },
          { p: "O gargalo costuma estar na base em escala e no desenho dos danos: fotos tiradas em ângulo precisam ser corrigidas, e cada mancha precisa ser contornada à mão. Em fachadas grandes, isso consome dias." },
          { p: "Ferramentas como o ArchRay encurtam esse caminho: a fachada é filmada com o celular, a [fotogrametria](/index/fotogrametria-arquitetura) gera o modelo 3D e a imagem em escala, a visão computacional sugere os danos e o profissional confirma. Quantitativos, orçamento, prioridades e laudo saem do mesmo lugar." },
        ],
      },
      {
        id: "patrimonio",
        title: "Mapa de danos em patrimônio histórico",
        blocks: [
          { p: "Em edifícios históricos, o mapa ganha camadas: materiais originais e acréscimos, prospecções, intervenções anteriores. O assunto está em [mapa de danos em patrimônio histórico](/index/mapa-de-danos-patrimonio-historico). Escritórios especializados, como o [Estúdio Restaura](" + ER.servicos + "), usam o mapa como ponto de partida do projeto de restauro." },
        ],
      },
    ],
    faq: [
      { q: "Qual a diferença entre mapa de danos e laudo?", a: "O mapa é o registro gráfico dos danos, com localização e extensão. O laudo é o documento técnico que interpreta o mapa, aponta causas prováveis, recomenda tratamentos e prioridades e é assinado por um profissional habilitado." },
      { q: "Quem pode fazer um mapa de danos?", a: "O levantamento pode ser feito por uma equipe técnica, mas o diagnóstico e o laudo que se apoiam nele devem ser assinados por arquiteto ou engenheiro habilitado, com o registro de responsabilidade técnica (RRT ou ART)." },
      { q: "Dá para fazer mapa de danos só com fotos?", a: "Sim, desde que as fotos sejam corrigidas para uma base em escala (retificação ou ortofoto). Fotos em ângulo, sem correção, distorcem áreas e comprimentos." },
      { q: "Quanto tempo leva para fazer um mapa de danos?", a: "Depende do tamanho e do método. No fluxo tradicional, com CAD e planilha, uma fachada média pode levar dias. Com captura por vídeo e sugestão automática de danos, o tempo de escritório cai bastante, mas a revisão do profissional continua indispensável." },
    ],
  }),

  article({
    slug: "mapa-de-danos-fachada-passo-a-passo",
    title: "Mapa de danos em fachada: passo a passo do levantamento ao laudo",
    seoTitle: "Mapa de danos de fachada: passo a passo prático",
    summary: "Como fazer o mapa de danos de uma fachada em seis etapas: planejamento, captura, base em escala, marcação dos danos, quantitativos e laudo, com dicas para evitar retrabalho.",
    category: CAT,
    keywords: ["mapa de danos fachada", "como fazer mapa de danos de fachada", "levantamento de danos fachada", "mapeamento de fachada"],
    intro: [
      "Fazer o mapa de danos de uma fachada é, antes de tudo, organizar informação: ver tudo, registrar tudo na mesma escala e não perder nada no caminho até o orçamento. Este guia prático mostra as seis etapas, do planejamento da visita ao laudo final.",
    ],
    sections: [
      {
        id: "planejar",
        title: "1. Planejar a vistoria",
        blocks: [
          { p: "Antes de ir a campo, defina o escopo (quais fachadas e elementos), separe desenhos existentes e verifique as condições de acesso. Para fachadas altas, avalie se haverá necessidade de andaime, balancim ou drone para ver os pavimentos superiores de perto." },
          { p: "Escolha o horário: luz difusa, em dia nublado, revela melhor manchas e fissuras do que sol forte com sombras duras." },
        ],
      },
      {
        id: "capturar",
        title: "2. Capturar a fachada",
        blocks: [
          { p: "O registro precisa cobrir a fachada inteira com sobreposição entre imagens. No método tradicional, são fotos frontais, uma ao lado da outra. Com a [fotogrametria](/index/fotogrametria-arquitetura), basta filmar caminhando paralelo à fachada, numa passada com a câmera reta e outra mirando a parte alta." },
          { p: "Inclua uma referência de medida: uma trena aberta, uma porta medida ou um [marcador de escala](/index/escala-fotogrametria-marcador). Sem ela, a fachada não terá medidas reais." },
        ],
      },
      {
        id: "base",
        title: "3. Montar a base em escala",
        blocks: [
          { p: "A base é a imagem ou o desenho sobre o qual os danos serão marcados. Pode ser uma elevação em CAD, uma foto retificada ou uma [ortofoto](/index/ortofoto-fachada-retificacao) gerada a partir do modelo 3D. O importante é que um metro na imagem corresponda a um metro na fachada, em toda a superfície." },
          { callout: "Se a base estiver distorcida, cada área calculada estará errada, e o erro vai direto para o orçamento." },
        ],
      },
      {
        id: "marcar",
        title: "4. Marcar os danos",
        blocks: [
          { p: "Contorne cada manifestação com a cor da [legenda](/index/legenda-mapa-de-danos): áreas para manchas, desplacamentos e biodeterioração; linhas para [fissuras e trincas](/index/fissura-trinca-rachadura-diferenca); pontos para danos localizados." },
          { p: "Trabalhe por elemento e por tipo, de cima para baixo, para não pular regiões. Ferramentas com detecção automática sugerem os danos e aceleram a etapa, mas cada sugestão deve ser revisada: a decisão final é do profissional." },
        ],
      },
      {
        id: "quantificar",
        title: "5. Levantar os quantitativos",
        blocks: [
          {
            table: {
              head: ["Tipo de dano", "Unidade usual"],
              rows: [
                ["Fissuras e trincas", "metro linear (m)"],
                ["Manchas, sujidade, biodeterioração", "metro quadrado (m²)"],
                ["Desplacamento de reboco ou cerâmica", "metro quadrado (m²)"],
                ["Peças faltantes, ferragens expostas", "unidade (un)"],
              ],
              caption: "As unidades dos quantitativos acompanham o serviço que será orçado.",
            },
          },
          { p: "Os quantitativos alimentam o [orçamento de recuperação](/index/orcamento-recuperacao-fachada) e a [matriz GUT](/index/matriz-gut-manutencao-predial)." },
        ],
      },
      {
        id: "laudo",
        title: "6. Redigir o laudo",
        blocks: [
          { p: "O mapa vira laudo quando ganha interpretação: causas prováveis, tratamentos recomendados, prioridades e prazos. Veja o que não pode faltar em [laudo de fachada](/index/laudo-de-fachada)." },
        ],
      },
    ],
    faq: [
      { q: "Preciso de andaime para fazer o mapa de danos?", a: "Para o mapa visual, nem sempre: uma boa captura do chão e de pontos elevados resolve muitos casos. Para confirmar desplacamentos (teste de percussão) ou ver detalhes de pavimentos altos, o acesso próximo continua necessário." },
      { q: "Qual a melhor escala para o mapa de danos de fachada?", a: "Depende do tamanho da fachada e do nível de detalhe. Em imagens digitais, pense em milímetros por pixel: quanto menor, mais detalhe. Para pranchas impressas, 1:50 e 1:100 são escalas comuns." },
    ],
  }),

  article({
    slug: "legenda-mapa-de-danos",
    title: "Legenda de mapa de danos: cores, hachuras e símbolos",
    seoTitle: "Legenda de mapa de danos: cores e símbolos",
    summary: "Como montar uma legenda clara para o mapa de danos: grupos de manifestações, cores, hachuras, linhas e boas práticas para que qualquer pessoa leia o mapa sem dúvida.",
    category: CAT,
    keywords: ["legenda mapa de danos", "simbologia mapa de danos", "cores mapa de danos", "hachuras mapa de danos"],
    intro: [
      "A legenda é o que transforma manchas coloridas em informação. Uma legenda confusa, com cores parecidas ou categorias que se sobrepõem, compromete a leitura do mapa e a confiança no laudo. Não existe uma única legenda obrigatória no Brasil, mas existem boas práticas que valem para qualquer projeto.",
    ],
    sections: [
      {
        id: "grupos",
        title: "Organize por grupos de manifestação",
        blocks: [
          { p: "Agrupar os danos por natureza facilita a leitura e o orçamento. Um agrupamento usual:" },
          {
            table: {
              head: ["Grupo", "Exemplos"],
              rows: [
                ["Fissuração", "fissura, trinca, rachadura"],
                ["Estrutura", "deformação, abaulamento, armadura exposta"],
                ["Umidade", "umidade ascendente, infiltração, eflorescência"],
                ["Revestimento", "desagregação, perda de reboco, descolamento de pintura, sujidade e crosta negra"],
                ["Biológico", "biodeterioração (fungos, liquens), vegetação parasita, xilófagos"],
              ],
            },
          },
          { p: "Cada grupo tem um guia próprio: [fissuras](/index/fissura-trinca-rachadura-diferenca), [umidade ascendente](/index/umidade-ascendente), [eflorescência](/index/eflorescencia-na-parede), [descolamento de revestimento](/index/descolamento-reboco-revestimento-fachada), [biodeterioração](/index/biodeterioracao-fachadas) e [crosta negra](/index/crosta-negra-sujidade-fachada)." },
        ],
      },
      {
        id: "cores",
        title: "Cores e hachuras",
        blocks: [
          {
            list: [
              "Use famílias de cor por grupo: tons de azul para umidade, de laranja e amarelo para revestimento, de verde para biológico, de vermelho para fissuras e problemas estruturais.",
              "Diferencie itens do mesmo grupo pelo tom e pela hachura, não só pela cor: o mapa precisa funcionar impresso em preto e branco e para pessoas com daltonismo.",
              "Áreas com preenchimento semitransparente deixam ver a fachada por baixo.",
              "Linhas (fissuras) com espessura e tipo de traço próprios, para não confundir com contornos de área.",
            ],
          },
          { callout: "Teste a legenda imprimindo uma prancha em tons de cinza: se você não distingue os danos, o leitor também não vai distinguir." },
        ],
      },
      {
        id: "codigos",
        title: "Códigos curtos ajudam o orçamento",
        blocks: [
          { p: "Além da cor, atribua um código curto a cada dano (por exemplo, FIS para fissura, UMA para umidade ascendente, DPT para descolamento de pintura). O código liga o mapa à planilha de quantitativos e ao [orçamento](/index/orcamento-recuperacao-fachada), e evita ambiguidade entre equipes." },
          { p: "No ArchRay, a biblioteca de danos já vem com grupos, cores e códigos, e pode ser personalizada com os preços de tratamento de cada escritório." },
        ],
      },
      {
        id: "consistencia",
        title: "Consistência em todo o projeto",
        blocks: [
          { p: "Use a mesma legenda em todas as fachadas e vistorias. Isso permite comparar o estado do edifício ao longo do tempo, como mostra o guia de [monitoramento de danos](/index/monitoramento-danos-comparar-vistorias)." },
        ],
      },
    ],
    faq: [
      { q: "Existe uma legenda oficial de mapa de danos?", a: "Não há uma legenda única obrigatória no Brasil. Cada escritório e cada órgão pode adotar a sua. O importante é que ela seja clara, consistente e explicada na prancha." },
      { q: "Quantas cores usar no mapa de danos?", a: "O suficiente para separar os tipos relevantes do projeto, sem exagero. Mapas com muitas categorias quase iguais ficam ilegíveis; agrupe o que tem o mesmo tratamento." },
    ],
  }),

  article({
    slug: "mapa-de-danos-patrimonio-historico",
    title: "Mapa de danos em patrimônio histórico: o que muda",
    seoTitle: "Mapa de danos em patrimônio histórico e tombado",
    summary: "Em edifícios históricos, o mapa de danos precisa registrar materiais, camadas e intervenções anteriores. Veja o que muda, como documentar e como ele embasa o projeto de restauro.",
    category: CAT,
    keywords: ["mapa de danos patrimônio histórico", "mapa de danos restauro", "mapa de danos IPHAN", "levantamento estado de conservação"],
    intro: [
      "No patrimônio histórico, o mapa de danos não serve só para orçar. Ele documenta o estado de conservação de um bem cultural num momento específico e embasa decisões que precisam respeitar a autenticidade do edifício. Por isso exige mais rigor e mais camadas de informação.",
    ],
    sections: [
      {
        id: "diferencas",
        title: "O que muda em relação a um edifício comum",
        blocks: [
          {
            list: [
              "**Materiais e técnicas tradicionais:** argamassas de cal, alvenarias de pedra ou tijolo, cantarias e pinturas à base de cal pedem diagnóstico específico.",
              "**Camadas do tempo:** repinturas, acréscimos e intervenções anteriores precisam ser identificados, não só os danos.",
              "**Prospecções:** pequenas janelas abertas no revestimento revelam camadas de pintura e argamassas originais e entram no registro.",
              "**Intervenção mínima:** o mapa ajuda a decidir o que tratar e o que apenas conservar, evitando substituições desnecessárias.",
            ],
          },
        ],
      },
      {
        id: "documentar",
        title: "Como documentar",
        blocks: [
          { p: "A base em escala continua sendo essencial: elevações precisas, [ortofotos](/index/ortofoto-fachada-retificacao) ou [nuvens de pontos](/index/nuvem-de-pontos) registram a geometria real, inclusive deformações, que em edifícios antigos são comuns e importantes." },
          { p: "Além dos danos, registre: materiais por região, elementos integrados (cantaria, esquadrias, gradis, azulejaria), intervenções anteriores e locais de prospecção. Uma [legenda](/index/legenda-mapa-de-danos) por camadas evita poluir uma única prancha." },
          { callout: "No restauro, o mapa de danos é documento histórico: daqui a dez anos, ele mostrará como o edifício estava antes da intervenção." },
        ],
      },
      {
        id: "orgaos",
        title: "Aprovação em órgãos de preservação",
        blocks: [
          { p: "Projetos de intervenção em bens tombados costumam passar por órgãos de preservação federais, estaduais ou municipais, conforme a proteção do bem. As exigências variam de órgão para órgão, mas o levantamento do estado de conservação, com mapa de danos e registro fotográfico, é peça recorrente desses processos. Consulte sempre as orientações do órgão responsável." },
          { p: "A preparação desses dossiês e a aprovação são etapas em que a experiência do escritório pesa. O [Estúdio Restaura](" + ER.servicos + ") atua da leitura histórica e das prospecções à aprovação e ao acompanhamento de obra." },
        ],
      },
      {
        id: "do-mapa-ao-projeto",
        title: "Do mapa ao projeto de restauro",
        blocks: [
          { p: "O mapa alimenta o diagnóstico, que leva às diretrizes de intervenção e ao projeto executivo de restauro. Entenda as etapas em [restauro de fachadas históricas](/index/restauro-fachadas-historicas) e o papel da [conservação preventiva](/index/conservacao-preventiva-edificios-historicos) depois da obra." },
          { p: "Repetido ao longo dos anos, o mapa vira ferramenta de monitoramento. Veja como comparar vistorias em [monitoramento de danos](/index/monitoramento-danos-comparar-vistorias)." },
        ],
      },
    ],
    faq: [
      { q: "O mapa de danos é obrigatório para restaurar um imóvel tombado?", a: "As exigências dependem do órgão de preservação e do tipo de intervenção. Na prática, o levantamento do estado de conservação, com mapa de danos e fotos, aparece com frequência nos processos de aprovação. Consulte o órgão responsável pelo bem." },
      { q: "Qual a diferença entre restauro e reforma em edifício histórico?", a: "A reforma busca adequar o uso e pode substituir materiais livremente. O restauro preserva a autenticidade: intervém o mínimo necessário, usa materiais compatíveis e reversíveis e documenta tudo." },
    ],
  }),

  article({
    slug: "mapa-de-danos-autocad-ou-software",
    title: "Mapa de danos no AutoCAD ou em software próprio? Comparativo",
    seoTitle: "Mapa de danos: AutoCAD x software especializado",
    summary: "Comparativo honesto entre fazer o mapa de danos no AutoCAD (com fotos e planilha) e usar um software especializado: tempo, precisão, quantitativos, laudo e custo.",
    category: CAT,
    keywords: ["mapa de danos autocad", "software mapa de danos", "programa para mapa de danos", "mapa de danos digital"],
    intro: [
      "Boa parte dos mapas de danos no Brasil ainda é feita no AutoCAD: foto de fundo, polilinhas por cima, hachuras e uma planilha ao lado. Funciona, mas é lento e sujeito a erro. Softwares especializados surgiram para encurtar esse caminho. Qual escolher depende do volume de trabalho e do tipo de entrega.",
    ],
    sections: [
      {
        id: "cad",
        title: "Como é o fluxo no AutoCAD",
        blocks: [
          {
            list: [
              "Fotografar a fachada e corrigir as fotos (ou desenhar a elevação).",
              "Inserir a imagem no CAD e ajustar a escala com uma medida conhecida.",
              "Desenhar cada dano com polilinhas e hachuras, em camadas por tipo.",
              "Extrair áreas e comprimentos (comando de propriedades ou rotinas próprias) para a planilha.",
              "Montar pranchas, legenda e o laudo em outro programa.",
            ],
          },
          { p: "**Vantagens:** controle total do desenho, software que o escritório já conhece, pranchas no padrão de sempre. **Desvantagens:** muito trabalho manual, retrabalho ao mudar algo, quantitativos que dependem de cuidado para não pular regiões e nenhuma ligação automática com orçamento e laudo." },
        ],
      },
      {
        id: "software",
        title: "Como é num software especializado",
        blocks: [
          { p: "Um software de mapa de danos já nasce com a [legenda](/index/legenda-mapa-de-danos), a escala e os quantitativos integrados. Cada dano marcado entra direto nas tabelas, no orçamento e no laudo." },
          { p: "No ArchRay, por exemplo, a captura é feita filmando a fachada com o celular; a [fotogrametria](/index/fotogrametria-arquitetura) gera a imagem em escala; a [inteligência artificial](/index/inteligencia-artificial-inspecao-predial) sugere os danos; e o profissional revisa. Quantitativos, [matriz GUT](/index/matriz-gut-manutencao-predial), orçamento e laudo em PDF são gerados no mesmo lugar, e há exportação em DXF para quem quiser continuar no CAD." },
        ],
      },
      {
        id: "comparativo",
        title: "Comparativo lado a lado",
        blocks: [
          {
            table: {
              head: ["Critério", "AutoCAD + planilha", "Software especializado"],
              rows: [
                ["Base em escala", "Manual (correção de fotos ou desenho)", "Gerada a partir das imagens"],
                ["Marcação dos danos", "100% manual", "Sugestão automática + revisão"],
                ["Quantitativos", "Extração manual", "Automáticos, por tipo e elemento"],
                ["Orçamento e laudo", "Em outros programas", "Integrados"],
                ["Comparar vistorias", "Difícil", "Previsto na ferramenta"],
                ["Curva de aprendizado", "Baixa para quem já usa CAD", "Baixa, mas é uma ferramenta nova"],
              ],
            },
          },
        ],
      },
      {
        id: "quando-usar",
        title: "Quando usar cada um",
        blocks: [
          { p: "Para um projeto isolado, com desenhos já prontos e equipe acostumada ao CAD, o fluxo tradicional pode bastar. Para quem faz mapas com frequência, precisa de orçamento e laudo rápidos ou acompanha o mesmo edifício ao longo do tempo, o software especializado tende a compensar." },
          { callout: "Não é preciso abandonar o CAD: o ideal é usar a ferramenta especializada para levantar e quantificar, e exportar para o CAD o que precisar de detalhamento." },
        ],
      },
    ],
    faq: [
      { q: "Dá para exportar o mapa de danos do ArchRay para o AutoCAD?", a: "Sim. O mapa pode ser exportado em DXF, com os danos em camadas, para continuar o detalhamento no CAD." },
      { q: "Software de mapa de danos substitui o arquiteto ou engenheiro?", a: "Não. A ferramenta acelera o levantamento, a marcação e os cálculos, mas o diagnóstico, a revisão dos danos e a assinatura do laudo continuam sendo do profissional responsável." },
    ],
  }),
];
