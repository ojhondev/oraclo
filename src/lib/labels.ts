/** Rótulos em português dos enums do schema. */

export const siteKinds = {
  igreja: "Igreja",
  capela: "Capela",
  convento: "Convento / mosteiro",
  casarao: "Casarão / sobrado",
  edificio_publico: "Edifício público",
  conjunto: "Conjunto arquitetônico",
  monumento: "Monumento",
  outro: "Outro",
} as const;

export const protectionLevels = {
  federal: "Tombamento federal",
  estadual: "Tombamento estadual",
  municipal: "Tombamento municipal",
  em_estudo: "Em processo de tombamento",
  nenhuma: "Sem proteção legal",
} as const;

export const elementKinds = {
  fachada: "Fachada",
  interior: "Interior",
  cobertura: "Cobertura",
  torre: "Torre / cúpula",
  elemento_artistico: "Elemento artístico",
  terreno: "Terreno / entorno",
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
