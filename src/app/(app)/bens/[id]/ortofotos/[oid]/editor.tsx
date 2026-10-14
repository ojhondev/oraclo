"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  FileDown,
  Hand,
  Loader2,
  Maximize,
  Ruler,
  Search,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SimpleSelect } from "@/components/form";
import { ConfirmButton } from "@/components/confirm-button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fmtArea, fmtLength, fmtMmPerPixel, measure, minPoints, scaleFromCalibration, type Pt } from "@/lib/geometry";
import { geometryKinds, severities } from "@/lib/labels";
import type { schema } from "@/lib/db";
import { calibrate, createDamage, deleteDamage, deleteOrthophoto, setScale, updateDamage } from "../actions";
import { DamagePattern, lineStyle } from "./patterns";

type Orthophoto = typeof schema.orthophotos.$inferSelect;
type Damage = typeof schema.damages.$inferSelect;
type DamageType = typeof schema.damageTypes.$inferSelect;
type View = { x: number; y: number; w: number; h: number };
type Tool = "mover" | "desenhar" | "calibrar";

const pts = (d: Damage) => (d.geometry?.points ?? []) as Pt[];
const toPath = (p: Pt[]) => p.map(([x, y]) => `${x},${y}`).join(" ");

export function DamageMapEditor({
  siteId,
  siteName,
  ortho,
  types,
  initialDamages,
  canEdit,
}: {
  siteId: string;
  siteName: string;
  ortho: Orthophoto;
  types: DamageType[];
  initialDamages: Damage[];
  canEdit: boolean;
}) {
  const W = ortho.widthPx;
  const H = ortho.heightPx;
  const typeById = useMemo(() => new Map(types.map((t) => [t.id, t])), [types]);

  const [damages, setDamages] = useState(initialDamages);
  const [mm, setMm] = useState<number | null>(ortho.mmPerPixel);
  const [tool, setTool] = useState<Tool>("mover");
  const [typeId, setTypeId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Pt[]>([]);
  const [hover, setHover] = useState<Pt | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>({ x: 0, y: 0, w: W, h: H });
  const [box, setBox] = useState({ w: 1, h: 1 });
  const [calLine, setCalLine] = useState<[Pt, Pt] | null>(ortho.calibration ? [ortho.calibration.a, ortho.calibration.b] : null);
  const [calOpen, setCalOpen] = useState(false);
  const [busy, startBusy] = useTransition();
  const [drag, setDrag] = useState<{ index: number; points: Pt[] } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef(view);
  viewRef.current = view;
  const panRef = useRef<{ sx: number; sy: number; vx: number; vy: number; moved: boolean; button: number } | null>(null);
  const spaceRef = useRef(false);

  const activeType = typeId ? typeById.get(typeId) ?? null : null;
  const selDamage = damages.find((d) => d.id === selected) ?? null;

  /* ── viewport ── */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setBox({ w: r.width || 1, h: r.height || 1 });
    const ro = new ResizeObserver(([e]) => setBox({ w: e!.contentRect.width || 1, h: e!.contentRect.height || 1 }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scale = Math.min(box.w / view.w, box.h / view.h); // px de tela por px de imagem
  const unit = 1 / scale;

  const toImage = useCallback((clientX: number, clientY: number): Pt => {
    const svg = svgRef.current!;
    const p = svg.createSVGPoint();
    p.x = clientX;
    p.y = clientY;
    const r = p.matrixTransform(svg.getScreenCTM()!.inverse());
    return [Math.max(0, Math.min(W, r.x)), Math.max(0, Math.min(H, r.y))];
  }, [W, H]);

  const zoomAt = useCallback((p: Pt, f: number) => {
    const v = viewRef.current;
    const w = Math.max(W / 80, Math.min(W * 4, v.w * f));
    const k = w / v.w;
    setView({ x: p[0] - (p[0] - v.x) * k, y: p[1] - (p[1] - v.y) * k, w, h: v.h * k });
  }, [W]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(toImage(e.clientX, e.clientY), e.deltaY > 0 ? 1.15 : 1 / 1.15);
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [toImage, zoomAt]);

  const fit = () => setView({ x: 0, y: 0, w: W, h: H });
  const zoomCenter = (f: number) => {
    const v = viewRef.current;
    zoomAt([v.x + v.w / 2, v.y + v.h / 2], f);
  };

  /* ── desenho ── */
  const cancelDraft = useCallback(() => {
    setDraft([]);
    if (tool === "calibrar") setTool("mover");
  }, [tool]);

  const finishDraft = useCallback(
    (points: Pt[]) => {
      if (!activeType) return;
      // remove pontos repetidos (duplo clique): menos de 2 px de tela de distância
      const ctm = svgRef.current?.getScreenCTM();
      const tol = 2 / (ctm?.a || scale);
      const clean = points.filter((p, i) => i === 0 || Math.hypot(p[0] - points[i - 1]![0], p[1] - points[i - 1]![1]) > tol);
      if (clean.length < minPoints(activeType.geometry)) {
        toast.error(activeType.geometry === "area" ? "Uma área precisa de pelo menos 3 pontos." : "Uma linha precisa de pelo menos 2 pontos.");
        return;
      }
      setDraft([]);
      const tempId = `tmp-${crypto.randomUUID()}`;
      const temp = {
        id: tempId,
        typeId: activeType.id,
        geometry: { points: clean },
        severity: "media",
        ...measure(activeType.geometry, clean, mm),
      } as Damage;
      setDamages((list) => [...list, temp]);
      startBusy(async () => {
        try {
          const saved = await createDamage(siteId, ortho.id, { typeId: activeType.id, points: clean });
          setDamages((list) => list.map((d) => (d.id === tempId ? saved : d)));
          setSelected(saved.id);
        } catch (e) {
          setDamages((list) => list.filter((d) => d.id !== tempId));
          toast.error((e as Error).message);
        }
      });
    },
    [activeType, mm, ortho.id, siteId, scale],
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof Element && t.closest("input, textarea, [contenteditable], [role=combobox], [role=listbox]")) return;
      if (e.code === "Space") spaceRef.current = true;
      if (e.key === "Escape") {
        cancelDraft();
        setSelected(null);
      }
      if (e.key === "Enter" && draft.length) finishDraft(draft);
      if (e.key === "Backspace" && draft.length) setDraft((d) => d.slice(0, -1));
      if ((e.key === "Delete" || (e.key === "Backspace" && !draft.length)) && selected && canEdit && !selected.startsWith("tmp-")) {
        removeDamage(selected);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceRef.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  });

  function removeDamage(id: string) {
    const prev = damages;
    setDamages((list) => list.filter((d) => d.id !== id));
    setSelected(null);
    startBusy(async () => {
      try {
        await deleteDamage(siteId, ortho.id, id);
      } catch (e) {
        setDamages(prev);
        toast.error((e as Error).message);
      }
    });
  }

  function patchDamage(id: string, patch: Parameters<typeof updateDamage>[3]) {
    startBusy(async () => {
      try {
        const saved = await updateDamage(siteId, ortho.id, id, patch);
        setDamages((list) => list.map((d) => (d.id === id ? saved : d)));
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  /* ── ponteiro ── */
  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const v = viewRef.current;
    panRef.current = { sx: e.clientX, sy: e.clientY, vx: v.x, vy: v.y, moved: false, button: e.button };
  }

  function onPointerMove(e: React.PointerEvent) {
    const p = toImage(e.clientX, e.clientY);
    setHover(p);
    if (drag && selDamage) {
      const next = drag.points.map((q, i) => (i === drag.index ? p : q));
      setDrag({ ...drag, points: next });
      return;
    }
    const pan = panRef.current;
    if (!pan) return;
    const dx = e.clientX - pan.sx;
    const dy = e.clientY - pan.sy;
    if (Math.hypot(dx, dy) > 4) pan.moved = true;
    const canPan = tool === "mover" || spaceRef.current || pan.button === 1;
    if (pan.moved && canPan) setView((v) => ({ ...v, x: pan.vx - dx / scale, y: pan.vy - dy / scale }));
  }

  function onPointerUp(e: React.PointerEvent) {
    const pan = panRef.current;
    panRef.current = null;
    if (drag) {
      const id = selected!;
      const points = drag.points;
      setDrag(null);
      const type = typeById.get(selDamage!.typeId)!;
      setDamages((list) => list.map((d) => (d.id === id ? { ...d, geometry: { points }, ...measure(type.geometry, points, mm) } : d)));
      patchDamage(id, { points });
      return;
    }
    if (!pan || pan.moved || pan.button !== 0 || spaceRef.current) return;
    const p = toImage(e.clientX, e.clientY);
    if (tool === "calibrar") {
      if (!draft.length) setDraft([p]);
      else {
        setCalLine([draft[0]!, p]);
        setDraft([]);
        setTool("mover");
        setCalOpen(true);
      }
      return;
    }
    if (tool === "desenhar" && activeType && canEdit) {
      if (activeType.geometry === "ponto") finishDraft([p]);
      else setDraft((d) => [...d, p]);
      return;
    }
    if ((e.target as Element).getAttribute("data-damage") === null) setSelected(null);
  }

  function onDoubleClick() {
    if (tool === "desenhar" && draft.length) finishDraft(draft);
  }

  function pickType(id: string) {
    setTypeId(id);
    setTool("desenhar");
    setDraft([]);
    setSelected(null);
  }

  /* ── calibração ── */
  function saveCalibration(form: FormData) {
    const raw = String(form.get("value") || "").replace(",", ".");
    const n = Number(raw);
    const mode = String(form.get("mode"));
    if (!(n > 0)) {
      toast.error("Informe um número maior que zero.");
      return;
    }
    startBusy(async () => {
      try {
        let next: number;
        if (mode === "linha") {
          if (!calLine) return;
          const local = scaleFromCalibration(calLine[0], calLine[1], n);
          if (!local) {
            toast.error("Desenhe uma linha maior.");
            return;
          }
          next = await calibrate(siteId, ortho.id, calLine[0], calLine[1], n);
        } else {
          next = await setScale(siteId, ortho.id, n);
          setCalLine(null);
        }
        setMm(next);
        setDamages((list) =>
          list.map((d) => ({ ...d, ...measure(typeById.get(d.typeId)?.geometry ?? "area", pts(d), next) })),
        );
        setCalOpen(false);
        toast.success("Escala atualizada — áreas e comprimentos recalculados.");
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  /* ── dados derivados ── */
  const filteredTypes = types.filter(
    (t) => !query || `${t.name} ${t.code} ${t.category}`.toLowerCase().includes(query.toLowerCase()),
  );
  const categories = [...new Set(filteredTypes.map((t) => t.category))];
  const summary = useMemo(() => {
    const m = new Map<string, { type: DamageType; count: number; area: number; length: number }>();
    for (const d of damages) {
      const t = typeById.get(d.typeId);
      if (!t) continue;
      const r = m.get(t.id) ?? { type: t, count: 0, area: 0, length: 0 };
      r.count++;
      r.area += d.areaM2 ?? 0;
      r.length += d.lengthM ?? 0;
      m.set(t.id, r);
    }
    return [...m.values()].sort((a, b) => a.type.sortOrder - b.type.sortOrder);
  }, [damages, typeById]);
  const usedTypes = summary.map((s) => s.type);

  const cursor = tool === "desenhar" || tool === "calibrar" ? "crosshair" : panRef.current?.moved ? "grabbing" : "grab";

  /* ── render ── */
  function renderDamage(d: Damage) {
    const t = typeById.get(d.typeId);
    if (!t || hidden.has(t.id)) return null;
    const isSel = d.id === selected;
    const points = isSel && drag ? drag.points : pts(d);
    const select = () => {
      if (tool === "mover") setSelected(d.id);
    };
    const common = { "data-damage": d.id, onPointerDown: select, style: { cursor: tool === "mover" ? "pointer" : undefined } };
    if (t.geometry === "area") {
      return (
        <polygon
          key={d.id}
          {...common}
          points={toPath(points)}
          fill={`url(#pat-${t.id})`}
          stroke={t.color}
          strokeWidth={isSel ? 3 : 1.6}
          vectorEffect="non-scaling-stroke"
        />
      );
    }
    if (t.geometry === "linha") {
      const ls = lineStyle(t.pattern);
      return (
        <g key={d.id}>
          <polyline points={toPath(points)} fill="none" stroke="#fff" strokeOpacity={0.7} strokeWidth={ls.width + 2.5} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
          <polyline
            {...common}
            points={toPath(points)}
            fill="none"
            stroke={t.color}
            strokeWidth={isSel ? ls.width + 1.5 : ls.width}
            strokeDasharray={ls.dash}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* área de clique mais larga */}
          <polyline {...common} points={toPath(points)} fill="none" stroke="transparent" strokeWidth={12} vectorEffect="non-scaling-stroke" />
        </g>
      );
    }
    const [x, y] = points[0] ?? [0, 0];
    return (
      <g key={d.id} {...common}>
        <circle cx={x} cy={y} r={(isSel ? 9 : 7) * unit} fill={t.color} stroke="#fff" strokeWidth={2 * unit} data-damage={d.id} />
        <text x={x} y={y + 3.5 * unit} fontSize={9 * unit} textAnchor="middle" fill="#fff" fontWeight={600} pointerEvents="none">
          {t.code}
        </text>
      </g>
    );
  }

  const draftType = tool === "calibrar" ? null : activeType;
  const preview = hover && draft.length ? [...draft, hover] : draft;

  return (
    <div className="flex h-[calc(100svh-3.5rem)] min-h-0 flex-col lg:h-svh">
      {/* barra superior */}
      <header className="flex flex-wrap items-center gap-2 border-b bg-background px-3 py-2 sm:px-4">
        <Button variant="ghost" size="icon-sm" asChild aria-label="Voltar ao bem">
          <Link href={`/bens/${siteId}`}>
            <ArrowLeft />
          </Link>
        </Button>
        <div className="mr-auto grid min-w-0 leading-tight">
          <span className="truncate text-[11.5px] text-muted-foreground">{siteName} · mapa de danos</span>
          <span className="truncate text-[16px] font-medium">{ortho.name}</span>
        </div>

        <Popover open={calOpen} onOpenChange={setCalOpen}>
          <PopoverTrigger asChild>
            <Button variant={mm ? "outline" : "default"} size="sm" disabled={!canEdit && !mm}>
              <Ruler /> {mm ? fmtMmPerPixel(mm) : "Definir escala"}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <div className="grid gap-4 text-[13px]">
              <div>
                <p className="font-medium">Escala da ortofoto</p>
                <p className="text-muted-foreground">
                  Sem escala não há áreas nem comprimentos. Calibre com uma medida de trena ou informe o mm/pixel.
                </p>
              </div>
              {canEdit && (
                <>
                  <form action={saveCalibration} className="grid gap-2 rounded-lg border p-3">
                    <input type="hidden" name="mode" value="linha" />
                    <p className="font-medium">1. Por uma medida conhecida</p>
                    {calLine ? (
                      <>
                        <p className="text-muted-foreground">Linha desenhada ({Math.round(Math.hypot(calLine[1][0] - calLine[0][0], calLine[1][1] - calLine[0][1]))} px). Qual a distância real?</p>
                        <div className="flex gap-2">
                          <Input name="value" inputMode="decimal" placeholder="metros, ex.: 3,20" autoFocus defaultValue={ortho.calibration?.meters ?? ""} />
                          <Button type="submit" size="sm" disabled={busy}>
                            Aplicar
                          </Button>
                        </div>
                      </>
                    ) : null}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setTool("calibrar");
                        setDraft([]);
                        setCalOpen(false);
                        toast.info("Clique nos dois extremos de uma medida conhecida (ex.: largura de uma porta).");
                      }}
                    >
                      {calLine ? "Desenhar outra linha" : "Desenhar linha de calibração"}
                    </Button>
                  </form>
                  <form action={saveCalibration} className="grid gap-2 rounded-lg border p-3">
                    <input type="hidden" name="mode" value="mm" />
                    <p className="font-medium">2. Informar mm por pixel</p>
                    <div className="flex gap-2">
                      <Input name="value" inputMode="decimal" placeholder="ex.: 2,5" defaultValue={!calLine && mm ? String(mm).replace(".", ",") : ""} />
                      <Button type="submit" size="sm" disabled={busy}>
                        Aplicar
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="outline" size="sm" asChild>
          <a href={`/bens/${siteId}/ortofotos/${ortho.id}/dxf`}>
            <FileDown /> DXF
          </a>
        </Button>
        <Button size="sm" asChild>
          <a href={`/bens/${siteId}/ortofotos/${ortho.id}/pdf`} target="_blank" rel="noreferrer">
            <FileDown /> Prancha PDF
          </a>
        </Button>
        {canEdit && (
          <ConfirmButton
            action={() => deleteOrthophoto(siteId, ortho.id)}
            title="Excluir esta ortofoto?"
            description="A imagem e todos os danos desenhados nela serão apagados."
            size="icon-sm"
          />
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        {/* biblioteca */}
        <aside className="thin-scroll hidden w-64 shrink-0 overflow-y-auto border-r bg-sidebar md:block">
          <div className="sticky top-0 z-10 border-b bg-sidebar p-3">
            <p className="label mb-2">Biblioteca de danos</p>
            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar dano" className="h-8 pl-8 text-[13px]" />
            </div>
          </div>
          {!canEdit && <p className="p-3 text-[12.5px] text-muted-foreground">Você tem acesso só de leitura.</p>}
          {categories.map((c) => (
            <div key={c} className="px-2 py-2">
              <p className="px-2 pb-1 text-[11px] font-medium text-muted-foreground">{c}</p>
              {filteredTypes
                .filter((t) => t.category === c)
                .map((t) => (
                  <button
                    key={t.id}
                    disabled={!canEdit}
                    onClick={() => pickType(t.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-sidebar-accent disabled:cursor-default disabled:hover:bg-transparent",
                      typeId === t.id && tool === "desenhar" && "bg-sidebar-accent font-medium ring-1 ring-brand/40",
                    )}
                  >
                    <Swatch type={t} />
                    <span className="min-w-0 flex-1 truncate">{t.name}</span>
                    <span className="text-[10.5px] text-muted-foreground">{t.code}</span>
                  </button>
                ))}
            </div>
          ))}
        </aside>

        {/* tela */}
        <div className="relative min-w-0 flex-1 bg-[#1b1d21]">
          <div ref={wrapRef} className="absolute inset-0">
            <svg
              ref={svgRef}
              className="size-full touch-none select-none"
              viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
              preserveAspectRatio="xMidYMid meet"
              style={{ cursor }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={() => setHover(null)}
              onDoubleClick={onDoubleClick}
            >
              <defs>
                {types.map((t) => (
                  <DamagePattern key={t.id} id={`pat-${t.id}`} color={t.color} pattern={t.pattern} unit={unit} />
                ))}
              </defs>
              <image href={ortho.url} x={0} y={0} width={W} height={H} preserveAspectRatio="none" />
              <rect x={0} y={0} width={W} height={H} fill="none" stroke="#fff" strokeOpacity={0.25} vectorEffect="non-scaling-stroke" />

              {damages.map(renderDamage)}

              {/* vértices do dano selecionado (arrastáveis) */}
              {canEdit && selDamage && tool === "mover" && typeById.get(selDamage.typeId)?.geometry !== "ponto" &&
                (drag?.points ?? pts(selDamage)).map(([x, y], i) => (
                  <rect
                    key={i}
                    x={x - 4 * unit}
                    y={y - 4 * unit}
                    width={8 * unit}
                    height={8 * unit}
                    fill="#fff"
                    stroke="#0e7c7b"
                    strokeWidth={1.5 * unit}
                    style={{ cursor: "move" }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      (e.target as Element).setPointerCapture(e.pointerId);
                      setDrag({ index: i, points: pts(selDamage) });
                    }}
                  />
                ))}

              {/* linha de calibração */}
              {calLine && tool !== "calibrar" && (
                <g pointerEvents="none">
                  <line x1={calLine[0][0]} y1={calLine[0][1]} x2={calLine[1][0]} y2={calLine[1][1]} stroke="#facc15" strokeWidth={2} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
                  {calLine.map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r={4 * unit} fill="#facc15" />
                  ))}
                </g>
              )}

              {/* rascunho */}
              {preview.length > 0 && (
                <g pointerEvents="none">
                  {tool === "calibrar" ? (
                    <polyline points={toPath(preview)} fill="none" stroke="#facc15" strokeWidth={2} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
                  ) : draftType?.geometry === "area" ? (
                    <polygon points={toPath(preview)} fill={draftType.color} fillOpacity={0.25} stroke={draftType.color} strokeWidth={2} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
                  ) : (
                    <polyline points={toPath(preview)} fill="none" stroke={draftType?.color ?? "#fff"} strokeWidth={2} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
                  )}
                  {draft.map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r={3.5 * unit} fill="#fff" stroke={draftType?.color ?? "#facc15"} strokeWidth={1.5 * unit} />
                  ))}
                </g>
              )}
            </svg>
          </div>

          {/* ferramentas flutuantes */}
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-lg border border-white/10 bg-black/60 p-1 text-white backdrop-blur">
            <ToolBtn active={tool === "mover"} onClick={() => { setTool("mover"); setDraft([]); }} label="Mover e selecionar (espaço + arrastar em qualquer modo)">
              <Hand className="size-4" />
            </ToolBtn>
            <ToolBtn onClick={() => zoomCenter(1 / 1.4)} label="Aproximar"><ZoomIn className="size-4" /></ToolBtn>
            <ToolBtn onClick={() => zoomCenter(1.4)} label="Afastar"><ZoomOut className="size-4" /></ToolBtn>
            <ToolBtn onClick={fit} label="Enquadrar"><Maximize className="size-4" /></ToolBtn>
            {draft.length > 0 && (
              <ToolBtn onClick={() => setDraft((d) => d.slice(0, -1))} label="Desfazer último ponto (Backspace)"><Undo2 className="size-4" /></ToolBtn>
            )}
            {busy && <Loader2 className="mx-1.5 size-4 animate-spin opacity-70" />}
          </div>

          {/* dica de uso */}
          <div className="pointer-events-none absolute right-3 bottom-3 left-3 flex justify-center">
            <p className="rounded-full bg-black/65 px-3 py-1.5 text-center text-[12px] text-white/90 backdrop-blur">
              {tool === "calibrar"
                ? draft.length
                  ? "Clique no segundo extremo da medida."
                  : "Clique no primeiro extremo de uma medida conhecida."
                : tool === "desenhar" && activeType
                  ? activeType.geometry === "ponto"
                    ? `${activeType.name}: clique para marcar. Esc para sair.`
                    : `${activeType.name}: clique para adicionar pontos · duplo clique ou Enter para concluir · Backspace desfaz · Esc cancela`
                  : canEdit
                    ? "Escolha um dano na biblioteca para desenhar · roda do mouse = zoom · arraste para mover"
                    : "Roda do mouse = zoom · arraste para mover"}
              {!mm && " · ⚠ sem escala: defina para calcular áreas"}
            </p>
          </div>
        </div>

        {/* painel direito */}
        <aside className="thin-scroll hidden w-80 shrink-0 overflow-y-auto border-l bg-background lg:block">
          {selDamage ? (
            <DamagePanel
              key={selDamage.id}
              damage={selDamage}
              types={types}
              type={typeById.get(selDamage.typeId)!}
              canEdit={canEdit && !selDamage.id.startsWith("tmp-")}
              onClose={() => setSelected(null)}
              onPatch={(patch) => patchDamage(selDamage.id, patch)}
              onDelete={() => removeDamage(selDamage.id)}
            />
          ) : (
            <div className="grid gap-5 p-4">
              <div>
                <p className="label mb-2">Quantitativos</p>
                {summary.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground">Nenhum dano marcado ainda.</p>
                ) : (
                  <ul className="grid gap-1">
                    {summary.map((s) => (
                      <li key={s.type.id} className="flex items-center gap-2 rounded-md px-1.5 py-1 text-[13px] hover:bg-muted">
                        <Swatch type={s.type} />
                        <span className="min-w-0 flex-1 truncate">{s.type.name}</span>
                        <span className="text-[12px] text-muted-foreground tabular-nums">
                          {s.type.geometry === "area" ? fmtArea(mm ? s.area : null) : s.type.geometry === "linha" ? fmtLength(mm ? s.length : null) : `${s.count} un.`}
                        </span>
                        <button
                          aria-label={hidden.has(s.type.id) ? "Mostrar" : "Ocultar"}
                          onClick={() =>
                            setHidden((h) => {
                              const n = new Set(h);
                              if (n.has(s.type.id)) n.delete(s.type.id);
                              else n.add(s.type.id);
                              return n;
                            })
                          }
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {hidden.has(s.type.id) ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {damages.length > 0 && (
                <div>
                  <p className="label mb-2">Danos ({damages.length})</p>
                  <ul className="grid gap-0.5">
                    {damages.map((d, i) => {
                      const t = typeById.get(d.typeId);
                      if (!t) return null;
                      return (
                        <li key={d.id}>
                          <button
                            onClick={() => {
                              setTool("mover");
                              setSelected(d.id);
                            }}
                            className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-[13px] hover:bg-muted"
                          >
                            <span className="w-5 text-[11px] text-muted-foreground tabular-nums">{i + 1}</span>
                            <Swatch type={t} />
                            <span className="min-w-0 flex-1 truncate">{t.name}</span>
                            <span className="text-[12px] text-muted-foreground tabular-nums">
                              {t.geometry === "area" ? fmtArea(d.areaM2) : t.geometry === "linha" ? fmtLength(d.lengthM) : ""}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {usedTypes.length > 0 && (
                <p className="text-[12px] text-muted-foreground">
                  A prancha PDF e o DXF usam esta legenda, com uma camada por tipo de dano.
                </p>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Swatch({ type }: { type: DamageType }) {
  return (
    <span
      className="size-3.5 shrink-0 rounded-[3px] border border-black/10"
      style={{
        background:
          type.geometry === "linha"
            ? `linear-gradient(transparent 40%, ${type.color} 40% 62%, transparent 62%)`
            : type.geometry === "ponto"
              ? `radial-gradient(circle, ${type.color} 45%, transparent 50%)`
              : type.color,
      }}
      aria-hidden
    />
  );
}

function ToolBtn({ active, onClick, label, children }: { active?: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn("grid size-8 place-items-center rounded-md hover:bg-white/15", active && "bg-white/20")}
    >
      {children}
    </button>
  );
}

function DamagePanel({
  damage,
  type,
  types,
  canEdit,
  onClose,
  onPatch,
  onDelete,
}: {
  damage: Damage;
  type: DamageType;
  types: DamageType[];
  canEdit: boolean;
  onClose: () => void;
  onPatch: (p: Parameters<typeof updateDamage>[3]) => void;
  onDelete: () => void;
}) {
  const sameGeometry = types.filter((t) => t.geometry === type.geometry);
  const saveText = (field: "cause" | "recommendation" | "notes") => (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const v = e.target.value.trim();
    if (v !== (damage[field] ?? "")) onPatch({ [field]: v || null });
  };
  return (
    <div className="grid gap-4 p-4">
      <div className="flex items-center gap-2">
        <button onClick={onClose} className="text-[12.5px] text-muted-foreground hover:text-foreground">
          ← Todos os danos
        </button>
        {canEdit && (
          <Button variant="ghost" size="icon-sm" className="ml-auto text-muted-foreground hover:text-destructive" onClick={onDelete} aria-label="Excluir dano">
            <Trash2 />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Swatch type={type} />
        <span className="text-[16px] font-medium leading-tight">{type.name}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{geometryKinds[type.geometry]}</Badge>
        {type.geometry === "area" && <Badge variant="secondary">{fmtArea(damage.areaM2)}</Badge>}
        {type.geometry !== "ponto" && <Badge variant="secondary">{type.geometry === "area" ? "perímetro " : ""}{fmtLength(damage.lengthM)}</Badge>}
      </div>

      <label className="grid gap-1.5 text-[12.5px] font-medium text-foreground/80">
        Tipo de dano
        <SimpleSelect
          options={sameGeometry.map((t) => ({ value: t.id, label: t.name }))}
          value={type.id}
          onValueChange={(v) => canEdit && onPatch({ typeId: v })}
        />
      </label>
      <label className="grid gap-1.5 text-[12.5px] font-medium text-foreground/80">
        Gravidade
        <SimpleSelect
          options={Object.entries(severities).map(([value, label]) => ({ value, label }))}
          value={damage.severity}
          onValueChange={(v) => canEdit && onPatch({ severity: v as Damage["severity"] })}
        />
      </label>
      <label className="grid gap-1.5 text-[12.5px] font-medium text-foreground/80">
        Causa provável
        <Textarea defaultValue={damage.cause ?? ""} onBlur={saveText("cause")} readOnly={!canEdit} rows={2} />
      </label>
      <label className="grid gap-1.5 text-[12.5px] font-medium text-foreground/80">
        Recomendação
        <Textarea defaultValue={damage.recommendation ?? ""} onBlur={saveText("recommendation")} readOnly={!canEdit} rows={2} />
      </label>
      <label className="grid gap-1.5 text-[12.5px] font-medium text-foreground/80">
        Observações
        <Textarea defaultValue={damage.notes ?? ""} onBlur={saveText("notes")} readOnly={!canEdit} rows={3} />
      </label>
      {canEdit && type.geometry !== "ponto" && (
        <p className="text-[12px] text-muted-foreground">Arraste os vértices brancos na imagem para ajustar o desenho.</p>
      )}
    </div>
  );
}
