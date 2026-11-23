"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Download, Loader2, MousePointer2, Plus, Rows3, ScanSearch, Spline, Trash2, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { Box } from "@/lib/cadastro/analyze";
import { drawingDxf, type Layer } from "@/lib/cadastro/drawing";
import { aplicarAoTipo, alterarTipo, alterarVao, desenhoDoModelo, medidas, novoId, tipoDe, type Modelo, type Tipo } from "@/lib/cadastro/model";
import { runCadastro } from "@/lib/cadastro/client";

type Vista = { id: string; name: string; site: string; url: string; mmPerPixel: number; width: number; height: number };
type Tool = "selecionar" | "modelo" | "janela" | "faixa" | "ornamento";
type Sel = { kind: "vao" | "faixa" | "ornamento"; id: string } | null;
type Saved = { modelo: Modelo; facade: Box; seeds: Box[] };

const STORE = (id: string) => `archray-lab-cadastro:${id}`;
const fmt = (n: number) => n.toFixed(3).replace(/\.?0+$/, "").replace(".", ",");
const COLOR: Partial<Record<Layer, string>> = { CONTORNO: "#ff3bd4", FAIXAS: "#ffd400", VAOS: "#00e5ff", ESQUADRIAS: "#7aa2ff", MOLDURAS: "#ffffff", ARCOS: "#c084fc", ORNAMENTOS: "#4ade80", COTAS: "#ff6b6b", TEXTOS: "#ffffff" };

/** Campo numérico em metros: aceita vírgula ou ponto e confirma ao sair ou com Enter. */
function Num({ label, value, onCommit, hint, step = 0.01 }: { label: string; value: number; onCommit: (v: number) => void; hint?: string; step?: number }) {
  const [text, setText] = useState(fmt(value));
  // valor mudou por fora (outro campo, desfazer): o texto acompanha
  const [last, setLast] = useState(value);
  if (last !== value) {
    setLast(value);
    setText(fmt(value));
  }
  const commit = () => {
    const v = Number(text.replace(",", "."));
    if (Number.isFinite(v) && v >= 0 && Math.abs(v - value) > 1e-6) onCommit(Math.round(v * 1000) / 1000);
    else setText(fmt(value));
  };
  return (
    <label className="grid gap-1">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <Input
        value={text}
        inputMode="decimal"
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const v = Math.max(0, Math.round((value + (e.key === "ArrowUp" ? step : -step)) * 1000) / 1000);
            onCommit(v);
          }
        }}
        className="h-8 tabular-nums"
      />
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

function Int({ label, value, onCommit }: { label: string; value: number; onCommit: (v: number) => void }) {
  return (
    <label className="grid gap-1">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <div className="flex h-8 items-center justify-between rounded-md border">
        <button type="button" className="h-full w-7 rounded-l-md text-muted-foreground hover:bg-muted" onClick={() => onCommit(Math.max(0, value - 1))} aria-label={`Menos ${label.toLowerCase()}`}>
          −
        </button>
        <span className="text-center text-[13px] tabular-nums">{value}</span>
        <button type="button" className="h-full w-7 rounded-r-md text-muted-foreground hover:bg-muted" onClick={() => onCommit(value + 1)} aria-label={`Mais ${label.toLowerCase()}`}>
          +
        </button>
      </div>
    </label>
  );
}

export function CadastroEditor({ vista }: { vista: Vista }) {
  const [modelo, setModelo] = useState<Modelo | null>(null);
  const [facade, setFacade] = useState<Box>({ x0: 0, y0: 0, x1: vista.width, y1: vista.height });
  const [seeds, setSeeds] = useState<Box[]>([]);
  const [tool, setTool] = useState<Tool>("selecionar");
  const [sel, setSel] = useState<Sel>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [foto, setFoto] = useState(true);
  const [cotas, setCotas] = useState(false);
  const [historico, setHistorico] = useState<Modelo[]>([]);
  const [drag, setDrag] = useState<Box | null>(null);
  const [rascunho, setRascunho] = useState<[number, number][]>([]);
  const [tipoNovo, setTipoNovo] = useState<string | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, w: vista.width, h: vista.height });
  const svgRef = useRef<SVGSVGElement>(null);
  const pan = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);

  // metros ↔ pixels da imagem original
  const k = vista.mmPerPixel / 1000;
  const toPx = useCallback((x: number, y: number): [number, number] => [facade.x0 + x / k, facade.y1 - y / k], [facade, k]);
  const toM = useCallback((px: number, py: number): [number, number] => [(px - facade.x0) * k, (facade.y1 - py) * k], [facade, k]);

  const salvar = useCallback(
    (m: Modelo, f = facade, s = seeds) => {
      try {
        localStorage.setItem(STORE(vista.id), JSON.stringify({ modelo: m, facade: f, seeds: s } satisfies Saved));
      } catch {}
    },
    [facade, seeds, vista.id],
  );
  const mudar = useCallback(
    (m: Modelo) => {
      setHistorico((h) => (modelo ? [...h.slice(-40), modelo] : h));
      setModelo(m);
      salvar(m);
    },
    [modelo, salvar],
  );

  const detectar = useCallback(
    async (s: Box[]) => {
      setBusy("Preparando");
      try {
        const r = await runCadastro({ url: vista.url, mmPerPixel: vista.mmPerPixel, seeds: s }, setBusy);
        setFacade(r.facade);
        setModelo((old) => {
          if (old) setHistorico((h) => [...h.slice(-40), old]);
          return r.modelo;
        });
        salvar(r.modelo, r.facade, s);
        if (s.length) toast.success(`${r.achados} janelas encontradas (${r.porTipo.map((n, i) => `tipo ${String.fromCharCode(65 + i)}: ${n}`).join(", ")}) em ${(r.ms / 1000).toFixed(1).replace(".", ",")} s. Confira e ajuste as medidas.`);
        console.info("cadastro: achados brutos por tipo", r.brutos);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha no levantamento.");
      } finally {
        setBusy(null);
      }
    },
    [salvar, vista.mmPerPixel, vista.url],
  );

  // retoma o trabalho salvo neste navegador; sem ele, lê contorno e faixas
  useEffect(() => {
    let saved: Saved | null = null;
    try {
      const raw = localStorage.getItem(STORE(vista.id));
      if (raw) saved = JSON.parse(raw) as Saved;
    } catch {}
    if (saved?.modelo) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lê o navegador só depois de montar
      setModelo(saved.modelo);
      setFacade(saved.facade);
      setSeeds(saved.seeds ?? []);
    } else void detectar([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista.id]);

  const desenho = useMemo(() => (modelo ? desenhoDoModelo(modelo) : null), [modelo]);

  const ponto = (e: React.MouseEvent): [number, number] => {
    const svg = svgRef.current!;
    const r = svg.getBoundingClientRect();
    const scale = Math.max(view.w / r.width, view.h / r.height);
    const ox = (r.width * scale - view.w) / 2, oy = (r.height * scale - view.h) / 2;
    return [view.x + (e.clientX - r.left) * scale - ox, view.y + (e.clientY - r.top) * scale - oy];
  };

  const acharObjeto = (px: number, py: number): Sel => {
    if (!modelo) return null;
    const [x, y] = toM(px, py);
    for (const v of [...modelo.vaos].reverse()) {
      const d = medidas(modelo, v);
      const t = tipoDe(modelo, v);
      if (x >= d.x - t.moldura.lateral && x <= d.x + d.largura + t.moldura.lateral && y >= d.y - t.moldura.base && y <= d.y + d.altura + t.moldura.topo) return { kind: "vao", id: v.id };
    }
    const tol = 8 * k * (view.w / 1000);
    for (const f of modelo.faixas) if (Math.abs(y - f.y) < Math.max(0.08, tol)) return { kind: "faixa", id: f.id };
    for (const o of modelo.ornamentos)
      for (let i = 0; i < o.pontos.length - 1; i++) {
        const [a, b] = [o.pontos[i]!, o.pontos[i + 1]!];
        const t = Math.max(0, Math.min(1, ((x - a[0]) * (b[0] - a[0]) + (y - a[1]) * (b[1] - a[1])) / ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2 || 1)));
        if (Math.hypot(x - (a[0] + t * (b[0] - a[0])), y - (a[1] + t * (b[1] - a[1]))) < Math.max(0.08, tol)) return { kind: "ornamento", id: o.id };
      }
    return null;
  };

  const onDown = (e: React.MouseEvent) => {
    // botão da roda: sempre move o desenho (sem a rolagem automática do navegador)
    if (e.button === 1) {
      e.preventDefault();
      pan.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
      return;
    }
    if (e.button !== 0) return;
    const [px, py] = ponto(e);
    if (tool === "modelo") return setDrag({ x0: px, y0: py, x1: px, y1: py });
    if (tool === "selecionar") {
      const hit = acharObjeto(px, py);
      setSel(hit);
      if (!hit) pan.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
    }
  };
  const onMove = (e: React.MouseEvent) => {
    if (drag) {
      const [px, py] = ponto(e);
      setDrag({ ...drag, x1: px, y1: py });
    } else if (pan.current) {
      const svg = svgRef.current!;
      const r = svg.getBoundingClientRect();
      const scale = Math.max(view.w / r.width, view.h / r.height);
      // calcula já: se o botão for solto antes de o React aplicar, pan.current vira null
      const p0 = pan.current;
      const nx = p0.vx - (e.clientX - p0.x) * scale, ny = p0.vy - (e.clientY - p0.y) * scale;
      if (Number.isFinite(nx) && Number.isFinite(ny)) setView((v) => ({ ...v, x: nx, y: ny }));
    }
  };
  const onUp = (e: React.MouseEvent) => {
    pan.current = null;
    if (drag) {
      const b = { x0: Math.min(drag.x0, drag.x1), y0: Math.min(drag.y0, drag.y1), x1: Math.max(drag.x0, drag.x1), y1: Math.max(drag.y0, drag.y1) };
      setDrag(null);
      if (b.x1 - b.x0 > 10 && b.y1 - b.y0 > 10) setSeeds((s) => [...s, b]);
      return;
    }
    if (!modelo) return;
    const [px, py] = ponto(e);
    const [x, y] = toM(px, py);
    if (tool === "janela") {
      const t = modelo.tipos.find((tp) => tp.id === tipoNovo) ?? modelo.tipos[0];
      if (!t) return toast.error("Marque uma janela-modelo primeiro para criar um tipo.");
      const id = novoId();
      mudar({ ...modelo, vaos: [...modelo.vaos, { id, tipo: t.id, x: Math.round((x - t.largura / 2) * 1000) / 1000, y: Math.round((y - t.altura / 2) * 1000) / 1000 }] });
      setSel({ kind: "vao", id });
      setTool("selecionar");
    } else if (tool === "faixa") {
      const id = novoId();
      mudar({ ...modelo, faixas: [...modelo.faixas, { id, y: Math.round(y * 1000) / 1000, altura: 0 }] });
      setSel({ kind: "faixa", id });
      setTool("selecionar");
    } else if (tool === "ornamento") {
      setRascunho((r) => [...r, [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000]]);
    }
  };
  const fecharOrnamento = useCallback(
    (fechado: boolean) => {
      if (modelo && rascunho.length >= 2) {
        const id = novoId();
        mudar({ ...modelo, ornamentos: [...modelo.ornamentos, { id, pontos: rascunho, fechado }] });
        setSel({ kind: "ornamento", id });
      }
      setRascunho([]);
      setTool("selecionar");
    },
    [modelo, mudar, rascunho],
  );

  const onWheel = (e: React.WheelEvent) => {
    const [px, py] = ponto(e as unknown as React.MouseEvent);
    const f = e.deltaY > 0 ? 1.15 : 1 / 1.15;
    setView((v) => {
      const w = Math.min(vista.width * 3, Math.max(60, v.w * f)), h = (w * v.h) / v.w;
      return { x: px - ((px - v.x) * w) / v.w, y: py - ((py - v.y) * h) / v.h, w, h };
    });
  };

  const apagarSel = useCallback(() => {
    if (!modelo || !sel) return;
    if (sel.kind === "vao") mudar({ ...modelo, vaos: modelo.vaos.filter((v) => v.id !== sel.id) });
    if (sel.kind === "faixa") mudar({ ...modelo, faixas: modelo.faixas.filter((f) => f.id !== sel.id) });
    if (sel.kind === "ornamento") mudar({ ...modelo, ornamentos: modelo.ornamentos.filter((o) => o.id !== sel.id) });
    setSel(null);
  }, [modelo, mudar, sel]);

  const desfazer = useCallback(() => {
    setHistorico((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1]!;
      setModelo(prev);
      salvar(prev);
      return h.slice(0, -1);
    });
  }, [salvar]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "Escape") {
        setRascunho([]);
        setDrag(null);
        setTool("selecionar");
      }
      if (e.key === "Enter" && tool === "ornamento") fecharOrnamento(false);
      if ((e.key === "Delete" || e.key === "Backspace") && sel) apagarSel();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") desfazer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [apagarSel, desfazer, fecharOrnamento, sel, tool]);

  const exportar = () => {
    if (!desenho) return;
    const blob = new Blob([drawingDxf(desenho)], { type: "application/dxf" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `fachada-${vista.name.replace(/[^\w-]+/g, "-").toLowerCase()}.dxf`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const vaoSel = sel?.kind === "vao" ? modelo?.vaos.find((v) => v.id === sel.id) : undefined;
  const tipoSel = vaoSel && modelo ? tipoDe(modelo, vaoSel) : undefined;
  const faixaSel = sel?.kind === "faixa" ? modelo?.faixas.find((f) => f.id === sel.id) : undefined;
  const sw = view.w / 700; // espessura de traço proporcional ao zoom

  const camadas = cotas ? undefined : (["COTAS", "TEXTOS"] as Layer[]);
  const linhas = desenho?.segs.filter((s) => !camadas?.includes(s.layer)) ?? [];

  const tools: { id: Tool; label: string; icon: React.ElementType }[] = [
    { id: "selecionar", label: "Selecionar", icon: MousePointer2 },
    { id: "modelo", label: "Marcar janela-modelo", icon: ScanSearch },
    { id: "janela", label: "Adicionar janela", icon: Plus },
    { id: "faixa", label: "Adicionar faixa", icon: Rows3 },
    { id: "ornamento", label: "Ornamento (desenho livre)", icon: Spline },
  ];

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col">
      {/* barra superior */}
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/lab/cadastro">
            <ArrowLeft /> Vistas
          </Link>
        </Button>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[14px] font-medium">{vista.name}</p>
          <p className="truncate text-[12px] text-muted-foreground">{vista.site} · laboratório</p>
        </div>
        <div className="ml-2 flex flex-wrap gap-1">
          {tools.map((t) => (
            <Button key={t.id} variant={tool === t.id ? "default" : "outline"} size="sm" onClick={() => setTool(t.id)} title={t.label}>
              <t.icon /> <span className="hidden xl:inline">{t.label}</span>
            </Button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <label className="flex items-center gap-2 text-[13px]">
            <Switch checked={foto} onCheckedChange={setFoto} /> Foto
          </label>
          <label className="flex items-center gap-2 text-[13px]">
            <Switch checked={cotas} onCheckedChange={setCotas} /> Cotas
          </label>
          <Button variant="outline" size="sm" onClick={desfazer} disabled={!historico.length} title="Desfazer (Ctrl+Z)">
            <Undo2 />
          </Button>
          <Button size="sm" onClick={exportar} disabled={!desenho}>
            <Download /> DXF
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* tela */}
        <div className="relative min-w-0 flex-1 bg-neutral-900">
          <svg
            ref={svgRef}
            viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
            className={cn("size-full select-none", tool === "selecionar" ? "cursor-default" : "cursor-crosshair")}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={() => (pan.current = null)}
            onDoubleClick={() => tool === "ornamento" && fecharOrnamento(false)}
            onWheel={onWheel}
          >
            <image href={vista.url} x={0} y={0} width={vista.width} height={vista.height} opacity={foto ? 0.55 : 0} crossOrigin="anonymous" />
            {!foto && <rect x={0} y={0} width={vista.width} height={vista.height} fill="#111" />}
            {linhas.map((s, i) => {
              const [ax, ay] = toPx(s.a[0], s.a[1]), [bx, by] = toPx(s.b[0], s.b[1]);
              return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} stroke={COLOR[s.layer]} strokeWidth={s.layer === "ESQUADRIAS" ? sw * 0.7 : sw * 1.3} />;
            })}
            {desenho?.arcs.map((a, i) => {
              const [cx, cy] = toPx(a.c[0], a.c[1]);
              const r = a.r / k;
              return <path key={i} d={`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={COLOR[a.layer]} strokeWidth={sw * 1.3} />;
            })}
            {cotas &&
              desenho?.labels.map((l, i) => {
                const [x, y] = toPx(l.at[0], l.at[1]);
                return (
                  <text key={i} x={x} y={y} fontSize={l.size / k} fill={COLOR[l.layer]} textAnchor="middle" transform={l.rotate ? `rotate(${-l.rotate} ${x} ${y})` : undefined}>
                    {l.text}
                  </text>
                );
              })}
            {/* seleção */}
            {vaoSel && modelo && (() => {
              const d = medidas(modelo, vaoSel);
              const [x0, y1] = toPx(d.x, d.y), [x1, y0] = toPx(d.x + d.largura, d.y + d.altura);
              return <rect x={x0 - sw * 4} y={y0 - sw * 4} width={x1 - x0 + sw * 8} height={y1 - y0 + sw * 8} fill="rgb(255 255 255 / 0.08)" stroke="#fff" strokeWidth={sw * 2} strokeDasharray={`${sw * 6} ${sw * 4}`} />;
            })()}
            {faixaSel && (() => {
              const [x0, y] = toPx(0, faixaSel.y), [x1] = toPx(modelo!.largura, faixaSel.y);
              return <line x1={x0} x2={x1} y1={y} y2={y} stroke="#fff" strokeWidth={sw * 4} strokeDasharray={`${sw * 8} ${sw * 6}`} />;
            })()}
            {/* janelas-modelo marcadas */}
            {seeds.map((s, i) => (
              <g key={i}>
                <rect x={s.x0} y={s.y0} width={s.x1 - s.x0} height={s.y1 - s.y0} fill="none" stroke="#ff2d55" strokeWidth={sw * 2.5} />
                <text x={s.x0} y={s.y0 - sw * 5} fontSize={sw * 16} fill="#ff2d55">
                  {String.fromCharCode(65 + i)}
                </text>
              </g>
            ))}
            {drag && <rect x={Math.min(drag.x0, drag.x1)} y={Math.min(drag.y0, drag.y1)} width={Math.abs(drag.x1 - drag.x0)} height={Math.abs(drag.y1 - drag.y0)} fill="rgb(255 45 85 / 0.12)" stroke="#ff2d55" strokeWidth={sw * 2} />}
            {rascunho.length > 0 && <polyline points={rascunho.map((p) => toPx(p[0], p[1]).join(",")).join(" ")} fill="none" stroke="#4ade80" strokeWidth={sw * 2} strokeDasharray={`${sw * 5} ${sw * 3}`} />}
          </svg>
          {busy && (
            <div className="absolute inset-0 grid place-items-center bg-black/40">
              <p className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[14px] text-black">
                <Loader2 className="size-4 animate-spin" /> {busy}…
              </p>
            </div>
          )}
          <p className="pointer-events-none absolute bottom-2 left-3 text-[12px] text-white/70">
            {tool === "modelo" && "Arraste um retângulo sobre UMA janela de cada tipo. Depois, toque em Procurar janelas."}
            {tool === "janela" && "Clique onde fica o centro da nova janela."}
            {tool === "faixa" && "Clique na altura da faixa (cornija, friso, peitoril corrido)."}
            {tool === "ornamento" && "Clique para marcar os pontos. Duplo clique ou Enter termina; Esc cancela."}
            {tool === "selecionar" && "Clique num objeto para editar as medidas. Arraste o fundo para mover; roda do mouse para zoom."}
          </p>
        </div>

        {/* painel de medidas */}
        <aside className="w-[320px] shrink-0 overflow-y-auto border-l p-4 text-[14px]">
          {tool === "modelo" || (!modelo?.tipos.length && !sel) ? (
            <div className="grid gap-3">
              <p className="font-medium">Janelas-modelo</p>
              <p className="text-[13px] text-muted-foreground">Marque uma janela de cada tipo. O ArchRay procura as parecidas, alinha e detalha (caixilho, moldura e arco). Depois você ajusta cada medida.</p>
              {seeds.length === 0 && <p className="text-[13px]">Nenhuma marcada ainda.</p>}
              <ul className="grid gap-1">
                {seeds.map((s, i) => (
                  <li key={i} className="flex items-center justify-between rounded-md border px-2 py-1.5 text-[13px]">
                    Tipo {String.fromCharCode(65 + i)} · {fmt((s.x1 - s.x0) * k)} × {fmt((s.y1 - s.y0) * k)} m
                    <button className="text-muted-foreground hover:text-foreground" onClick={() => setSeeds((x) => x.filter((_, j) => j !== i))} aria-label="Remover">
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <Button onClick={() => void detectar(seeds)} disabled={!seeds.length || !!busy}>
                <ScanSearch /> Procurar janelas
              </Button>
              {modelo && modelo.vaos.length > 0 && <p className="text-[12px] text-muted-foreground">Procurar de novo substitui as janelas atuais (dá para desfazer).</p>}
            </div>
          ) : vaoSel && tipoSel && modelo ? (
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">Janela · {tipoSel.nome}</p>
                <Button variant="ghost" size="sm" onClick={apagarSel} title="Apagar janela">
                  <Trash2 />
                </Button>
              </div>
              <div className="grid gap-2 rounded-lg border p-3">
                <p className="text-[12px] font-medium">Só esta janela</p>
                <div className="grid grid-cols-2 gap-2">
                  <Num label="Largura (m)" value={medidas(modelo, vaoSel).largura} onCommit={(v) => mudar(alterarVao(modelo, vaoSel.id, { largura: v, medido: { largura: true } }))} />
                  <Num label="Altura (m)" value={medidas(modelo, vaoSel).altura} onCommit={(v) => mudar(alterarVao(modelo, vaoSel.id, { altura: v, medido: { altura: true } }))} />
                  <Num label="Do chão (m)" value={vaoSel.y} onCommit={(v) => mudar(alterarVao(modelo, vaoSel.id, { y: v, medido: { y: true } }))} />
                  <Num label="Da esquerda (m)" value={vaoSel.x} onCommit={(v) => mudar(alterarVao(modelo, vaoSel.id, { x: v, medido: { x: true } }))} />
                </div>
                {(vaoSel.largura !== undefined || vaoSel.altura !== undefined) && (
                  <Button variant="outline" size="sm" onClick={() => mudar(aplicarAoTipo(modelo, vaoSel.id))}>
                    Usar estas medidas em todas do {tipoSel.nome}
                  </Button>
                )}
                <label className="grid gap-1">
                  <span className="text-[12px] text-muted-foreground">Tipo</span>
                  <select className="h-8 rounded-md border bg-background px-2 text-[13px]" value={vaoSel.tipo} onChange={(e) => mudar(alterarVao(modelo, vaoSel.id, { tipo: e.target.value, largura: undefined, altura: undefined }))}>
                    {modelo.tipos.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <TipoPanel modelo={modelo} tipo={tipoSel} onChange={(patch) => mudar(alterarTipo(modelo, tipoSel.id, patch))} />
            </div>
          ) : faixaSel && modelo ? (
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">Faixa</p>
                <Button variant="ghost" size="sm" onClick={apagarSel}>
                  <Trash2 />
                </Button>
              </div>
              <Num label="Altura do chão (m)" value={faixaSel.y} onCommit={(v) => mudar({ ...modelo, faixas: modelo.faixas.map((f) => (f.id === faixaSel.id ? { ...f, y: v } : f)) })} />
              <Num label="Espessura (m)" hint="Cornija ou friso: a faixa ganha linha de cima." value={faixaSel.altura} onCommit={(v) => mudar({ ...modelo, faixas: modelo.faixas.map((f) => (f.id === faixaSel.id ? { ...f, altura: v } : f)) })} />
            </div>
          ) : sel?.kind === "ornamento" ? (
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">Ornamento</p>
                <Button variant="ghost" size="sm" onClick={apagarSel}>
                  <Trash2 />
                </Button>
              </div>
              <p className="text-[13px] text-muted-foreground">Desenho livre, na camada CAD-ORNAMENTOS do DXF.</p>
            </div>
          ) : modelo ? (
            <div className="grid gap-4">
              <p className="font-medium">Fachada</p>
              <div className="grid grid-cols-2 gap-2">
                <Num label="Largura (m)" value={modelo.largura} onCommit={(v) => mudar({ ...modelo, largura: v })} />
                <Num label="Altura (m)" value={modelo.altura} onCommit={(v) => mudar({ ...modelo, altura: v })} />
              </div>
              <div className="grid gap-1">
                <p className="text-[12px] font-medium">Tipos de janela</p>
                {modelo.tipos.length === 0 && <p className="text-[13px] text-muted-foreground">Use “Marcar janela-modelo” para começar.</p>}
                {modelo.tipos.map((t) => (
                  <p key={t.id} className="flex justify-between text-[13px]">
                    <span>{t.nome}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {modelo.vaos.filter((v) => v.tipo === t.id).length} · {fmt(t.largura)} × {fmt(t.altura)} m
                    </span>
                  </p>
                ))}
              </div>
              {modelo.tipos.length > 0 && (
                <label className="grid gap-1">
                  <span className="text-[12px] text-muted-foreground">Tipo para “Adicionar janela”</span>
                  <select className="h-8 rounded-md border bg-background px-2 text-[13px]" value={tipoNovo ?? modelo.tipos[0]!.id} onChange={(e) => setTipoNovo(e.target.value)}>
                    {modelo.tipos.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <p className="text-[12px] text-muted-foreground">
                Dica: a medida digitada sempre prevalece sobre a da imagem. Medidas que você muda numa janela ficam marcadas como medidas em campo.
              </p>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

/** Campos do tipo: valem para todas as janelas dele (como um bloco de CAD). */
function TipoPanel({ modelo, tipo, onChange }: { modelo: Modelo; tipo: Tipo; onChange: (p: Partial<Tipo>) => void }) {
  const n = modelo.vaos.filter((v) => v.tipo === tipo.id).length;
  return (
    <div className="grid gap-3 rounded-lg border p-3">
      <p className="text-[12px] font-medium">
        Todas do {tipo.nome} ({n} {n === 1 ? "janela" : "janelas"})
      </p>
      <label className="grid gap-1">
        <span className="text-[12px] text-muted-foreground">Nome</span>
        <Input className="h-8" defaultValue={tipo.nome} onBlur={(e) => e.target.value.trim() && e.target.value !== tipo.nome && onChange({ nome: e.target.value.trim() })} />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <Num label="Largura (m)" value={tipo.largura} onCommit={(v) => onChange({ largura: v })} />
        <Num label="Altura (m)" value={tipo.altura} onCommit={(v) => onChange({ altura: v })} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Int label="Folhas" value={tipo.folhas} onCommit={(v) => onChange({ folhas: Math.max(1, v) })} />
        <Int label="Montantes" value={tipo.montantes} onCommit={(v) => onChange({ montantes: v })} />
        <Int label="Travessas" value={tipo.travessas} onCommit={(v) => onChange({ travessas: v })} />
      </div>
      <p className="text-[12px] font-medium">Moldura</p>
      <div className="grid grid-cols-3 gap-2">
        <Num label="Laterais" value={tipo.moldura.lateral} onCommit={(v) => onChange({ moldura: { ...tipo.moldura, lateral: v } })} />
        <Num label="Topo" value={tipo.moldura.topo} onCommit={(v) => onChange({ moldura: { ...tipo.moldura, topo: v } })} />
        <Num label="Base" value={tipo.moldura.base} onCommit={(v) => onChange({ moldura: { ...tipo.moldura, base: v } })} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-[12px] font-medium">Arco / luneta</Label>
        <Switch checked={!!tipo.arco} onCheckedChange={(on) => onChange({ arco: on ? { base: 0.05, raio: Math.round((tipo.largura / 2 + tipo.moldura.lateral) * 1000) / 1000, anel: 0.1 } : null })} />
      </div>
      {tipo.arco && (
        <div className="grid grid-cols-3 gap-2">
          <Num label="Raio" value={tipo.arco.raio} onCommit={(v) => onChange({ arco: { ...tipo.arco!, raio: v } })} />
          <Num label="Anel" value={tipo.arco.anel} onCommit={(v) => onChange({ arco: { ...tipo.arco!, anel: v } })} />
          <Num label="Acima" hint="da moldura" value={tipo.arco.base} onCommit={(v) => onChange({ arco: { ...tipo.arco!, base: v } })} />
        </div>
      )}
    </div>
  );
}
