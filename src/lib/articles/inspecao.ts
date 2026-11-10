import { article, ER } from "./helper";

const CAT = "Inspeção e laudo";

export const INSPECAO = [
  article({
    slug: "inspecao-predial-nbr-16747",
    title: "Inspeção predial segundo a NBR 16747: guia prático",
    seoTitle: "Inspeção predial NBR 16747: guia prático",
    summary: "O que é a inspeção predial, o que a ABNT NBR 16747 estabelece, como é feita na prática e onde entram o mapa de danos e o laudo.",
    category: CAT,
    keywords: ["inspeção predial", "NBR 16747", "norma de inspeção predial", "laudo de inspeção predial", "inspeção predial o que é"],
    intro: [
      "A **inspeção predial** é a avaliação das condições técnicas, de uso, de operação e de manutenção de uma edificação. No Brasil, a referência é a **ABNT NBR 16747** (Inspeção predial: diretrizes, conceitos, terminologia, requisitos e procedimento), publicada em 2020, que organizou um campo antes regido sobretudo por práticas de mercado.",
      "Este guia resume como a inspeção funciona na prática e como o mapa de danos e o laudo se encaixam nela.",
    ],
    sections: [
      {
        id: "o-que-e",
        title: "O que é a inspeção predial",
        blocks: [
          { p: "É uma vistoria predominantemente sensorial (visual, com apoio de instrumentos simples) dos sistemas da edificação: estrutura aparente, fachadas, coberturas, impermeabilizações, instalações, esquadrias e áreas comuns. O objetivo é identificar irregularidades, avaliar o estado de conservação e orientar a manutenção." },
          { p: "A inspeção não substitui ensaios e investigações aprofundadas: quando encontra algo que exige análise específica, ela recomenda esse aprofundamento." },
        ],
      },
      {
        id: "etapas",
        title: "Etapas usuais",
        blocks: [
          {
            list: [
              "**Levantamento de dados e documentos:** projetos, manuais, histórico de manutenção e intervenções.",
              "**Entrevista com responsáveis** (síndico, gestor, zelador) sobre uso e problemas conhecidos.",
              "**Vistoria em campo,** sistema por sistema, com registro fotográfico.",
              "**Classificação das irregularidades** e avaliação do estado de conservação.",
              "**Recomendações organizadas por prioridade.**",
              "**Laudo** assinado pelo responsável técnico.",
            ],
          },
        ],
      },
      {
        id: "fachadas",
        title: "Onde entra o mapa de danos",
        blocks: [
          { p: "Fachadas costumam concentrar boa parte das irregularidades: [fissuras](/index/fissura-trinca-rachadura-diferenca), [descolamentos](/index/descolamento-reboco-revestimento-fachada), [umidade](/index/umidade-ascendente) e [biodeterioração](/index/biodeterioracao-fachadas). Registrar tudo isso só em fotos soltas dificulta quantificar e priorizar. O [mapa de danos](/index/mapa-de-danos) dá à inspeção de fachada localização, extensão e quantitativos." },
          { callout: "Fotos mostram que o dano existe. O mapa mostra onde, quanto e o que vem primeiro." },
        ],
      },
      {
        id: "prioridades",
        title: "Prioridades e manutenção",
        blocks: [
          { p: "Uma inspeção útil termina numa lista clara do que fazer primeiro. Muitos profissionais usam a [matriz GUT](/index/matriz-gut-manutencao-predial) para ordenar as recomendações, combinando gravidade, urgência e tendência. Essas recomendações alimentam o plano de manutenção da edificação, que tem como referência a ABNT NBR 5674." },
          { p: "Para condomínios, veja também o guia de [inspeção de fachadas em condomínios](/index/inspecao-fachada-condominio)." },
        ],
      },
      {
        id: "laudo",
        title: "O laudo e a responsabilidade técnica",
        blocks: [
          { p: "O resultado é um laudo técnico assinado por profissional habilitado, com registro de responsabilidade técnica. Veja [o que deve conter um laudo de fachada](/index/laudo-de-fachada) e [como funcionam ART e RRT](/index/art-rrt-laudo-tecnico)." },
          { p: "Em edifícios históricos, a inspeção se soma ao diagnóstico de materiais e ao histórico do bem. É o tipo de trabalho do [Estúdio Restaura](" + ER.servicos + ")." },
        ],
      },
    ],
    faq: [
      { q: "A inspeção predial é obrigatória?", a: "A NBR 16747 define como a inspeção deve ser feita, mas a obrigatoriedade e a periodicidade dependem da legislação local. Alguns municípios têm leis próprias de inspeção predial. Consulte as regras da sua cidade." },
      { q: "Quem pode fazer inspeção predial?", a: "Arquitetos e engenheiros habilitados, que assinam o laudo e registram a responsabilidade técnica (RRT no CAU ou ART no CREA)." },
      { q: "De quanto em quanto tempo inspecionar?", a: "Depende da idade, do uso, do estado e da legislação local. Como prática, inspeções periódicas programadas evitam que pequenos problemas virem grandes reparos." },
    ],
  }),

  article({
    slug: "laudo-de-fachada",
    title: "Laudo de fachada: o que deve conter e como fazer",
    seoTitle: "Laudo de fachada: o que deve conter (checklist)",
    summary: "Checklist do laudo técnico de fachada: identificação, metodologia, mapa de danos, diagnóstico, recomendações, prioridades, orçamento e responsabilidade técnica.",
    category: CAT,
    keywords: ["laudo de fachada", "laudo técnico de fachada", "o que deve conter um laudo de fachada", "laudo de inspeção de fachada"],
    intro: [
      "O laudo de fachada é o documento que transforma uma vistoria em decisão: ele diz o que há na fachada, por que aconteceu, o que fazer, em que ordem e quanto deve custar. Um laudo bem estruturado evita discussões, aditivos de obra e decisões no escuro.",
    ],
    sections: [
      {
        id: "estrutura",
        title: "Estrutura recomendada",
        blocks: [
          {
            list: [
              "**Identificação:** edificação, endereço, contratante, responsável técnico e data da vistoria.",
              "**Objetivo e escopo:** quais fachadas e elementos foram avaliados e com que finalidade.",
              "**Metodologia:** como a vistoria foi feita (inspeção visual, percussão, captura por fotogrametria, instrumentos) e as limitações.",
              "**Caracterização da fachada:** sistema construtivo, revestimentos, idade aproximada, intervenções anteriores.",
              "**Mapa de danos:** pranchas em escala com legenda e quantitativos.",
              "**Diagnóstico:** manifestações encontradas e causas prováveis.",
              "**Recomendações:** tratamento por tipo de dano.",
              "**Prioridades:** ordem de execução, com critério explícito (por exemplo, matriz GUT).",
              "**Estimativa de custos**, quando faz parte do escopo.",
              "**Anexos:** registro fotográfico e responsabilidade técnica (ART ou RRT).",
            ],
          },
        ],
      },
      {
        id: "mapa",
        title: "O mapa de danos é o coração do laudo",
        blocks: [
          { p: "Sem o [mapa de danos](/index/mapa-de-danos), o laudo fica em descrições genéricas como 'há fissuras em diversos pontos'. Com ele, cada recomendação aponta um local e uma quantidade: '42 m de fissuras no pano norte, 18 m² de reboco com som cavo no 4º pavimento'." },
          { callout: "Quantificar é o que separa um laudo técnico de uma opinião." },
        ],
      },
      {
        id: "diagnostico",
        title: "Diagnóstico: separar sintoma de causa",
        blocks: [
          { p: "Para cada grupo de [manifestações patológicas](/index/manifestacoes-patologicas-fachadas), o laudo deve indicar a causa provável e, quando não for possível concluir só pela inspeção visual, recomendar investigações complementares (ensaios, prospecções, monitoramento de fissuras)." },
        ],
      },
      {
        id: "prioridades",
        title: "Prioridades e orçamento",
        blocks: [
          { p: "A [matriz GUT](/index/matriz-gut-manutencao-predial) organiza o que fazer primeiro, e os quantitativos do mapa permitem estimar o custo de cada etapa. Veja como montar o [orçamento de recuperação da fachada](/index/orcamento-recuperacao-fachada)." },
        ],
      },
      {
        id: "ferramentas",
        title: "Como a tecnologia ajuda",
        blocks: [
          { p: "No ArchRay, o laudo é montado a partir do próprio mapa: os danos confirmados viram quantitativos, o orçamento usa a tabela de preços do escritório, as prioridades são calculadas pela GUT e o PDF sai com pranchas, tabelas e textos editáveis. O profissional revisa e assina." },
          { p: "Para modelos de texto e estrutura, veja também [laudo técnico de patologias: estrutura e modelo](/index/laudo-tecnico-patologias-modelo)." },
        ],
      },
    ],
    faq: [
      { q: "Quem assina o laudo de fachada?", a: "Um arquiteto ou engenheiro habilitado, com registro de responsabilidade técnica: RRT no CAU ou ART no CREA." },
      { q: "Laudo de fachada precisa de orçamento?", a: "Não obrigatoriamente, mas uma estimativa de custos por prioridade ajuda muito o cliente a decidir e planejar a obra." },
      { q: "Quanto tempo vale um laudo de fachada?", a: "Ele retrata o estado da fachada na data da vistoria. Como os danos evoluem, laudos antigos devem ser atualizados antes de contratar obras." },
    ],
  }),

  article({
    slug: "laudo-tecnico-patologias-modelo",
    title: "Laudo técnico de patologias: estrutura e modelo comentado",
    seoTitle: "Laudo técnico de patologia: estrutura e modelo",
    summary: "Modelo comentado de laudo técnico de manifestações patológicas, seção por seção, com exemplos de redação clara e o que evitar.",
    category: CAT,
    keywords: ["laudo técnico de patologia", "modelo de laudo técnico", "laudo de patologia das construções", "como fazer laudo técnico"],
    intro: [
      "Um bom laudo técnico se lê sem esforço: frases objetivas, conclusões amparadas em evidências e recomendações que qualquer gestor consegue executar. Este modelo comentado mostra a estrutura e exemplos de redação para cada seção.",
    ],
    sections: [
      {
        id: "modelo",
        title: "Modelo seção por seção",
        blocks: [
          {
            table: {
              head: ["Seção", "O que escrever", "Exemplo de redação"],
              rows: [
                ["Objetivo", "Finalidade do laudo", "Avaliar o estado de conservação das fachadas e recomendar intervenções priorizadas."],
                ["Metodologia", "Como foi feita a vistoria", "Inspeção visual, ensaio de percussão nas áreas acessíveis e captura por fotogrametria com escala pelo marcador."],
                ["Constatações", "O que foi encontrado, com localização", "Pano norte: 18,4 m² de reboco com som cavo entre o 3º e o 5º pavimentos."],
                ["Diagnóstico", "Causa provável", "Perda de aderência associada à infiltração pela platibanda sem rufo."],
                ["Recomendação", "O que fazer", "Remover e recompor o reboco afetado após instalação de rufo metálico."],
                ["Prioridade", "Quando fazer", "Prioridade 1: risco de queda sobre área de circulação."],
              ],
            },
          },
        ],
      },
      {
        id: "boas-praticas",
        title: "Boas práticas de redação",
        blocks: [
          {
            list: [
              "Uma constatação por frase, sempre com local e quantidade.",
              "Separar o que foi observado do que é hipótese ('provável', 'indica').",
              "Declarar limitações: áreas não acessadas, ensaios não realizados.",
              "Evitar adjetivos vagos ('grave', 'muito danificado') sem critério; usar a [matriz GUT](/index/matriz-gut-manutencao-predial).",
              "Ligar cada recomendação a uma região do [mapa de danos](/index/mapa-de-danos).",
            ],
          },
          { callout: "Se uma frase do laudo não ajuda alguém a decidir ou executar algo, ela provavelmente pode sair." },
        ],
      },
      {
        id: "erros",
        title: "Erros comuns",
        blocks: [
          {
            list: [
              "Fotos sem localização nem legenda.",
              "Quantitativos estimados 'a olho', sem base em escala.",
              "Recomendações genéricas ('tratar as fissuras') sem método.",
              "Ausência de prioridade, o que deixa o cliente sem saber por onde começar.",
              "Laudo sem responsabilidade técnica registrada (veja [ART e RRT](/index/art-rrt-laudo-tecnico)).",
            ],
          },
        ],
      },
      {
        id: "gerar",
        title: "Gerar o laudo a partir do mapa",
        blocks: [
          { p: "No ArchRay, cada seção do laudo já vem com um texto padrão editável, preenchido com os dados do projeto: quantitativos, prioridades e orçamento. Só o que você muda fica salvo. Veja o que não pode faltar em [laudo de fachada](/index/laudo-de-fachada)." },
          { p: "Para patrimônio histórico, o laudo dialoga com o projeto de restauro. Exemplos de trabalhos estão nos [projetos do Estúdio Restaura](" + ER.projetos + ")." },
        ],
      },
    ],
    faq: [
      { q: "Existe um modelo oficial de laudo técnico?", a: "Não existe um modelo único obrigatório. Normas como a NBR 16747 (inspeção predial) indicam o conteúdo mínimo de certos tipos de laudo, e cada profissional organiza a apresentação." },
      { q: "Posso usar o mesmo laudo para vários prédios?", a: "A estrutura sim; o conteúdo não. Cada laudo precisa retratar a edificação vistoriada, com constatações, quantitativos e fotos próprias." },
    ],
  }),

  article({
    slug: "matriz-gut-manutencao-predial",
    title: "Matriz GUT na manutenção predial: como priorizar intervenções",
    seoTitle: "Matriz GUT na manutenção predial: como usar",
    summary: "Como usar a matriz GUT (gravidade, urgência e tendência) para priorizar os reparos de uma edificação, com escala de notas, exemplo e cuidados.",
    category: CAT,
    keywords: ["matriz GUT", "matriz GUT manutenção predial", "GUT gravidade urgência tendência", "priorização de manutenção", "matriz GUT exemplo"],
    intro: [
      "Quase toda edificação tem mais problemas do que verba para resolvê-los de uma vez. A **matriz GUT** é uma ferramenta simples para decidir o que vem primeiro, combinando três critérios numa nota única. É muito usada em laudos de inspeção e planos de manutenção.",
    ],
    sections: [
      {
        id: "criterios",
        title: "Os três critérios",
        blocks: [
          {
            table: {
              head: ["Critério", "Pergunta", "Nota 1", "Nota 5"],
              rows: [
                ["Gravidade (G)", "Qual o impacto se nada for feito?", "Sem gravidade", "Extremamente grave (risco à vida, à estrutura)"],
                ["Urgência (U)", "Quanto tempo há para agir?", "Pode esperar", "Ação imediata"],
                ["Tendência (T)", "Como evolui sem intervenção?", "Não vai piorar", "Vai piorar rapidamente"],
              ],
              caption: "Notas de 1 a 5 em cada critério. A prioridade é o produto G × U × T, de 1 a 125.",
            },
          },
        ],
      },
      {
        id: "exemplo",
        title: "Exemplo aplicado a uma fachada",
        blocks: [
          {
            table: {
              head: ["Dano", "G", "U", "T", "G×U×T"],
              rows: [
                ["Revestimento com som cavo sobre a calçada", "5", "5", "4", "100"],
                ["Infiltração pela platibanda", "4", "4", "4", "64"],
                ["Fissuras de retração no reboco", "2", "2", "2", "8"],
                ["Sujidade em área protegida", "1", "1", "2", "2"],
              ],
            },
          },
          { p: "O resultado é uma lista ordenada: primeiro o risco de queda, depois a origem da água, e por último o que é estético. Os danos vêm do [mapa de danos](/index/mapa-de-danos), e os quantitativos alimentam o [orçamento por etapa](/index/orcamento-recuperacao-fachada)." },
        ],
      },
      {
        id: "cuidados",
        title: "Cuidados ao usar a GUT",
        blocks: [
          {
            list: [
              "Defina e escreva no laudo o que cada nota significa, para que a avaliação seja reproduzível.",
              "Avalie a causa junto com o sintoma: tratar a infiltração costuma vir antes de recuperar o reboco que ela danificou.",
              "Risco à segurança de pessoas deve receber prioridade máxima, independentemente da conta.",
              "Revise a matriz a cada vistoria: a tendência muda.",
            ],
          },
          { callout: "A GUT não substitui o julgamento técnico; ela organiza e torna transparente o raciocínio do profissional." },
        ],
      },
      {
        id: "no-archray",
        title: "GUT automática no ArchRay",
        blocks: [
          { p: "No ArchRay, cada tipo de dano já vem com notas G, U e T sugeridas, que podem ser ajustadas por projeto. A prioridade aparece no mapa, nas tabelas e no [laudo](/index/laudo-de-fachada)." },
        ],
      },
    ],
    faq: [
      { q: "Quem criou a matriz GUT?", a: "A técnica é atribuída a Charles Kepner e Benjamin Tregoe, como ferramenta de análise e priorização de problemas, e foi incorporada à gestão da qualidade e à manutenção." },
      { q: "A matriz GUT é exigida por norma?", a: "Não especificamente. Ela é uma das formas de organizar as prioridades que laudos de inspeção devem apresentar. O importante é que o critério seja explícito." },
    ],
  }),

  article({
    slug: "orcamento-recuperacao-fachada",
    title: "Orçamento de recuperação de fachada: como calcular quantitativos e custos",
    seoTitle: "Orçamento de recuperação de fachada: como calcular",
    summary: "Como montar o orçamento de recuperação de uma fachada a partir do mapa de danos: quantitativos por serviço, composições, itens indiretos e erros que geram aditivos.",
    category: CAT,
    keywords: ["orçamento recuperação de fachada", "quanto custa recuperar fachada", "quantitativos de fachada", "orçamento reforma de fachada"],
    intro: [
      "Orçamentos de fachada feitos 'por verba' ou por estimativa visual costumam terminar em aditivos. A forma mais segura de orçar é partir de quantitativos medidos sobre o [mapa de danos](/index/mapa-de-danos), serviço por serviço.",
    ],
    sections: [
      {
        id: "quantitativos",
        title: "1. Quantitativos por serviço",
        blocks: [
          { p: "Cada tipo de dano corresponde a um ou mais serviços de recuperação. O mapa fornece a quantidade na unidade certa:" },
          {
            table: {
              head: ["Dano no mapa", "Serviço típico", "Unidade"],
              rows: [
                ["Fissuras", "Abertura, tratamento e selagem", "m"],
                ["Reboco com som cavo", "Remoção e recomposição de reboco", "m²"],
                ["Descolamento de pintura", "Preparação e repintura", "m²"],
                ["Sujidade / crosta negra", "Limpeza", "m²"],
                ["Biodeterioração", "Limpeza com biocida", "m²"],
                ["Peças faltantes", "Recomposição / substituição", "un"],
              ],
            },
          },
        ],
      },
      {
        id: "precos",
        title: "2. Preços unitários",
        blocks: [
          { p: "Os preços unitários podem vir de composições próprias do escritório, de cotações com empreiteiros ou de bases de referência públicas, ajustadas à realidade local. O importante é que cada preço inclua material, mão de obra e encargos, e que a fonte esteja registrada." },
          { callout: "Preço sem fonte é chute. Registre de onde veio cada valor e a data da referência." },
        ],
      },
      {
        id: "indiretos",
        title: "3. Itens que costumam ser esquecidos",
        blocks: [
          {
            list: [
              "Acesso: andaimes, balancins, plataformas, com montagem e desmontagem.",
              "Proteções: telas, bandejas, isolamento de calçadas.",
              "Retirada de entulho e limpeza final.",
              "Margem para danos ocultos, que só aparecem quando o revestimento é aberto.",
              "Administração e BDI.",
            ],
          },
        ],
      },
      {
        id: "etapas",
        title: "4. Orçamento por prioridade",
        blocks: [
          { p: "Dividir o orçamento pelas prioridades da [matriz GUT](/index/matriz-gut-manutencao-predial) ajuda o cliente a decidir: o que é urgente (segurança, infiltração), o que pode ir para a próxima etapa e o que é estético. Para condomínios, isso facilita a aprovação em assembleia, como mostra o guia de [inspeção de fachadas em condomínios](/index/inspecao-fachada-condominio)." },
        ],
      },
      {
        id: "automatico",
        title: "Do mapa ao orçamento, automaticamente",
        blocks: [
          { p: "No ArchRay, cada dano da biblioteca tem um preço de tratamento editável. Ao marcar os danos sobre a fachada em escala, o orçamento se monta sozinho, por tipo e por prioridade, e entra no [laudo](/index/laudo-de-fachada). Os preços de fábrica são só um ponto de partida: devem ser revisados com os valores reais do escritório." },
        ],
      },
    ],
    faq: [
      { q: "Quanto custa recuperar uma fachada?", a: "Não existe preço único: depende da área, do tipo e da extensão dos danos, do acesso necessário e da região. Por isso o orçamento confiável começa pelo levantamento dos quantitativos." },
      { q: "Por que o orçamento de fachada costuma estourar?", a: "Principalmente por quantitativos estimados a olho, acesso não previsto e danos ocultos. Medir sobre uma base em escala e prever uma margem para o que só aparece na obra reduz o risco." },
    ],
  }),

  article({
    slug: "inspecao-fachada-condominio",
    title: "Inspeção de fachada em condomínio: responsabilidades e periodicidade",
    seoTitle: "Inspeção de fachada em condomínio: guia do síndico",
    summary: "Guia para síndicos e administradoras: por que inspecionar a fachada, quem é responsável, como planejar a inspeção e como levar o resultado à assembleia.",
    category: CAT,
    keywords: ["inspeção de fachada condomínio", "laudo de fachada condomínio", "síndico manutenção fachada", "reforma de fachada condomínio"],
    intro: [
      "A fachada é uma área comum do condomínio, e a sua conservação é responsabilidade coletiva, administrada pelo síndico. Placas de revestimento soltas, infiltrações e fissuras não são só questão estética: envolvem segurança, valorização do imóvel e responsabilidade civil.",
    ],
    sections: [
      {
        id: "responsabilidade",
        title: "Quem é responsável",
        blocks: [
          { p: "O Código Civil atribui ao síndico, entre outras funções, o dever de diligenciar a conservação e a guarda das partes comuns (art. 1.348). Na prática, isso inclui programar inspeções, contratar laudos e levar as obras necessárias à aprovação dos condôminos." },
          { p: "Além disso, alguns municípios têm leis próprias de inspeção predial, com prazos e exigências específicas. Vale consultar a legislação da sua cidade e as orientações do seu administrador." },
        ],
      },
      {
        id: "periodicidade",
        title: "Com que frequência inspecionar",
        blocks: [
          { p: "Não há um prazo único para todos os prédios. A frequência depende da idade, do tipo de revestimento, da exposição e do histórico. Uma boa prática é incluir a fachada no plano de manutenção, com inspeções periódicas e vistorias extras depois de eventos como chuvas fortes ou quedas de material." },
          { callout: "Esperar a primeira placa cair para chamar um técnico costuma sair muito mais caro, em dinheiro e em risco." },
        ],
      },
      {
        id: "como-contratar",
        title: "Como contratar a inspeção",
        blocks: [
          {
            list: [
              "Contrate arquiteto ou engenheiro habilitado, com [ART ou RRT](/index/art-rrt-laudo-tecnico).",
              "Peça que o laudo traga [mapa de danos](/index/mapa-de-danos) com quantitativos, não só fotos.",
              "Exija recomendações com prioridade, por exemplo pela [matriz GUT](/index/matriz-gut-manutencao-predial).",
              "Peça estimativa de custos por etapa, para planejar o caixa e o fundo de reserva.",
            ],
          },
        ],
      },
      {
        id: "assembleia",
        title: "Levando o resultado à assembleia",
        blocks: [
          { p: "Condôminos aprovam com mais facilidade quando entendem o problema. Um laudo com imagens da fachada em escala, danos coloridos por tipo e orçamento dividido por prioridade comunica muito melhor do que uma lista de defeitos. Veja como montar o [orçamento de recuperação](/index/orcamento-recuperacao-fachada) e o que deve conter um [laudo de fachada](/index/laudo-de-fachada)." },
          { p: "Repetir a inspeção ao longo dos anos permite mostrar a evolução, com [comparação entre vistorias](/index/monitoramento-danos-comparar-vistorias)." },
        ],
      },
    ],
    faq: [
      { q: "O síndico pode ser responsabilizado por queda de revestimento?", a: "A responsabilidade em casos concretos depende de análise jurídica. O que se recomenda é documentar a manutenção: inspeções periódicas, laudos e providências tomadas mostram a diligência na conservação das áreas comuns." },
      { q: "Precisa de assembleia para fazer o laudo de fachada?", a: "A contratação de um laudo costuma caber na gestão ordinária do síndico, conforme a convenção. As obras resultantes, dependendo do valor e da natureza, geralmente vão para aprovação em assembleia." },
    ],
  }),

  article({
    slug: "art-rrt-laudo-tecnico",
    title: "ART e RRT em laudos técnicos: o que são e quando emitir",
    seoTitle: "ART e RRT em laudos técnicos: o que são",
    summary: "O que são a ART (CREA) e o RRT (CAU), por que todo laudo técnico precisa de responsabilidade técnica registrada e o papel das ferramentas digitais nesse processo.",
    category: CAT,
    keywords: ["ART laudo técnico", "RRT laudo", "responsabilidade técnica laudo", "diferença entre ART e RRT"],
    intro: [
      "Todo laudo técnico de engenharia ou arquitetura precisa de um responsável identificado, com registro no conselho profissional. É isso que dão a **ART** (Anotação de Responsabilidade Técnica) e o **RRT** (Registro de Responsabilidade Técnica).",
    ],
    sections: [
      {
        id: "o-que-sao",
        title: "O que são",
        blocks: [
          {
            table: {
              head: ["Documento", "Conselho", "Profissionais", "Base legal"],
              rows: [
                ["ART", "CREA (sistema Confea/CREA)", "Engenheiros e outros profissionais do sistema", "Lei 6.496/1977"],
                ["RRT", "CAU", "Arquitetos e urbanistas", "Lei 12.378/2010"],
              ],
            },
          },
          { p: "Os dois registram quem é o responsável técnico por um serviço, que serviço é esse e onde ele foi feito. Servem de garantia para o contratante e de prova da autoria para o profissional." },
        ],
      },
      {
        id: "laudos",
        title: "Laudos, vistorias e inspeções",
        blocks: [
          { p: "Laudos de [inspeção predial](/index/inspecao-predial-nbr-16747), [laudos de fachada](/index/laudo-de-fachada), perícias e pareceres técnicos são atividades técnicas que exigem o registro de responsabilidade. Um laudo sem ART ou RRT perde força em discussões com seguradoras, órgãos públicos e na Justiça." },
          { callout: "O registro de responsabilidade técnica é o que transforma um relatório em documento técnico com autoria e respaldo." },
        ],
      },
      {
        id: "ferramentas",
        title: "E as ferramentas digitais?",
        blocks: [
          { p: "Softwares de levantamento, [fotogrametria](/index/fotogrametria-arquitetura), detecção automática de danos e geração de laudos aceleram o trabalho, mas não assumem a responsabilidade técnica. Quem revisa o [mapa de danos](/index/mapa-de-danos), interpreta os dados e assina o laudo é o profissional." },
          { p: "No ArchRay, toda sugestão automática precisa ser aceita pelo profissional antes de virar dano, e o laudo registra o método usado, inclusive quando houve apoio de visão computacional. Assim a tecnologia fica transparente para quem lê." },
        ],
      },
    ],
    faq: [
      { q: "Qual a diferença entre ART e RRT?", a: "A ART é emitida por profissionais do sistema Confea/CREA, como engenheiros. O RRT é emitido por arquitetos e urbanistas, no CAU. Ambos registram a responsabilidade técnica por um serviço." },
      { q: "Arquiteto pode fazer laudo de fachada?", a: "Sim, dentro das suas atribuições profissionais, com emissão de RRT. Engenheiros fazem o mesmo com ART. Em casos com questões estruturais específicas, pode ser necessário o parecer de um especialista." },
    ],
  }),
];
