"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowLeftRight, Eye, EyeOff, Loader2, Maximize, Undo2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SimpleSelect } from "@/components/form";
import { alignmentRms, compareDamages, fitAlignment, mapPoints, scaleGuess, toMatrix3d, type DiffStatus, type Pair } from "@/lib/compare";
import { fmtArea, fmtLength, type Pt } from "@/lib/geometry";
import { saveAlignment } from "./actions";

export type CmpVista = {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  mmPerPixel: number | null;
  /** "Vistoria · data — vista". */
  label: string;
  /** ISO (aaaa-mm-dd). */
  date: string;
};
type Dmg = { id: string; typeId: string; points: [number, number][]; areaM2: number | null; lengthM: number | null };
type DType = { id: string; code: string; name: string; category: string; geometry: "area" | "linha" | "ponto"; color: string };
type Alignment = { pairs: Pair[]; matrix: number[]; rmsPx: number | null };
type View = { s: number; tx: number; ty: number };
type Mode = "cortina" | "lado" | "alinhar";
type Box = { w: number; h: number };

const STATUS: Record<DiffStatus, { label: string; color: string; hint: string }> = {
  novo: { label: "Novos", color: "#ef4444", hint: "Só aparecem na vistoria depois." },
  cresceu: { label: "Cresceram", color: "#f97316", hint: "Mais de 20% maiores, ou agravados (ex.: fissura que virou trinca)." },
  estavel: { label: "Estáveis", color: "#a3a3a3", hint: "Nas duas vistorias, com tamanho parecido." },
  diminuiu: { label: "Diminuíram", color: "#3b82f6", hint: "Mais de 20% menores na vistoria depois." },
  sumiu: { label: "Não aparecem", color: "#22c55e", hint: "Só na vistoria antes: tratados, ou escondidos por sombra ou ângulo." },
};
const ORDER: DiffStatus[] = ["novo", "cresceu", "diminuiu", "sumiu", "estavel"];

const toPath = (p: Pt[]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
const fmtMm = (mm: number) => (mm < 10 ? `${mm.toFixed(1).replace(".", ",")} mm` : `${(mm / 10).toFixed(1).replace(".", ",")} cm`);
const fmtDay = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR");

export function CompareView({
  siteId,
  siteName,
  vistas,
  a,
  b,
  damagesA,
  damagesB,
  types,
  alignment: initial,
  canEdit,
}: {
  siteId: string;
  siteName: string;
  vistas: CmpVista[];
  /** Antes (referência). */
  a: CmpVista;
  /** Depois. */
  b: CmpVista;
  damagesA: Dmg[];
  damagesB: Dmg[];
  types: DType[];
  alignment: Alignment | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const typeById = useMemo(() => new Map(types.map((t) => [t.id, t])), [types]);
  const [alignment, setAlignment] = useState(initial);
  const [mode, setModeRaw] = useState<Mode>(initial ? "cortina" : "alinhar");
  const [split, setSplit] = useState(0.5);
  const [showDamages, setShowDamages] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [view, setView] = useState<View | null>(null);
  const [viewB, setViewB] = useState<View | null>(null);
  const [pairs, setPairs] = useState<Pair[]>(initial?.pairs ?? []);
  const [pending, setPending] = useState<{ a?: Pt; b?: Pt }>({});
  const [focus, setFocus] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const boxRef = useRef<Box>({ w: 1, h: 1 });

  const setMode = (m: Mode) => {
    setModeRaw(m);
    // cada modo tem outro tamanho de painel: reenquadra
    setView(null);
    setViewB(null);
  };

  const Hm = useMemo(() => alignment?.matrix ?? scaleGuess(a.mmPerPixel, b.mmPerPixel, a.width, b.width), [alignment, a, b]);
  const live = useMemo(() => {
    try {
      return pairs.length >= 2 ? fitAlignment(pairs) : null;
    } catch {
      return null;
    }
  }, [pairs]);
  const liveRms = live ? alignmentRms(live, pairs) : null;

  const mappedB = useMemo(() => damagesB.map((d) => ({ ...d, points: mapPoints(Hm, d.points as Pt[]) })), [damagesB, Hm]);
  const footB = useMemo(() => mapPoints(Hm, [[0, 0], [b.width, 0], [b.width, b.height], [0, b.height]]), [Hm, b.width, b.height]);
  const diff = useMemo(
    () => (alignment ? compareDamages({ a: damagesA, b: mappedB, types: typeById, W: a.width, H: a.height, footB }) : null),
    [alignment, damagesA, mappedB, typeById, a.width, a.height, footB],
  );

  // quantitativos por tipo, só na área comum às duas vistas
  const byType = useMemo(() => {
    if (!diff) return [];
    const m = new Map<string, { type: DType; before: number; after: number; nb: number; na: number }>();
    const add = (d: Dmg, side: "before" | "after") => {
      const t = typeById.get(d.typeId);
      if (!t) return;
      const r = m.get(t.code) ?? { type: t, before: 0, after: 0, nb: 0, na: 0 };
      const q = t.geometry === "area" ? d.areaM2 ?? 0 : t.geometry === "linha" ? d.lengthM ?? 0 : 1;
      if (side === "before") {
        r.before += q;
        r.nb++;
      } else {
        r.after += q;
        r.na++;
      }
      m.set(t.code, r);
    };
    for (const d of damagesA) if (diff.inA.has(d.id)) add(d, "before");
    for (const d of damagesB) if (diff.inB.has(d.id)) add(d, "after");
    return [...m.values()].sort((x, y) => x.type.category.localeCompare(y.type.category) || x.type.name.localeCompare(y.type.name));
  }, [diff, damagesA, damagesB, typeById]);

  const changes = useMemo(() => {
    if (!diff) return [];
    const list: { id: string; side: "a" | "b"; status: DiffStatus; type: DType; points: Pt[]; ratio: number | null; typeChanged: boolean }[] = [];
    for (const d of mappedB) {
      const r = diff.b.get(d.id);
      const t = typeById.get(d.typeId);
      if (r && t && r.status !== "estavel") list.push({ id: d.id, side: "b", status: r.status, type: t, points: d.points, ratio: r.ratio, typeChanged: r.typeChanged });
    }
    for (const d of damagesA) {
      const r = diff.a.get(d.id);
      const t = typeById.get(d.typeId);
      if (r && t) list.push({ id: d.id, side: "a", status: "sumiu", type: t, points: d.points as Pt[], ratio: null, typeChanged: false });
    }
    return list.sort((x, y) => ORDER.indexOf(x.status) - ORDER.indexOf(y.status));
  }, [diff, mappedB, damagesA, typeById]);

  /** Centraliza o palco num dano (pontos no referencial da vista antes). */
  const focusOn = (points: Pt[]) => {
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const bw = Math.max(60, Math.max(...xs) - Math.min(...xs));
    const bh = Math.max(60, Math.max(...ys) - Math.min(...ys));
    const box = boxRef.current;
    const s = Math.min(box.w / (bw * 4), box.h / (bh * 4), 2.5);
    setView({ s, tx: box.w / 2 - cx * s, ty: box.h / 2 - cy * s });
  };

  const go = (na: string, nb: string) => router.push(`/bens/${siteId}/comparar?a=${na}&b=${nb}`);

  function addPoint(side: "a" | "b", p: Pt) {
    const next = { ...pending, [side]: p };
    if (next.a && next.b) {
      setPairs((list) => [...list, { a: next.a!, b: next.b! }]);
      setPending({});
    } else setPending(next);
  }

  function save() {
    startSaving(async () => {
      try {
        const r = await saveAlignment(siteId, a.id, b.id, pairs);
        setAlignment(r);
        setMode("cortina");
        toast.success("Vistas alinhadas.", { description: "Arraste a cortina para comparar. O painel mostra o que surgiu, cresceu ou não aparece mais." });
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  /* ── camadas no referencial da vista A ── */
  const imgA = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={a.url} alt={a.name} draggable={false} className="absolute top-0 left-0 max-w-none" style={{ width: a.width, height: a.height }} />
  );
  const imgB = (clip?: string) => (
    <div className="absolute top-0 left-0 overflow-hidden bg-[#0a0a0a]" style={{ width: a.width, height: a.height, clipPath: clip }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={b.url}
        alt={b.name}
        draggable={false}
        className="absolute top-0 left-0 max-w-none"
        style={{ width: b.width, height: b.height, transform: toMatrix3d(Hm), transformOrigin: "0 0" }}
      />
    </div>
  );

  const colorOf = (side: "a" | "b", d: Dmg) => {
    const t = typeById.get(d.typeId);
    if (!diff) return t?.color ?? "#fff";
    if (side === "b") return STATUS[diff.b.get(d.id)?.status ?? "estavel"].color;
    return diff.a.has(d.id) ? STATUS.sumiu.color : STATUS.estavel.color;
  };
  const damageLayer = (side: "a" | "b", list: Dmg[], unit: number, clip?: string) =>
    showDamages && (
      <svg className="pointer-events-none absolute top-0 left-0 overflow-visible" width={a.width} height={a.height} viewBox={`0 0 ${a.width} ${a.height}`} style={{ clipPath: clip }}>
        {list.map((d) => {
          const t = typeById.get(d.typeId);
          if (!t) return null;
          const c = colorOf(side, d);
          const sel = focus === d.id;
          const dashed = side === "a" && diff?.a.has(d.id);
          const sw = (sel ? 4 : 2) * unit;
          const p = d.points as Pt[];
          if (t.geometry === "ponto") return <circle key={d.id} cx={p[0]![0]} cy={p[0]![1]} r={(sel ? 9 : 6) * unit} fill={c} stroke="#fff" strokeWidth={1.5 * unit} />;
          const Shape = t.geometry === "area" ? "polygon" : "polyline";
          return (
            <g key={d.id}>
              <Shape points={toPath(p)} fill="none" stroke="#000" strokeOpacity={0.5} strokeWidth={sw + 2 * unit} strokeLinejoin="round" />
              <Shape
                points={toPath(p)}
                fill={t.geometry === "area" ? c : "none"}
                fillOpacity={0.22}
                stroke={c}
                strokeWidth={sw}
                strokeDasharray={dashed ? `${6 * unit} ${4 * unit}` : undefined}
                strokeLinejoin="round"
              />
            </g>
          );
        })}
      </svg>
    );
  const markers = (side: "a" | "b", unit: number) => (
    <svg className="pointer-events-none absolute top-0 left-0 overflow-visible" width={1} height={1}>
      {pairs.map((p, i) => {
        const [x, y] = p[side];
        const err = live ? Math.hypot(...((): [number, number] => {
          const [mx, my] = mapPoints(live, [p.b])[0]!;
          return [mx - p.a[0], my - p.a[1]];
        })()) : 0;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={11 * unit} fill="#000" fillOpacity={0.6} stroke={err > 8 ? "#f97316" : "#fff"} strokeWidth={2 * unit} />
            <text x={x} y={y + 4 * unit} fontSize={11 * unit} textAnchor="middle" fill="#fff" fontWeight={700}>
              {i + 1}
            </text>
          </g>
        );
      })}
      {pending[side] && <circle cx={pending[side]![0]} cy={pending[side]![1]} r={9 * unit} fill="#fff" stroke="#000" strokeWidth={2 * unit} />}
    </svg>
  );

  const quality = alignment
    ? `Alinhadas · erro médio ${alignment.rmsPx != null ? (a.mmPerPixel ? fmtMm(alignment.rmsPx * a.mmPerPixel) : `${alignment.rmsPx.toFixed(1)} px`) : "—"}`
    : "Sem alinhamento";

  return (
    <div className="flex h-svh min-h-0 flex-col pt-[env(safe-area-inset-top)]">
      <header className="flex flex-wrap items-center gap-2 border-b bg-background px-3 py-2 sm:px-4">
        <Button variant="ghost" size="icon-sm" asChild aria-label="Voltar ao projeto">
          <Link href={`/bens/${siteId}?aba=vistorias`}>
            <ArrowLeft />
          </Link>
        </Button>
        <div className="mr-auto grid min-w-0 leading-tight">
          <span className="truncate text-[11.5px] text-muted-foreground">{siteName}</span>
          <span className="truncate text-[16px] font-medium">Comparar vistorias</span>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <div className="w-60 min-w-0 2xl:w-72">
            <SimpleSelect options={vistas.filter((v) => v.id !== b.id).map((v) => ({ value: v.id, label: `Antes: ${v.label}` }))} value={a.id} onValueChange={(v) => go(v, b.id)} />
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => go(b.id, a.id)} aria-label="Trocar antes e depois" title="Trocar antes e depois">
            <ArrowLeftRight />
          </Button>
          <div className="w-60 min-w-0 2xl:w-72">
            <SimpleSelect options={vistas.filter((v) => v.id !== a.id).map((v) => ({ value: v.id, label: `Depois: ${v.label}` }))} value={b.id} onValueChange={(v) => go(a.id, v)} />
          </div>
        </div>
        <div className="flex rounded-full border p-0.5 text-[12.5px]" role="radiogroup" aria-label="Modo">
          {(
            [
              ["cortina", "Cortina"],
              ["lado", "Lado a lado"],
              ["alinhar", "Alinhar"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              role="radio"
              aria-checked={mode === m}
              onClick={() => mode !== m && setMode(m)}
              className={cn("rounded-full px-3 py-1", mode === m ? "bg-foreground font-medium text-background" : "text-muted-foreground hover:text-foreground")}
            >
              {label}
            </button>
          ))}
        </div>
        {mode !== "alinhar" && (
          <Button variant="ghost" size="icon-sm" onClick={() => setShowDamages((v) => !v)} aria-label={showDamages ? "Esconder danos" : "Mostrar danos"} title={showDamages ? "Esconder danos" : "Mostrar danos"}>
            {showDamages ? <Eye /> : <EyeOff />}
          </Button>
        )}
        <Button variant="ghost" size="icon-sm" onClick={() => (setView(null), setViewB(null))} aria-label="Enquadrar" title="Enquadrar">
          <Maximize />
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          {!alignment && mode !== "alinhar" && (
            <p className="border-b bg-muted px-4 py-2 text-[12.5px] text-muted-foreground">
              Prévia sem alinhamento (só pela escala). Para comparar os danos,{" "}
              <button onClick={() => setMode("alinhar")} className="font-medium text-foreground underline-offset-4 hover:underline">
                alinhe as vistas com 4 pontos
              </button>
              .
            </p>
          )}
          <div className={cn("flex min-h-0 flex-1", mode !== "cortina" && "divide-x divide-white/10")}>
            {mode === "cortina" && (
              <Stage
                W={a.width}
                H={a.height}
                view={view}
                onView={setView}
                boxRef={boxRef}
                overlay={(v) => <Divider split={split} onSplit={setSplit} view={v} W={a.width} />}
                labels={[`Antes · ${fmtDay(a.date)}`, `Depois · ${fmtDay(b.date)}`]}
              >
                {view && (
                  <>
                    {imgA}
                    {imgB(`inset(0 0 0 ${split * 100}%)`)}
                    {damageLayer("a", damagesA, 1 / view.s, `inset(0 ${(1 - split) * 100}% 0 0)`)}
                    {damageLayer("b", mappedB, 1 / view.s, `inset(0 0 0 ${split * 100}%)`)}
                  </>
                )}
              </Stage>
            )}
            {mode === "lado" && (
              <>
                <Stage W={a.width} H={a.height} view={view} onView={setView} boxRef={boxRef} labels={[`Antes · ${fmtDay(a.date)}`]}>
                  {view && (
                    <>
                      {imgA}
                      {damageLayer("a", damagesA, 1 / view.s)}
                    </>
                  )}
                </Stage>
                <Stage W={a.width} H={a.height} view={view} onView={setView} labels={[`Depois · ${fmtDay(b.date)}`]}>
                  {view && (
                    <>
                      {imgB()}
                      {damageLayer("b", mappedB, 1 / view.s)}
                    </>
                  )}
                </Stage>
              </>
            )}
            {mode === "alinhar" && (
              <>
                <Stage W={a.width} H={a.height} view={view} onView={setView} boxRef={boxRef} onPick={canEdit ? (p) => addPoint("a", p) : undefined} labels={[`Antes · ${fmtDay(a.date)}`]}>
                  {view && (
                    <>
                      {imgA}
                      {markers("a", 1 / view.s)}
                    </>
                  )}
                </Stage>
                <Stage W={b.width} H={b.height} view={viewB} onView={setViewB} onPick={canEdit ? (p) => addPoint("b", p) : undefined} labels={[`Depois · ${fmtDay(b.date)}`]}>
                  {viewB && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.url} alt={b.name} draggable={false} className="absolute top-0 left-0 max-w-none" style={{ width: b.width, height: b.height }} />
                      {markers("b", 1 / viewB.s)}
                    </>
                  )}
                </Stage>
              </>
            )}
          </div>
        </div>

        {/* no celular o painel vira uma gaveta que sobe */}
        {panelOpen && <button aria-label="Fechar painel" onClick={() => setPanelOpen(false)} className="fixed inset-0 z-30 bg-black/40 lg:hidden" />}
        <aside
          className={cn(
            "thin-scroll w-80 shrink-0 overflow-y-auto border-l bg-background 2xl:w-96",
            "max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-40 max-lg:max-h-[75svh] max-lg:w-full max-lg:rounded-t-3xl max-lg:border-t max-lg:border-l-0 max-lg:pb-[env(safe-area-inset-bottom)] max-lg:shadow-2xl max-lg:transition-transform",
            !panelOpen && "max-lg:invisible max-lg:translate-y-full",
          )}
        >
          <div className="grid min-w-0 gap-5 p-4 pb-16">
            <p className={cn("rounded-lg px-3 py-2 text-[12.5px]", alignment ? "bg-muted" : "border border-dashed text-muted-foreground")}>{quality}</p>

            {mode === "alinhar" ? (
              <AlignPanel
                pairs={pairs}
                pending={pending}
                live={live}
                liveRms={liveRms}
                mmPerPixel={a.mmPerPixel}
                canEdit={canEdit}
                saving={saving}
                onRemove={(i) => setPairs((l) => l.filter((_, k) => k !== i))}
                onUndo={() => (pending.a || pending.b ? setPending({}) : setPairs((l) => l.slice(0, -1)))}
                onReset={() => (setPairs([]), setPending({}))}
                onSave={save}
              />
            ) : !diff ? (
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Sem alinhamento, a comparação dos danos não é confiável. Use <b className="font-medium text-foreground">Alinhar</b> e marque 4 pontos iguais nas duas vistas.
              </p>
            ) : (
              <>
                <section>
                  <p className="label mb-2">O que mudou</p>
                  <ul className="grid gap-1.5">
                    {ORDER.map((s) => (
                      <li key={s} className="flex items-start gap-2.5 text-[13px]" title={STATUS[s].hint}>
                        <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ background: STATUS[s].color }} />
                        <span className="min-w-0 flex-1">
                          {STATUS[s].label}
                          <span className="block text-[11.5px] leading-snug text-muted-foreground">{STATUS[s].hint}</span>
                        </span>
                        <span className="font-medium tabular-nums">{diff.counts[s]}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {byType.length > 0 && (
                  <section className="min-w-0">
                    <p className="label mb-1">Quantitativos (área comum)</p>
                    <table className="w-full table-fixed text-[12.5px]">
                      <thead>
                        <tr className="text-left text-[11px] text-muted-foreground">
                          <th className="py-1 font-normal">Tipo</th>
                          <th className="w-[5.5rem] py-1 text-right font-normal">Antes</th>
                          <th className="w-[5.5rem] py-1 text-right font-normal">Depois</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {byType.map((r) => {
                          const q = (v: number, n: number, mm: number | null) =>
                            r.type.geometry === "ponto" ? `${n} un.` : !mm ? `${n}` : r.type.geometry === "area" ? fmtArea(v) : fmtLength(v);
                          return (
                            <tr key={r.type.code}>
                              <td className="py-1.5 pr-2" title={r.type.name}>
                                <span className="flex min-w-0 items-start gap-1.5">
                                  <span className="mt-1 size-2.5 shrink-0 rounded-[3px]" style={{ background: r.type.color }} />
                                  <span className="line-clamp-2 leading-snug break-words">{r.type.name}</span>
                                </span>
                              </td>
                              <td className="py-1.5 text-right whitespace-nowrap tabular-nums">{r.nb ? q(r.before, r.nb, a.mmPerPixel) : "—"}</td>
                              <td className="py-1.5 pl-2 text-right whitespace-nowrap tabular-nums">{r.na ? q(r.after, r.na, b.mmPerPixel) : "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </section>
                )}

                {changes.length > 0 && (
                  <section className="min-w-0">
                    <p className="label mb-1">Danos que mudaram ({changes.length})</p>
                    <ul className="-mx-1.5 grid grid-cols-1">
                      {changes.map((c) => (
                        <li key={`${c.side}-${c.id}`}>
                          <button
                            onClick={() => {
                              setFocus(c.id);
                              if (mode === "cortina") setSplit(c.side === "a" ? 0.98 : 0.02);
                              focusOn(c.points);
                            }}
                            className={cn("flex w-full min-w-0 items-center gap-2 rounded-md px-1.5 py-1.5 text-left hover:bg-muted", focus === c.id && "bg-muted")}
                          >
                            <span className="size-2.5 shrink-0 rounded-full" style={{ background: STATUS[c.status].color }} />
                            <span className="min-w-0 flex-1 truncate text-[13px]" title={c.type.name}>
                              {c.type.name}
                            </span>
                            <span className="shrink-0 text-[11.5px] text-muted-foreground">
                              {c.status === "novo"
                                ? "novo"
                                : c.status === "sumiu"
                                  ? "não aparece"
                                  : c.typeChanged
                                    ? "agravou"
                                    : c.ratio != null
                                      ? `${c.ratio > 1 ? "+" : ""}${Math.round((c.ratio - 1) * 100)}%`
                                      : STATUS[c.status].label.toLowerCase()}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <p className="text-[11.5px] leading-snug text-muted-foreground">
                  Só entra o que aparece nas duas vistas. Os danos são casados pela posição e pela categoria (fissura com trinca, umidade com umidade).
                  Confira na imagem antes de concluir: sombra, ângulo e resolução mudam o que a foto mostra.
                </p>
              </>
            )}
          </div>
        </aside>
      </div>
      <div className="shrink-0 border-t bg-background px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
        <Button variant="secondary" className="h-11 w-full" onClick={() => setPanelOpen(true)}>
          O que mudou
        </Button>
      </div>
    </div>
  );
}

/** Palco com arrastar e zoom (roda), no referencial de uma imagem W×H. */
function Stage({
  W,
  H,
  view,
  onView,
  onPick,
  boxRef,
  overlay,
  labels,
  children,
}: {
  W: number;
  H: number;
  view: View | null;
  onView: (v: View) => void;
  onPick?: (p: Pt) => void;
  boxRef?: React.RefObject<Box>;
  overlay?: (v: View) => React.ReactNode;
  labels?: string[];
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const viewRef = useRef(view);
  useLayoutEffect(() => {
    viewRef.current = view;
  }, [view]);
  const drag = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean } | null>(null);

  const fit = useCallback(() => {
    const r = ref.current?.getBoundingClientRect();
    if (!r?.width) return;
    const s = Math.min(r.width / W, r.height / H) * 0.94;
    onView({ s, tx: (r.width - W * s) / 2, ty: (r.height - H * s) / 2 });
  }, [W, H, onView]);

  useEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(([e]) => {
      if (boxRef) boxRef.current = { w: e!.contentRect.width || 1, h: e!.contentRect.height || 1 };
      if (!viewRef.current) fit();
    });
    ro.observe(el);
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const v = viewRef.current;
      if (!v) return;
      const r = el.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      const s = Math.max(0.02, Math.min(20, v.s * (e.deltaY > 0 ? 1 / 1.15 : 1.15)));
      const k = s / v.s;
      onView({ s, tx: mx - (mx - v.tx) * k, ty: my - (my - v.ty) * k });
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      ro.disconnect();
      el.removeEventListener("wheel", wheel);
    };
  }, [fit, onView, boxRef]);

  // ao ser "desenquadrado" (view nulo) por um botão, reenquadra
  useEffect(() => {
    if (!view) fit();
  }, [view, fit]);

  return (
    <div
      ref={ref}
      className="relative min-h-0 min-w-0 flex-1 touch-none overflow-hidden bg-canvas select-none"
      style={{ cursor: onPick ? "crosshair" : "grab" }}
      onPointerDown={(e) => {
        const v = viewRef.current;
        if (!v) return;
        try {
          (e.currentTarget as Element).setPointerCapture(e.pointerId);
        } catch {
          // sem captura: segue sem
        }
        drag.current = { x: e.clientX, y: e.clientY, tx: v.tx, ty: v.ty, moved: false };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        const v = viewRef.current;
        if (!d || !v) return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        if (!d.moved && Math.hypot(dx, dy) > 4) d.moved = true;
        if (d.moved) onView({ ...v, tx: d.tx + dx, ty: d.ty + dy });
      }}
      onPointerUp={(e) => {
        const d = drag.current;
        drag.current = null;
        const v = viewRef.current;
        if (!d || d.moved || !onPick || !v || e.button !== 0) return;
        const r = ref.current!.getBoundingClientRect();
        const x = (e.clientX - r.left - v.tx) / v.s;
        const y = (e.clientY - r.top - v.ty) / v.s;
        if (x >= 0 && y >= 0 && x <= W && y <= H) onPick([x, y]);
      }}
    >
      {view && (
        <div className="absolute top-0 left-0" style={{ width: W, height: H, transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.s})`, transformOrigin: "0 0" }}>
          {children}
        </div>
      )}
      {view && overlay?.(view)}
      {labels && (
        <div className="pointer-events-none absolute inset-x-3 top-3 flex justify-between gap-2">
          {labels.map((l) => (
            <span key={l} className="rounded-full bg-black/65 px-2.5 py-1 text-[12px] text-white backdrop-blur">
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Divisor da cortina (arrastável), em coordenadas de tela. */
function Divider({ split, onSplit, view, W }: { split: number; onSplit: (v: number) => void; view: View; W: number }) {
  const x = view.tx + split * W * view.s;
  return (
    <div
      className="absolute inset-y-0 z-10 w-8 -translate-x-1/2 cursor-ew-resize touch-none"
      style={{ left: x }}
      role="slider"
      aria-label="Cortina entre antes e depois"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(split * 100)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") onSplit(Math.max(0, split - 0.02));
        if (e.key === "ArrowRight") onSplit(Math.min(1, split + 0.02));
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!(e.currentTarget as Element).hasPointerCapture(e.pointerId)) return;
        e.stopPropagation();
        const parent = (e.currentTarget as HTMLElement).parentElement!.getBoundingClientRect();
        onSplit(Math.max(0, Math.min(1, (e.clientX - parent.left - view.tx) / (W * view.s))));
      }}
      onPointerUp={(e) => e.stopPropagation()}
    >
      <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]" />
      <div className="absolute top-1/2 left-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-black shadow-lg">
        <ArrowLeftRight className="size-4" />
      </div>
    </div>
  );
}

function AlignPanel({
  pairs,
  pending,
  live,
  liveRms,
  mmPerPixel,
  canEdit,
  saving,
  onRemove,
  onUndo,
  onReset,
  onSave,
}: {
  pairs: Pair[];
  pending: { a?: Pt; b?: Pt };
  live: number[] | null;
  liveRms: number | null;
  mmPerPixel: number | null;
  canEdit: boolean;
  saving: boolean;
  onRemove: (i: number) => void;
  onUndo: () => void;
  onReset: () => void;
  onSave: () => void;
}) {
  const next = pending.a ? "agora o mesmo ponto na vista depois (direita)" : pending.b ? "agora o mesmo ponto na vista antes (esquerda)" : "um ponto bem visível na vista antes (esquerda)";
  return (
    <section className="grid gap-3">
      <div>
        <p className="label">Alinhar as vistas</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
          Marque pontos iguais nas duas imagens: cantos de janelas, de portas, de cornijas. Use pelo menos 4, espalhados pela fachada (não
          todos numa linha). A rodinha do mouse aproxima; arraste para mover.
        </p>
      </div>
      {canEdit ? (
        <p className="rounded-lg border border-dashed px-3 py-2 text-[12.5px]">
          Par {pairs.length + 1}: clique {next}.
        </p>
      ) : (
        <p className="text-[12.5px] text-muted-foreground">Somente técnicos e administradores alinham vistas.</p>
      )}
      {pairs.length > 0 && (
        <ul className="grid gap-0.5 text-[12.5px]">
          {pairs.map((p, i) => {
            const err = live ? (() => {
              const [mx, my] = mapPoints(live, [p.b])[0]!;
              return Math.hypot(mx - p.a[0], my - p.a[1]);
            })() : null;
            return (
              <li key={i} className="flex items-center gap-2">
                <span className="grid size-5 place-items-center rounded-full bg-foreground text-[10.5px] font-bold text-background">{i + 1}</span>
                <span className="flex-1 text-muted-foreground tabular-nums">
                  {err == null ? "—" : mmPerPixel ? `erro ${fmtMm(err * mmPerPixel)}` : `erro ${err.toFixed(1)} px`}
                </span>
                {canEdit && (
                  <button onClick={() => onRemove(i)} aria-label={`Remover par ${i + 1}`} className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                    <X className="size-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {liveRms != null && (
        <p className="text-[12.5px]">
          Erro médio: <b className="font-medium">{mmPerPixel ? fmtMm(liveRms * mmPerPixel) : `${liveRms.toFixed(1)} px`}</b>
          {pairs.length < 4 && <span className="text-muted-foreground"> · com {pairs.length} pares a perspectiva não é corrigida</span>}
          {pairs.length === 4 && <span className="text-muted-foreground"> · com 4 pares o erro é sempre zero: um 5º par confere o alinhamento</span>}
        </p>
      )}
      {canEdit && (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={onUndo} disabled={!pairs.length && !pending.a && !pending.b}>
            <Undo2 /> Desfazer
          </Button>
          <Button variant="ghost" size="sm" onClick={onReset} disabled={!pairs.length}>
            Recomeçar
          </Button>
          <Button className="col-span-2" onClick={onSave} disabled={saving || pairs.length < 2 || !live}>
            {saving && <Loader2 className="animate-spin" />} Salvar alinhamento
          </Button>
        </div>
      )}
    </section>
  );
}
