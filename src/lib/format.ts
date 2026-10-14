import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TZDate } from "@date-fns/tz";

const TZ = "America/Sao_Paulo";

/** Sempre formatar datas por aqui (servidor roda em UTC). */
export function fmtDate(d: Date | string, pattern = "dd/MM/yyyy") {
  const date = typeof d === "string" ? new Date(d.length === 10 ? `${d}T12:00:00Z` : d) : d;
  return format(new TZDate(date, TZ), pattern, { locale: ptBR });
}

export function todayISO() {
  return format(new TZDate(new Date(), TZ), "yyyy-MM-dd");
}

export function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 ? 1 : 0).replace(".", ",")} ${units[i]}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
