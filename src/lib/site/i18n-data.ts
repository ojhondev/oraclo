import { priority } from "@/lib/pricing";
import { locale, type Lang } from "./lang";

/** Nomes dos tipos de dano em inglês (pelo código da biblioteca). */
const DAMAGE_EN: Record<string, string> = {
  FIS: "Hairline crack",
  TRI: "Crack",
  RAC: "Wide crack",
  DEF: "Deformation / bulging",
  UMA: "Rising damp",
  UMD: "Penetrating damp / leak",
  EFL: "Efflorescence",
  DES: "Render disaggregation",
  PRB: "Render loss",
  DPT: "Paint detachment / loss",
  SUJ: "Soiling / black crust",
  BIO: "Biodeterioration (fungi, lichens, moss)",
  VEG: "Plant growth",
  VID: "Broken / missing glass",
  XIL: "Wood-boring insects",
  PAS: "Bird droppings",
};

export const damageName = (code: string, pt: string, lang: Lang) => (lang === "en" ? DAMAGE_EN[code] ?? pt : pt);

const PRIO_EN = ["", "Priority 1 — immediate", "Priority 2 — short term", "Priority 3 — medium term", "Priority 4 — monitor"];

/** Faixa de prioridade GUT no idioma. */
export const prioLabel = (score: number, lang: Lang) => {
  const p = priority(score);
  return lang === "en" ? PRIO_EN[p.level]! : p.label;
};

/** Número com casas decimais no formato do idioma (1,58 / 1.58). */
export const fmtNum = (n: number, digits: number, lang: Lang) =>
  n.toLocaleString(locale(lang), { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Data por extenso curta (15 de out. de 2026 / Oct 15, 2026). */
export const fmtDateShort = (iso: string, lang: Lang) =>
  new Intl.DateTimeFormat(locale(lang), { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));

/** Data por extenso longa (15 de outubro de 2026 / October 15, 2026). */
export const fmtDateLong = (iso: string, lang: Lang) =>
  new Intl.DateTimeFormat(locale(lang), { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));
