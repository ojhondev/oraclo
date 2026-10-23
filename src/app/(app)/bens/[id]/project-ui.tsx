import Link from "next/link";
import { cn } from "@/lib/utils";
import { BetaBadge } from "@/components/beta-badge";

/** Abas da tela de Projeto — a "barra de funcionalidades". */
export const TABS = [
  { id: "resumo", label: "Resumo" },
  { id: "vistas", label: "Vistas" },
  { id: "danos", label: "Danos" },
  { id: "vistorias", label: "Vistorias" },
  { id: "areas", label: "Áreas" },
  { id: "modelo3d", label: "Modelo 3D", beta: true },
  { id: "ficha", label: "Ficha" },
] as const;
export type TabId = (typeof TABS)[number]["id"];

export function parseTab(v: unknown): TabId {
  return TABS.some((t) => t.id === v) ? (v as TabId) : "resumo";
}

/** Link para uma aba, mantendo o filtro de vistoria. */
export function tabHref(siteId: string, tab: TabId, vistoria?: string | null) {
  const q = new URLSearchParams();
  if (tab !== "resumo") q.set("aba", tab);
  if (vistoria) q.set("vistoria", vistoria);
  const s = q.toString();
  return `/bens/${siteId}${s ? `?${s}` : ""}`;
}

export function TabBar({
  siteId,
  active,
  vistoria,
  counts,
}: {
  siteId: string;
  active: TabId;
  vistoria: string | null;
  counts: Partial<Record<TabId, number>>;
}) {
  return (
    <nav
      aria-label="Seções do projeto"
      data-tour="project-tabs"
      className="thin-scroll flex gap-1 overflow-x-auto border-b px-5 sm:px-8 lg:px-10"
    >
      {TABS.map((t) => {
        const on = t.id === active;
        const n = counts[t.id];
        return (
          <Link
            key={t.id}
            href={tabHref(siteId, t.id, vistoria)}
            aria-current={on ? "page" : undefined}
            className={cn(
              "-mb-px flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-[14px] transition-colors",
              on ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {"beta" in t && t.beta && <BetaBadge />}
            {n != null && n > 0 && <span className="rounded-full bg-muted px-1.5 text-[11.5px] tabular-nums text-muted-foreground">{n}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function Section({
  title,
  description,
  children,
  action,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("grid min-w-0 content-start gap-4 rounded-2xl border bg-card p-5", className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            {title && <h2 className="text-[16px] font-medium leading-tight">{title}</h2>}
            {description && <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-2xl border bg-card px-4 py-3.5">
      <div className="truncate text-[12px] text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-[22px] font-medium leading-none tabular-nums">{value}</div>
      {hint && <div className="mt-1.5 truncate text-[11.5px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

/** Barra horizontal simples (sem biblioteca de gráficos). */
export function Bar({ label, value, max, right, color }: { label: React.ReactNode; value: number; max: number; right: string; color?: string }) {
  return (
    <li className="grid min-w-0 gap-1">
      <div className="flex min-w-0 items-baseline gap-2 text-[12.5px]">
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <span className="shrink-0 text-muted-foreground tabular-nums">{right}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground"
          style={{ width: `${max > 0 ? Math.max(2, (value / max) * 100) : 0}%`, ...(color && { background: color }) }}
        />
      </div>
    </li>
  );
}

export const PRIORITY_SHADES = ["bg-foreground", "bg-foreground/70", "bg-foreground/45", "bg-foreground/20"];
export const PRIORITY_NAMES = ["Imediata", "Curto prazo", "Médio prazo", "Monitorar"];

/** Faixa empilhada com a distribuição das prioridades GUT e a legenda. */
export function PriorityBar({ rows, fmt }: { rows: { level: number; count: number; cents: number }[]; fmt: (cents: number) => string }) {
  const total = rows.reduce((s, r) => s + r.count, 0);
  return (
    <div className="grid min-w-0 gap-3">
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        {rows.map((r, i) => (r.count ? <div key={r.level} className={PRIORITY_SHADES[i]} style={{ width: `${(r.count / total) * 100}%` }} /> : null))}
      </div>
      <ul className="grid gap-1 text-[12.5px]">
        {rows.map((r, i) => (
          <li key={r.level} className="flex min-w-0 items-center gap-2">
            <span className={cn("size-2.5 shrink-0 rounded-full", PRIORITY_SHADES[i])} />
            <span className="min-w-0 flex-1 truncate">{PRIORITY_NAMES[i]}</span>
            <span className="shrink-0 text-muted-foreground tabular-nums">
              {r.count} · {fmt(r.cents)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
