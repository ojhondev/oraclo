import "server-only";
import { isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { GeometryKind } from "@/lib/db/schema";

type DefaultType = {
  code: string;
  name: string;
  category: string;
  color: string;
  pattern: string;
  geometry: GeometryKind;
  description: string;
};

/**
 * Biblioteca padrão de danos — nomenclatura usual dos mapas de danos de restauro
 * no Brasil. A legenda é validada com os restauradores do piloto (PRD §15).
 */
export const DEFAULT_DAMAGE_TYPES: DefaultType[] = [
  // Estrutura e fissuração
  { code: "FIS", name: "Fissura", category: "Fissuração", color: "#b42318", pattern: "linha", geometry: "linha", description: "Abertura até ~0,5 mm, superficial." },
  { code: "TRI", name: "Trinca", category: "Fissuração", color: "#7a1610", pattern: "linha-dupla", geometry: "linha", description: "Abertura entre ~0,5 e 1,5 mm." },
  { code: "RAC", name: "Rachadura", category: "Fissuração", color: "#4a0d08", pattern: "linha-grossa", geometry: "linha", description: "Abertura acima de ~1,5 mm; pode indicar problema estrutural." },
  { code: "DEF", name: "Deformação / abaulamento", category: "Estrutura", color: "#9e3a1a", pattern: "cruzado", geometry: "area", description: "Desaprumo, embarrigamento ou flecha excessiva." },
  // Umidade
  { code: "UMA", name: "Umidade ascendente", category: "Umidade", color: "#1d5fa8", pattern: "diagonal", geometry: "area", description: "Umidade vinda do solo por capilaridade." },
  { code: "UMD", name: "Umidade descendente / infiltração", category: "Umidade", color: "#3b82c4", pattern: "diagonal-inversa", geometry: "area", description: "Água vinda da cobertura, calhas ou esquadrias." },
  { code: "EFL", name: "Eflorescência", category: "Umidade", color: "#8fb8de", pattern: "pontilhado", geometry: "area", description: "Depósito de sais na superfície." },
  // Revestimentos
  { code: "DES", name: "Desagregação do reboco", category: "Revestimento", color: "#c8742a", pattern: "pontilhado-denso", geometry: "area", description: "Perda de coesão da argamassa." },
  { code: "PRB", name: "Perda de reboco", category: "Revestimento", color: "#e0a050", pattern: "solido", geometry: "area", description: "Lacuna com alvenaria aparente." },
  { code: "DPT", name: "Descolamento / perda de pintura", category: "Revestimento", color: "#d9b26f", pattern: "horizontal", geometry: "area", description: "Película de tinta solta ou ausente." },
  { code: "SUJ", name: "Sujidade / crosta negra", category: "Revestimento", color: "#55524c", pattern: "pontilhado", geometry: "area", description: "Depósito de poluição e particulado." },
  // Biológicos
  { code: "BIO", name: "Biodeterioração (fungos, liquens, musgos)", category: "Biológico", color: "#2f6b4f", pattern: "circulos", geometry: "area", description: "Colonização biológica da superfície." },
  { code: "VEG", name: "Vegetação parasita", category: "Biológico", color: "#4d8a3a", pattern: "solido", geometry: "ponto", description: "Plantas enraizadas na alvenaria ou cobertura." },
  { code: "XIL", name: "Ataque de xilófagos (cupim, broca)", category: "Biológico", color: "#6b4a2b", pattern: "pontilhado-denso", geometry: "area", description: "Madeira com galerias, orifícios ou serragem." },
  { code: "PAS", name: "Excrementos de aves", category: "Biológico", color: "#a39e93", pattern: "pontilhado", geometry: "area", description: "Depósito de guano." },
  // Madeira, metal, vidro
  { code: "APO", name: "Apodrecimento da madeira", category: "Madeira", color: "#4a3520", pattern: "cruzado", geometry: "area", description: "Perda de seção por fungos de podridão." },
  { code: "COR", name: "Corrosão / oxidação", category: "Metal", color: "#a0522d", pattern: "solido", geometry: "area", description: "Ferragens, gradis e grampos oxidados." },
  { code: "VID", name: "Vidro quebrado / ausente", category: "Esquadrias", color: "#5fa8a8", pattern: "solido", geometry: "area", description: "" },
  // Ações humanas
  { code: "LAC", name: "Lacuna / perda de elemento", category: "Perdas", color: "#7c3aed", pattern: "contorno", geometry: "area", description: "Ornamento, peça ou trecho faltante." },
  { code: "INA", name: "Intervenção inadequada", category: "Ações humanas", color: "#c026d3", pattern: "diagonal", geometry: "area", description: "Reparos com material incompatível (cimento, tinta acrílica…)." },
  { code: "PIC", name: "Pichação / vandalismo", category: "Ações humanas", color: "#db2777", pattern: "solido", geometry: "area", description: "" },
  { code: "INS", name: "Instalação aparente (elétrica, hidráulica)", category: "Ações humanas", color: "#64748b", pattern: "linha", geometry: "linha", description: "Fiação, tubulação ou equipamento sobreposto." },
];

/** Garante a biblioteca padrão (orgId nulo) no banco — insere só os códigos que faltam. */
export async function ensureDefaultDamageTypes() {
  const have = await db
    .select({ code: schema.damageTypes.code })
    .from(schema.damageTypes)
    .where(isNull(schema.damageTypes.orgId));
  const existing = new Set(have.map((r) => r.code));
  const missing = DEFAULT_DAMAGE_TYPES.map((t, i) => ({ ...t, orgId: null, sortOrder: i })).filter(
    (t) => !existing.has(t.code),
  );
  if (missing.length) await db.insert(schema.damageTypes).values(missing);
}
