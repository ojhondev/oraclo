import type { Lang } from "./lang";

/**
 * O site público é só em português (desde 2026-11-18). Sem ler cookies nem cabeçalhos, as páginas
 * podem ser geradas uma vez e servidas do cache, sem gastar CPU a cada visita.
 */
export async function getLang(): Promise<Lang> {
  return "pt";
}
