"use client";

import { Download, Loader2, Maximize, Plus, Trash2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SCALES, fitScale, newSheet, paperToWorld, sheetPaper, type Sheet, type SheetSize, type Stamp } from "@/lib/cad/sheets";
import type { CadDoc } from "@/lib/cad/types";

/** Campo de texto que só grava ao sair ou no Enter (não enche o histórico a cada letra). */
function TextField({ label, value, onCommit, hint }: { label: string; value: string; onCommit: (v: string) => void; hint?: string }) {
  const [v, setV] = useState(value);
  const [last, setLast] = useState(value);
  if (last !== value) {
    setLast(value);
    setV(value);
  }
  return (
    <label className="grid gap-0.5">
      <span className="text-[11px] text-muted-foreground">
        {label} {hint && <span className="opacity-70">· {hint}</span>}
      </span>
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => v !== value && onCommit(v)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="h-7 rounded-md border bg-background px-2 text-[12.5px]"
      />
    </label>
  );
}

/** Prévia fiel da folha (mesmos traços do PDF), em SVG; arrastar move o enquadramento. */
function SheetPreview({ doc, sheet, onCenter }: { doc: CadDoc; sheet: Sheet; onCenter: (c: [number, number]) => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; center: [number, number] } | null>(null);
  // enquadramento ao vivo durante o arrasto; grava uma vez só, ao soltar
  const [live, setLive] = useState<[number, number] | null>(null);
  const shown = useMemo(() => (live ? { ...sheet, center: live } : sheet), [sheet, live]);
  const paper = useMemo(() => sheetPaper(doc, shown), [doc, shown]);
  const { w, h, view } = paper.layout;
  // segmentos agrupados por espessura: um <path> por pena
  const paths = useMemo(() => {
    const by = new Map<number, string[]>();
    for (const g of paper.segs) {
      const k = Math.round(g.w * 100) / 100;
      if (!by.has(k)) by.set(k, []);
      by.get(k)!.push(`M${g.a[0].toFixed(2)} ${(h - g.a[1]).toFixed(2)}L${g.b[0].toFixed(2)} ${(h - g.b[1]).toFixed(2)}`);
    }
    return [...by.entries()];
  }, [paper, h]);
  const mmPerPx = () => {
    const r = svgRef.current!.getBoundingClientRect();
    return Math.max(w / r.width, h / r.height);
  };
  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${w} ${h}`}
      className="h-full w-full cursor-grab touch-none drop-shadow-xl active:cursor-grabbing"
      preserveAspectRatio="xMidYMid meet"
      data-testid="prancha-previa"
      onPointerDown={(e) => {
        (e.target as Element).setPointerCapture?.(e.pointerId);
        drag.current = { x: e.clientX, y: e.clientY, center: sheet.center };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const k = mmPerPx();
        // arrastar o papel para a direita mostra o que está à esquerda do desenho
        const c = paperToWorld({ ...sheet, center: d.center }, [((view.x0 + view.x1) / 2) - (e.clientX - d.x) * k, ((view.y0 + view.y1) / 2) + (e.clientY - d.y) * k]);
        setLive(c);
      }}
      onPointerUp={() => {
        drag.current = null;
        if (live) onCenter(live);
        setLive(null);
      }}
    >
      <rect x={0} y={0} width={w} height={h} fill="#ffffff" />
      <defs>
        <clipPath id="prancha-janela">
          <rect x={view.x0} y={h - view.y1} width={view.x1 - view.x0} height={view.y1 - view.y0} />
        </clipPath>
      </defs>
      {paper.image && (
        <image href={paper.image.url} x={paper.image.p[0]} y={h - paper.image.p[1] - paper.image.h} width={paper.image.w} height={paper.image.h} opacity={0.35} preserveAspectRatio="none" clipPath="url(#prancha-janela)" />
      )}
      {paths.map(([pw, ds]) => (
        <path key={pw} d={ds.join("")} stroke="#0d0d0f" strokeWidth={pw} strokeLinecap="round" fill="none" />
      ))}
      {paper.texts.map((t, i) => (
        <text
          key={i}
          x={t.p[0]}
          y={h - t.p[1]}
          fontSize={t.size}
          fontFamily="Helvetica, Arial, sans-serif"
          fontWeight={t.bold ? 700 : 400}
          fill={t.muted ? "#6b6b70" : "#0d0d0f"}
          textAnchor={t.align === "center" ? "middle" : t.align === "right" ? "end" : "start"}
          transform={t.rot ? `rotate(${(-t.rot * 180) / Math.PI} ${t.p[0]} ${h - t.p[1]})` : undefined}
        >
          {t.s}
        </text>
      ))}
      {live && <rect x={view.x0} y={h - view.y1} width={view.x1 - view.x0} height={view.y1 - view.y0} fill="none" stroke="#3b82f6" strokeWidth={0.6} strokeDasharray="3 2" />}
    </svg>
  );
}

const SIZES: SheetSize[] = ["A4", "A3", "A2", "A1", "A0"];

/** Tela das pranchas: lista, prévia, folha/escala/camadas/carimbo e PDF. */
export function SheetsView({ doc, name, onChange, onClose, newId }: {
  doc: CadDoc;
  name: string;
  onChange: (sheets: Sheet[]) => void;
  onClose: () => void;
  newId: () => string;
}) {
  const sheets = doc.sheets ?? [];
  const [currentId, setCurrentId] = useState<string | null>(sheets[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const cur = sheets.find((s) => s.id === currentId) ?? sheets[0] ?? null;

  const add = () => {
    const s = newSheet(doc, newId(), sheets.length + 1);
    // projeto, local e responsável valem para todas: copia da primeira
    const first = sheets[0];
    if (first) s.stamp = { ...s.stamp, projeto: first.stamp.projeto, local: first.stamp.local, autor: first.stamp.autor };
    else s.stamp.projeto = name;
    onChange([...sheets, s]);
    setCurrentId(s.id);
  };
  const patch = (p: Partial<Sheet>) => cur && onChange(sheets.map((s) => (s.id === cur.id ? { ...s, ...p } : s)));
  const patchStamp = (p: Partial<Stamp>, all = false) =>
    cur && onChange(sheets.map((s) => (s.id === cur.id || all ? { ...s, stamp: { ...s.stamp, ...p } } : s)));

  const download = async (which: Sheet[]) => {
    if (!which.length) return;
    setBusy(true);
    try {
      const { sheetsToPdf } = await import("@/lib/cad/sheets-pdf");
      const bytes = await sheetsToPdf(doc, which);
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const base = (which.length === 1 ? `${name} ${which[0]!.name}` : `${name} pranchas`).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w-]+/g, "-").toLowerCase();
      a.download = `${base}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar o PDF.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex bg-background" data-testid="pranchas">
      {/* lista */}
      <aside className="flex w-52 shrink-0 flex-col border-r bg-card">
        <div className="flex h-11 items-center justify-between border-b px-3">
          <span className="text-[13px] font-medium">Pranchas</span>
          <button onClick={add} title="Nova prancha" className="grid size-7 place-items-center rounded hover:bg-muted">
            <Plus className="size-4" />
          </button>
        </div>
        <ul className="grid gap-0.5 p-2">
          {sheets.map((s) => (
            <li key={s.id}>
              <button onClick={() => setCurrentId(s.id)} className={cn("grid w-full gap-0.5 rounded-md px-2 py-1.5 text-left hover:bg-muted", cur?.id === s.id && "bg-muted")}>
                <span className="truncate text-[12.5px]">
                  {s.stamp.numero} · {s.name}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {s.size} {s.orient} · 1:{s.scale}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {sheets.length > 0 && (
          <button onClick={() => download(sheets)} disabled={busy} className="m-2 mt-auto flex h-8 items-center justify-center gap-1.5 rounded-md border text-[12.5px] hover:bg-muted disabled:opacity-60">
            <Download className="size-4" /> Baixar todas ({sheets.length})
          </button>
        )}
      </aside>

      {/* prévia */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="flex h-11 items-center justify-between border-b px-3">
          <span className="text-[12.5px] text-muted-foreground">{cur ? "Arraste a folha para enquadrar o desenho." : "Nenhuma prancha ainda."}</span>
          <button onClick={onClose} className="flex h-8 items-center gap-1.5 rounded-md px-2 text-[13px] hover:bg-muted">
            <X className="size-4" /> Voltar ao desenho
          </button>
        </div>
        <div className="grid min-h-0 flex-1 place-items-center bg-neutral-200 p-6 dark:bg-neutral-800">
          {cur ? (
            <SheetPreview doc={doc} sheet={cur} onCenter={(center) => patch({ center })} />
          ) : (
            <button onClick={add} className="flex h-10 items-center gap-2 rounded-md bg-foreground px-4 text-[13px] text-background">
              <Plus className="size-4" /> Criar a primeira prancha
            </button>
          )}
        </div>
      </div>

      {/* propriedades */}
      {cur && (
        <aside className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l bg-card p-3 text-[12.5px]">
          <TextField label="Título da prancha" value={cur.name} onCommit={(v) => patch({ name: v })} />
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-0.5">
              <span className="text-[11px] text-muted-foreground">Folha</span>
              <select value={cur.size} onChange={(e) => patch({ size: e.target.value as SheetSize })} className="h-7 rounded-md border bg-background px-1.5">
                {SIZES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-0.5">
              <span className="text-[11px] text-muted-foreground">Orientação</span>
              <select value={cur.orient} onChange={(e) => patch({ orient: e.target.value as Sheet["orient"] })} className="h-7 rounded-md border bg-background px-1.5">
                <option value="paisagem">Paisagem</option>
                <option value="retrato">Retrato</option>
              </select>
            </label>
            <label className="grid gap-0.5">
              <span className="text-[11px] text-muted-foreground">Escala</span>
              <select value={cur.scale} onChange={(e) => patch({ scale: Number(e.target.value) })} className="h-7 rounded-md border bg-background px-1.5">
                {[...new Set([...SCALES, cur.scale])].sort((a, b) => a - b).map((k) => (
                  <option key={k} value={k}>
                    1:{k}
                  </option>
                ))}
              </select>
            </label>
            <button onClick={() => patch(fitScale(doc, cur))} className="mt-auto flex h-7 items-center justify-center gap-1 rounded-md border text-[12px] hover:bg-muted" title="Menor escala técnica em que o desenho cabe, centralizado">
              <Maximize className="size-3.5" /> Ajustar
            </button>
          </div>
          <div className="grid gap-1">
            <span className="text-[11px] text-muted-foreground">Camadas na prancha</span>
            {doc.layers.map((l) => (
              <label key={l.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!cur.hidden.includes(l.id)}
                  onChange={(e) => patch({ hidden: e.target.checked ? cur.hidden.filter((x) => x !== l.id) : [...cur.hidden, l.id] })}
                />
                <span className="size-2.5 rounded-full" style={{ background: l.color }} />
                {l.name}
              </label>
            ))}
            {doc.entities.some((e) => e.t === "image") && (
              <label className="mt-1 flex items-center gap-2">
                <input type="checkbox" checked={cur.photo} onChange={(e) => patch({ photo: e.target.checked })} /> Foto clareada por baixo
              </label>
            )}
          </div>
          <div className="grid gap-2">
            <span className="text-[11px] font-medium">Carimbo</span>
            <TextField label="Projeto" hint="todas" value={cur.stamp.projeto} onCommit={(v) => patchStamp({ projeto: v }, true)} />
            <TextField label="Local" hint="todas" value={cur.stamp.local} onCommit={(v) => patchStamp({ local: v }, true)} />
            <TextField label="Responsável técnico" hint="todas" value={cur.stamp.autor} onCommit={(v) => patchStamp({ autor: v }, true)} />
            <div className="grid grid-cols-2 gap-2">
              <TextField label="Data" value={cur.stamp.data} onCommit={(v) => patchStamp({ data: v })} />
              <TextField label="Folha nº" value={cur.stamp.numero} onCommit={(v) => patchStamp({ numero: v })} />
            </div>
            <TextField label="Observação" value={cur.stamp.obs} onCommit={(v) => patchStamp({ obs: v })} />
          </div>
          <div className="mt-auto grid gap-2">
            <button onClick={() => download([cur])} disabled={busy} className="flex h-9 items-center justify-center gap-1.5 rounded-md bg-foreground text-[13px] text-background hover:opacity-90 disabled:opacity-60">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Baixar PDF
            </button>
            <button
              onClick={() => {
                if (!confirm(`Apagar a prancha "${cur.name}"? O desenho não é afetado.`)) return;
                const rest = sheets.filter((s) => s.id !== cur.id);
                onChange(rest);
                setCurrentId(rest[0]?.id ?? null);
              }}
              className="flex h-8 items-center justify-center gap-1.5 rounded-md border text-[12px] text-destructive hover:bg-muted"
            >
              <Trash2 className="size-3.5" /> Apagar prancha
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
