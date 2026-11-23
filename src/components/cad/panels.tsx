"use client";

import { Eye, EyeOff, Lock, LockOpen, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { dist, dimGeometry } from "@/lib/cad/geometry";
import type { CadDoc, Entity, Layer, P } from "@/lib/cad/types";
import { NumField, fmtM } from "./fields";
import { BlockProps } from "./block-panels";
import type { BlockParams } from "@/lib/cad/types";

const deg = (r: number) => (r * 180) / Math.PI;
const rad = (d: number) => (d * Math.PI) / 180;

/** Camadas: cor, nome, visível, travada, opacidade e camada atual (onde nasce o que se desenha). */
export function LayersPanel({ doc, onLayer, onCurrent, onAdd, onRemove }: {
  doc: CadDoc;
  onLayer: (id: string, patch: Partial<Layer>) => void;
  onCurrent: (id: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const counts = new Map<string, number>();
  for (const e of doc.entities) counts.set(e.layer, (counts.get(e.layer) ?? 0) + 1);
  return (
    <section className="border-b">
      <div className="flex items-center justify-between px-3 py-2">
        <p className="text-[12px] font-medium">Camadas</p>
        <button onClick={onAdd} className="grid size-6 place-items-center rounded hover:bg-muted" title="Nova camada">
          <Plus className="size-3.5" />
        </button>
      </div>
      <ul className="max-h-[38vh] overflow-y-auto pb-2">
        {doc.layers.map((l) => {
          const hasImage = doc.entities.some((e) => e.layer === l.id && e.t === "image");
          const current = doc.current === l.id;
          return (
            <li key={l.id} className={cn("group px-2", current && "bg-muted/70")}>
              <div className="flex h-8 items-center gap-1.5" onClick={() => onCurrent(l.id)}>
                <input
                  type="color"
                  value={l.color}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => onLayer(l.id, { color: e.target.value })}
                  className="size-4 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                  title="Cor da camada"
                />
                {editing === l.id ? (
                  <input
                    autoFocus
                    defaultValue={l.name}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter" || e.key === "Escape") (e.target as HTMLInputElement).blur();
                    }}
                    onBlur={(e) => {
                      if (e.target.value.trim()) onLayer(l.id, { name: e.target.value.trim() });
                      setEditing(null);
                    }}
                    className="h-6 min-w-0 flex-1 rounded border bg-background px-1 text-[12.5px]"
                  />
                ) : (
                  <span className="min-w-0 flex-1 truncate text-[12.5px]" onDoubleClick={() => setEditing(l.id)} title="Duplo clique renomeia; clique torna atual">
                    {l.name}
                    <span className="ml-1 text-[11px] text-muted-foreground">{counts.get(l.id) ?? 0}</span>
                  </span>
                )}
                {current && <span className="rounded bg-foreground px-1 text-[9.5px] text-background">atual</span>}
                <button onClick={(e) => (e.stopPropagation(), onLayer(l.id, { visible: !l.visible }))} className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-muted" title={l.visible ? "Esconder" : "Mostrar"}>
                  {l.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                </button>
                <button onClick={(e) => (e.stopPropagation(), onLayer(l.id, { locked: !l.locked }))} className={cn("grid size-6 place-items-center rounded text-muted-foreground hover:bg-muted", l.locked && "text-amber-500")} title={l.locked ? "Destravar" : "Travar"}>
                  {l.locked ? <Lock className="size-3.5" /> : <LockOpen className="size-3.5" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const n = counts.get(l.id) ?? 0;
                    if (!n || window.confirm(`Apagar a camada "${l.name}" e os ${n} objetos dela?`)) onRemove(l.id);
                  }}
                  className="grid size-6 place-items-center rounded text-muted-foreground opacity-0 hover:bg-muted group-hover:opacity-100"
                  title="Apagar camada"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              {(hasImage || l.opacity < 1) && (
                <label className="flex items-center gap-2 pb-1.5 pl-6 text-[11px] text-muted-foreground">
                  Opacidade
                  <input type="range" min={0} max={1} step={0.05} value={l.opacity} onChange={(e) => onLayer(l.id, { opacity: Number(e.target.value) })} className="flex-1" />
                </label>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const TYPE_LABEL: Record<Entity["t"], string> = { line: "Linha", poly: "Polilinha", circle: "Círculo", arc: "Arco", text: "Texto", dim: "Cota", image: "Imagem", block: "Bloco" };

/** Retângulo alinhado aos eixos? (polilinha fechada de 4 pontos) */
function asRect(e: Entity): { x: number; y: number; w: number; h: number } | null {
  if (e.t !== "poly" || !e.closed || e.pts.length !== 4) return null;
  const xs = e.pts.map((p) => p[0]), ys = e.pts.map((p) => p[1]);
  const ux = new Set(xs.map((v) => v.toFixed(6))), uy = new Set(ys.map((v) => v.toFixed(6)));
  if (ux.size !== 2 || uy.size !== 2) return null;
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

function polyMeasures(pts: P[], closed: boolean) {
  let per = 0;
  for (let i = 0; i < pts.length - 1; i++) per += dist(pts[i]!, pts[i + 1]!);
  let area = 0;
  if (closed && pts.length > 2) {
    per += dist(pts[pts.length - 1]!, pts[0]!);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i]!, b = pts[(i + 1) % pts.length]!;
      area += a[0] * b[1] - b[0] * a[1];
    }
    area = Math.abs(area) / 2;
  }
  return { per, area };
}

/** Propriedades do que está selecionado; com vários, ações em grupo. */
export function PropertiesPanel({ doc, selected, focus, onEntity, onLayerOf, onDelete, onArray, onEditText, onBlockParams, onBlockTypeName, onBlockReset, onSelectType }: {
  doc: CadDoc;
  selected: Entity[];
  /** Objeto que recebeu duplo clique: o primeiro campo dele ganha o foco (só ele, só ao montar). */
  focus: { id: string; n: number } | null;
  onEntity: (id: string, patch: Partial<Entity>) => void;
  onLayerOf: (layer: string) => void;
  onDelete: () => void;
  onArray: (cols: number, rows: number, dx: number, dy: number) => void;
  onEditText: (e: Extract<Entity, { t: "text" }>) => void;
  onBlockParams: (b: Extract<Entity, { t: "block" }>, patch: Partial<BlockParams>, scope: "tipo" | "esta") => void;
  onBlockTypeName: (typeId: string, name: string) => void;
  onBlockReset: (id: string) => void;
  onSelectType: (typeId: string) => void;
}) {
  const [arr, setArr] = useState({ cols: 3, rows: 1, dx: 1.5, dy: 3 });
  if (!selected.length)
    return (
      <section className="grid gap-2 p-3 text-[12.5px]">
        <p className="text-[12px] font-medium">Propriedades</p>
        <p className="text-muted-foreground">Nada selecionado. Clique num objeto, ou arraste uma área: para a direita pega só o que está inteiro dentro; para a esquerda, o que encostar.</p>
        <p className="text-muted-foreground">{doc.entities.length} objetos no desenho.</p>
      </section>
    );
  const layerSel = (
    <label className="grid gap-0.5">
      <span className="text-[11px] text-muted-foreground">Camada</span>
      <select
        className="h-7 rounded-md border bg-background px-1.5 text-[12.5px]"
        value={selected.every((e) => e.layer === selected[0]!.layer) ? selected[0]!.layer : ""}
        onChange={(e) => e.target.value && onLayerOf(e.target.value)}
      >
        <option value="">Várias</option>
        {doc.layers.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
    </label>
  );

  if (selected.length > 1)
    return (
      <section className="grid gap-3 p-3 text-[12.5px]">
        <p className="text-[12px] font-medium">{selected.length} objetos selecionados</p>
        {layerSel}
        <div className="grid gap-2 rounded-md border p-2">
          <p className="text-[11.5px] font-medium">Matriz (repetir)</p>
          <div className="grid grid-cols-2 gap-2">
            <NumField label="Colunas" value={arr.cols} step={1} min={1} onCommit={(v) => setArr({ ...arr, cols: Math.round(v) })} />
            <NumField label="Linhas" value={arr.rows} step={1} min={1} onCommit={(v) => setArr({ ...arr, rows: Math.round(v) })} />
            <NumField label="Espaço X (m)" value={arr.dx} onCommit={(v) => setArr({ ...arr, dx: v })} />
            <NumField label="Espaço Y (m)" value={arr.dy} onCommit={(v) => setArr({ ...arr, dy: v })} />
          </div>
          <button className="h-7 rounded-md bg-foreground text-[12px] text-background" onClick={() => onArray(arr.cols, arr.rows, arr.dx, arr.dy)}>
            Criar matriz
          </button>
        </div>
        <button className="h-7 rounded-md border text-[12px] text-destructive hover:bg-muted" onClick={onDelete}>
          Apagar ({selected.length})
        </button>
      </section>
    );

  const e = selected[0]!;
  const fk = focus?.n ?? 0; // muda a cada duplo clique e remonta o campo
  const body = (() => {
    switch (e.t) {
      case "line": {
        const len = dist(e.a, e.b);
        const ang = Math.atan2(e.b[1] - e.a[1], e.b[0] - e.a[0]);
        return (
          <>
            <div className="grid grid-cols-2 gap-2">
              <NumField key={`l${fk}`} autoFocus={focus?.id === e.id} label="Comprimento (m)" value={len} min={0.0001} onCommit={(v) => onEntity(e.id, { b: [e.a[0] + Math.cos(ang) * v, e.a[1] + Math.sin(ang) * v] })} />
              <NumField label="Ângulo (°)" value={deg(ang)} step={1} onCommit={(v) => onEntity(e.id, { b: [e.a[0] + Math.cos(rad(v)) * len, e.a[1] + Math.sin(rad(v)) * len] })} />
              <NumField label="Início X" value={e.a[0]} onCommit={(v) => onEntity(e.id, { a: [v, e.a[1]] })} />
              <NumField label="Início Y" value={e.a[1]} onCommit={(v) => onEntity(e.id, { a: [e.a[0], v] })} />
              <NumField label="Fim X" value={e.b[0]} onCommit={(v) => onEntity(e.id, { b: [v, e.b[1]] })} />
              <NumField label="Fim Y" value={e.b[1]} onCommit={(v) => onEntity(e.id, { b: [e.b[0], v] })} />
            </div>
          </>
        );
      }
      case "poly": {
        const r = asRect(e);
        const m = polyMeasures(e.pts, e.closed);
        const setRect = (patch: Partial<{ x: number; y: number; w: number; h: number }>) => {
          const n = { ...r!, ...patch };
          onEntity(e.id, { pts: [[n.x, n.y], [n.x + n.w, n.y], [n.x + n.w, n.y + n.h], [n.x, n.y + n.h]] });
        };
        return (
          <>
            {r && (
              <div className="grid grid-cols-2 gap-2">
                <NumField key={`w${fk}`} autoFocus={focus?.id === e.id} label="Largura (m)" value={r.w} min={0.0001} onCommit={(v) => setRect({ w: v })} />
                <NumField label="Altura (m)" value={r.h} min={0.0001} onCommit={(v) => setRect({ h: v })} />
                <NumField label="Canto X" value={r.x} onCommit={(v) => setRect({ x: v })} />
                <NumField label="Canto Y" value={r.y} onCommit={(v) => setRect({ y: v })} />
              </div>
            )}
            <label className="flex items-center gap-2 text-[12px]">
              <input type="checkbox" checked={e.closed} onChange={(ev) => onEntity(e.id, { closed: ev.target.checked })} /> Fechada
            </label>
            <p className="text-[11.5px] text-muted-foreground">
              {e.pts.length} vértices · perímetro {fmtM(m.per, 2)} m{e.closed ? ` · área ${fmtM(m.area, 2)} m²` : ""}
            </p>
          </>
        );
      }
      case "circle":
        return (
          <div className="grid grid-cols-2 gap-2">
            <NumField key={`r${fk}`} autoFocus={focus?.id === e.id} label="Raio (m)" value={e.r} min={0.0001} onCommit={(v) => onEntity(e.id, { r: v })} />
            <NumField label="Diâmetro (m)" value={e.r * 2} min={0.0002} onCommit={(v) => onEntity(e.id, { r: v / 2 })} />
            <NumField label="Centro X" value={e.c[0]} onCommit={(v) => onEntity(e.id, { c: [v, e.c[1]] })} />
            <NumField label="Centro Y" value={e.c[1]} onCommit={(v) => onEntity(e.id, { c: [e.c[0], v] })} />
          </div>
        );
      case "arc":
        return (
          <div className="grid grid-cols-2 gap-2">
            <NumField key={`a${fk}`} autoFocus={focus?.id === e.id} label="Raio (m)" value={e.r} min={0.0001} onCommit={(v) => onEntity(e.id, { r: v })} />
            <span />
            <NumField label="Centro X" value={e.c[0]} onCommit={(v) => onEntity(e.id, { c: [v, e.c[1]] })} />
            <NumField label="Centro Y" value={e.c[1]} onCommit={(v) => onEntity(e.id, { c: [e.c[0], v] })} />
            <NumField label="Início (°)" value={deg(e.a0)} step={1} onCommit={(v) => onEntity(e.id, { a0: rad(v) })} />
            <NumField label="Fim (°)" value={deg(e.a1)} step={1} onCommit={(v) => onEntity(e.id, { a1: rad(v) })} />
          </div>
        );
      case "text":
        return (
          <>
            <label className="grid gap-0.5">
              <span className="text-[11px] text-muted-foreground">Texto</span>
              <button className="h-7 truncate rounded-md border px-2 text-left text-[12.5px] hover:bg-muted" onClick={() => onEditText(e)}>
                {e.s}
              </button>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <NumField key={`t${fk}`} autoFocus={focus?.id === e.id} label="Altura (m)" value={e.h} min={0.001} onCommit={(v) => onEntity(e.id, { h: v })} />
              <span />
              <NumField label="X" value={e.p[0]} onCommit={(v) => onEntity(e.id, { p: [v, e.p[1]] })} />
              <NumField label="Y" value={e.p[1]} onCommit={(v) => onEntity(e.id, { p: [e.p[0], v] })} />
            </div>
          </>
        );
      case "dim": {
        const g = dimGeometry(e.a, e.b, e.off);
        return (
          <div className="grid grid-cols-2 gap-2">
            <NumField key={`d${fk}`} autoFocus={focus?.id === e.id} label="Afastamento (m)" value={e.off} onCommit={(v) => onEntity(e.id, { off: v })} />
            <div className="grid gap-0.5">
              <span className="text-[11px] text-muted-foreground">Medida</span>
              <span className="h-7 px-1 text-[12.5px] leading-7 tabular-nums">{fmtM(g.length, 3)} m</span>
            </div>
          </div>
        );
      }
      case "block":
        return (
          <BlockProps
            key={e.id}
            doc={doc}
            b={e}
            fk={fk}
            autoFocus={focus?.id === e.id}
            onParams={(patch, scope) => onBlockParams(e, patch, scope)}
            onTypeName={(name) => onBlockTypeName(e.type, name)}
            onReset={() => onBlockReset(e.id)}
            onSelectType={() => onSelectType(e.type)}
            onPos={(p) => onEntity(e.id, { p })}
          />
        );
      case "image":
        return (
          <p className="text-[11.5px] text-muted-foreground">
            {fmtM(e.w, 2)} × {fmtM(e.h, 2)} m. Para não mexer sem querer, deixe a camada dela travada.
          </p>
        );
    }
  })();
  return (
    <section className="grid gap-3 p-3 text-[12.5px]">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium">{e.t === "block" ? (e.params.kind === "porta" ? "Porta" : "Janela") : TYPE_LABEL[e.t]}</p>
        <button className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-muted" onClick={onDelete} title="Apagar (Delete)">
          <Trash2 className="size-3.5" />
        </button>
      </div>
      {layerSel}
      {body}
    </section>
  );
}
