"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, ImageIcon, MapPin, Plus, Search, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type HomeSite = {
  id: string;
  name: string;
  kind: string;
  city: string | null;
  state: string | null;
  protection: string | null;
  elementCount: number;
  damageCount: number;
};
export type HomeMap = { id: string; siteId: string; name: string; siteName: string; damageCount: number };

type Mode = "bens" | "mapas";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function HomeSearch({ sites, maps, canEdit, autoFocus }: { sites: HomeSite[]; maps: HomeMap[]; canEdit: boolean; autoFocus: boolean }) {
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<Mode>("bens");
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const results = useMemo(() => {
    const t = norm(q.trim());
    if (mode === "bens") {
      return sites
        .filter((s) => !t || norm(`${s.name} ${s.kind} ${s.city ?? ""} ${s.state ?? ""} ${s.protection ?? ""}`).includes(t))
        .map((s) => ({ key: s.id, href: `/bens/${s.id}`, title: s.name, sub: [s.kind, [s.city, s.state].filter(Boolean).join(" · ")].filter(Boolean).join(" — "), meta: `${s.damageCount} danos`, protection: s.protection }));
    }
    return maps
      .filter((m) => !t || norm(`${m.name} ${m.siteName}`).includes(t))
      .map((m) => ({ key: m.id, href: `/bens/${m.siteId}/ortofotos/${m.id}`, title: m.name, sub: m.siteName, meta: `${m.damageCount} danos`, protection: null }));
  }, [q, mode, sites, maps]);

  function submit() {
    if (results[0]) router.push(results[0].href);
  }

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <div className="mb-5 text-center">
        <p className="mb-1.5 text-[13px] text-muted-foreground">Levantamento 3D e BIM</p>
        <h1 className="text-[28px] leading-tight font-normal tracking-[-0.015em] sm:text-[30px]">O que vamos levantar hoje?</h1>
      </div>

      <div data-tour="busca" className="rounded-2xl border bg-card shadow-(--shadow-soft) transition-shadow focus-within:border-foreground/25 focus-within:shadow-(--shadow-focus)">
        <textarea
          ref={inputRef}
          value={q}
          autoFocus={autoFocus}
          rows={2}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={mode === "bens" ? "Busque um projeto, cidade ou endereço…" : "Busque um mapa de danos pelo nome ou pelo projeto…"}
          className="block w-full resize-none bg-transparent px-5 pt-4 text-[16px] outline-none placeholder:text-muted-foreground/80"
        />
        <div className="flex items-center gap-1.5 px-3 pt-1 pb-3">
          {canEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/bens/novo" aria-label="Novo projeto" className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
                  <Plus className="size-[18px]" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>Novo projeto</TooltipContent>
            </Tooltip>
          )}
          <div className="flex items-center rounded-full bg-muted p-0.5">
            <ModeChip active={mode === "bens"} onClick={() => setMode("bens")} icon={Building2}>Projetos</ModeChip>
            <ModeChip active={mode === "mapas"} onClick={() => setMode("mapas")} icon={ImageIcon}>Mapas de danos</ModeChip>
          </div>
          <button
            onClick={submit}
            disabled={!results.length}
            aria-label="Abrir primeiro resultado"
            className="ml-auto grid size-9 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-30"
          >
            <ArrowRight className="size-[18px]" />
          </button>
        </div>
      </div>

      <div className="mt-6">
        {results.length === 0 ? (
          <p className="text-center text-[14px] text-muted-foreground">
            {q ? "Nada encontrado." : mode === "bens" ? "Nenhum projeto ainda." : "Nenhum mapa de danos ainda."}
            {canEdit && mode === "bens" && !q && (
              <>
                {" "}
                <Link href="/bens/novo" className="text-brand hover:underline">Criar o primeiro projeto</Link>
              </>
            )}
          </p>
        ) : (
          <>
            <p className="mb-2 flex items-center gap-1.5 px-1 text-[13px] text-muted-foreground">
              <Search className="size-3.5" /> {q ? `${results.length} resultado${results.length > 1 ? "s" : ""}` : mode === "bens" ? "Seus projetos" : "Mapas de danos recentes"}
            </p>
            <ul className="divide-y rounded-2xl border bg-card">
              {results.slice(0, 12).map((r) => (
                <li key={r.key}>
                  <Link href={r.href} className="group flex items-center gap-3 px-4 py-3 first:rounded-t-2xl last:rounded-b-2xl hover:bg-muted/60">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                      {mode === "bens" ? <Building2 className="size-4" /> : <ImageIcon className="size-4" />}
                    </span>
                    <span className="grid min-w-0 flex-1 leading-tight">
                      <span className="truncate text-[15px]">{r.title}</span>
                      <span className="flex items-center gap-1 truncate text-[13px] text-muted-foreground">
                        {mode === "bens" && r.sub && <MapPin className="size-3 shrink-0" />}
                        {r.sub}
                      </span>
                    </span>
                    {r.protection && (
                      <span className="hidden items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[12px] text-brand sm:inline-flex">
                        <ShieldCheck className="size-3" /> {r.protection}
                      </span>
                    )}
                    <span className="text-[13px] text-muted-foreground tabular-nums">{r.meta}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function ModeChip({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-full px-3 text-[13.5px] transition-colors",
        active ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className={cn("size-3.5", active && "text-brand")} />
      {children}
    </button>
  );
}
