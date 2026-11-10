import { article, ER } from "./helper";

const CAT = "Restauro e patrimônio";

export const RESTAURO = [
  article({
    slug: "restauro-fachadas-historicas",
    title: "Restauro de fachadas históricas: etapas, critérios e cuidados",
    seoTitle: "Restauro de fachadas históricas: etapas e critérios",
    summary: "Como é o restauro de uma fachada histórica, da leitura do edifício e do mapa de danos ao projeto, à obra e à manutenção, com os critérios que diferenciam restauro de reforma.",
    category: CAT,
    keywords: ["restauro de fachadas históricas", "restauração de fachada", "restauro de patrimônio histórico", "projeto de restauro", "fachada histórica"],
    intro: [
      "Restaurar uma fachada histórica não é deixá-la 'como nova'. É conservar o que ela tem de autêntico, tratar os danos com materiais compatíveis e deixar registro de tudo o que foi feito. Isso exige método, das primeiras visitas à manutenção depois da obra.",
    ],
    sections: [
      {
        id: "criterios",
        title: "Critérios que orientam o restauro",
        blocks: [
          {
            list: [
              "**Intervenção mínima:** tratar o necessário, conservar o máximo.",
              "**Compatibilidade:** materiais novos que trabalhem bem com os antigos (por exemplo, argamassas de cal sobre alvenarias tradicionais).",
              "**Reversibilidade:** sempre que possível, intervenções que possam ser desfeitas no futuro sem dano.",
              "**Distinguibilidade:** o que é novo deve ser identificável numa observação atenta, sem competir com o original.",
              "**Documentação:** registrar o antes, o durante e o depois.",
            ],
          },
          { p: "Esses princípios guiam o trabalho de escritórios especializados como o [Estúdio Restaura](" + ER.sobre + "), que atua com intervenção mínima, reversibilidade e documentação rigorosa." },
        ],
      },
      {
        id: "etapas",
        title: "As etapas",
        blocks: [
          {
            table: {
              head: ["Etapa", "O que acontece"],
              rows: [
                ["Pesquisa histórica", "Documentos, fotos antigas, intervenções anteriores"],
                ["Levantamento", "Geometria em escala: desenho, fotogrametria ou nuvem de pontos"],
                ["Mapa de danos e diagnóstico", "Registro dos danos, materiais e causas"],
                ["Prospecções e ensaios", "Camadas de pintura, argamassas, caracterização de materiais"],
                ["Projeto de restauro", "Diretrizes e especificações por tipo de dano e material"],
                ["Aprovação", "Órgãos de preservação, quando o bem é protegido"],
                ["Obra e acompanhamento", "Execução com fiscalização especializada"],
                ["Manutenção", "Plano de conservação preventiva"],
              ],
            },
          },
          { p: "O [mapa de danos em patrimônio histórico](/index/mapa-de-danos-patrimonio-historico) é a base técnica de todo o processo." },
        ],
      },
      {
        id: "danos",
        title: "Danos típicos de fachadas históricas",
        blocks: [
          { p: "[Umidade ascendente](/index/umidade-ascendente), [eflorescências](/index/eflorescencia-na-parede), perda de reboco, [crosta negra](/index/crosta-negra-sujidade-fachada) em cantarias, [biodeterioração](/index/biodeterioracao-fachadas) e fissuras ligadas a movimentações antigas são frequentes. Muitas vezes, agravados por intervenções anteriores com materiais incompatíveis, como rebocos de cimento e tintas impermeáveis." },
          { callout: "Boa parte dos danos em fachadas históricas vem de reformas anteriores bem-intencionadas e mal especificadas." },
        ],
      },
      {
        id: "projetos",
        title: "Exemplos",
        blocks: [
          { p: "Projetos de restauro de murais, painéis e fachadas podem ser vistos no [acervo de projetos do Estúdio Restaura](" + ER.projetos + "). No ArchRay, a [história da Igreja do Carmo, na Horta](/historias/carmo-da-horta) mostra o diagnóstico completo de uma fachada histórica, do levantamento ao laudo." },
          { p: "Para viabilizar a obra, muitos projetos de restauro recorrem a [leis de incentivo à cultura](/index/leis-de-incentivo-restauro-patrimonio)." },
        ],
      },
    ],
    faq: [
      { q: "Qual a diferença entre restauro e reforma?", a: "A reforma adapta o edifício e pode substituir materiais livremente. O restauro preserva a autenticidade, intervém o mínimo, usa materiais compatíveis e documenta tudo." },
      { q: "Posso pintar uma fachada histórica com tinta acrílica?", a: "Em alvenarias tradicionais, tintas pouco permeáveis podem prender a umidade e acelerar danos. A especificação deve considerar o material da parede; em bens protegidos, também as exigências do órgão de preservação." },
    ],
  }),

  article({
    slug: "conservacao-preventiva-edificios-historicos",
    title: "Conservação preventiva de edifícios históricos: como evitar grandes restauros",
    seoTitle: "Conservação preventiva de edifícios históricos",
    summary: "O que é conservação preventiva, quais rotinas evitam que pequenos danos virem restauros caros e como inspeções periódicas e mapas de danos sustentam o plano de manutenção.",
    category: CAT,
    keywords: ["conservação preventiva", "conservação de edifícios históricos", "manutenção de patrimônio histórico", "plano de conservação"],
    intro: [
      "Cada grande restauro costuma ser o resultado de anos de pequenos problemas não resolvidos: uma calha entupida, uma telha quebrada, uma fissura que deixou entrar água. A **conservação preventiva** atua antes, com rotinas simples e acompanhamento constante.",
    ],
    sections: [
      {
        id: "o-que-e",
        title: "O que é",
        blocks: [
          { p: "É o conjunto de ações que reduzem os riscos de degradação de um bem sem intervir diretamente nos seus materiais: controlar a água, a umidade, os agentes biológicos e o uso, e observar a evolução do estado de conservação." },
          { callout: "A água é a principal inimiga do patrimônio construído. Controlá-la já resolve boa parte da conservação." },
        ],
      },
      {
        id: "rotinas",
        title: "Rotinas que fazem diferença",
        blocks: [
          {
            list: [
              "Limpar calhas, rufos e condutores antes das chuvas.",
              "Revisar coberturas e substituir telhas quebradas.",
              "Manter a drenagem no entorno e afastar a água da base das paredes.",
              "Remover vegetação nascente em frestas, com cuidado.",
              "Monitorar fissuras e manchas, com registro datado.",
              "Controlar temperatura e umidade em interiores com acervo ou bens integrados.",
            ],
          },
          { p: "O [Estúdio Restaura](" + ER.servicos + ") elabora planos de manutenção por elemento, monitoramento de temperatura e umidade e treinamento de equipes locais." },
        ],
      },
      {
        id: "inspecoes",
        title: "Inspeções periódicas e mapas de danos",
        blocks: [
          { p: "Inspeções regulares, com [mapa de danos](/index/mapa-de-danos) na mesma base e com a mesma [legenda](/index/legenda-mapa-de-danos), mostram o que mudou desde a última visita. É isso que permite agir cedo, como explica o guia de [monitoramento de danos](/index/monitoramento-danos-comparar-vistorias)." },
          { p: "A lógica é a mesma da [inspeção predial](/index/inspecao-predial-nbr-16747), com a sensibilidade adicional que os materiais tradicionais exigem." },
        ],
      },
      {
        id: "custo",
        title: "Prevenir é mais barato",
        blocks: [
          { p: "Manutenção preventiva distribui custos ao longo do tempo e evita obras emergenciais. Também preserva mais material original, o que, em patrimônio, não tem preço. Quando o restauro for inevitável, veja as etapas em [restauro de fachadas históricas](/index/restauro-fachadas-historicas)." },
        ],
      },
    ],
    faq: [
      { q: "Qual a diferença entre conservação e restauro?", a: "A conservação preventiva atua sobre o ambiente e os riscos, para retardar a degradação. O restauro intervém diretamente nos materiais, para tratar danos já instalados." },
      { q: "De quanto em quanto tempo inspecionar um edifício histórico?", a: "Depende do estado e do uso, mas inspeções anuais, com vistorias extras após eventos climáticos fortes, são uma prática comum para manter o controle." },
    ],
  }),

  article({
    slug: "leis-de-incentivo-restauro-patrimonio",
    title: "Leis de incentivo para restauro de patrimônio: como viabilizar a obra",
    seoTitle: "Leis de incentivo para restauro de patrimônio",
    summary: "Como as leis de incentivo à cultura podem financiar o restauro de bens históricos, quais são os mecanismos mais conhecidos e por que um bom diagnóstico fortalece o projeto.",
    category: CAT,
    keywords: ["lei de incentivo restauro", "Lei Rouanet patrimônio", "financiamento restauro patrimônio histórico", "ProAC restauro", "captação de recursos restauro"],
    intro: [
      "Restaurar um bem histórico costuma custar caro, e muitos proprietários, igrejas e instituições não têm esse recurso. As **leis de incentivo à cultura** permitem que empresas e pessoas direcionem parte de impostos devidos a projetos culturais aprovados, inclusive de preservação do patrimônio.",
    ],
    sections: [
      {
        id: "como-funciona",
        title: "Como funciona, em linhas gerais",
        blocks: [
          {
            list: [
              "O proponente apresenta o projeto ao programa de incentivo (federal, estadual ou municipal).",
              "Após a aprovação, o projeto fica autorizado a captar recursos.",
              "Empresas ou pessoas patrocinam e abatem o valor, total ou parcialmente, de impostos, conforme as regras de cada programa.",
              "O proponente executa o projeto e presta contas.",
            ],
          },
          { callout: "Cada programa tem regras, prazos e limites próprios, que mudam com o tempo. Consulte sempre o edital e a regulamentação vigente." },
        ],
      },
      {
        id: "mecanismos",
        title: "Mecanismos mais conhecidos",
        blocks: [
          {
            list: [
              "**Lei Rouanet (Lei 8.313/1991),** de âmbito federal, que inclui o patrimônio cultural entre as áreas apoiadas.",
              "**Programas estaduais,** como o ProAC, em São Paulo, e as leis estaduais de incentivo à cultura de Minas Gerais e de Goiás (Goyazes), entre outros.",
              "**Leis municipais** de incentivo, em várias cidades.",
            ],
          },
        ],
      },
      {
        id: "diagnostico",
        title: "Por que o diagnóstico fortalece o projeto",
        blocks: [
          { p: "Projetos de restauro com levantamento em escala, [mapa de danos](/index/mapa-de-danos), diagnóstico e orçamento detalhado são mais convincentes para avaliadores e patrocinadores: mostram exatamente o que será feito, por quê e quanto custa. Veja como montar o [orçamento por quantitativos](/index/orcamento-recuperacao-fachada) e o [laudo](/index/laudo-de-fachada)." },
          { p: "Também facilitam a prestação de contas: o mapa de antes e o de depois mostram o resultado da obra, como explica o guia de [monitoramento de danos](/index/monitoramento-danos-comparar-vistorias)." },
        ],
      },
      {
        id: "apoio",
        title: "Apoio especializado",
        blocks: [
          { p: "A preparação de projetos culturais de restauro envolve diagnóstico técnico, projeto, orçamento, documentação e acompanhamento. O [Estúdio Restaura](" + ER.contato + ") atua no diagnóstico, no projeto e no acompanhamento de obras de patrimônio, e pode orientar sobre a viabilização por leis de incentivo." },
        ],
      },
    ],
    faq: [
      { q: "Imóvel particular tombado pode usar lei de incentivo?", a: "Depende das regras de cada programa e do enquadramento do projeto. Muitos programas aceitam projetos de preservação de bens tombados, com contrapartidas definidas no edital." },
      { q: "Quanto tempo leva para captar recursos?", a: "Varia muito: a aprovação depende dos prazos do programa, e a captação depende de encontrar patrocinadores. Planejar com antecedência é essencial." },
    ],
  }),

  article({
    slug: "monitoramento-danos-comparar-vistorias",
    title: "Monitoramento de danos: como comparar vistorias e medir a evolução",
    seoTitle: "Monitoramento de danos: comparar vistorias",
    summary: "Como comparar duas vistorias da mesma fachada para saber o que surgiu, cresceu, ficou estável ou foi tratado, e por que isso muda a gestão da manutenção e do restauro.",
    category: CAT,
    keywords: ["monitoramento de danos", "comparar vistorias", "evolução de fissuras", "monitoramento de patologias", "acompanhamento de edificações"],
    intro: [
      "Um mapa de danos mostra como a fachada está hoje. Para saber se ela está piorando, se a última intervenção funcionou ou o que priorizar na próxima obra, é preciso comparar com uma vistoria anterior. Até pouco tempo, isso era feito no olho, com duas fotos lado a lado.",
    ],
    sections: [
      {
        id: "alinhar",
        title: "O desafio: alinhar imagens diferentes",
        blocks: [
          { p: "Duas vistorias quase nunca têm fotos tiradas do mesmo ponto, com a mesma lente e a mesma luz. Para comparar, é preciso alinhar as imagens: marcar o mesmo ponto (o canto de uma janela, de uma cornija) nas duas datas e calcular a correção que leva uma sobre a outra." },
          { p: "Com bases em escala, como [ortofotos](/index/ortofoto-fachada-retificacao) geradas do modelo 3D, o alinhamento fica ainda mais preciso." },
        ],
      },
      {
        id: "classificar",
        title: "O que mudou, em categorias",
        blocks: [
          {
            table: {
              head: ["Situação", "Significado"],
              rows: [
                ["Novo", "O dano só aparece na vistoria mais recente"],
                ["Cresceu", "Ficou maior ou agravou (uma fissura que virou trinca)"],
                ["Estável", "Está nas duas vistorias, com tamanho parecido"],
                ["Diminuiu", "Ficou menor"],
                ["Não aparece", "Foi tratado, ou ficou escondido por sombra ou ângulo"],
              ],
            },
          },
          { callout: "'Não aparece' não é sinônimo de 'resolvido': confira em campo antes de concluir." },
        ],
      },
      {
        id: "usos",
        title: "Para que serve",
        blocks: [
          {
            list: [
              "Confirmar se [fissuras](/index/fissura-trinca-rachadura-diferenca) estão ativas.",
              "Avaliar a eficácia de tratamentos de [umidade](/index/umidade-ascendente) e limpeza.",
              "Atualizar a [matriz GUT](/index/matriz-gut-manutencao-predial): a tendência passa a ser medida, não estimada.",
              "Prestar contas de obras e de projetos financiados por [leis de incentivo](/index/leis-de-incentivo-restauro-patrimonio).",
              "Sustentar o plano de [conservação preventiva](/index/conservacao-preventiva-edificios-historicos).",
            ],
          },
        ],
      },
      {
        id: "archray",
        title: "Comparar vistorias no ArchRay",
        blocks: [
          { p: "No ArchRay, a tela Comparar vistorias alinha duas datas da mesma fachada com pares de pontos, mostra o erro de cada par e classifica cada dano como novo, cresceu, estável, diminuiu ou não aparece. Há visualização em cortina (arrastando um divisor entre as datas) e lado a lado, com zoom sincronizado." },
          { p: "Para que a comparação funcione, use a mesma [legenda](/index/legenda-mapa-de-danos) em todas as vistorias e mantenha a base em escala." },
          { p: "Em bens históricos, o monitoramento faz parte do plano de conservação. O [Estúdio Restaura](" + ER.servicos + ") elabora planos de manutenção por elemento e acompanha a evolução do estado de conservação depois do restauro." },
        ],
      },
    ],
    faq: [
      { q: "Com que frequência repetir a vistoria para monitorar?", a: "Depende do que se quer acompanhar. Fissuras suspeitas podem ser medidas em semanas ou meses; o estado geral da fachada, em inspeções anuais ou conforme o plano de manutenção." },
      { q: "Preciso fotografar do mesmo lugar nas duas vistorias?", a: "Ajuda, mas não é obrigatório: o alinhamento por pontos homólogos corrige diferenças de ângulo. Quanto mais parecidas as condições de captura, melhor o resultado." },
    ],
  }),
];
