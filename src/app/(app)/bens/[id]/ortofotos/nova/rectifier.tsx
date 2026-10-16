"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { upload } from "@vercel/blob/client";
import { Camera, Check, Crosshair, Hand, Loader2, Plus, RotateCcw, Ruler, Spline, Target, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, SimpleSelect } from "@/components/form";
import { cn } from "@/lib/utils";
import {
  estimateLens,
  fmtPrecision,
  lensFor,
  outputSize,
  photoExtent,
  quality,
  solveRectification,
  type Extent,
  type Pt,
  type Solution,
} from "@/lib/rectify";
import { RectifyEngine } from "@/lib/rectify-client";
import { createOrthophoto } from "../actions";

type Opt = { id: string; name: string };
/** Modo demonstração (tour guiado): foto carregada sozinha e alvos nos cantos da fachada. */
export type RectifierDemo = { src: string; targets: Pt[]; name: string; widthM: number; heightM: number; credit: string };
type Props = { siteId: string; orgId: string; elements: Opt[]; campaigns: Opt[]; defaultCampaignId?: string | null; demo?: RectifierDemo };

type Tool = "ajustar" | "conferencia" | "controle" | "linha";
type Handle = { kind: "corner" | "ctrl" | "checkA" | "checkB" | "line"; i: number; j?: number };
type CtrlPt = { img: Pt; x: string; y: string };
type CheckLine = { a: Pt; b: Pt | null; m: string };

const LABELS = ["superior esquerdo", "superior direito", "inferior direito", "inferior esquerdo"];
const num = (v: string) => Number(String(v ?? "").replace(",", "."));
const br = (n: number, d = 2) => n.toFixed(d).replace(".", ",");

/** Ordena 4 pontos quaisquer em SE, SD, ID, IE (o usuário pode marcar em qualquer ordem). */
function order(pts: Pt[]): Pt[] {
  const cx = pts.reduce((s, p) => s + p[0], 0) / 4;
  const cy = pts.reduce((s, p) => s + p[1], 0) / 4;
  const sorted = [...pts].sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx));
  const start = sorted.reduce((best, p, i) => (p[0] + p[1] < sorted[best]![0] + sorted[best]![1] ? i : best), 0);
  return [0, 1, 2, 3].map((k) => sorted[(start + k) % 4]!);
}

const TOOLS: { id: Tool; label: string; icon: typeof Hand; hint: string }[] = [
  { id: "ajustar", label: "Ajustar pontos", icon: Hand, hint: "Arraste os pontos. Clique num ponto e use as setas do teclado para o ajuste fino (Shift = 10 px, Alt = ¼ px)." },
  { id: "conferencia", label: "Conferência", icon: Ruler, hint: "Clique nas duas pontas de uma medida conhecida (uma porta, um vão) e informe a medida de trena no painel ao lado." },
  { id: "controle", label: "Ponto de controle", icon: Crosshair, hint: "Clique num ponto da parede e informe a posição dele, em metros, a partir do canto superior esquerdo do retângulo." },
  { id: "linha", label: "Linha reta", icon: Spline, hint: "Clique 3 ou mais pontos ao longo de uma aresta reta (cornija, prumada, friso). Termine com Enter ou duplo clique." },
];

export function Rectifier({ siteId, orgId, elements, campaigns, defaultCampaignId, demo }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [corners, setCorners] = useState<Pt[]>([]);
  const [controls, setControls] = useState<CtrlPt[]>([]);
  const [checks, setChecks] = useState<CheckLine[]>([]);
  const [lines, setLines] = useState<Pt[][]>([]);
  const [lineDraft, setLineDraft] = useState<Pt[]>([]);
  const [lensOn, setLensOn] = useState(true);
  const [tool, setTool] = useState<Tool>("ajustar");
  const [drag, setDrag] = useState<Handle | null>(null);
  const [sel, setSel] = useState<Handle | null>(null);
  const [hover, setHover] = useState<{ p: Pt; left: boolean } | null>(null);
  const [dims, setDims] = useState({ w: "", h: "" });
  const [mode, setMode] = useState<"ref" | "parede">("ref");
  const [margins, setMargins] = useState({ l: "0", t: "0", r: "0", b: "0" });
  const [preview, setPreview] = useState<{ url: string; w: number; h: number } | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const boxRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const engine = useRef<RectifyEngine | null>(null);

  useEffect(() => () => {
    if (img) URL.revokeObjectURL(img.src);
  }, [img]);
  useEffect(() => () => engine.current?.dispose(), []);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview.url);
  }, [preview]);

  function pick(f: File | undefined) {
    setError(null);
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      return setError('Use uma foto JPG, PNG ou WebP. (No iPhone, em Ajustes › Câmera › Formatos, escolha "Mais compatível".)');
    }
    const im = new Image();
    im.onload = () => {
      setImg(im);
      setFile(f);
      setControls([]);
      setChecks([]);
      setLines([]);
      setLineDraft([]);
      setPreview(null);
      const { naturalWidth: W, naturalHeight: H } = im;
      // na demonstração os pontos começam longe dos alvos, para a pessoa arrastar cada um
      const m = demo ? 0.08 : 0.2;
      setCorners([
        [W * m, H * m],
        [W * (1 - m), H * m],
        [W * (1 - m), H * (1 - m)],
        [W * m, H * (1 - m)],
      ]);
      if (nameRef.current && !nameRef.current.value) nameRef.current.value = demo?.name ?? f.name.replace(/\.[^.]+$/, "");
    };
    im.onerror = () => setError("Não foi possível ler a foto.");
    im.src = URL.createObjectURL(f);
    setLoaded(false);
    engine.current?.dispose();
    const e = new RectifyEngine();
    engine.current = e;
    e.load(f)
      .then(() => engine.current === e && setLoaded(true))
      .catch((err) => setError((err as Error).message));
  }

  // demonstração: carrega a foto do caso sozinha
  useEffect(() => {
    if (!demo) return;
    let off = false;
    fetch(demo.src)
      .then((r) => r.blob())
      .then((b) => !off && pick(new File([b], demo.src.split("/").pop() || "fachada.jpg", { type: "image/jpeg" })))
      .catch(() => !off && setError("Não foi possível carregar a foto da demonstração."));
    return () => {
      off = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao abrir
  }, [demo?.src]);

  const W = img?.naturalWidth ?? 1;
  const H = img?.naturalHeight ?? 1;
  const w = num(dims.w);
  const h = num(dims.h);
  const ordered = useMemo(() => (corners.length === 4 ? order(corners) : corners), [corners]);

  /* ── solução ── */
  const lensEst = useMemo(() => {
    const valid = lines.filter((l) => l.length >= 3);
    if (!img || !lensOn || !valid.length) return null;
    const est = estimateLens(valid, W, H);
    // distorção desprezível: não corrige (e não anuncia "lente corrigida")
    return Math.abs(est.lens.k1) < 1e-3 ? { ...est, lens: { ...est.lens, k1: 0 } } : est;
  }, [lines, lensOn, img, W, H]);

  const solved = useMemo((): { sol: Solution | null; err: string | null } => {
    if (!img || ordered.length !== 4 || !(w > 0) || !(h > 0)) return { sol: null, err: null };
    const ref = ordered.map((p, i) => ({ img: p, plane: ([[0, 0], [w, 0], [w, h], [0, h]] as Pt[])[i]! }));
    const extra = controls
      .filter((c) => c.x.trim() && c.y.trim() && Number.isFinite(num(c.x)) && Number.isFinite(num(c.y)))
      .map((c) => ({ img: c.img, plane: [num(c.x), num(c.y)] as Pt }));
    const ck = checks.filter((c) => c.b && num(c.m) > 0).map((c) => ({ a: c.a, b: c.b!, meters: num(c.m) }));
    try {
      return { sol: solveRectification({ controls: [...ref, ...extra], lens: lensEst?.lens ?? lensFor(W, H), checks: ck }), err: null };
    } catch (e) {
      return { sol: null, err: (e as Error).message };
    }
  }, [img, ordered, w, h, controls, checks, lensEst, W, H]);
  const sol = solved.sol;

  const maxExtent = useMemo<Extent | null>(() => (sol ? photoExtent(sol, W, H, [0, 0, w, h]) : null), [sol, W, H, w, h]);
  const extent = useMemo<Extent>(() => {
    if (mode === "ref") return [0, 0, w, h];
    const m = { l: Math.max(0, num(margins.l) || 0), t: Math.max(0, num(margins.t) || 0), r: Math.max(0, num(margins.r) || 0), b: Math.max(0, num(margins.b) || 0) };
    return [-m.l, -m.t, w + m.r, h + m.b];
  }, [mode, margins, w, h]);

  function useWholeWall() {
    setMode("parede");
    if (maxExtent) {
      const f = (v: number) => br(Math.max(0, v), 1);
      setMargins({ l: f(-maxExtent[0]), t: f(-maxExtent[1]), r: f(maxExtent[2] - w), b: f(maxExtent[3] - h) });
    }
  }

  const ready = !!(img && sol && loaded);
  const size = sol ? outputSize(sol, ordered, extent) : null;
  const q = sol ? quality(sol.precisionMm, Math.max(w, h)) : null;

  // prévia (baixa resolução), alguns instantes depois da última mudança
  useEffect(() => {
    if (!ready || !sol || drag) return;
    const t = setTimeout(async () => {
      const ps = outputSize(sol, ordered, extent, 900);
      setPreviewBusy(true);
      try {
        const blob = await engine.current!.render({ Hpi: sol.Hpi, lens: sol.lens, extent, mmPerPixel: ps.mmPerPixel, width: ps.width, height: ps.height }, { quality: 0.8 });
        setPreview({ url: URL.createObjectURL(blob), w: ps.width, h: ps.height });
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setPreviewBusy(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [ready, sol, extent, ordered, drag]);

  /* ── interação na foto ── */
  const toImage = useCallback(
    (e: { clientX: number; clientY: number }): Pt | null => {
      const box = boxRef.current;
      if (!box || !img) return null;
      const r = box.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * img.naturalWidth;
      const y = ((e.clientY - r.top) / r.height) * img.naturalHeight;
      return [Math.max(0, Math.min(img.naturalWidth, x)), Math.max(0, Math.min(img.naturalHeight, y))];
    },
    [img],
  );

  const getPt = (hd: Handle): Pt | null => {
    if (hd.kind === "corner") return corners[hd.i] ?? null;
    if (hd.kind === "ctrl") return controls[hd.i]?.img ?? null;
    if (hd.kind === "checkA") return checks[hd.i]?.a ?? null;
    if (hd.kind === "checkB") return checks[hd.i]?.b ?? null;
    return lines[hd.i]?.[hd.j ?? 0] ?? null;
  };
  const setPt = useCallback((hd: Handle, p: Pt) => {
    if (hd.kind === "corner") setCorners((c) => c.map((q, i) => (i === hd.i ? p : q)));
    else if (hd.kind === "ctrl") setControls((c) => c.map((q, i) => (i === hd.i ? { ...q, img: p } : q)));
    else if (hd.kind === "checkA") setChecks((c) => c.map((q, i) => (i === hd.i ? { ...q, a: p } : q)));
    else if (hd.kind === "checkB") setChecks((c) => c.map((q, i) => (i === hd.i ? { ...q, b: p } : q)));
    else setLines((l) => l.map((line, i) => (i === hd.i ? line.map((q, j) => (j === hd.j ? p : q)) : line)));
  }, []);

  // demonstração: alvos dos cantos
  const tol = Math.max(W, H) * 0.03;
  const near = (p: Pt, t: Pt) => Math.hypot(p[0] - t[0], p[1] - t[1]) <= tol;
  const hit = demo ? demo.targets.map((t) => corners.some((p) => near(p, t))) : [];
  const hits = hit.filter(Boolean).length;
  const dimsOk = demo ? Math.abs(w - demo.widthM) <= demo.widthM * 0.05 && Math.abs(h - demo.heightM) <= demo.heightM * 0.05 : true;

  function release() {
    if (demo && drag?.kind === "corner") {
      const p = corners[drag.i];
      const t = p && demo.targets.find((q) => near(p, q));
      if (t) setPt(drag, [t[0], t[1]]);
    }
    setDrag(null);
  }

  function clickPhoto(e: React.PointerEvent) {
    const p = toImage(e);
    if (!p) return;
    if (tool === "conferencia") {
      const open = checks.findIndex((c) => !c.b);
      if (open >= 0) setChecks((c) => c.map((q, i) => (i === open ? { ...q, b: p } : q)));
      else setChecks((c) => [...c, { a: p, b: null, m: "" }]);
    } else if (tool === "controle") {
      setControls((c) => [...c, { img: p, x: "", y: "" }]);
    } else if (tool === "linha") {
      setLineDraft((d) => [...d, p]);
    }
  }

  const finishLine = useCallback(() => {
    if (lineDraft.length >= 3) setLines((l) => [...l, lineDraft]);
    setLineDraft([]);
  }, [lineDraft]);

  // teclado: setas = ajuste fino do ponto selecionado; Enter/Esc na linha reta
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (tool === "linha" && e.key === "Enter") {
        e.preventDefault();
        return finishLine();
      }
      if (tool === "linha" && e.key === "Escape") return setLineDraft([]);
      if (!sel) return;
      const step = e.shiftKey ? 10 : e.altKey ? 0.25 : 1;
      const d: Record<string, Pt> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      const v = d[e.key];
      const p = getPt(sel);
      if (!v || !p) return;
      e.preventDefault();
      setPt(sel, [Math.max(0, Math.min(W, p[0] + v[0])), Math.max(0, Math.min(H, p[1] + v[1]))]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getPt lê o estado atual
  }, [sel, tool, W, H, corners, controls, checks, lines, finishLine, setPt]);

  /* ── salvar ── */
  function submit(form: FormData) {
    if (!file || !img || !sol || !ready || !size) return setError("Marque os 4 cantos e informe largura e altura reais.");
    const name = String(form.get("name") || "").trim();
    if (name.length < 2) return setError("Dê um nome à vista.");
    const elementId = String(form.get("elementId") || "");
    const campaignId = String(form.get("campaignId") || "");
    setError(null);
    start(async () => {
      try {
        setStage("Retificando… 0%");
        const blob = await engine.current!.render(
          { Hpi: sol.Hpi, lens: sol.lens, extent, mmPerPixel: size.mmPerPixel, width: size.width, height: size.height },
          { quality: 0.9, onProgress: (p) => setStage(`Retificando… ${Math.round(p * 100)}%`) },
        );
        const base = `orgs/${orgId}/sites/${siteId}/vistas/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "fachada"}`;
        const opts = { access: "public" as const, handleUploadUrl: "/api/upload", clientPayload: JSON.stringify({ siteId }) };
        let sourceUrl: string | null = null;
        if (file.type === "image/jpeg" || file.type === "image/png") {
          setStage("Enviando a foto original…");
          sourceUrl = (await upload(`${base}-original.${file.type === "image/png" ? "png" : "jpg"}`, file, { ...opts, multipart: file.size > 20 * 1024 * 1024 })).url;
        }
        setStage("Enviando a fachada retificada…");
        const res = await upload(`${base}-retificada.jpg`, blob, {
          ...opts,
          contentType: "image/jpeg",
          multipart: blob.size > 20 * 1024 * 1024,
          onUploadProgress: (p) => setStage(`Enviando a fachada retificada… ${Math.round(p.percentage)}%`),
        });
        setStage("Salvando…");
        const validCtrl = controls.filter((c) => c.x.trim() && c.y.trim());
        const validChecks = checks.filter((c) => c.b && num(c.m) > 0);
        await createOrthophoto(siteId, {
          name,
          kind: "fachada",
          elementId: elementId && elementId !== "__none" ? elementId : null,
          campaignId: campaignId && campaignId !== "__none" ? campaignId : null,
          url: res.url,
          pathname: res.pathname,
          contentType: "image/jpeg",
          width: size.width,
          height: size.height,
          mmPerPixel: size.mmPerPixel,
          sourceUrl,
          rectification: {
            version: 2,
            corners: ordered,
            widthM: w,
            heightM: h,
            srcW: img.naturalWidth,
            srcH: img.naturalHeight,
            controls: validCtrl.map((c) => ({ img: c.img, plane: [num(c.x), num(c.y)] as Pt })),
            checks: validChecks.map((c, i) => ({ a: c.a, b: c.b!, meters: num(c.m), measured: sol.checks[i]?.measured ?? 0 })),
            lens: lensEst && sol.lens.k1 ? { ...sol.lens, lines: lines.length, rmsBefore: lensEst.rmsBefore, rmsAfter: lensEst.rmsAfter } : null,
            extent,
            residualRmsMm: sol.residualRmsMm,
            checkRmsMm: sol.checkRmsMm,
            precisionMm: sol.precisionMm,
          },
        });
      } catch (e) {
        if ((e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e;
        setError((e as Error).message || "Falha ao retificar.");
        setStage(null);
      }
    });
  }

  /* ── desenho ── */
  const handle = Math.max(W, H) / 70;
  const sw = handle / 5;
  const isSel = (hd: Handle) => !!sel && sel.kind === hd.kind && sel.i === hd.i && sel.j === hd.j;
  const grab = (hd: Handle) => (e: React.PointerEvent) => {
    if (tool !== "ajustar") return;
    e.stopPropagation();
    try {
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch {
      // sem captura o arraste continua funcionando dentro da imagem
    }
    setDrag(hd);
    setSel(hd);
  };
  const dot = (hd: Handle, p: Pt, fill: string, label?: string) => (
    <g key={`${hd.kind}${hd.i}-${hd.j ?? ""}`} style={{ cursor: tool === "ajustar" ? "grab" : undefined }} onPointerDown={grab(hd)}>
      <circle cx={p[0]} cy={p[1]} r={handle * 1.6} fill="transparent" />
      <circle cx={p[0]} cy={p[1]} r={handle * (isSel(hd) ? 0.7 : 0.5)} fill={fill} stroke="black" strokeWidth={sw} />
      {label && (
        <text x={p[0] + handle} y={p[1] - handle} fontSize={handle * 1.4} fill="white" stroke="black" strokeWidth={sw / 2} paintOrder="stroke" style={{ pointerEvents: "none" }}>
          {label}
        </text>
      )}
    </g>
  );
  const loupeAt = drag ? getPt(drag) : tool !== "ajustar" ? hover?.p ?? null : null;

  return (
    <form action={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="grid min-w-0 content-start gap-3">
        {!img ? (
          <label
            className="grid cursor-pointer place-items-center gap-2 rounded-xl border border-dashed bg-card px-6 py-16 text-center transition-colors hover:border-foreground/40"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              pick(e.dataTransfer.files[0]);
            }}
          >
            <span className="grid size-11 place-items-center rounded-full bg-muted">
              <Camera className="size-5" />
            </span>
            <span className="text-sm font-medium">Escolha ou tire a foto da fachada</span>
            <span className="max-w-md text-[12.5px] text-muted-foreground">
              Fotografe o mais de frente possível, com a parede inteira no quadro. Pode ser do celular — a perspectiva e a
              distorção da lente são corrigidas aqui.
            </span>
            <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
        ) : (
          <>
            {demo ? (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card px-3 py-2 text-[13px]">
                <Target className="size-4 shrink-0" />
                <span className="min-w-0 flex-1">
                  Arraste cada ponto branco até um <b className="font-medium">alvo tracejado</b> — os cantos da fachada da igreja. Ao chegar perto, ele encaixa.
                </span>
                <span className={hits === 4 ? "rounded-full bg-foreground px-2.5 py-0.5 text-[12px] font-medium text-background" : "rounded-full bg-muted px-2.5 py-0.5 text-[12px] tabular-nums"}>
                  {hits === 4 ? "4/4 cantos ✓" : `${hits}/4 cantos`}
                </span>
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                Arraste os 4 pontos brancos até os cantos de um retângulo real da parede (a fachada inteira, uma janela grande,
                um painel) e informe a largura e a altura reais dele. A lupa mostra os pixels de perto.
              </p>
            )}

            {/* ferramentas */}
            <div className="flex flex-wrap items-center gap-1 rounded-xl border bg-card p-1" role="radiogroup" aria-label="Ferramenta">
              {TOOLS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={tool === t.id}
                  onClick={() => {
                    setTool(t.id);
                    setLineDraft([]);
                  }}
                  className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px]", tool === t.id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
                >
                  <t.icon className="size-3.5" /> {t.label}
                </button>
              ))}
              {tool === "linha" && lineDraft.length > 0 && (
                <Button type="button" size="sm" variant="secondary" className="ml-auto h-7" onClick={finishLine} disabled={lineDraft.length < 3}>
                  Concluir linha ({lineDraft.length})
                </Button>
              )}
            </div>
            <p className="text-[12px] text-muted-foreground">{TOOLS.find((t) => t.id === tool)!.hint}</p>

            <div
              ref={boxRef}
              className={cn("relative w-full touch-none select-none overflow-hidden rounded-xl border bg-muted", tool !== "ajustar" && "cursor-crosshair")}
              style={{ aspectRatio: `${W} / ${H}` }}
              onPointerDown={(e) => tool !== "ajustar" && clickPhoto(e)}
              onPointerMove={(e) => {
                const p = toImage(e);
                if (!p) return;
                const r = e.currentTarget.getBoundingClientRect();
                setHover({ p, left: e.clientX < r.left + r.width / 2 });
                if (drag) setPt(drag, p);
              }}
              onPointerUp={release}
              onPointerLeave={() => {
                release();
                setHover(null);
              }}
              onDoubleClick={() => tool === "linha" && finishLine()}
              data-tour="retificar-foto"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt="" className="absolute inset-0 size-full" draggable={false} />
              <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" preserveAspectRatio="none">
                {ordered.length === 4 && (
                  <polygon points={ordered.map((p) => p.join(",")).join(" ")} fill="rgba(255,255,255,0.10)" stroke="white" strokeWidth={handle / 4} style={{ filter: "drop-shadow(0 0 2px black)" }} />
                )}
                {demo?.targets.map((t, i) => (
                  <g key={`t${i}`} className={hit[i] ? "" : "animate-pulse"} pointerEvents="none">
                    <circle cx={t[0]} cy={t[1]} r={tol} fill={hit[i] ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.12)"} stroke={hit[i] ? "#22c55e" : "white"} strokeWidth={sw} strokeDasharray={hit[i] ? undefined : `${handle / 1.5} ${handle / 2}`} style={{ filter: "drop-shadow(0 0 2px black)" }} />
                  </g>
                ))}
                {/* linhas retas (lente) */}
                {[...lines, ...(lineDraft.length ? [lineDraft] : [])].map((line, i) => (
                  <polyline key={`l${i}`} points={line.map((p) => p.join(",")).join(" ")} fill="none" stroke="#38bdf8" strokeWidth={sw * 1.2} strokeDasharray={i >= lines.length ? `${handle} ${handle / 2}` : undefined} style={{ pointerEvents: "none" }} />
                ))}
                {/* conferências */}
                {checks.map((c, i) => c.b && <line key={`c${i}`} x1={c.a[0]} y1={c.a[1]} x2={c.b[0]} y2={c.b[1]} stroke="#facc15" strokeWidth={sw * 1.4} style={{ pointerEvents: "none" }} />)}
                {lines.map((line, i) => line.map((p, j) => dot({ kind: "line", i, j }, p, "#38bdf8")))}
                {lineDraft.map((p, j) => (
                  <circle key={`ld${j}`} cx={p[0]} cy={p[1]} r={handle * 0.4} fill="#38bdf8" stroke="black" strokeWidth={sw} />
                ))}
                {checks.map((c, i) => [dot({ kind: "checkA", i }, c.a, "#facc15", `C${i + 1}`), c.b && dot({ kind: "checkB", i }, c.b, "#facc15")])}
                {controls.map((c, i) => dot({ kind: "ctrl", i }, c.img, "#f472b6", `P${i + 5}`))}
                {corners.map((p, i) => dot({ kind: "corner", i }, p, demo && demo.targets.some((t) => near(p, t)) ? "#22c55e" : "white"))}
              </svg>
              {loupeAt && hover && <Loupe img={img} p={loupeAt} right={hover.left} />}
            </div>
            {demo && <p className="text-[11.5px] text-muted-foreground">{demo.credit}</p>}
            <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
              <span>
                Foto {W} × {H} px · cantos: {ordered.map((_, i) => LABELS[i]).join(", ")}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setImg(null);
                  setFile(null);
                  setCorners([]);
                  setPreview(null);
                }}
              >
                <RotateCcw /> Trocar foto
              </Button>
            </div>

            {/* resultado */}
            {sol && (
              <section className="grid gap-3 rounded-xl border bg-card p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13px] font-medium">Resultado</p>
                  <div className="ml-auto flex rounded-lg bg-muted p-0.5 text-[12px]" role="radiogroup" aria-label="Recorte">
                    <button type="button" role="radio" aria-checked={mode === "ref"} onClick={() => setMode("ref")} className={cn("rounded-md px-2.5 py-1", mode === "ref" && "bg-background font-medium shadow-sm")}>
                      Só o retângulo
                    </button>
                    <button type="button" role="radio" aria-checked={mode === "parede"} onClick={useWholeWall} className={cn("rounded-md px-2.5 py-1", mode === "parede" && "bg-background font-medium shadow-sm")}>
                      Parede inteira
                    </button>
                  </div>
                </div>
                {mode === "parede" && (
                  <div className="grid grid-cols-4 gap-2">
                    {(
                      [
                        ["l", "Esquerda"],
                        ["t", "Acima"],
                        ["r", "Direita"],
                        ["b", "Abaixo"],
                      ] as const
                    ).map(([k, label]) => (
                      <label key={k} className="grid gap-1 text-[11.5px] text-muted-foreground">
                        {label} (m)
                        <Input inputMode="decimal" className="h-8 text-[13px]" value={margins[k]} onChange={(e) => setMargins((m) => ({ ...m, [k]: e.target.value }))} />
                      </label>
                    ))}
                    <p className="col-span-4 text-[11.5px] text-muted-foreground">
                      Quanto a vista se estende além do retângulo de referência (tracejado). Elementos fora do plano da parede
                      (outras fachadas, telhados, céu) saem deformados — reduza as margens para cortá-los.
                    </p>
                  </div>
                )}
                <div className="relative overflow-hidden rounded-lg border bg-muted" style={{ aspectRatio: preview ? `${preview.w} / ${preview.h}` : undefined, minHeight: preview ? undefined : 120 }}>
                  {preview && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview.url} alt="Prévia da vista retificada" className="block size-full" />
                      {mode === "parede" && (
                        <svg viewBox={`${extent[0]} ${extent[1]} ${extent[2] - extent[0]} ${extent[3] - extent[1]}`} className="pointer-events-none absolute inset-0 size-full" preserveAspectRatio="none">
                          <rect x={0} y={0} width={w} height={h} fill="none" stroke="white" strokeWidth={(extent[2] - extent[0]) / 300} strokeDasharray={`${(extent[2] - extent[0]) / 80} ${(extent[2] - extent[0]) / 120}`} style={{ filter: "drop-shadow(0 0 1px black)" }} />
                        </svg>
                      )}
                    </>
                  )}
                  {(previewBusy || !preview) && (
                    <span className="absolute inset-0 grid place-items-center text-[12px] text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                    </span>
                  )}
                </div>
                {size && (
                  <p className="text-[12px] text-muted-foreground">
                    {size.width} × {size.height} px · {br(extent[2] - extent[0])} × {br(extent[3] - extent[1])} m · escala{" "}
                    <b className="font-medium text-foreground">{br(size.mmPerPixel)} mm/pixel</b>
                  </p>
                )}
              </section>
            )}
          </>
        )}
      </div>

      <div className="grid content-start gap-4">
        <Field label="Nome da vista" htmlFor="name">
          <Input ref={nameRef} id="name" name="name" required placeholder="Ex.: Fachada principal" />
        </Field>
        {demo && (
          <div className="rounded-xl border bg-card px-3 py-2.5 text-[12.5px]">
            <p className="font-medium">Medidas da fachada (trena)</p>
            <p className="text-muted-foreground">
              Largura <b className="font-medium text-foreground">{String(demo.widthM).replace(".", ",")} m</b> · altura{" "}
              <b className="font-medium text-foreground">{String(demo.heightM).replace(".", ",")} m</b> — digite abaixo.
            </p>
            {w > 0 && h > 0 && (
              <p className="mt-1 flex items-center gap-1">
                {dimsOk ? (
                  <>
                    <Check className="size-3.5" /> Medidas certas.
                  </>
                ) : (
                  "Confira: os valores não batem com a trena."
                )}
              </p>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3" data-tour="medidas">
          <Field label="Largura real (m)" htmlFor="w">
            <Input id="w" inputMode="decimal" placeholder="Ex.: 12,40" value={dims.w} onChange={(e) => setDims((d) => ({ ...d, w: e.target.value }))} />
          </Field>
          <Field label="Altura real (m)" htmlFor="h">
            <Input id="h" inputMode="decimal" placeholder="Ex.: 8,50" value={dims.h} onChange={(e) => setDims((d) => ({ ...d, h: e.target.value }))} />
          </Field>
        </div>
        <Field label="Área">
          <SimpleSelect name="elementId" options={elements.map((e) => ({ value: e.id, label: e.name }))} defaultValue={demo ? elements[0]?.id : undefined} allowNone noneLabel="Nenhuma" />
        </Field>
        <Field label="Vistoria">
          <SimpleSelect name="campaignId" options={campaigns.map((c) => ({ value: c.id, label: c.name }))} defaultValue={defaultCampaignId ?? undefined} allowNone noneLabel="Sem vistoria" />
        </Field>

        {img && (
          <section className="grid gap-3 rounded-xl border p-3">
            <div>
              <p className="text-[13px] font-medium">Precisão profissional</p>
              <p className="text-[11.5px] text-muted-foreground">Opcional, mas recomendado para laudos: confere a escala, ajusta por mínimos quadrados e corrige a lente.</p>
            </div>

            {/* conferências */}
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-medium">Medidas de conferência</span>
                <Button type="button" size="sm" variant="ghost" className="h-7 px-2" onClick={() => setTool("conferencia")}>
                  <Plus /> Adicionar
                </Button>
              </div>
              {checks.length === 0 && <p className="text-[11.5px] text-muted-foreground">Meça com trena algo que apareça na foto (uma porta) e marque as duas pontas: o erro real aparece aqui.</p>}
              {checks.map((c, i) => {
                const r = sol?.checks[checks.slice(0, i).filter((x) => x.b && num(x.m) > 0).length];
                const valid = !!c.b && num(c.m) > 0;
                return (
                  <div key={i} className="flex items-center gap-1.5 text-[12px]">
                    <span className="w-6 shrink-0 font-medium text-yellow-500">C{i + 1}</span>
                    {c.b ? (
                      <Input inputMode="decimal" placeholder="m" aria-label={`Medida de trena C${i + 1} (m)`} className="h-7 w-20 text-[12.5px]" value={c.m} onChange={(e) => setChecks((l) => l.map((q, k) => (k === i ? { ...q, m: e.target.value } : q)))} />
                    ) : (
                      <span className="text-muted-foreground">clique a 2ª ponta…</span>
                    )}
                    {valid && r && (
                      <span className="min-w-0 flex-1 truncate text-muted-foreground tabular-nums">
                        medido {br(r.measured)} m ·{" "}
                        <b className={cn("font-medium", Math.abs(r.errPct) <= 1 ? "text-foreground" : "text-yellow-500")}>
                          {r.errMm >= 0 ? "+" : ""}
                          {br(r.errMm / 10, 1)} cm ({br(r.errPct, 1)}%)
                        </b>
                      </span>
                    )}
                    <button type="button" aria-label="Remover conferência" onClick={() => setChecks((l) => l.filter((_, k) => k !== i))} className="ml-auto text-muted-foreground hover:text-foreground">
                      <X className="size-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* pontos de controle */}
            <div className="grid gap-1.5 border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-medium">Pontos de controle extras</span>
                <Button type="button" size="sm" variant="ghost" className="h-7 px-2" onClick={() => setTool("controle")}>
                  <Plus /> Adicionar
                </Button>
              </div>
              {controls.length === 0 && <p className="text-[11.5px] text-muted-foreground">Pontos com posição medida (x, y em metros, a partir do canto superior esquerdo). Com 5 ou mais pontos, o ajuste mostra o erro de cada um.</p>}
              {controls.map((c, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[12px]">
                  <span className="w-6 shrink-0 font-medium text-pink-400">P{i + 5}</span>
                  <Input inputMode="decimal" placeholder="x m" aria-label={`x do ponto P${i + 5} (m)`} className="h-7 w-16 text-[12.5px]" value={c.x} onChange={(e) => setControls((l) => l.map((q, k) => (k === i ? { ...q, x: e.target.value } : q)))} />
                  <Input inputMode="decimal" placeholder="y m" aria-label={`y do ponto P${i + 5} (m)`} className="h-7 w-16 text-[12.5px]" value={c.y} onChange={(e) => setControls((l) => l.map((q, k) => (k === i ? { ...q, y: e.target.value } : q)))} />
                  {sol && sol.residualRmsMm != null && c.x.trim() && c.y.trim() && (
                    <span className="truncate text-muted-foreground tabular-nums">resíduo {Math.round(sol.residualsMm[4 + controls.slice(0, i).filter((x) => x.x.trim() && x.y.trim()).length] ?? 0)} mm</span>
                  )}
                  <button type="button" aria-label="Remover ponto" onClick={() => setControls((l) => l.filter((_, k) => k !== i))} className="ml-auto text-muted-foreground hover:text-foreground">
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* lente */}
            <div className="grid gap-1.5 border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-medium">Distorção da lente</span>
                <Button type="button" size="sm" variant="ghost" className="h-7 px-2" onClick={() => setTool("linha")}>
                  <Plus /> Linha reta
                </Button>
              </div>
              {lines.length === 0 ? (
                <p className="text-[11.5px] text-muted-foreground">Marque 2 ou 3 arestas retas, de preferência perto das bordas da foto, para corrigir o encurvamento da lente.</p>
              ) : (
                <div className="flex flex-wrap items-center gap-2 text-[12px]">
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" checked={lensOn} onChange={(e) => setLensOn(e.target.checked)} /> Corrigir
                  </label>
                  {lensEst && (
                    <span className="text-muted-foreground tabular-nums">
                      retidão {br(lensEst.rmsBefore, 1)} → {br(lensEst.rmsAfter, 1)} px
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    {lines.length} {lines.length === 1 ? "linha" : "linhas"}
                  </span>
                  <button type="button" onClick={() => setLines([])} className="ml-auto inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                    <Trash2 className="size-3" /> Limpar
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* precisão */}
        {sol && q && (
          <div className="grid gap-1 rounded-xl border bg-card px-3 py-2.5 text-[12.5px]" data-tour="precisao">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium">Precisão estimada</span>
              <span className="text-[15px] font-medium tabular-nums">{fmtPrecision(sol.precisionMm)}</span>
            </div>
            <p className="flex items-center gap-1.5">
              <span className={cn("inline-block size-2 rounded-full", q.level === "excelente" ? "bg-green-500" : q.level === "boa" ? "bg-lime-400" : q.level === "regular" ? "bg-yellow-500" : "bg-red-500")} />
              {q.label}
              <span className="text-muted-foreground">· 95% de confiança</span>
            </p>
            <p className="text-[11.5px] text-muted-foreground">
              {sol.checkRmsMm != null
                ? `Medida em ${sol.checks.length} conferência(s): erro médio ${Math.round(sol.checkRmsMm)} mm.`
                : "Sem conferência: estimada só pela marcação dos pontos. Adicione uma medida de conferência para medir o erro real."}
              {sol.lens.k1 ? " Lente corrigida." : ""}
              {sol.residualRmsMm != null ? ` Ajuste com ${4 + controls.filter((c) => c.x.trim() && c.y.trim()).length} pontos (resíduo ${Math.round(sol.residualRmsMm)} mm).` : ""}
            </p>
          </div>
        )}
        {solved.err && <p className="text-sm text-destructive">{solved.err}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={pending || !ready} data-tour="retificar">
            {pending && <Loader2 className="animate-spin" />}
            {pending ? stage ?? "Processando…" : img && !loaded ? "Carregando a foto…" : "Retificar e abrir no editor"}
          </Button>
          <Button variant="ghost" asChild>
            <Link href={`/bens/${siteId}`}>Cancelar</Link>
          </Button>
        </div>
        <p className="text-[11.5px] text-muted-foreground">A correção vale para o plano da parede: elementos salientes (marquises, beirais) ficam levemente deslocados.</p>
      </div>
    </form>
  );
}

/** Lupa: os pixels da foto em volta do ponto, ampliados 5×, com mira no centro. */
function Loupe({ img, p, right }: { img: HTMLImageElement; p: Pt; right: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const SIZE = 150;
  const ZOOM = 5;
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const half = SIZE / ZOOM / 2;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.drawImage(img, p[0] - half, p[1] - half, half * 2, half * 2, 0, 0, SIZE, SIZE);
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(SIZE / 2, 0);
    ctx.lineTo(SIZE / 2, SIZE / 2 - 6);
    ctx.moveTo(SIZE / 2, SIZE / 2 + 6);
    ctx.lineTo(SIZE / 2, SIZE);
    ctx.moveTo(0, SIZE / 2);
    ctx.lineTo(SIZE / 2 - 6, SIZE / 2);
    ctx.moveTo(SIZE / 2 + 6, SIZE / 2);
    ctx.lineTo(SIZE, SIZE / 2);
    ctx.stroke();
  }, [img, p]);
  return (
    <div className={cn("pointer-events-none absolute top-2 overflow-hidden rounded-full border-2 border-white shadow-xl", right ? "right-2" : "left-2")}>
      <canvas ref={ref} width={SIZE} height={SIZE} className="block" />
      <span className="absolute inset-x-0 bottom-2 text-center text-[10px] text-white tabular-nums [text-shadow:0_0_3px_black]">
        {Math.round(p[0])}, {Math.round(p[1])}
      </span>
    </div>
  );
}
