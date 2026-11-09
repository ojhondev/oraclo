import { article, ER, IMG } from "./helper";

const CAT = "Manifestações patológicas";

export const PATOLOGIAS = [
  article({
    slug: "manifestacoes-patologicas-fachadas",
    title: "Manifestações patológicas em fachadas: os tipos mais comuns",
    seoTitle: "Manifestações patológicas em fachadas: tipos e causas",
    summary: "As manifestações patológicas mais comuns em fachadas, como reconhecer cada uma, causas prováveis e por que mapear antes de tratar.",
    category: CAT,
    ...IMG.fachada,
    keywords: ["manifestações patológicas em fachadas", "patologias em fachadas", "patologia das construções", "problemas em fachadas"],
    intro: [
      "Fachadas estão expostas a sol, chuva, vento, poluição e variações de temperatura todos os dias. Com o tempo, surgem as **manifestações patológicas**: sinais visíveis de que algo no sistema construtivo não vai bem. Reconhecê-las é o primeiro passo para tratar a causa, e não só o sintoma.",
    ],
    sections: [
      {
        id: "principais",
        title: "As principais manifestações",
        blocks: [
          {
            table: {
              head: ["Manifestação", "Como reconhecer", "Guia"],
              rows: [
                ["Fissuras e trincas", "Aberturas lineares no revestimento ou na alvenaria", "Fissura, trinca e rachadura"],
                ["Umidade ascendente", "Manchas na base da parede, até cerca de 1 m", "Umidade ascendente"],
                ["Eflorescência", "Depósitos brancos e pulverulentos", "Eflorescência"],
                ["Descolamento de revestimento", "Som cavo, estufamento, placas soltas", "Descolamento de reboco"],
                ["Biodeterioração", "Manchas verdes, pretas ou alaranjadas; plantas", "Biodeterioração"],
                ["Sujidade e crosta negra", "Escurecimento em áreas protegidas da chuva", "Crosta negra"],
              ],
            },
          },
          { p: "Cada uma tem um guia detalhado: [fissuras](/index/fissura-trinca-rachadura-diferenca), [umidade ascendente](/index/umidade-ascendente), [eflorescência](/index/eflorescencia-na-parede), [descolamento de reboco e cerâmica](/index/descolamento-reboco-revestimento-fachada), [biodeterioração](/index/biodeterioracao-fachadas) e [crosta negra](/index/crosta-negra-sujidade-fachada)." },
        ],
      },
      {
        id: "causas",
        title: "Causas mais frequentes",
        blocks: [
          {
            list: [
              "**Água:** chuva dirigida, infiltração por coberturas e esquadrias, umidade do solo. É a causa ou o agravante da maioria dos danos.",
              "**Movimentação:** variação térmica, retração de argamassas, recalques e deformações estruturais.",
              "**Materiais incompatíveis:** argamassas rígidas sobre alvenarias antigas, tintas impermeáveis que prendem a umidade.",
              "**Falta de manutenção:** calhas entupidas, juntas sem vedação, pequenos danos que crescem.",
              "**Execução:** falhas no assentamento de revestimentos, cura inadequada, ausência de juntas de movimentação.",
            ],
          },
          { callout: "Tratar o sintoma sem resolver a causa costuma fazer o dano voltar, às vezes mais grave." },
        ],
      },
      {
        id: "mapear",
        title: "Por que mapear antes de tratar",
        blocks: [
          { p: "Ver os danos espalhados pela fachada, em escala, revela padrões que uma inspeção ponto a ponto não mostra: manchas que seguem a linha de uma calha, fissuras alinhadas a vergas, umidade concentrada numa face. O [mapa de danos](/index/mapa-de-danos) organiza essa leitura e gera os quantitativos do orçamento." },
          { p: "Em edifícios históricos, o diagnóstico exige ainda conhecimento de materiais tradicionais. O [Estúdio Restaura](" + ER.servicos + ") faz diagnóstico de patologias e caracterização de argamassas e tintas para embasar o restauro." },
        ],
      },
      {
        id: "inspecao",
        title: "Inspeção periódica",
        blocks: [
          { p: "A melhor forma de evitar grandes reparos é inspecionar regularmente. Veja como funciona a [inspeção predial segundo a NBR 16747](/index/inspecao-predial-nbr-16747) e a [inspeção de fachadas em condomínios](/index/inspecao-fachada-condominio)." },
        ],
      },
    ],
    faq: [
      { q: "Qual a diferença entre patologia e manifestação patológica?", a: "Patologia é a área que estuda os problemas das construções. Manifestação patológica é o sinal visível do problema, como uma fissura ou mancha. No dia a dia os termos se misturam, mas o mais preciso é falar em manifestação patológica." },
      { q: "Toda fissura em fachada é grave?", a: "Não. Muitas são superficiais, ligadas à retração do reboco. Mas fissuras que aumentam, que têm desenho inclinado ou que aparecem junto a vigas e pilares merecem avaliação de um profissional." },
    ],
  }),

  article({
    slug: "fissura-trinca-rachadura-diferenca",
    title: "Fissura, trinca e rachadura: qual a diferença e quando se preocupar",
    seoTitle: "Fissura, trinca e rachadura: diferenças e riscos",
    summary: "Entenda a diferença entre fissura, trinca e rachadura pela abertura, as causas mais comuns, como medir e quando a situação exige um profissional.",
    category: CAT,
    ...IMG.vista,
    keywords: ["diferença entre fissura trinca e rachadura", "fissura na parede", "trinca na parede", "rachadura na parede", "tipos de fissuras"],
    intro: [
      "Fissura, trinca e rachadura são nomes para aberturas de tamanhos diferentes no mesmo fenômeno: a parede ou o revestimento se rompeu porque não acompanhou um esforço. Saber a diferença ajuda a comunicar o problema com precisão e a decidir quando chamar um especialista.",
    ],
    sections: [
      {
        id: "classificacao",
        title: "Classificação pela abertura",
        blocks: [
          {
            table: {
              head: ["Nome", "Abertura usual", "Leitura"],
              rows: [
                ["Fissura", "até cerca de 0,5 mm", "Fina, muitas vezes superficial"],
                ["Trinca", "de 0,5 a cerca de 1,5 mm", "Já atravessa o revestimento com mais profundidade"],
                ["Rachadura", "de 1,5 a cerca de 5 mm", "Abertura visível, pode indicar problema estrutural"],
                ["Fenda", "acima de 5 mm", "Separação marcada; avaliação imediata"],
              ],
              caption: "Faixas usuais na literatura técnica brasileira; os limites variam entre autores.",
            },
          },
          { callout: "Mais importante que o tamanho é saber se a abertura está ativa (crescendo) ou estabilizada." },
        ],
      },
      {
        id: "causas",
        title: "Causas comuns",
        blocks: [
          {
            list: [
              "**Retração de argamassa:** fissuras finas em mapa (rede), comuns em rebocos.",
              "**Variação térmica:** fissuras em platibandas, topos de parede e encontros de materiais diferentes.",
              "**Sobrecarga e deformação de vigas:** trincas inclinadas ou horizontais junto a apoios.",
              "**Recalque de fundação:** trincas inclinadas a 45°, mais abertas numa das extremidades.",
              "**Vergas e contravergas ausentes:** trincas partindo dos cantos de janelas e portas.",
              "**Corrosão de armaduras:** fissuras que acompanham a armadura, às vezes com manchas de ferrugem.",
            ],
          },
        ],
      },
      {
        id: "medir",
        title: "Como medir e acompanhar",
        blocks: [
          { p: "A abertura pode ser medida com fissurômetro (régua com linhas de espessuras conhecidas). Para saber se está ativa, use selos de gesso ou marcações datadas e volte a medir depois de algumas semanas." },
          { p: "No [mapa de danos](/index/mapa-de-danos), fissuras são registradas como linhas, com o comprimento somado em metros lineares. Comparar mapas de datas diferentes mostra se elas cresceram, como explica o guia de [monitoramento de danos](/index/monitoramento-danos-comparar-vistorias)." },
        ],
      },
      {
        id: "quando-se-preocupar",
        title: "Quando chamar um profissional",
        blocks: [
          {
            list: [
              "A abertura está aumentando.",
              "Portas e janelas começaram a emperrar.",
              "Há trincas inclinadas, em escada ou próximas a pilares e vigas.",
              "Aparecem desníveis entre os dois lados da abertura.",
              "Há sinais de corrosão ou desplacamento junto à trinca.",
            ],
          },
          { p: "Nesses casos, um engenheiro ou arquiteto deve avaliar a causa antes de qualquer reparo estético. Fechar a trinca com massa, sem tratar a causa, só esconde o problema. O resultado dessa avaliação entra no [laudo de fachada](/index/laudo-de-fachada), com a prioridade definida pela [matriz GUT](/index/matriz-gut-manutencao-predial)." },
        ],
      },
    ],
    faq: [
      { q: "Fissura na parede é perigosa?", a: "Fissuras finas e estabilizadas costumam ser superficiais. A preocupação aumenta quando a abertura cresce, tem forma inclinada ou aparece junto a elementos estruturais." },
      { q: "Como tratar uma trinca na fachada?", a: "Primeiro identifique e resolva a causa. Depois, o tratamento depende do tipo: abertura e preenchimento com material flexível, telas de reforço no revestimento ou, em casos estruturais, intervenção na estrutura." },
    ],
  }),

  article({
    slug: "umidade-ascendente",
    title: "Umidade ascendente: causas, diagnóstico e tratamento",
    seoTitle: "Umidade ascendente na parede: causas e tratamento",
    summary: "O que é a umidade ascendente por capilaridade, como diferenciá-la de infiltração e condensação, por que ela destrói rebocos e quais tratamentos funcionam.",
    category: CAT,
    ...IMG.convento,
    keywords: ["umidade ascendente", "umidade por capilaridade", "umidade na parede", "tratamento umidade ascendente", "salitre na parede"],
    intro: [
      "A umidade ascendente é a água do solo que sobe pelas paredes por capilaridade, como num pavio. Ela é especialmente comum em construções antigas, sem barreira impermeável na fundação, e responde por boa parte dos rebocos estufados e pinturas descascadas na base das paredes.",
    ],
    sections: [
      {
        id: "reconhecer",
        title: "Como reconhecer",
        blocks: [
          {
            list: [
              "Manchas na base da parede, com limite superior irregular, geralmente até cerca de 1 metro de altura.",
              "Pintura descascando e reboco esfarelando nessa faixa.",
              "Depósitos brancos de sais ([eflorescência](/index/eflorescencia-na-parede)) na linha onde a água evapora.",
              "Manchas presentes nos dois lados da parede e que não dependem diretamente da chuva.",
            ],
          },
        ],
      },
      {
        id: "diferenciar",
        title: "Umidade ascendente, infiltração ou condensação?",
        blocks: [
          {
            table: {
              head: ["Origem", "Onde aparece", "Pista"],
              rows: [
                ["Ascendente", "Base das paredes", "Constante, faixa horizontal com limite irregular"],
                ["Infiltração", "Perto de coberturas, calhas, esquadrias, fissuras", "Piora depois da chuva"],
                ["Condensação", "Cantos frios, atrás de móveis, banheiros", "Mofo pontilhado, piora em dias frios e úmidos"],
              ],
            },
          },
          { p: "O diagnóstico errado leva ao tratamento errado. No [mapa de danos](/index/mapa-de-danos), separar umidade ascendente de infiltração (descendente) ajuda a enxergar a origem." },
        ],
      },
      {
        id: "por-que-destroi",
        title: "Por que ela destrói o reboco",
        blocks: [
          { p: "A água sobe carregando sais do solo e dos materiais. Quando evapora, os sais cristalizam dentro dos poros e na superfície. A cristalização gera pressão, que desagrega argamassas e descola pinturas. Por isso, pintar por cima sem tratar a causa não resolve." },
          { callout: "Tintas e rebocos impermeáveis sobre parede com umidade ascendente costumam piorar o problema: a água sobe mais alto procurando por onde sair." },
        ],
      },
      {
        id: "tratamento",
        title: "Tratamentos possíveis",
        blocks: [
          {
            list: [
              "Melhorar a drenagem no entorno: afastar a água da base, corrigir caimentos e calçadas.",
              "Barreiras químicas por injeção na base da alvenaria.",
              "Barreiras físicas, em casos específicos.",
              "Rebocos de sacrifício ou rebocos macroporosos, que acumulam os sais sem danificar a alvenaria.",
              "Em edifícios históricos, preferir argamassas de cal, permeáveis ao vapor (veja [restauro de fachadas históricas](/index/restauro-fachadas-historicas)).",
            ],
          },
          { p: "A escolha depende da espessura e do material da parede, da origem da água e, em patrimônio histórico, da compatibilidade com os materiais originais. Escritórios de restauro, como o [Estúdio Restaura](" + ER.servicos + "), costumam caracterizar as argamassas antes de definir o tratamento." },
        ],
      },
    ],
    faq: [
      { q: "Umidade ascendente tem cura definitiva?", a: "Tem controle eficaz quando a causa é tratada (drenagem e barreira) e os materiais danificados são substituídos por outros compatíveis. Só pintar ou rebocar por cima não resolve." },
      { q: "Salitre e umidade ascendente são a mesma coisa?", a: "O 'salitre' é como popularmente se chamam os sais que aparecem na parede. Eles são uma consequência da umidade, que traz os sais e os deposita ao evaporar." },
    ],
  }),

  article({
    slug: "eflorescencia-na-parede",
    title: "Eflorescência na parede: o que é, causas e como tratar",
    seoTitle: "Eflorescência: o que é e como tratar na parede",
    summary: "Eflorescência são os depósitos brancos de sais que surgem em paredes, tijolos e concreto. Veja por que aparecem, quando são sinal de problema maior e como tratar.",
    category: CAT,
    ...IMG.igreja2010,
    keywords: ["eflorescência", "eflorescência na parede", "manchas brancas na parede", "eflorescência no tijolo", "como tratar eflorescência"],
    intro: [
      "A eflorescência é aquela camada esbranquiçada, às vezes em forma de pó ou de pequenos cristais, que aparece em paredes, tijolos aparentes, rejuntes e concreto. Ela é, na maioria das vezes, um aviso: há água atravessando o material.",
    ],
    sections: [
      {
        id: "como-se-forma",
        title: "Como ela se forma",
        blocks: [
          { p: "Três condições precisam existir juntas: sais solúveis no material ou no solo, água para dissolvê-los e um caminho até a superfície, onde a água evapora e os sais ficam. Basta tirar uma delas para o processo parar." },
          { p: "Quando os sais cristalizam abaixo da superfície (criptoflorescência), o dano é maior: a pressão dos cristais desagrega o material por dentro." },
        ],
      },
      {
        id: "causas",
        title: "Causas comuns",
        blocks: [
          {
            list: [
              "[Umidade ascendente](/index/umidade-ascendente) na base das paredes.",
              "Infiltração por coberturas, platibandas, juntas e fissuras.",
              "Argamassas e materiais novos ainda liberando sais nos primeiros meses (eflorescência de obra nova).",
              "Limpeza com produtos inadequados que deixam resíduos salinos.",
              "Juntas e [fissuras](/index/fissura-trinca-rachadura-diferenca) que deixam a chuva entrar na alvenaria.",
            ],
          },
        ],
      },
      {
        id: "tratar",
        title: "Como tratar",
        blocks: [
          {
            list: [
              "Identificar e interromper a entrada de água: é o passo que realmente resolve.",
              "Remover os sais a seco, com escova macia, antes de qualquer lavagem (a água pode levá-los de volta para dentro).",
              "Em casos persistentes, compressas de dessalinização.",
              "Evitar tintas e vernizes impermeáveis, que prendem a umidade.",
            ],
          },
          { callout: "Lavar eflorescência com muita água costuma fazer ela voltar: os sais se dissolvem, entram nos poros e reaparecem quando a parede seca." },
          { p: "Em alvenarias e cantarias históricas, a remoção de sais é feita com técnicas de limpeza controlada, como as usadas pelo [Estúdio Restaura](" + ER.servicos + ") no restauro de bens integrados." },
        ],
      },
      {
        id: "mapear",
        title: "Registrar no mapa de danos",
        blocks: [
          { p: "Mapear a eflorescência por área, junto com as manchas de umidade, ajuda a localizar a origem da água. Ela costuma aparecer na borda das zonas úmidas. Veja como montar a [legenda do mapa de danos](/index/legenda-mapa-de-danos)." },
        ],
      },
    ],
    faq: [
      { q: "Eflorescência some sozinha?", a: "Em obra nova, a eflorescência inicial pode diminuir conforme os materiais liberam os sais. Se ela persiste ou volta, há entrada de água a ser investigada." },
      { q: "Vinagre resolve eflorescência?", a: "Soluções ácidas podem remover depósitos superficiais em alguns materiais, mas atacam argamassas de cal, pedras calcárias e rejuntes. Teste antes, prefira a remoção a seco e trate a causa da umidade." },
    ],
  }),

  article({
    slug: "descolamento-reboco-revestimento-fachada",
    title: "Descolamento de reboco e de revestimento cerâmico em fachadas",
    seoTitle: "Descolamento de reboco e cerâmica na fachada",
    summary: "Por que rebocos e cerâmicas descolam em fachadas, como identificar áreas com som cavo antes da queda e o que considerar na recuperação.",
    category: CAT,
    ...IMG.fachada,
    keywords: ["descolamento de reboco", "desplacamento cerâmico fachada", "revestimento cerâmico soltando", "reboco estufado", "teste de percussão fachada"],
    intro: [
      "O descolamento de revestimentos é uma das manifestações mais perigosas em fachadas: uma placa de reboco ou de cerâmica que cai de um pavimento alto pode ferir pessoas e danificar bens. Por isso merece atenção prioritária em qualquer inspeção.",
    ],
    sections: [
      {
        id: "sinais",
        title: "Sinais de alerta",
        blocks: [
          {
            list: [
              "Som cavo ao bater levemente (teste de percussão), indicando que a camada já não está aderida.",
              "Estufamentos e abaulamentos na superfície.",
              "Fissuras em volta de áreas estufadas.",
              "Peças cerâmicas trincadas, rejuntes soltos ou ausentes.",
              "Pedaços já caídos na calçada ou em marquises.",
            ],
          },
          { callout: "Áreas com som cavo em pavimentos altos devem ser isoladas e avaliadas com urgência." },
        ],
      },
      {
        id: "causas",
        title: "Causas mais comuns",
        blocks: [
          {
            list: [
              "Ausência ou falha das juntas de movimentação, que absorvem a dilatação térmica.",
              "Água infiltrada atrás do revestimento.",
              "Argamassa de assentamento inadequada ou mal aplicada (tempo em aberto excedido, falta de dupla colagem em peças grandes).",
              "Base com baixa resistência ou contaminada.",
              "Envelhecimento e ciclos térmicos ao longo dos anos.",
            ],
          },
          { p: "As normas técnicas brasileiras de revestimento de argamassa e de revestimento cerâmico de fachadas trazem requisitos de projeto e execução que ajudam a prevenir o problema." },
        ],
      },
      {
        id: "mapear",
        title: "Mapear antes de recuperar",
        blocks: [
          { p: "O mapeamento do descolamento combina inspeção visual e percussão. As áreas comprometidas entram no [mapa de danos](/index/mapa-de-danos) em metros quadrados, separadas de outras manifestações, porque têm tratamento e custo próprios." },
          { p: "Com os quantitativos em mãos, fica mais fácil montar o [orçamento de recuperação da fachada](/index/orcamento-recuperacao-fachada) e definir prioridades pela [matriz GUT](/index/matriz-gut-manutencao-predial). Em geral, risco de queda tem gravidade e urgência máximas." },
        ],
      },
      {
        id: "recuperar",
        title: "Recuperação",
        blocks: [
          { p: "Conforme a extensão, a recuperação vai da remoção e recomposição localizada até a troca de todo o revestimento de um pano, com execução correta das juntas. Em fachadas históricas, a recomposição de rebocos usa argamassas compatíveis com as originais, como indica o guia de [restauro de fachadas históricas](/index/restauro-fachadas-historicas)." },
        ],
      },
    ],
    faq: [
      { q: "Como saber se o reboco vai cair?", a: "O teste de percussão indica perda de aderência pelo som cavo. Áreas estufadas, fissuradas em volta ou com som cavo em altura devem ser avaliadas por um profissional e, se necessário, isoladas." },
      { q: "Rejunte resolve cerâmica soltando?", a: "Refazer o rejunte ajuda a impedir a entrada de água, mas não recola peças que já perderam a aderência. Elas precisam ser removidas e reassentadas." },
    ],
  }),

  article({
    slug: "biodeterioracao-fachadas",
    title: "Biodeterioração em fachadas: fungos, algas, liquens e vegetação",
    seoTitle: "Biodeterioração em fachadas: fungos, liquens e plantas",
    summary: "Como micro-organismos e plantas degradam fachadas, como identificar cada agente e por que a limpeza precisa vir junto com o controle da umidade.",
    category: CAT,
    ...IMG.convento,
    keywords: ["biodeterioração", "fungos na fachada", "limo na parede", "liquens em fachadas", "vegetação em fachada", "mofo na parede externa"],
    intro: [
      "Manchas verdes, pretas ou alaranjadas e pequenas plantas nascendo em frestas são sinais de **biodeterioração**: seres vivos colonizando a fachada. Além do aspecto, eles retêm umidade, produzem substâncias que atacam os materiais e, no caso das plantas, abrem fissuras com as raízes.",
    ],
    sections: [
      {
        id: "agentes",
        title: "Os principais agentes",
        blocks: [
          {
            table: {
              head: ["Agente", "Aparência", "Onde aparece"],
              rows: [
                ["Algas e cianobactérias", "Película verde ou escura, escorregadia", "Áreas úmidas e sombreadas"],
                ["Fungos (mofo)", "Manchas pretas pontilhadas", "Superfícies úmidas, pouco ventiladas"],
                ["Liquens", "Crostas cinzas, verdes ou alaranjadas", "Pedras e superfícies expostas por longo tempo"],
                ["Musgos", "Tufos verdes", "Juntas, cornijas, bases úmidas"],
                ["Plantas superiores", "Ervas e até arbustos", "Fissuras, juntas, platibandas, calhas"],
              ],
            },
          },
        ],
      },
      {
        id: "por-que",
        title: "Por que aparecem",
        blocks: [
          { p: "Todos dependem de umidade. Fachadas voltadas para o sul (no hemisfério sul, as que recebem menos sol), áreas com vazamento de calhas, cornijas sem pingadeira e bases com [umidade ascendente](/index/umidade-ascendente) concentram a colonização." },
          { callout: "Limpar sem resolver a umidade é temporário: os organismos voltam em poucos meses." },
        ],
      },
      {
        id: "tratamento",
        title: "Tratamento",
        blocks: [
          {
            list: [
              "Corrigir as fontes de umidade: calhas, rufos, pingadeiras, drenagem.",
              "Remover plantas com cuidado, sem arrancar à força raízes presas na alvenaria.",
              "Limpeza com escovação e produtos biocidas adequados ao material, testados antes.",
              "Evitar jatos de alta pressão em materiais frágeis, como rebocos de cal e pedras macias.",
            ],
          },
          { p: "Em fachadas históricas, liquens antigos e pátinas fazem parte da história do bem, e a decisão de remover segue critérios de conservação. Veja [restauro de fachadas históricas](/index/restauro-fachadas-historicas) e os serviços de conservação do [Estúdio Restaura](" + ER.servicos + ")." },
        ],
      },
      {
        id: "mapear",
        title: "No mapa de danos",
        blocks: [
          { p: "Biodeterioração e vegetação são registradas por área, com códigos próprios na [legenda](/index/legenda-mapa-de-danos). Mapeadas junto com as manchas de umidade, elas ajudam a encontrar a origem da água. A detecção automática do ArchRay identifica regiões esverdeadas como sugestão, para o profissional confirmar." },
        ],
      },
    ],
    faq: [
      { q: "Limo na parede externa faz mal à construção?", a: "Sim. Ele retém umidade na superfície e alguns organismos produzem ácidos que degradam argamassas e pedras com o tempo. Além disso, indica um problema de umidade a ser resolvido." },
      { q: "Posso lavar a fachada com cloro?", a: "Produtos à base de cloro podem manchar e deixar sais nos materiais. Prefira biocidas indicados para fachadas, testados numa pequena área, e trate a causa da umidade." },
    ],
  }),

  article({
    slug: "crosta-negra-sujidade-fachada",
    title: "Crosta negra e sujidade em fachadas: causas e limpeza",
    seoTitle: "Crosta negra em fachadas: causas e como limpar",
    summary: "A crosta negra é a camada escura e endurecida que se forma em fachadas urbanas, sobretudo em pedras. Veja como se forma, por que danifica e como limpar sem agredir.",
    category: CAT,
    ...IMG.igreja2021,
    keywords: ["crosta negra", "sujidade em fachada", "limpeza de fachada histórica", "fachada escurecida", "limpeza de pedra"],
    intro: [
      "Em cidades com tráfego intenso, as fachadas escurecem. Em áreas lavadas pela chuva, a sujeira é removida naturalmente; nas áreas protegidas, como sob cornijas, frisos e ornamentos, ela se acumula e endurece, formando a **crosta negra**.",
    ],
    sections: [
      {
        id: "o-que-e",
        title: "O que é a crosta negra",
        blocks: [
          { p: "É uma camada formada por partículas de poluição (fuligem, poeira) presas numa matriz de gesso que se forma quando poluentes reagem com materiais à base de cálcio, como pedras calcárias e argamassas de cal. Por isso ela é mais agressiva em pedras e rebocos tradicionais." },
          { p: "Diferente da simples sujidade, que fica solta na superfície, a crosta adere ao material e, ao se desprender, pode levar junto parte da superfície original." },
        ],
      },
      {
        id: "dano",
        title: "Por que ela danifica",
        blocks: [
          {
            list: [
              "Altera a superfície e a porosidade do material.",
              "Retém umidade e poluentes.",
              "Pode se desprender em placas, levando detalhes de cantaria e ornamentos.",
              "Esconde outros danos, como [fissuras](/index/fissura-trinca-rachadura-diferenca) e perdas, que só aparecem após a limpeza.",
            ],
          },
        ],
      },
      {
        id: "limpeza",
        title: "Como limpar sem agredir",
        blocks: [
          { p: "A regra é usar o método menos agressivo que funcione, testado em pequenas áreas antes. Entre as técnicas usadas em conservação: nebulização de água, compressas, micro-abrasão de baixa pressão e, em casos específicos, laser." },
          { callout: "Jato de areia e produtos ácidos fortes removem a sujeira, mas também removem a pele da pedra e os detalhes: o dano é irreversível." },
          { p: "Em edifícios históricos, a limpeza faz parte do projeto de restauro, com critérios definidos pelo responsável técnico. O [Estúdio Restaura](" + ER.servicos + ") trabalha com limpeza controlada de cantarias e revestimentos." },
        ],
      },
      {
        id: "mapear",
        title: "Registro no mapa de danos",
        blocks: [
          { p: "Sujidade e crosta negra entram no [mapa de danos](/index/mapa-de-danos) por área, porque a limpeza é orçada em metros quadrados. Registrar antes e depois da limpeza ajuda a documentar a intervenção, como mostra o guia de [monitoramento de danos](/index/monitoramento-danos-comparar-vistorias)." },
        ],
      },
    ],
    faq: [
      { q: "Posso usar lavadora de alta pressão na fachada?", a: "Em materiais resistentes e com pressão controlada, às vezes sim. Em pedras macias, rebocos de cal e fachadas históricas, a alta pressão pode erodir a superfície e forçar água para dentro. Teste antes e consulte um profissional." },
      { q: "A crosta negra volta depois da limpeza?", a: "Em ambiente poluído, a sujidade volta a se acumular com o tempo, principalmente em áreas protegidas da chuva. Manutenção periódica e detalhes que drenam bem a água reduzem o acúmulo." },
    ],
  }),
];
