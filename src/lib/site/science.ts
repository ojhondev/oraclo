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
    steps: { title: string; text: string }[];
    beforeLabel: string;
    afterLabel: string;
    compare: [string, string][];
    cta: string;
  };
  transform: { label: string; title: string; text: string; before: string; after: string; rows: [string, string, string][] };
  mathLabel: string;
  /** Equações por frente, na mesma ordem e com os mesmos ids de `tech.items`. */
  math: Record<string, Eq[]>;
  ai: { label: string; title: string; text: string; headers: [string, string, string, string, string]; rows: AiRow[]; note: string };
  diff: { label: string; title: string; text: string; headers: [string, string, string, string]; rows: [string, string, string, string][]; note: string };
};

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
    label: "O que é o ArchRay",
    title: "O mapa de danos, reinventado do vídeo ao laudo",
    text:
      "O ArchRay é a plataforma que transforma um vídeo da fachada em diagnóstico completo. Em vez de juntar trena, CAD, planilha e editor de texto, você grava com o celular e segue um único fluxo: modelo 3D, nuvem de pontos, imagem em escala, mapa de danos com IA e laudo.",
    steps: [
      { title: "Grave a fachada", text: "Filme com o celular. O ArchRay escolhe os quadros mais nítidos." },
      { title: "Modelo 3D e nuvem de pontos", text: "A fotogrametria reconstrói a edificação em três dimensões." },
      { title: "Imagem em escala", text: "Uma medida real calibra o modelo e gera a imagem da fachada." },
      { title: "Mapa de danos com IA", text: "A IA sugere, o contorno sai em um clique e o profissional decide." },
      { title: "Laudo pronto", text: "Quantitativos, prioridades, orçamento, prancha e PDF do mesmo dado." },
    ],
    beforeLabel: "Antes",
    afterLabel: "Com o ArchRay",
    compare: [
      ["Trena, croqui e fotos soltas", "Um vídeo gravado no celular"],
      ["Hachura à mão, dano por dano", "IA sugere e o profissional revisa"],
      ["Planilha sem margem de erro", "Medidas calculadas, com margem de erro"],
      ["Laudo montado em vários programas", "Tudo em um só fluxo"],
    ],
    cta: "Ver a transformação",
  },
  transform: {
    label: "A transformação",
    title: "O mapa de danos antes e depois do ArchRay",
    text: "O trabalho técnico continua sendo seu. O que muda é tudo que ficava em volta dele.",
    before: "Antes",
    after: "Com o ArchRay",
    rows: [
      ["Levantamento", "Trena, croqui e fotos soltas", "Um vídeo da fachada gravado no celular"],
      ["Base de trabalho", "Desenho cadastral e foto ajustada no olho", "Modelo 3D, nuvem de pontos e imagem em escala"],
      ["Marcação dos danos", "Hachura à mão no CAD, dano por dano", "Sugestões da IA e contorno em um clique, com revisão profissional"],
      ["Medidas", "Planilha preenchida à mão, sem margem de erro", "Áreas e comprimentos calculados, com margem de erro"],
      ["Decisão", "Prioridade e orçamento em arquivos separados", "GUT e orçamento ligados a cada dano do desenho"],
      ["Entrega", "Laudo montado em editor de texto", "Laudo, prancha A3 e DXF gerados do mesmo dado"],
      ["Acompanhamento", "Cada visita recomeça do zero", "Vistorias comparadas: o que surgiu, cresceu ou foi tratado"],
    ],
  },
  mathLabel: "Fundamentos",
  math: {
    captura: [
      { tex: m`\min_{P,\,X}\sum_{i,j}\lVert\mathbf{x}_{ij}-\pi(P_i,X_j)\rVert^2`, note: "Ajuste de feixes: a fotogrametria busca as posições das câmeras P e os pontos 3D X que melhor explicam o que cada quadro vê. O processamento usa o OpenDroneMap, software aberto." },
      { tex: m`s=\mathrm{Var}(\nabla^2 I)`, note: "Na gravação, cada janela de tempo guarda só o quadro de maior nitidez, medida pela variância do Laplaciano. Quadros repetidos ou tremidos ficam de fora." },
    ],
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
    title: "A IA sugere. O profissional decide.",
    text:
      "Nada de caixa-preta. Em um documento técnico, você precisa saber de onde vem cada resultado, então cada etapa mostra exatamente o que a máquina faz e quem dá a palavra final.",
    headers: ["Etapa", "Método", "Natureza", "Papel da automação", "Quem decide"],
    rows: [
      { step: "Modelo 3D", method: "Fotogrametria com OpenDroneMap", nature: "Geometria 3D, com software aberto", role: "Reconstrói a edificação a partir dos quadros do vídeo", human: "O profissional informa uma medida real para a escala" },
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
    title: "Outras ferramentas resolvem uma parte. O ArchRay resolve o caminho inteiro.",
    text: "Do campo à entrega, sem trocar de programa. O quadro compara por categoria de ferramenta e mostra o padrão mais comum.",
    headers: ["Aspecto", "Fluxo tradicional", "Ferramentas genéricas (CAD, fotogrametria, inspeção)", "ArchRay"],
    rows: [
      ["Captura", "Trena, croqui e fotos soltas", "Exige drone, laser ou outro software", "Vídeo no celular vira modelo 3D e nuvem de pontos"],
      ["Base em escala", "Desenho cadastral e foto ajustada no olho", "Depende de um levantamento dedicado", "Imagem em escala, com precisão declarada"],
      ["Desenho dos danos", "Hachura manual no CAD", "Manual, sem legenda de patologias", "Biblioteca de danos, contorno por IA e detecção sugerida"],
      ["Quantitativos", "Extraídos à mão para planilha", "Possíveis, mas fora do contexto do laudo", "Automáticos, por classe e por área do imóvel"],
      ["Incerteza", "Não declarada", "Declarada no levantamento, não em cada dano", "Propagada até a medida de cada dano"],
      ["Prioridade e orçamento", "Planilhas separadas", "Em geral ausentes", "Matriz GUT e tabela de preços ligadas ao desenho"],
      ["Laudo", "Montado em editor de texto", "Relatórios genéricos", "PDF, prancha A3 e DXF gerados do mesmo dado"],
      ["Uso de IA", "Não se aplica", "Quando há, costuma ser opaco", "Sugere com justificativa, com aceite individual e motor registrado"],
      ["Série histórica", "Recomeça a cada visita", "Rara", "Comparação alinhada entre vistorias"],
    ],
    note: "Já usa laser ou drone? Importe a nuvem de pontos ou o modelo e siga no mesmo fluxo do ArchRay.",
  },
};

const enCopy: Science = {
  home: {
    label: "What ArchRay is",
    title: "The damage map, reinvented from video to report",
    text:
      "ArchRay is the platform that turns a facade video into a complete diagnosis. Instead of juggling tape measures, CAD, spreadsheets and word processors, you record on your phone and follow one flow: 3D model, point cloud, scaled image, AI damage map and report.",
    steps: [
      { title: "Record the facade", text: "Film on your phone. ArchRay picks the sharpest frames." },
      { title: "3D model and point cloud", text: "Photogrammetry rebuilds the building in three dimensions." },
      { title: "Scaled image", text: "One real measurement calibrates the model and generates the facade image." },
      { title: "AI damage map", text: "AI suggests, outlines take one click and the professional decides." },
      { title: "Report ready", text: "Quantities, priorities, budget, sheet and PDF from the same data." },
    ],
    beforeLabel: "Before",
    afterLabel: "With ArchRay",
    compare: [
      ["Tape measure, sketches and loose photos", "One video recorded on a phone"],
      ["Hatching by hand, damage by damage", "AI suggests and the professional reviews"],
      ["Spreadsheets with no margin of error", "Computed measurements, with a margin of error"],
      ["A report assembled across several programs", "Everything in one flow"],
    ],
    cta: "See the transformation",
  },
  transform: {
    label: "The transformation",
    title: "The damage map before and after ArchRay",
    text: "The technical work is still yours. What changes is everything around it.",
    before: "Before",
    after: "With ArchRay",
    rows: [
      ["Survey", "Tape measure, sketches and loose photos", "One facade video recorded on a phone"],
      ["Working base", "Survey drawing and a photo fitted by eye", "3D model, point cloud and scaled image"],
      ["Marking damage", "Hatching by hand in CAD, damage by damage", "AI suggestions and one-click outlines, with professional review"],
      ["Measurements", "Hand-filled spreadsheet with no margin of error", "Computed areas and lengths, with a margin of error"],
      ["Decision", "Priority and budget in separate files", "GUT and budget tied to each damage on the drawing"],
      ["Delivery", "Report assembled in a word processor", "Report, A3 sheet and DXF generated from the same data"],
      ["Follow-up", "Every visit starts from zero", "Compared surveys: what appeared, grew or was treated"],
    ],
  },
  mathLabel: "Foundations",
  math: {
    captura: [
      { tex: m`\min_{P,\,X}\sum_{i,j}\lVert\mathbf{x}_{ij}-\pi(P_i,X_j)\rVert^2`, note: "Bundle adjustment: photogrammetry looks for the camera positions P and 3D points X that best explain what each frame sees. Processing uses OpenDroneMap, open-source software." },
      { tex: m`s=\mathrm{Var}(\nabla^2 I)`, note: "While recording, each time window keeps only the sharpest frame, measured by the variance of the Laplacian. Repeated or shaky frames are left out." },
    ],
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
    title: "AI suggests. The professional decides.",
    text:
      "No black box. In a technical document you need to know where each result comes from, so every step shows exactly what the machine does and who has the final word.",
    headers: ["Step", "Method", "Nature", "Role of automation", "Who decides"],
    rows: [
      { step: "3D model", method: "Photogrammetry with OpenDroneMap", nature: "3D geometry, with open-source software", role: "Rebuilds the building from the video frames", human: "The professional enters a real measurement for scale" },
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
    title: "Other tools solve one part. ArchRay solves the whole path.",
    text: "From the field to delivery, without switching programs. The table compares tool categories and shows the most common pattern.",
    headers: ["Aspect", "Traditional workflow", "Generic tools (CAD, photogrammetry, inspection)", "ArchRay"],
    rows: [
      ["Capture", "Tape measure, sketches and loose photos", "Requires a drone, laser or other software", "A phone video becomes a 3D model and point cloud"],
      ["Scaled base", "Survey drawing and a photo fitted by eye", "Depends on a dedicated survey", "Scaled image, with stated precision"],
      ["Damage drawing", "Manual CAD hatching", "Manual, with no pathology legend", "Damage library, AI outline and suggested detection"],
      ["Quantities", "Extracted by hand to a spreadsheet", "Possible, but outside the report", "Automatic, by class and by area of the building"],
      ["Uncertainty", "Not stated", "Stated for the survey, not for each damage", "Propagated to the measurement of each damage"],
      ["Priority and budget", "Separate spreadsheets", "Usually absent", "GUT matrix and price table tied to the drawing"],
      ["Report", "Assembled in a word processor", "Generic reports", "PDF, A3 sheet and DXF generated from the same data"],
      ["Use of AI", "Not applicable", "When present, usually opaque", "Suggests with reasons, individual acceptance and a recorded engine"],
      ["Time series", "Starts over at each visit", "Rare", "Aligned comparison between surveys"],
    ],
    note: "Already using a laser or drone? Import the point cloud or model and continue in the same ArchRay flow.",
  },
};

export const SCIENCE: Record<Lang, Science> = { pt, en: enCopy };
