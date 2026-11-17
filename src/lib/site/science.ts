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
    title: "Um serviço de levantamento e laudo, com tecnologia própria",
    text:
      "O ArchRay é o serviço de diagnóstico de fachadas do Estúdio Restaura. Em vez de mobilizar laser scanner e drone com LiDAR, nossa equipe grava a edificação com o celular e o nosso software transforma o vídeo em modelo 3D, nuvem de pontos, imagem em escala, mapa de danos e laudo. Você recebe o diagnóstico pronto.",
    steps: [
      { title: "Vistoria", text: "Nossa equipe vai ao imóvel e grava a fachada com o celular e o marcador de escala." },
      { title: "Modelo 3D e nuvem de pontos", text: "A fotogrametria reconstrói a edificação em três dimensões." },
      { title: "Imagem em escala", text: "O marcador calibra o modelo e gera a imagem da fachada em escala." },
      { title: "Mapa de danos", text: "A IA sugere e os arquitetos de restauro confirmam cada dano." },
      { title: "Laudo e orçamento", text: "Quantitativos, prioridades, orçamento, pranchas e laudo assinado." },
    ],
    beforeLabel: "Levantamento tradicional",
    afterLabel: "Serviço ArchRay",
    compare: [
      ["Laser scanner e drone com LiDAR em campo", "Celular e marcador de escala"],
      ["Entrega uma nuvem de pontos para alguém interpretar", "Entrega mapa de danos, orçamento e laudo"],
      ["Equipamento caro encarece cada levantamento", "Menos mobilização, orçamento mais acessível"],
      ["Levantamento, desenho e laudo com fornecedores diferentes", "Um só serviço, do campo ao laudo"],
    ],
    cta: "Ver a diferença",
  },
  transform: {
    label: "A diferença",
    title: "Levantamento tradicional × serviço ArchRay",
    text: "Laser scanner e drone continuam ótimos quando o projeto exige precisão milimétrica. Para diagnosticar e orçar a recuperação de uma fachada, o nosso caminho é mais curto.",
    before: "Levantamento tradicional",
    after: "Serviço ArchRay",
    rows: [
      ["Em campo", "Laser scanner terrestre e drone com LiDAR, com equipe especializada", "Nossa equipe com celular, app de captura e marcador de escala"],
      ["Mobilização", "Equipamento caro, transporte e, no caso do drone, autorização de voo", "Leve: o que cabe numa mochila"],
      ["Base de trabalho", "Nuvem de pontos bruta, que ainda precisa ser tratada", "Modelo 3D, nuvem de pontos e imagem em escala com precisão declarada"],
      ["Marcação dos danos", "Feita depois, à mão no CAD, por outro profissional", "Sugerida pela IA e confirmada por arquitetos de restauro"],
      ["Decisão", "Prioridade e orçamento montados à parte", "Matriz GUT e orçamento ligados a cada dano"],
      ["Entrega", "Arquivos para o seu time interpretar", "Laudo, pranchas, DXF e orçamento, prontos para decidir"],
      ["Acompanhamento", "Novo levantamento, novo custo cheio", "Vistorias comparadas: o que surgiu, cresceu ou foi tratado"],
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
    title: "Outros fornecedores entregam uma parte. Nós entregamos o diagnóstico inteiro.",
    text: "Do campo ao laudo, com uma só equipe. O quadro compara por tipo de fornecedor e mostra o padrão mais comum.",
    headers: ["Aspecto", "Levantamento com laser scanner ou drone", "Vistoria tradicional", "Serviço ArchRay"],
    rows: [
      ["Em campo", "Laser scanner terrestre e drone com LiDAR", "Trena, croqui e fotos soltas", "Celular, app de captura e marcador de escala"],
      ["Base em escala", "Nuvem de pontos precisa, mas bruta", "Desenho cadastral e foto ajustada no olho", "Modelo 3D e imagem em escala, com precisão declarada"],
      ["Mapa de danos", "Fora do escopo; fica para outro profissional", "Hachura manual no CAD", "IA sugere, arquitetos de restauro confirmam"],
      ["Quantitativos", "Possíveis, mas não ligados ao dano", "Extraídos à mão para planilha", "Por classe de dano e por área do imóvel"],
      ["Incerteza", "Declarada no levantamento, não em cada dano", "Não declarada", "Propagada até a medida de cada dano"],
      ["Prioridade e orçamento", "Em geral ausentes", "Planilhas separadas", "Matriz GUT e orçamento ligados ao desenho"],
      ["Laudo", "Não incluso", "Montado em editor de texto", "Laudo, pranchas A3 e DXF, assinados pelo responsável técnico"],
      ["Custo e mobilização", "Equipamento caro e equipe especializada", "Baixo, mas sem base métrica", "Leve, com base métrica"],
      ["Série histórica", "Novo levantamento a cada vez", "Recomeça a cada visita", "Comparação alinhada entre vistorias"],
    ],
    note: "Já tem levantamento com laser ou drone? Trabalhamos sobre a sua nuvem de pontos ou modelo e entregamos o diagnóstico.",
  },
};

const enCopy: Science = {
  home: {
    label: "What ArchRay is",
    title: "A survey and report service, built on in-house technology",
    text:
      "ArchRay is Estúdio Restaura's façade diagnosis service. Instead of mobilising a laser scanner and a LiDAR drone, our team records the building on a phone and our software turns the video into a 3D model, point cloud, scaled image, damage map and report. You receive a finished diagnosis.",
    steps: [
      { title: "Site visit", text: "Our team goes to the building and records the façade with a phone and the scale marker." },
      { title: "3D model and point cloud", text: "Photogrammetry rebuilds the building in three dimensions." },
      { title: "Scaled image", text: "The marker calibrates the model and produces the scaled façade image." },
      { title: "Damage map", text: "AI suggests and restoration architects confirm every defect." },
      { title: "Report and budget", text: "Quantities, priorities, budget, drawings and a signed report." },
    ],
    beforeLabel: "Traditional survey",
    afterLabel: "ArchRay service",
    compare: [
      ["Laser scanner and LiDAR drone on site", "A phone and a scale marker"],
      ["Delivers a point cloud for someone to interpret", "Delivers a damage map, budget and report"],
      ["Expensive equipment raises every survey's cost", "Less mobilisation, a more affordable budget"],
      ["Survey, drawings and report from different suppliers", "One service, from site to report"],
    ],
    cta: "See the difference",
  },
  transform: {
    label: "The difference",
    title: "Traditional survey × ArchRay service",
    text: "Laser scanners and drones are still great when a project needs millimetre precision. To diagnose and price the repair of a façade, our path is shorter.",
    before: "Traditional survey",
    after: "ArchRay service",
    rows: [
      ["On site", "Terrestrial laser scanner and LiDAR drone, with a specialised crew", "Our team with a phone, capture app and scale marker"],
      ["Mobilisation", "Expensive equipment, transport and, for drones, flight permits", "Light: it fits in a backpack"],
      ["Working base", "A raw point cloud that still needs processing", "3D model, point cloud and scaled image with stated precision"],
      ["Marking damage", "Done later, by hand in CAD, by someone else", "Suggested by AI and confirmed by restoration architects"],
      ["Decision", "Priority and budget put together separately", "GUT matrix and budget tied to each defect"],
      ["Delivery", "Files for your team to interpret", "Report, drawings, DXF and budget, ready to decide"],
      ["Follow-up", "New survey, full cost again", "Compared surveys: what appeared, grew or was treated"],
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
    title: "Other suppliers deliver one part. We deliver the whole diagnosis.",
    text: "From site to report, with one team. The table compares supplier types and shows the most common pattern.",
    headers: ["Aspect", "Laser scanner or drone survey", "Traditional inspection", "ArchRay service"],
    rows: [
      ["On site", "Terrestrial laser scanner and LiDAR drone", "Tape measure, sketches and loose photos", "Phone, capture app and scale marker"],
      ["Scaled base", "Precise but raw point cloud", "Survey drawing and a photo fitted by eye", "3D model and scaled image, with stated precision"],
      ["Damage map", "Out of scope; left to someone else", "Manual CAD hatching", "AI suggests, restoration architects confirm"],
      ["Quantities", "Possible, but not tied to each defect", "Extracted by hand to a spreadsheet", "By defect class and by area of the building"],
      ["Uncertainty", "Stated for the survey, not each defect", "Not stated", "Propagated to the measurement of each defect"],
      ["Priority and budget", "Usually absent", "Separate spreadsheets", "GUT matrix and budget tied to the drawing"],
      ["Report", "Not included", "Assembled in a word processor", "Report, A3 drawings and DXF, signed by the professional in charge"],
      ["Cost and mobilisation", "Expensive equipment and a specialised crew", "Low, but no metric base", "Light, with a metric base"],
      ["Time series", "A new survey every time", "Starts over at each visit", "Aligned comparison between surveys"],
    ],
    note: "Already have a laser or drone survey? We work on your point cloud or model and deliver the diagnosis.",
  },
};

export const SCIENCE: Record<Lang, Science> = { pt, en: enCopy };
