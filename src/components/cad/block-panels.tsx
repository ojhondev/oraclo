"use client";

import { DoorOpen, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { BLOCK_PRESETS } from "@/lib/cad/blocks";
import type { Block, BlockParams, BlockTop, CadDoc } from "@/lib/cad/types";
import { NumField } from "./fields";

/** Biblioteca de blocos do desenho: tipos (com quantas cópias), novo tipo por modelo, inserir. */
export function BlocksPanel({ doc, active, onPick, onAdd, onRemove }: {
  doc: CadDoc;
  /** Tipo sendo inserido agora (ferramenta Bloco). */
  active: string | null;
  onPick: (typeId: string) => void;
  onAdd: (presetKey: string) => void;
  onRemove: (typeId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const types = doc.blockTypes ?? [];
  const count = (id: string) => doc.entities.filter((e) => e.t === "block" && e.type === id).length;
  return (
    <section className="grid gap-1 border-b p-3">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium">Blocos</p>
        <button onClick={() => setOpen((v) => !v)} className="grid size-6 place-items-center rounded hover:bg-muted" title="Novo tipo de janela ou porta">
          <Plus className="size-3.5" />
        </button>
      </div>
      {open && (
        <div className="mb-1 grid gap-0.5 rounded-md border bg-background p-1">
          {BLOCK_PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => {
                onAdd(p.key);
                setOpen(false);
              }}
              className="rounded px-2 py-1 text-left text-[12.5px] hover:bg-muted"
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
      {types.length === 0 ? (
        <p className="text-[12px] text-muted-foreground">Crie um tipo (+) e clique no desenho para inserir. Mudar o tipo muda todas as cópias.</p>
      ) : (
        <ul className="grid gap-0.5">
          {types.map((t) => (
            <li key={t.id} className={cn("group flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-muted", active === t.id && "bg-muted ring-1 ring-foreground/30")}>
              <button onClick={() => onPick(t.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left" title="Clique e depois clique no desenho para inserir">
                <DoorOpen className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate text-[12.5px]">{t.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {t.params.w.toFixed(2).replace(".", ",")}×{t.params.h.toFixed(2).replace(".", ",")} · {count(t.id)}
                </span>
              </button>
              <button
                onClick={() => {
                  const n = count(t.id);
                  if (!n || confirm(`Apagar o tipo "${t.name}" e as ${n} cópias dele?`)) onRemove(t.id);
                }}
                className="invisible grid size-5 place-items-center rounded text-muted-foreground group-hover:visible hover:text-destructive"
                title="Apagar tipo"
              >
                <Trash2 className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const TOPS: { v: BlockTop; label: string }[] = [
  { v: "reta", label: "Reta" },
  { v: "pleno", label: "Arco pleno" },
  { v: "abatido", label: "Arco abatido" },
];

/** Propriedades de um bloco: medidas aplicadas ao tipo todo ou só a este. */
export function BlockProps({ doc, b, autoFocus, fk, onParams, onTypeName, onReset, onSelectType, onPos }: {
  doc: CadDoc;
  b: Block;
  autoFocus: boolean;
  fk: number;
  onParams: (patch: Partial<BlockParams>, scope: "tipo" | "esta") => void;
  onTypeName: (name: string) => void;
  onReset: () => void;
  onSelectType: () => void;
  onPos: (p: [number, number]) => void;
}) {
  const type = doc.blockTypes?.find((t) => t.id === b.type);
  const n = doc.entities.filter((e) => e.t === "block" && e.type === b.type).length;
  const [scope, setScope] = useState<"tipo" | "esta">(b.own ? "esta" : "tipo");
  const [name, setName] = useState(type?.name ?? "");
  const p = b.params;
  const set = (patch: Partial<BlockParams>) => onParams(patch, scope);
  return (
    <div className="grid gap-3">
      <div className="grid gap-1">
        <span className="text-[11px] text-muted-foreground">Tipo</span>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() && name !== type?.name && onTypeName(name.trim())}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className="h-7 min-w-0 flex-1 rounded-md border bg-background px-2 text-[12.5px]"
          />
          <button onClick={onSelectType} className="h-7 rounded-md border px-2 text-[11.5px] hover:bg-muted" title="Selecionar todas as cópias deste tipo">
            {n} no desenho
          </button>
        </div>
      </div>
      <div className="grid gap-1">
        <span className="text-[11px] text-muted-foreground">Ao mudar uma medida, alterar</span>
        <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-0.5">
          {(["tipo", "esta"] as const).map((s) => (
            <button key={s} onClick={() => setScope(s)} className={cn("h-7 rounded text-[12px]", scope === s ? "bg-background shadow-sm" : "text-muted-foreground")}>
              {s === "tipo" ? `Todas do tipo (${n})` : "Só esta"}
            </button>
          ))}
        </div>
        {b.own && (
          <div className="flex items-center justify-between rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[11.5px]">
            Medida própria (não segue o tipo)
            <button onClick={onReset} className="flex items-center gap-1 text-[11.5px] underline-offset-2 hover:underline">
              <RotateCcw className="size-3" /> Voltar ao tipo
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumField key={`bw${fk}`} autoFocus={autoFocus} label="Largura do vão (m)" value={p.w} min={0.1} onCommit={(v) => set({ w: v })} />
        <NumField label="Altura do vão (m)" value={p.h} min={0.1} onCommit={(v) => set({ h: v })} />
        <label className="col-span-2 grid gap-0.5">
          <span className="text-[11px] text-muted-foreground">Verga</span>
          <select value={p.top} onChange={(e) => set({ top: e.target.value as BlockTop })} className="h-7 rounded-md border bg-background px-1.5 text-[12.5px]">
            {TOPS.map((t) => (
              <option key={t.v} value={t.v}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        {p.top === "abatido" && <NumField label="Flecha do arco (m)" value={p.rise} min={0.01} onCommit={(v) => set({ rise: v })} />}
        <NumField label={p.kind === "porta" ? "Marco (m)" : "Caixilho (m)"} value={p.frame} min={0} step={0.01} onCommit={(v) => set({ frame: v })} />
        <NumField label="Moldura (m)" value={p.moldura} min={0} step={0.01} onCommit={(v) => set({ moldura: v })} />
        {p.kind === "janela" && <NumField label="Peitoril (m)" value={p.peitoril} min={0} step={0.01} onCommit={(v) => set({ peitoril: v })} />}
        <NumField label={p.kind === "porta" ? "Folhas" : "Colunas"} value={p.cols} min={1} step={1} onCommit={(v) => set({ cols: Math.round(v) })} />
        <NumField label={p.kind === "porta" ? "Almofadas" : "Linhas"} value={p.rows} min={1} step={1} onCommit={(v) => set({ rows: Math.round(v) })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumField label="Posição X (m)" value={b.p[0]} onCommit={(v) => onPos([v, b.p[1]])} />
        <NumField label="Posição Y (m)" value={b.p[1]} onCommit={(v) => onPos([b.p[0], v])} />
      </div>
    </div>
  );
}
