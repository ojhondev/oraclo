/**
 * Conteúdo de comparação do site (Nossa Tecnologia), em PT e EN: levantamento tradicional × serviço
 * ArchRay e diferenciais. Não publicar aqui método interno (bibliotecas, algoritmos, fórmulas).
 */
import type { Lang } from "./lang";

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
  diff: { label: string; title: string; text: string; headers: [string, string, string, string]; rows: [string, string, string, string][]; note: string };
};

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
