/**
 * Conteúdo técnico-científico do site (Home e Nossa Tecnologia), em PT e EN. Cada fórmula é a que o
 * código usa de fato: rectify.ts, detect/detect.ts, sam/wand.ts, compare.ts e geometry.ts.
 * Mudou o método? Atualize aqui também.
 * Regra de honestidade: cv-2 é visão computacional clássica; SlimSAM é modelo público de terceiros;
 * ml-1 está em desenvolvimento e não roda em produção. Nada de "IA treinada" ou "modelo próprio".
 */
import type { Lang } from "./lang";

const m = String.raw;

export type Eq = { tex: string; note: string };
type AiRow = { step: string; method: string; nature: string; role: string; human: string };
type Science = {
  home: {
    label: string;
    title: string;
    text: string;
    items: { tag: string; title: string; tex: string; text: string }[];
    note: string;
    cta: string;
  };
  mathLabel: string;
  /** Equações por frente, na mesma ordem e com os mesmos ids de `tech.items`. */
  math: Record<string, Eq[]>;
  ai: { label: string; title: string; text: string; headers: [string, string, string, string, string]; rows: AiRow[]; note: string };
  diff: { label: string; title: string; text: string; headers: [string, string, string, string]; rows: [string, string, string, string][]; note: string };
  limits: { label: string; title: string; items: [string, string][] };
};

const homography = m`\mathbf{x}' \sim H\,\mathbf{x}`;
const rawDeviation = m`z(p)=\dfrac{|\Delta L(p)|}{\sigma_S}`;
const areaError = m`\sigma_A=\sigma_p\sqrt{\sum_i\bigl(\tfrac12\lVert\mathbf{v}_{i+1}-\mathbf{v}_{i-1}\rVert\bigr)^2}`;

const math = {
  dlt: m`\min_{\mathbf{h}}\lVert A\mathbf{h}-\mathbf{b}\rVert^2\;\Rightarrow\;(A^{\mathsf T}A)\,\mathbf{h}=A^{\mathsf T}\mathbf{b}`,
  lens: m`r'=r\,(1+k_1r^2+k_2r^4)`,
  sigma: m`\begin{gathered}\sigma=\max\Bigl(\sqrt{\mathrm{RMS}_{\mathrm{conf}}^2+\mathrm{RMS}_{\mathrm{res}}^2},\ \mathrm{RMS}_{\mathrm{LOO}},\ \sigma_{\mathrm{mark}}\Bigr)\\[2pt]P_{95}=1{,}96\,\sigma\end{gathered}`,
  graph: m`w(C_1,C_2)\le\min\Bigl(\mathrm{Int}(C_1)+\tfrac{k}{|C_1|},\ \mathrm{Int}(C_2)+\tfrac{k}{|C_2|}\Bigr)`,
  mad: m`\begin{gathered}\sigma_S=1{,}4826\cdot\mathrm{MAD}_S\\[2pt]|\Delta L(p)|>\max(5\kappa,\ 3{,}5\,\kappa\,\sigma_S)\end{gathered}`,
  ridge: m`R=\sigma^2\lambda_1\quad\text{se}\quad\lambda_1>0,\ \ |\lambda_2|<0{,}5\,\lambda_1`,
  grow: m`\Delta E(p,s)=\lVert c(p)-c(s)\rVert\le\tau`,
  sam: m`M=D\bigl(E(I),\ \{\text{prompts}\}\bigr)`,
  compare: m`\begin{gathered}\mathbf{x}_a\sim T\,\mathbf{x}_b\\[2pt]T\in\{\text{similaridade},\ \text{afim},\ \text{homografia}\}\end{gathered}`,
  overlap: m`\frac{|A\cap B|}{\min(|A|,|B|)}\ge 0{,}2`,
  shoelace: m`A=\tfrac12\Bigl|\sum_i\bigl(x_iy_{i+1}-x_{i+1}y_i\bigr)\Bigr|`,
  gut: m`P=G\cdot U\cdot T,\qquad C=\sum_k q_k\,\pi_k`,
};

/** Versão em inglês de uma fórmula: ponto decimal e palavras traduzidas. */
const en = (tex: string) =>
  tex.replaceAll("{,}", ".").replace("{se}", "{if}").replace("similaridade", "similarity").replace("afim", "affine").replace("homografia", "homography");

const pt: Science = {
  home: {
    label: "Inovação",
    title: "O mapa de danos como problema de medição",
    text:
      "O mapa de danos convencional é um desenho: depende do olho e do tempo de quem traça, e o seu erro nunca é declarado. A inovação do ArchRay na Arquitetura e na Engenharia é tratá-lo como medição: cada patologia vira um polígono em coordenadas métricas, com incerteza propagada, origem registrada e decisão humana. A inteligência artificial não dá o veredito. Ela formula hipóteses, com justificativa, para um profissional confirmar ou recusar.",
    items: [
      { tag: "Geometria", title: "Da foto ao plano métrico", tex: homography, text: "Uma homografia estimada por mínimos quadrados leva a fotografia em perspectiva a um plano em escala, com a lente corrigida e o erro calculado." },
      { tag: "Estatística", title: "O dano medido contra a própria parede", tex: rawDeviation, text: "Cada superfície tem o seu ruído. O desvio é medido nessa unidade, e não por uma cor fixa, o que torna a detecção independente da tinta e da luz da foto." },
      { tag: "Metrologia", title: "Toda medida com margem de erro", tex: areaError, text: "A precisão da retificação se propaga até a área e o comprimento de cada dano, e a margem de erro (95%) sai no laudo." },
      { tag: "Decisão", title: "A máquina sugere, o profissional assina", tex: m`\text{sugestão}\ \xrightarrow{\ \text{revisão humana}\ }\ \text{dano}`, text: "Cada sugestão traz a sua justificativa e é aceita uma a uma. O motor que a gerou fica registrado no dano, e o laudo declara o uso de IA." },
    ],
    note: "Um método auditável: a mesma foto, com os mesmos parâmetros, gera as mesmas sugestões de detecção, e cada número do laudo tem origem conhecida.",
    cta: "Ver os fundamentos",
  },
  mathLabel: "Fundamentos",
  math: {
    retificacao: [
      { tex: math.dlt, note: "Homografia estimada por DLT com normalização de Hartley: os cantos e os pontos de controle montam um sistema sobredeterminado, resolvido por mínimos quadrados." },
      { tex: math.lens, note: "Distorção radial da lente, com os coeficientes buscados por seção áurea e Nelder–Mead até que as linhas retas da foto fiquem retas." },
      { tex: math.sigma, note: "A incerteza vale o pior entre o erro nas medidas de conferência e nos resíduos, o erro de previsão com um ponto deixado de fora (leave-one-out) e o da própria marcação dos pontos. Com ela, a vista é classificada em excelente (até 0,3%), boa (até 1%) ou regular (até 2,5%)." },
    ],
    deteccao: [
      { tex: math.graph, note: "Segmentação em grafos de Felzenszwalb no espaço Lab: duas regiões só se unem se a diferença entre elas não superar a variação interna de cada uma. A fachada é separada em superfícies antes de qualquer análise." },
      { tex: math.mad, note: "O fundo é estimado localmente em cada superfície e o desvio é medido no ruído dela, com estimador robusto (MAD). A classe do dano vem da direção do desvio em luminosidade e cromaticidade, nunca de uma cor absoluta." },
      { tex: math.ridge, note: "Fissuras por filtro de cristas na Hessiana, em duas escalas, com histerese e teste de vale dos dois lados. Assim, juntas, frisos e bordas de superfície são descartados." },
    ],
    contorno: [
      { tex: math.grow, note: "Modo Mancha: crescimento de região em cor Lab a partir do ponto clicado, com tolerância τ ajustável." },
      { tex: math.sam, note: "Modo Elemento: o codificador E da rede SlimSAM transforma a imagem e o decodificador D gera as máscaras a partir dos cliques. O contorno é extraído por Moore e simplificado por Douglas–Peucker." },
    ],
    comparacao: [
      { tex: math.compare, note: "O modelo cresce com o número de pares homólogos: 2 pares dão similaridade, 3 dão afim e 4 ou mais dão homografia." },
      { tex: math.overlap, note: "Dois danos de mesma categoria são o mesmo dano se a sobreposição, numa grade de 400 células, for de ao menos 20% do menor. Variação acima de ±20% conta como crescimento ou redução." },
    ],
    laudo: [
      { tex: math.shoelace, note: "A área de cada dano vem da fórmula do cadarço sobre os vértices, já em coordenadas métricas." },
      { tex: areaError, note: "Propagação de primeira ordem da precisão da vista para a medida, supondo erros independentes por vértice." },
      { tex: math.gut, note: "Prioridade P pela matriz GUT e custo C pela soma de quantidades q e preços π de cada tratamento, ligados ao desenho." },
    ],
  },
  ai: {
    label: "Inteligência artificial",
    title: "Como a IA auxilia em cada etapa",
    text:
      "Chamar tudo de IA esconderia o que importa. Em um documento técnico, é preciso saber o que é modelo matemático explícito, o que é regra estatística e o que é rede neural. Por isso, cada etapa declara a sua natureza.",
    headers: ["Etapa", "Método", "Natureza", "Papel da automação", "Quem decide"],
    rows: [
      { step: "Retificação", method: "Homografia e mínimos quadrados", nature: "Geometria e estatística", role: "Calcula o plano e a incerteza", human: "O profissional marca os pontos e confere as medidas" },
      { step: "Detecção", method: "Motor cv-2: grafos, estatística robusta e Hessiana", nature: "Visão computacional clássica", role: "Sugere danos, cada um com justificativa e confiança", human: "O profissional aceita ou rejeita um a um" },
      { step: "Contorno", method: "SlimSAM e crescimento de região", nature: "Rede neural pública, de terceiros, executada no navegador", role: "Recorta o elemento a partir de um clique", human: "O profissional refina e confirma" },
      { step: "Comparação", method: "Transformação por pontos homólogos", nature: "Geometria", role: "Alinha as datas e conta as mudanças", human: "O profissional marca os pares e interpreta" },
      { step: "Laudo", method: "Matriz GUT, orçamento e texto a partir dos dados", nature: "Regras determinísticas", role: "Monta o documento e declara o uso de IA", human: "O responsável técnico revisa e assina" },
      { step: "Modelo treinado (ml-1)", method: "U-Net sobre MobileNetV2, em ONNX", nature: "Rede neural, em desenvolvimento e fora de produção", role: "Assumir uma classe de dano só se vencer o portão de qualidade", human: "Portão: precisão ≥ 70%, revocação ≥ 35% e melhor que o cv-2" },
    ],
    note: "A detecção por rede treinada ainda não está em uso. Até lá, nenhuma classe de dano muda de motor, e o motor de cada dano aceito fica registrado.",
  },
  diff: {
    label: "Diferenciais",
    title: "O que muda em relação às alternativas",
    text: "A comparação é por categoria de ferramenta, não por produto. As características variam em cada caso; o quadro mostra o padrão mais comum.",
    headers: ["Aspecto", "Fluxo tradicional", "Ferramentas genéricas (CAD, fotogrametria, inspeção)", "ArchRay"],
    rows: [
      ["Base métrica", "Desenho cadastral e foto ajustada no olho", "Exige levantamento dedicado (drone, laser) ou outro software", "Retificação a partir de foto e medidas, com precisão declarada"],
      ["Desenho dos danos", "Hachura manual no CAD", "Manual, sem legenda de patologias", "Biblioteca de danos, contorno por IA e detecção sugerida"],
      ["Quantitativos", "Extraídos à mão para planilha", "Possíveis, mas fora do contexto do laudo", "Automáticos, por classe e por área do imóvel"],
      ["Incerteza", "Não declarada", "Declarada no levantamento, não em cada dano", "Propagada até a medida de cada dano"],
      ["Prioridade e orçamento", "Planilhas separadas", "Em geral ausentes", "Matriz GUT e tabela de preços ligadas ao desenho"],
      ["Laudo", "Montado em editor de texto", "Relatórios genéricos", "PDF, prancha A3 e DXF gerados do mesmo dado"],
      ["Uso de IA", "Não se aplica", "Quando há, costuma ser opaco", "Sugere com justificativa, com aceite individual e motor registrado"],
      ["Série histórica", "Recomeça a cada visita", "Rara", "Comparação alinhada entre vistorias"],
    ],
    note: "Um laser scanner mede melhor que uma foto, e há casos em que ele é indispensável. A questão é de adequação ao problema: precisão conhecida, no mesmo ambiente do mapa, do orçamento e do laudo.",
  },
  limits: {
    label: "Limites declarados",
    title: "O que o método não afirma",
    items: [
      ["Plano", "A homografia supõe uma superfície plana. Relevos fora do plano sofrem paralaxe, e fachadas com volumes distintos pedem uma vista para cada plano."],
      ["Resolução", "O que tem dimensão abaixo do pixel não aparece. A qualidade da foto limita a detecção, e o sistema avisa quando há sombra, pouca resolução, área estourada ou escura."],
      ["Detecção", "É hipótese, não diagnóstico. Em superfícies decoradas a confiança é menor e o aviso aparece na própria vista."],
      ["Causa", "A imagem registra o sintoma. A investigação das causas, os ensaios e a análise estrutural seguem com o profissional responsável."],
    ],
  },
};

const enCopy: Science = {
  home: {
    label: "Innovation",
    title: "The damage map as a measurement problem",
    text:
      "A conventional damage map is a drawing: it depends on the eye and the time of whoever draws it, and its error is never stated. ArchRay's innovation in Architecture and Engineering is to treat it as a measurement: each defect becomes a polygon in metric coordinates, with propagated uncertainty, a recorded origin and a human decision. Artificial intelligence does not give the verdict. It puts forward hypotheses, with reasons, for a professional to confirm or reject.",
    items: [
      { tag: "Geometry", title: "From the photo to the metric plane", tex: homography, text: "A homography estimated by least squares takes the perspective photo to a scaled plane, with the lens corrected and the error computed." },
      { tag: "Statistics", title: "Damage measured against its own wall", tex: rawDeviation, text: "Each surface has its own noise. The deviation is measured in that unit, not against a fixed colour, which makes detection independent of the paint and the light in the photo." },
      { tag: "Metrology", title: "Every measurement with a margin of error", tex: areaError, text: "The rectification precision propagates to the area and length of each damage, and the 95% margin of error goes into the report." },
      { tag: "Decision", title: "The machine suggests, the professional signs", tex: m`\text{suggestion}\ \xrightarrow{\ \text{human review}\ }\ \text{damage}`, text: "Each suggestion carries its reason and is accepted one by one. The engine that produced it is recorded on the damage, and the report states the use of AI." },
    ],
    note: "An auditable method: the same photo, with the same parameters, yields the same detection suggestions, and every number in the report has a known origin.",
    cta: "See the foundations",
  },
  mathLabel: "Foundations",
  math: {
    retificacao: [
      { tex: en(math.dlt), note: "Homography estimated by DLT with Hartley normalisation: corners and control points form an overdetermined system, solved by least squares." },
      { tex: en(math.lens), note: "Radial lens distortion, with coefficients searched by golden-section and Nelder–Mead until the straight lines in the photo are straight." },
      { tex: en(math.sigma), note: "The uncertainty is the worst of the error on check measurements and residuals, the leave-one-out prediction error and the point-marking error. It classes each view as excellent (up to 0.3%), good (up to 1%) or regular (up to 2.5%)." },
    ],
    deteccao: [
      { tex: en(math.graph), note: "Felzenszwalb graph segmentation in Lab space: two regions merge only if the difference between them does not exceed the internal variation of each. The facade is split into surfaces before any analysis." },
      { tex: en(math.mad), note: "The background is estimated locally on each surface and the deviation is measured in its noise, with a robust estimator (MAD). The damage class comes from the direction of the deviation in lightness and chromaticity, never from an absolute colour." },
      { tex: en(math.ridge), note: "Cracks found by a Hessian ridge filter at two scales, with hysteresis and a two-sided valley test, so joints, mouldings and surface edges are discarded." },
    ],
    contorno: [
      { tex: en(math.grow), note: "Stain mode: region growing in Lab colour from the clicked point, with adjustable tolerance τ." },
      { tex: en(math.sam), note: "Element mode: the SlimSAM network's encoder E transforms the image and the decoder D generates masks from the clicks. The outline is extracted by Moore tracing and simplified by Douglas–Peucker." },
    ],
    comparacao: [
      { tex: en(math.compare), note: "The model grows with the number of matching pairs: 2 pairs give a similarity, 3 an affine map and 4 or more a homography." },
      { tex: en(math.overlap), note: "Two damages of the same category are the same damage if their overlap, on a 400-cell grid, reaches at least 20% of the smaller one. A change above ±20% counts as growth or reduction." },
    ],
    laudo: [
      { tex: en(math.shoelace), note: "The area of each damage comes from the shoelace formula over its vertices, already in metric coordinates." },
      { tex: en(areaError), note: "First-order propagation of the view's precision to the measurement, assuming independent errors per vertex." },
      { tex: en(math.gut), note: "Priority P from the GUT matrix and cost C from the sum of quantities q and prices π of each treatment, tied to the drawing." },
    ],
  },
  ai: {
    label: "Artificial intelligence",
    title: "How AI assists at each step",
    text:
      "Calling everything AI would hide what matters. In a technical document, you need to know what is an explicit mathematical model, what is a statistical rule and what is a neural network. So each step states its nature.",
    headers: ["Step", "Method", "Nature", "Role of automation", "Who decides"],
    rows: [
      { step: "Rectification", method: "Homography and least squares", nature: "Geometry and statistics", role: "Computes the plane and the uncertainty", human: "The professional marks the points and checks the measurements" },
      { step: "Detection", method: "cv-2 engine: graphs, robust statistics and Hessian", nature: "Classical computer vision", role: "Suggests damage, each with a reason and a confidence", human: "The professional accepts or rejects one by one" },
      { step: "Outline", method: "SlimSAM and region growing", nature: "Public third-party neural network, run in the browser", role: "Cuts out the element from one click", human: "The professional refines and confirms" },
      { step: "Comparison", method: "Transformation from matching points", nature: "Geometry", role: "Aligns the dates and counts the changes", human: "The professional marks the pairs and interprets" },
      { step: "Report", method: "GUT matrix, budget and text from the data", nature: "Deterministic rules", role: "Builds the document and states the use of AI", human: "The responsible professional reviews and signs" },
      { step: "Trained model (ml-1)", method: "U-Net on MobileNetV2, in ONNX", nature: "Neural network, in development and not in production", role: "To take over a damage class only if it clears the quality gate", human: "Gate: precision ≥ 70%, recall ≥ 35% and better than cv-2" },
    ],
    note: "Detection by a trained network is not in use yet. Until then, no damage class changes engine, and the engine of each accepted damage is recorded.",
  },
  diff: {
    label: "Differentiators",
    title: "What changes compared with the alternatives",
    text: "The comparison is by tool category, not by product. Features vary case by case; the table shows the most common pattern.",
    headers: ["Aspect", "Traditional workflow", "Generic tools (CAD, photogrammetry, inspection)", "ArchRay"],
    rows: [
      ["Metric base", "Survey drawing and a photo fitted by eye", "Requires a dedicated survey (drone, laser) or other software", "Rectification from a photo and measurements, with stated precision"],
      ["Damage drawing", "Manual CAD hatching", "Manual, with no pathology legend", "Damage library, AI outline and suggested detection"],
      ["Quantities", "Extracted by hand to a spreadsheet", "Possible, but outside the report", "Automatic, by class and by area of the building"],
      ["Uncertainty", "Not stated", "Stated for the survey, not for each damage", "Propagated to the measurement of each damage"],
      ["Priority and budget", "Separate spreadsheets", "Usually absent", "GUT matrix and price table tied to the drawing"],
      ["Report", "Assembled in a word processor", "Generic reports", "PDF, A3 sheet and DXF generated from the same data"],
      ["Use of AI", "Not applicable", "When present, usually opaque", "Suggests with reasons, individual acceptance and a recorded engine"],
      ["Time series", "Starts over at each visit", "Rare", "Aligned comparison between surveys"],
    ],
    note: "A laser scanner measures better than a photo, and there are cases where it is indispensable. The point is fitness for the problem: known precision, in the same place as the map, the budget and the report.",
  },
  limits: {
    label: "Stated limits",
    title: "What the method does not claim",
    items: [
      ["Plane", "The homography assumes a flat surface. Reliefs outside the plane suffer parallax, and facades with distinct volumes need one view per plane."],
      ["Resolution", "Anything smaller than a pixel does not appear. Photo quality limits detection, and the system warns about shadow, low resolution, blown-out or dark areas."],
      ["Detection", "It is a hypothesis, not a diagnosis. On decorated surfaces confidence is lower and a warning appears on the view."],
      ["Cause", "The image records the symptom. Investigating causes, testing and structural analysis stay with the responsible professional."],
    ],
  },
};

export const SCIENCE: Record<Lang, Science> = { pt, en: enCopy };
