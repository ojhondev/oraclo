/** Rótulos em português dos enums do schema. */

export const siteKinds = {
  residencial: "Residencial",
  comercial: "Comercial / varejo",
  corporativo: "Corporativo / escritórios",
  industrial: "Industrial / galpão",
  institucional: "Institucional (saúde, educação, público)",
  infraestrutura: "Infraestrutura",
  patrimonio: "Patrimônio histórico",
  outro: "Outro",
  // tipos antigos, ainda exibidos nos projetos cadastrados com eles
  igreja: "Igreja",
  capela: "Capela",
  convento: "Convento / mosteiro",
  casarao: "Casarão / sobrado",
  edificio_publico: "Edifício público",
  conjunto: "Conjunto arquitetônico",
  monumento: "Monumento",
} as const;

/** Tipos oferecidos no cadastro de projeto. */
export const SITE_KIND_OPTIONS = ["residencial", "comercial", "corporativo", "industrial", "institucional", "infraestrutura", "patrimonio", "outro"] as const;

/** Tipos que pedem os campos de proteção legal (tombamento). */
export const HERITAGE_KINDS = ["patrimonio", "igreja", "capela", "convento", "casarao", "edificio_publico", "conjunto", "monumento"];

export const protectionLevels = {
  federal: "Tombamento federal",
  estadual: "Tombamento estadual",
  municipal: "Tombamento municipal",
  em_estudo: "Em processo de tombamento",
  nenhuma: "Sem proteção legal",
} as const;

export const elementKinds = {
  fachada: "Fachada",
  pavimento: "Pavimento",
  interior: "Ambiente interno",
  cobertura: "Cobertura / telhado",
  estrutura: "Estrutura",
  torre: "Torre / cúpula",
  elemento_artistico: "Elemento decorativo / artístico",
  terreno: "Terreno / área externa",
  outro: "Outro",
} as const;

export const purposes = {
  levantamento: "Levantamento",
  monitoramento: "Monitoramento",
  obra: "Registro de obra",
  outro: "Outro",
} as const;

export const captureModes = {
  fotos: "Fotos (celular)",
  video: "Vídeo",
  lidar: "LiDAR (iPhone)",
  drone: "Drone",
  laser: "Modelo 3D importado",
} as const;

export const captureStatuses = {
  rascunho: "Rascunho",
  enviando: "Enviando",
  na_fila: "Na fila",
  processando: "Processando",
  concluida: "Concluída",
  falhou: "Falhou",
} as const;

export const roles = {
  admin: "Administrador",
  tecnico: "Técnico",
  campo: "Equipe de campo",
  leitor: "Leitor",
} as const;

export const geometryKinds = { area: "Área", linha: "Linha", ponto: "Ponto" } as const;

/** Órgãos de proteção mais comuns — sugestões no formulário. */
export const protectionBodies = [
  "IPHAN",
  "CONDEPHAAT (SP)",
  "CONPRESP (São Paulo)",
  "IEPHA (MG)",
  "INEPAC (RJ)",
  "IRPH (Rio de Janeiro)",
  "IPAC (BA)",
  "FUNDARPE (PE)",
  "IPHAE (RS)",
  "CEPHA (PR)",
];

export const states = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB",
  "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export const severities = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
} as const;
