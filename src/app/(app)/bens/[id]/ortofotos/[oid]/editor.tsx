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
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Trash2,
  Undo2,
  WandSparkles,
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
import { fmtArea, fmtLength, fmtMmPerPixel, measure, minPoints, polygonAreaPx, scaleFromCalibration, type Pt } from "@/lib/geometry";
import { geometryKinds, severities } from "@/lib/labels";
import { TREND_LABELS, URGENCY_LABELS, budget, damageCostCents, fmtBRL, gut, priority, unitLabels, type Price } from "@/lib/pricing";
import type { schema } from "@/lib/db";
import { calibrate, createDamage, deleteDamage, deleteOrthophoto, setScale, updateDamage } from "../actions";
import { DamagePattern, lineStyle } from "./patterns";
import { getSam, type SamProgress } from "@/lib/sam/client";
import type { SamMask, SamRegion } from "@/lib/sam/protocol";

type Orthophoto = typeof schema.orthophotos.$inferSelect;
type Damage = typeof schema.damages.$inferSelect;
type DamageType = typeof schema.damageTypes.$inferSelect;
type View = { x: number; y: number; w: number; h: number };
type Tool = "mover" | "desenhar" | "calibrar" | "contorno";
type AiPoint = { p: Pt; label: 0 | 1 };
type AiStatus = "idle" | "loading" | "encoding" | "decoding";
/** "mancha": varinha por cor (manchas, umidade, sujidade…); "elemento": SAM (bordas nítidas). */
type AiMode = "mancha" | "elemento";
// danos de borda nítida (lacunas, vidros, peças) vão para o SAM; manchas e películas, para a cor
const ELEMENT_CODES = new Set(["PRB", "LAC", "VID", "COR", "XIL", "APO", "DEF", "PIC", "INA"]);
const modeFor = (code?: string | null): AiMode => (code && ELEMENT_CODES.has(code) ? "elemento" : "mancha");

const PANELS_KEY = "archray:editor-paineis";

const pts = (d: Damage) => (d.geometry?.points ?? []) as Pt[];
const toPath = (p: Pt[]) => p.map(([x, y]) => `${x},${y}`).join(" ");

export function DamageMapEditor({
  siteId,
  siteName,
  ortho,
  types,
  initialDamages,
  canEdit,
  prices,
  initialSelected,
}: {
  siteId: string;
  siteName: string;
  ortho: Orthophoto;
  types: DamageType[];
  initialDamages: Damage[];
  canEdit: boolean;
  prices: Record<string, Price>;
  initialSelected?: string | null;
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
  const [selected, setSelected] = useState<string | null>(initialSelected ?? null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>({ x: 0, y: 0, w: W, h: H });
  const [box, setBox] = useState({ w: 1, h: 1 });
  const [calLine, setCalLine] = useState<[Pt, Pt] | null>(ortho.calibration ? [ortho.calibration.a, ortho.calibration.b] : null);
  const [calOpen, setCalOpen] = useState(false);
  // painéis recolhíveis (biblioteca à esquerda, orçamento à direita), lembrados neste aparelho
  const [panels, setPanels] = useState({ lib: true, side: true });
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PANELS_KEY) ?? "null");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lê o navegador só depois de montar
      if (saved) setPanels({ lib: saved.lib !== false, side: saved.side !== false });
      // sem preferência salva, em telas menores a biblioteca começa recolhida para a imagem ter espaço
      else if (window.innerWidth < 1200) setPanels({ lib: false, side: true });
    } catch {
      // sem armazenamento: painéis abertos
    }
  }, []);
  const togglePanel = (k: "lib" | "side") =>
    setPanels((p) => {
      const n = { ...p, [k]: !p[k] };
      try {
        localStorage.setItem(PANELS_KEY, JSON.stringify(n));
      } catch {
        // sem armazenamento: vale só nesta visita
      }
      return n;
    });
  const [busy, startBusy] = useTransition();
  const [drag, setDrag] = useState<{ index: number; points: Pt[] } | null>(null);
  // contorno IA (SlimSAM no navegador)
  const [aiPoints, setAiPoints] = useState<AiPoint[]>([]);
  const [aiMasks, setAiMasks] = useState<SamMask[]>([]);
  const [aiIndex, setAiIndex] = useState(0);
  const [aiStatus, setAiStatus] = useState<AiStatus>("idle");
  const [aiProgress, setAiProgress] = useState<SamProgress | null>(null);
  const [aiInfo, setAiInfo] = useState<string | null>(null);
  const encodedRef = useRef<{ region: SamRegion; job: Promise<void> } | null>(null);
  const [aiMode, setAiMode] = useState<AiMode>("mancha");
  const [tol, setTol] = useState(14);
  const [aiBox, setAiBox] = useState<SamRegion | null>(null);
  const [boxDrag, setBoxDrag] = useState<[Pt, Pt] | null>(null);
  const aiRegionRef = useRef<SamRegion | null>(null);
  const aiSeq = useRef(0);

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

  /* ── contorno IA ── */
  const clearAi = useCallback(() => {
    aiSeq.current++;
    setAiPoints([]);
    setAiMasks([]);
    setAiIndex(0);
    setAiBox(null);
    setBoxDrag(null);
    aiRegionRef.current = null;
  }, []);

  /** Região da imagem visível na tela (o que o usuário vê é o que a IA analisa), unida aos pontos. */
  const visibleRegion = useCallback(
    (extra: Pt[] = []): SamRegion => {
      const v = viewRef.current;
      const s = Math.min(box.w / v.w, box.h / v.h);
      const vw = box.w / s;
      const vh = box.h / s;
      const cx = v.x + v.w / 2;
      const cy = v.y + v.h / 2;
      let x0 = cx - vw / 2;
      let y0 = cy - vh / 2;
      let x1 = cx + vw / 2;
      let y1 = cy + vh / 2;
      for (const [x, y] of extra) {
        x0 = Math.min(x0, x - 8);
        y0 = Math.min(y0, y - 8);
        x1 = Math.max(x1, x + 8);
        y1 = Math.max(y1, y + 8);
      }
      x0 = Math.max(0, Math.floor(x0));
      y0 = Math.max(0, Math.floor(y0));
      x1 = Math.min(W, Math.ceil(x1));
      y1 = Math.min(H, Math.ceil(y1));
      return { x: x0, y: y0, w: Math.max(16, x1 - x0), h: Math.max(16, y1 - y0) };
    },
    [box, W, H],
  );

  const failAi = useCallback((e: unknown) => {
    console.error("[contorno IA]", e);
    setAiStatus("idle");
    setAiProgress(null);
    encodedRef.current = null;
    toast.error("Contorno IA indisponível neste navegador/computador. Use o desenho manual (clique ponto a ponto).", {
      description: (e as Error)?.message,
    });
    setTool("desenhar");
  }, []);

  /** Garante que a região visível (com os pontos) está codificada; reaproveita se ainda serve. */
  const ensureEncoded = useCallback(
    (points: Pt[], forced?: SamRegion) => {
      const want = forced ?? visibleRegion(points);
      const cur = encodedRef.current;
      const covers =
        cur &&
        points.every(([x, y]) => x >= cur.region.x && y >= cur.region.y && x <= cur.region.x + cur.region.w && y <= cur.region.y + cur.region.h);
      // reaproveita se cobre os pontos e não ficou muito mais grosseira que o zoom atual
      const same = forced && cur && cur.region.x === want.x && cur.region.y === want.y && cur.region.w === want.w && cur.region.h === want.h;
      if (same || (!forced && cur && covers && Math.max(cur.region.w, cur.region.h) <= Math.max(want.w, want.h) * 1.6)) return cur!.job;
      const sam = getSam();
      sam.onProgress = setAiProgress;
      const job = (async () => {
        setAiStatus("loading");
        await sam.load();
        setAiStatus("encoding");
        setAiProgress(null);
        const ms = await sam.encode(ortho.url, want);
        setAiInfo(`${sam.backend === "webgpu" ? "WebGPU" : `CPU · ${sam.threads} thread${sam.threads > 1 ? "s" : ""}`} · análise ${(ms / 1000).toFixed(1)} s`);
      })();
      encodedRef.current = { region: want, job };
      job.catch(() => {
        if (encodedRef.current?.job === job) encodedRef.current = null;
      });
      return job;
    },
    [ortho.url, visibleRegion],
  );

  /** Caixa desenhada + margem: a IA olha só para ela, então o dano ocupa o quadro todo. */
  const boxRegion = useCallback(
    (b: SamRegion): SamRegion => {
      const m = Math.max(b.w, b.h) * 0.15 + 8;
      const x = Math.max(0, Math.floor(b.x - m));
      const y = Math.max(0, Math.floor(b.y - m));
      return { x, y, w: Math.min(W, Math.ceil(b.x + b.w + m)) - x, h: Math.min(H, Math.ceil(b.y + b.h + m)) - y };
    },
    [W, H],
  );

  const runAi = useCallback(
    async (points: AiPoint[], opts: { box?: SamRegion | null; mode?: AiMode; tol?: number } = {}) => {
      const seq = ++aiSeq.current;
      const box = opts.box === undefined ? aiBox : opts.box;
      const mode = opts.mode ?? aiMode;
      if (!points.length) {
        setAiMasks([]);
        return;
      }
      const pts = points.map((a) => a.p);
      const labels = points.map((a) => a.label);
      try {
        let masks: SamMask[];
        let regionArea: number;
        if (mode === "mancha") {
          // região fixa durante o rascunho, para a tolerância mexer sempre na mesma imagem
          const region = (aiRegionRef.current ??= box ? boxRegion(box) : visibleRegion(pts));
          setAiStatus("decoding");
          masks = await getSam().wand(ortho.url, region, pts, labels, opts.tol ?? tol, box ?? undefined);
          regionArea = region.w * region.h;
        } else {
          const forced = box ? boxRegion(box) : undefined;
          await ensureEncoded(pts, forced);
          if (seq !== aiSeq.current) return;
          setAiStatus("decoding");
          masks = await getSam().decode(pts, labels, box ?? undefined);
          const r = encodedRef.current?.region ?? visibleRegion(pts);
          regionArea = r.w * r.h;
        }
        if (seq !== aiSeq.current) return;
        setAiStatus("idle");
        const valid = masks.filter((m) => m.points.length >= 3);
        // sem caixa: descarta o que pega quase tudo o que está na tela (a parede inteira não é um dano);
        // com caixa o recorte já limita, e o dano tende a preencher a caixa
        const local = box ? valid : valid.filter((m) => polygonAreaPx(m.points as Pt[]) <= regionArea * 0.4);
        const list = local.length ? local : valid.slice(0, 1);
        if (!list.length) {
          setAiMasks([]);
          toast.info(
            mode === "mancha"
              ? "Nada parecido com a cor clicada. Aumente a tolerância ou clique mais ao centro da mancha."
              : "A IA não encontrou um elemento aqui. Arraste uma caixa em volta do dano ou aproxime o zoom.",
          );
          return;
        }
        // opções vêm do contorno mais justo ao mais amplo; ao refinar, mantém o nível escolhido
        setAiMasks(list);
        // com caixa, começa pela opção de melhor nota que ocupa boa parte dela (sem ser a caixa toda)
        let first = 0;
        if (box && mode === "elemento") {
          const boxArea = box.w * box.h;
          let best = -1;
          list.forEach((m, i) => {
            const fill = polygonAreaPx(m.points as Pt[]) / boxArea;
            if (fill > 0.12 && fill < 0.92 && m.score > best) {
              best = m.score;
              first = i;
            }
          });
        }
        setAiIndex((cur) => (points.length > 1 && cur < list.length ? cur : first));
      } catch (e) {
        if (seq === aiSeq.current) failAi(e);
      }
    },
    [aiBox, aiMode, tol, boxRegion, ensureEncoded, failAi, ortho.url, visibleRegion],
  );

  const changeTol = (t: number) => {
    const next = Math.max(3, Math.min(45, Math.round(t)));
    setTol(next);
    if (aiMode === "mancha" && aiPoints.length) runAi(aiPoints, { tol: next });
  };

  const changeMode = (m: AiMode) => {
    clearAi();
    setAiMode(m);
    // o modelo só é baixado quando o modo Elemento é usado
    if (m === "elemento") ensureEncoded([]).then(() => setAiStatus((s) => (s === "encoding" ? "idle" : s))).catch(failAi);
  };

  const startAi = useCallback(() => {
    setTool("contorno");
    setDraft([]);
    setSelected(null);
    clearAi();
    let t = activeType;
    if (t?.geometry !== "area") {
      const first = types.find((x) => x.geometry === "area") ?? null;
      if (activeType && first) toast.info(`Contorno IA é para danos de área — usando "${first.name}".`);
      setTypeId(first?.id ?? null);
      t = first;
    }
    const m = modeFor(t?.code);
    setAiMode(m);
    // no modo Elemento já baixa o modelo e analisa a vista, para o primeiro clique ser rápido
    if (m === "elemento") ensureEncoded([]).then(() => setAiStatus((s) => (s === "encoding" ? "idle" : s))).catch(failAi);
  }, [activeType, types, clearAi, ensureEncoded, failAi]);

  /* ── desenho ── */
  const cancelDraft = useCallback(() => {
    setDraft([]);
    clearAi();
    if (tool === "calibrar") setTool("mover");
  }, [tool, clearAi]);

  const finishDraft = useCallback(
    (points: Pt[], exact = false) => {
      if (!activeType) return;
      // remove pontos repetidos (duplo clique): menos de 2 px de tela de distância
      const ctm = svgRef.current?.getScreenCTM();
      // (contorno da IA já vem limpo: só tira pontos repetidos de fato)
      const tol = exact ? 0.01 : 2 / (ctm?.a || scale);
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
        urgency: 3,
        trend: 3,
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

  const aiPolygon = aiMasks[aiIndex]?.points ?? null;
  const saveAi = useCallback(() => {
    if (!aiPolygon || aiStatus !== "idle") return;
    finishDraft(aiPolygon as Pt[], true);
    clearAi();
    // avisa a demonstração guiada de que um dano foi salvo pelo Contorno IA
    window.dispatchEvent(new Event("archray:contorno-ia"));
  }, [aiPolygon, aiStatus, finishDraft, clearAi]);
  const cycleAi = () => aiMasks.length > 1 && setAiIndex((i) => (i + 1) % aiMasks.length);
  const undoAi = () => {
    const next = aiPoints.slice(0, -1);
    setAiPoints(next);
    if (next.length) runAi(next);
    else clearAi();
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof Element && t.closest("input, textarea, [contenteditable], [role=combobox], [role=listbox]")) return;
      if (e.code === "Space") spaceRef.current = true;
      if (e.key === "Escape") {
        cancelDraft();
        setSelected(null);
      }
      if (tool === "contorno" && aiMode === "mancha" && (e.key === "-" || e.key === "=" || e.key === "+")) {
        changeTol(tol + (e.key === "-" ? -2 : 2));
        return;
      }
      if (tool === "contorno" && aiPoints.length) {
        if (e.key === "Enter") saveAi();
        if (e.key === "Backspace") undoAi();
        if (e.key === "Tab") {
          e.preventDefault();
          cycleAi();
        }
        return;
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
    try {
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch {
      // ponteiro sem captura (ex.: caneta que saiu da tela) — segue sem
    }
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
    // Contorno IA: arrastar desenha a caixa em volta do dano
    else if (pan.moved && tool === "contorno" && pan.button === 0 && canEdit) setBoxDrag([toImage(pan.sx, pan.sy), p]);
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
    if (tool === "contorno" && pan?.moved && pan.button === 0 && !spaceRef.current && canEdit) {
      // caixa = do ponto onde o arraste começou até onde soltou (não depende do estado do arraste)
      const [ax, ay] = toImage(pan.sx, pan.sy);
      const [bx, by] = toImage(e.clientX, e.clientY);
      setBoxDrag(null);
      const b = { x: Math.min(ax, bx), y: Math.min(ay, by), w: Math.abs(bx - ax), h: Math.abs(by - ay) };
      if (b.w * scale < 8 || b.h * scale < 8 || activeType?.geometry !== "area") return;
      // caixa nova = rascunho novo, começando pelo centro dela
      aiSeq.current++;
      aiRegionRef.current = null;
      setAiBox(b);
      const first: AiPoint[] = [{ p: [b.x + b.w / 2, b.y + b.h / 2], label: 1 }];
      setAiPoints(first);
      runAi(first, { box: b });
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
    if (tool === "contorno" && activeType?.geometry === "area" && canEdit) {
      // Shift ou Alt + clique = "não é isso" (ponto negativo)
      const next = [...aiPoints, { p, label: e.shiftKey || e.altKey ? 0 : 1 } as AiPoint];
      setAiPoints(next);
      runAi(next);
      return;
    }
    if ((e.target as Element).getAttribute("data-damage") === null) setSelected(null);
  }

  function onDoubleClick() {
    if (tool === "desenhar" && draft.length) finishDraft(draft);
  }

  function pickType(id: string) {
    setTypeId(id);
    // no Contorno IA, trocar para outro tipo de área mantém a ferramenta (e o rascunho)
    if (tool === "contorno" && typeById.get(id)?.geometry === "area") {
      // cada tipo abre no modo que funciona melhor para ele (mancha × elemento)
      const m = modeFor(typeById.get(id)?.code);
      if (m !== aiMode) changeMode(m);
      return;
    }
    clearAi();
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
  const orc = useMemo(() => budget(damages, prices), [damages, prices]);
  const costByType = new Map(orc.rows.map((r) => [r.typeId, r]));
  const stats = useMemo(() => {
    let area = 0;
    let length = 0;
    let urgent = 0;
    for (const d of damages) {
      const g = typeById.get(d.typeId)?.geometry;
      if (g === "area") area += d.areaM2 ?? 0;
      if (g === "linha") length += d.lengthM ?? 0;
      if (gut(d) >= 64) urgent++;
    }
    return { area, length, urgent };
  }, [damages, typeById]);

  const cursor = tool === "desenhar" || tool === "calibrar" || tool === "contorno" ? (aiStatus !== "idle" && tool === "contorno" ? "progress" : "crosshair") : panRef.current?.moved ? "grabbing" : "grab";

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
        <Button variant="ghost" size="icon-sm" asChild aria-label="Voltar ao projeto">
          <Link href={`/bens/${siteId}`}>
            <ArrowLeft />
          </Link>
        </Button>
        <Button variant="ghost" size="icon-sm" className="hidden md:inline-flex" onClick={() => togglePanel("lib")} aria-label={panels.lib ? "Recolher biblioteca de danos" : "Mostrar biblioteca de danos"} title={panels.lib ? "Recolher biblioteca de danos" : "Mostrar biblioteca de danos"}>
          {panels.lib ? <PanelLeftClose /> : <PanelLeftOpen />}
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
        <Button variant="ghost" size="icon-sm" className="hidden lg:inline-flex" onClick={() => togglePanel("side")} aria-label={panels.side ? "Recolher painel de orçamento" : "Mostrar painel de orçamento"} title={panels.side ? "Recolher painel de orçamento" : "Mostrar painel de orçamento"}>
          {panels.side ? <PanelRightClose /> : <PanelRightOpen />}
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* biblioteca */}
        {!panels.lib && (
          <button
            onClick={() => togglePanel("lib")}
            aria-label="Mostrar biblioteca de danos"
            className="hidden w-10 shrink-0 flex-col items-center gap-3 border-r bg-sidebar pt-3 text-muted-foreground hover:text-foreground md:flex"
          >
            <PanelLeftOpen className="size-4" />
            {typeId && typeById.get(typeId) && <Swatch type={typeById.get(typeId)!} />}
            <span className="text-[12px] [writing-mode:vertical-rl] rotate-180">Biblioteca de danos</span>
          </button>
        )}
        <aside data-tour="biblioteca-danos" className={cn("thin-scroll hidden w-56 shrink-0 overflow-y-auto border-r bg-sidebar 2xl:w-64", panels.lib && "md:block")}>
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
                      typeId === t.id && (tool === "desenhar" || tool === "contorno") && "bg-sidebar-accent font-medium ring-1 ring-brand/40",
                    )}
                  >
                    <Swatch type={t} />
                    <span className="line-clamp-2 min-w-0 flex-1 leading-tight break-words" title={t.name}>
                      {t.name}
                    </span>
                    <span className="shrink-0 text-[10.5px] text-muted-foreground">{t.code}</span>
                  </button>
                ))}
            </div>
          ))}
        </aside>

        {/* tela */}
        <div className="relative min-w-0 flex-1 bg-canvas">
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
                    stroke="#0a0a0a"
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
                  <line x1={calLine[0][0]} y1={calLine[0][1]} x2={calLine[1][0]} y2={calLine[1][1]} stroke="#000" strokeWidth={4} vectorEffect="non-scaling-stroke" />
                  <line x1={calLine[0][0]} y1={calLine[0][1]} x2={calLine[1][0]} y2={calLine[1][1]} stroke="#ffffff" strokeWidth={2} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
                  {calLine.map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r={4 * unit} fill="#ffffff" stroke="#000" strokeWidth={1.5 * unit} />
                  ))}
                </g>
              )}

              {/* rascunho */}
              {preview.length > 0 && (
                <g pointerEvents="none">
                  {tool === "calibrar" ? (
                    <polyline points={toPath(preview)} fill="none" stroke="#ffffff" strokeWidth={2} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
                  ) : draftType?.geometry === "area" ? (
                    <polygon points={toPath(preview)} fill={draftType.color} fillOpacity={0.25} stroke={draftType.color} strokeWidth={2} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
                  ) : (
                    <polyline points={toPath(preview)} fill="none" stroke={draftType?.color ?? "#fff"} strokeWidth={2} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
                  )}
                  {draft.map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r={3.5 * unit} fill="#fff" stroke={draftType?.color ?? "#ffffff"} strokeWidth={1.5 * unit} />
                  ))}
                </g>
              )}

              {/* caixa do contorno IA (sendo arrastada ou já usada) */}
              {tool === "contorno" && (boxDrag || aiBox) && (() => {
                const b = boxDrag
                  ? { x: Math.min(boxDrag[0][0], boxDrag[1][0]), y: Math.min(boxDrag[0][1], boxDrag[1][1]), w: Math.abs(boxDrag[1][0] - boxDrag[0][0]), h: Math.abs(boxDrag[1][1] - boxDrag[0][1]) }
                  : aiBox!;
                return (
                  <g pointerEvents="none">
                    <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="none" stroke="#000" strokeOpacity={0.6} strokeWidth={3} vectorEffect="non-scaling-stroke" />
                    <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="none" stroke="#fff" strokeWidth={1.5} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
                  </g>
                );
              })()}

              {/* rascunho do contorno IA */}
              {tool === "contorno" && (aiPolygon || aiPoints.length > 0) && (
                <g pointerEvents="none">
                  {aiPolygon && activeType && (
                    <>
                      <polygon points={toPath(aiPolygon as Pt[])} fill="none" stroke="#000" strokeOpacity={0.6} strokeWidth={4} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                      <polygon points={toPath(aiPolygon as Pt[])} fill={activeType.color} fillOpacity={0.3} stroke={activeType.color} strokeWidth={2} strokeDasharray="6 3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
                    </>
                  )}
                  {aiPoints.map(({ p: [x, y], label }, i) => (
                    <g key={i}>
                      <circle cx={x} cy={y} r={7 * unit} fill={label ? "#fff" : "#0a0a0a"} stroke={label ? "#0a0a0a" : "#fff"} strokeWidth={1.5 * unit} />
                      <path
                        d={label ? `M${x - 3.5 * unit},${y}H${x + 3.5 * unit}M${x},${y - 3.5 * unit}V${y + 3.5 * unit}` : `M${x - 3.5 * unit},${y}H${x + 3.5 * unit}`}
                        stroke={label ? "#0a0a0a" : "#fff"}
                        strokeWidth={1.8 * unit}
                      />
                    </g>
                  ))}
                </g>
              )}
            </svg>
          </div>

          {/* ferramentas flutuantes */}
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-lg border border-white/10 bg-black/60 p-1 text-white backdrop-blur">
            <ToolBtn active={tool === "mover"} onClick={() => { setTool("mover"); setDraft([]); clearAi(); }} label="Mover e selecionar (espaço + arrastar em qualquer modo)">
              <Hand className="size-4" />
            </ToolBtn>
            <ToolBtn onClick={() => zoomCenter(1 / 1.4)} label="Aproximar"><ZoomIn className="size-4" /></ToolBtn>
            <ToolBtn onClick={() => zoomCenter(1.4)} label="Afastar"><ZoomOut className="size-4" /></ToolBtn>
            <ToolBtn onClick={fit} label="Enquadrar"><Maximize className="size-4" /></ToolBtn>
            {canEdit && (
              <ToolBtn
                active={tool === "contorno"}
                onClick={() => (tool === "contorno" ? (clearAi(), setTool("mover")) : startAi())}
                label="Contorno IA: clique sobre a mancha e a IA contorna (roda no seu navegador)"
              >
                <WandSparkles className="size-4" />
              </ToolBtn>
            )}
            {draft.length > 0 && (
              <ToolBtn onClick={() => setDraft((d) => d.slice(0, -1))} label="Desfazer último ponto (Backspace)"><Undo2 className="size-4" /></ToolBtn>
            )}
            {busy && <Loader2 className="mx-1.5 size-4 animate-spin opacity-70" />}
          </div>

          {/* rodapé da tela: ações do contorno IA e dica de uso, empilhadas para nunca se sobreporem */}
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-col items-center gap-2">
          {tool === "contorno" && canEdit && (
            <div className="pointer-events-auto flex max-w-full justify-center">
              <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-3xl border border-white/10 bg-black/70 p-1 text-[12px] text-white backdrop-blur">
                <div className="flex rounded-full bg-white/10 p-0.5" role="radiogroup" aria-label="Modo do contorno">
                  {(
                    [
                      ["mancha", "Mancha", "Pela cor: manchas, umidade, sujidade, biodeterioração"],
                      ["elemento", "Elemento", "IA (SAM): danos com borda nítida — perda de reboco, lacuna, vidro"],
                    ] as const
                  ).map(([m, label, title]) => (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={aiMode === m}
                      title={title}
                      onClick={() => aiMode !== m && changeMode(m)}
                      className={cn("rounded-full px-2.5 py-1", aiMode === m ? "bg-white font-medium text-black" : "hover:bg-white/15")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {aiMode === "mancha" ? (
                  <label className="flex items-center gap-2 px-1.5" title="Tolerância de cor (teclas − e +)">
                    <span className="text-white/70">Tolerância</span>
                    <input
                      type="range"
                      min={3}
                      max={45}
                      step={1}
                      value={tol}
                      onChange={(e) => changeTol(Number(e.target.value))}
                      className="h-1 w-24 cursor-pointer accent-white"
                    />
                    <span className="w-5 text-right tabular-nums">{tol}</span>
                  </label>
                ) : (
                  <>
                    {aiStatus !== "idle" && <Loader2 className="size-3.5 animate-spin opacity-80" />}
                    <span className="px-1 text-white/70">{aiInfo ?? "IA no navegador"}</span>
                  </>
                )}
                {aiPoints.length > 0 && (
                  <>
                    {aiMasks.length > 1 && (
                      <button type="button" onClick={cycleAi} className="rounded-full px-2.5 py-1 hover:bg-white/15" title="Tab">
                        Contorno: {["justo", "médio", "amplo"][aiIndex] ?? aiIndex + 1}
                      </button>
                    )}
                    <button type="button" onClick={clearAi} className="rounded-full px-2.5 py-1 hover:bg-white/15" title="Esc">
                      Descartar
                    </button>
                    <button
                      type="button"
                      onClick={saveAi}
                      disabled={!aiPolygon || aiStatus !== "idle"}
                      className="rounded-full bg-white px-3 py-1 font-medium text-black hover:bg-white/90 disabled:opacity-40"
                      title="Enter"
                    >
                      Salvar dano
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

            {/* dica de uso */}
            <p className="max-w-full rounded-2xl bg-black/65 px-3 py-1.5 text-center text-[12px] text-balance text-white/90 backdrop-blur">
              {tool === "calibrar"
                ? draft.length
                  ? "Clique no segundo extremo da medida."
                  : "Clique no primeiro extremo de uma medida conhecida."
                : tool === "contorno"
                  ? aiStatus === "loading"
                    ? aiProgress?.total
                      ? `Baixando a IA (${aiProgress.label}) · ${(aiProgress.loaded / 1e6).toFixed(1)} de ${(aiProgress.total / 1e6).toFixed(1)} MB · só na primeira vez`
                      : "Carregando a IA no navegador…"
                    : aiStatus === "encoding"
                      ? "Analisando a área visível da imagem…"
                      : aiStatus === "decoding"
                        ? "Contornando…"
                        : !activeType || activeType.geometry !== "area"
                          ? "Contorno IA: escolha na biblioteca um dano de área (mancha, perda de reboco…)"
                          : aiPolygon
                            ? aiMode === "mancha"
                              ? `${activeType.name}: clique para incluir mais · Shift+clique exclui · − / + tolerância · Enter salva · Esc descarta`
                              : `${activeType.name}: clique para incluir mais · Shift+clique exclui · Enter salva · Tab outra opção · Esc descarta`
                            : aiMode === "mancha"
                              ? `${activeType.name}: clique sobre a mancha (cresce pela cor) · ou arraste uma caixa para limitar`
                              : `${activeType.name}: arraste uma caixa em volta do dano · ou clique sobre ele`
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
        {!panels.side && !selDamage && (
          <button
            onClick={() => togglePanel("side")}
            aria-label="Mostrar painel de orçamento"
            className="hidden w-10 shrink-0 flex-col items-center gap-3 border-l bg-background pt-3 text-muted-foreground hover:text-foreground lg:flex"
          >
            <PanelRightOpen className="size-4" />
            <span className="text-[12px] tabular-nums [writing-mode:vertical-rl] rotate-180">Orçamento · {fmtBRL(orc.totalCents)}</span>
          </button>
        )}
        {/* com um dano selecionado o painel abre mesmo recolhido, para editar; ao fechar o dano ele recolhe de novo */}
        <aside data-tour="painel-orcamento" className={cn("thin-scroll hidden w-72 shrink-0 overflow-y-auto border-l bg-background 2xl:w-80", (panels.side || selDamage) && "lg:block")}>
          {selDamage ? (
            <DamagePanel
              key={selDamage.id}
              damage={selDamage}
              types={types}
              price={prices[selDamage.typeId]}
              type={typeById.get(selDamage.typeId)!}
              canEdit={canEdit && !selDamage.id.startsWith("tmp-")}
              onClose={() => setSelected(null)}
              onPatch={(patch) => patchDamage(selDamage.id, patch)}
              onDelete={() => removeDamage(selDamage.id)}
            />
          ) : (
            <div className="flex min-w-0 flex-col gap-6 p-4 pb-20">
              {/* orçamento da vista */}
              <div className="rounded-xl border bg-card p-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="label">Orçamento estimado</p>
                  <span className="text-[11.5px] text-muted-foreground tabular-nums">
                    {damages.length} {damages.length === 1 ? "dano" : "danos"}
                  </span>
                </div>
                <p className="mt-1 text-[24px] leading-tight font-medium tracking-[-0.01em] tabular-nums">{fmtBRL(orc.totalCents)}</p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
                  {damages.length === 0
                    ? "Marque danos para orçar o tratamento."
                    : orc.missing > 0
                      ? `${orc.missing} dano(s) sem medida — defina a escala para orçar.`
                      : "Quantidade × preço da tabela do escritório."}
                </p>
                {damages.length > 0 && (
                  <dl className="mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-[11.5px]">
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">Área</dt>
                      <dd className="truncate text-[13px] font-medium tabular-nums">{mm ? fmtArea(stats.area) : "—"}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">Linhas</dt>
                      <dd className="truncate text-[13px] font-medium tabular-nums">{mm ? fmtLength(stats.length) : "—"}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">Imediatos</dt>
                      <dd className="truncate text-[13px] font-medium tabular-nums">{stats.urgent}</dd>
                    </div>
                  </dl>
                )}
              </div>

              {/* quantitativos por tipo */}
              <section className="min-w-0">
                <p className="label mb-1">Quantitativos</p>
                {summary.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground">Nenhum dano marcado ainda.</p>
                ) : (
                  <ul className="grid grid-cols-1 divide-y">
                    {summary.map((s) => {
                      const off = hidden.has(s.type.id);
                      const qty =
                        s.type.geometry === "area" ? fmtArea(mm ? s.area : null) : s.type.geometry === "linha" ? fmtLength(mm ? s.length : null) : `${s.count} un.`;
                      return (
                        <li key={s.type.id} className={cn("flex min-w-0 items-start gap-2.5 py-2", off && "opacity-45")}>
                          <span className="mt-[3px] flex shrink-0">
                            <Swatch type={s.type} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-[13px] leading-5 break-words" title={s.type.name}>
                              {s.type.name}
                            </p>
                            <p className="text-[11.5px] leading-4 text-muted-foreground tabular-nums">
                              {qty}
                              {s.type.geometry !== "ponto" && ` · ${s.count} ${s.count === 1 ? "dano" : "danos"}`}
                            </p>
                          </div>
                          <span className="shrink-0 text-[13px] leading-5 tabular-nums">{fmtBRL(costByType.get(s.type.id)?.cents ?? 0)}</span>
                          <button
                            aria-label={off ? `Mostrar ${s.type.name}` : `Ocultar ${s.type.name}`}
                            title={off ? "Mostrar na imagem" : "Ocultar na imagem"}
                            onClick={() =>
                              setHidden((h) => {
                                const n = new Set(h);
                                if (n.has(s.type.id)) n.delete(s.type.id);
                                else n.add(s.type.id);
                                return n;
                              })
                            }
                            className="-mr-1 grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            {off ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* lista de danos */}
              {damages.length > 0 && (
                <section className="min-w-0">
                  <p className="label mb-1">Danos ({damages.length})</p>
                  <ul className="-mx-1.5 grid grid-cols-1">
                    {damages.map((d, i) => {
                      const t = typeById.get(d.typeId);
                      if (!t) return null;
                      const cost = damageCostCents(d, prices);
                      const measureText = t.geometry === "area" ? fmtArea(d.areaM2) : t.geometry === "linha" ? fmtLength(d.lengthM) : "1 un.";
                      return (
                        <li key={d.id} className="min-w-0">
                          <button
                            onClick={() => {
                              setTool("mover");
                              setSelected(d.id);
                            }}
                            className="flex w-full min-w-0 items-start gap-2.5 rounded-md px-1.5 py-1.5 text-left hover:bg-muted"
                          >
                            <span className="w-4 shrink-0 text-right text-[11px] leading-5 text-muted-foreground tabular-nums">{i + 1}</span>
                            <span className="mt-[3px] flex shrink-0">
                              <Swatch type={t} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="line-clamp-2 text-[13px] leading-5 break-words" title={t.name}>
                                {t.name}
                              </span>
                              <span className="block truncate text-[11.5px] leading-4 text-muted-foreground tabular-nums">
                                {measureText} · P{priority(gut(d)).level}
                              </span>
                            </span>
                            <span className="shrink-0 text-[12px] leading-5 tabular-nums">{cost == null ? "—" : fmtBRL(cost)}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
              {usedTypes.length > 0 && (
                <p className="text-[11.5px] leading-snug text-muted-foreground">
                  P1 a P4 = prioridade GUT. A prancha PDF e o DXF usam esta legenda, com uma camada por tipo de dano.
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
  price,
  canEdit,
  onClose,
  onPatch,
  onDelete,
}: {
  damage: Damage;
  type: DamageType;
  types: DamageType[];
  price?: Price;
  canEdit: boolean;
  onClose: () => void;
  onPatch: (p: Parameters<typeof updateDamage>[3]) => void;
  onDelete: () => void;
}) {
  const sameGeometry = types.filter((t) => t.geometry === type.geometry);
  const score = gut(damage);
  const prio = priority(score);
  const cost = price ? damageCostCents(damage, { [damage.typeId]: price }) : null;
  const saveText = (field: "cause" | "recommendation" | "notes") => (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const v = e.target.value.trim();
    if (v !== (damage[field] ?? "")) onPatch({ [field]: v || null });
  };
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 p-4 pb-20">
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
      <div className="flex items-start gap-2">
        <span className="mt-[3px] flex shrink-0">
          <Swatch type={type} />
        </span>
        <span className="min-w-0 text-[16px] leading-tight font-medium break-words">{type.name}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{geometryKinds[type.geometry]}</Badge>
        {type.geometry === "area" && <Badge variant="secondary">{fmtArea(damage.areaM2)}</Badge>}
        {type.geometry !== "ponto" && <Badge variant="secondary">{type.geometry === "area" ? "perímetro " : ""}{fmtLength(damage.lengthM)}</Badge>}
      </div>

      <label className="grid min-w-0 grid-cols-1 gap-1.5 text-[12.5px] font-medium text-foreground/80">
        Tipo de dano
        <SimpleSelect
          options={sameGeometry.map((t) => ({ value: t.id, label: t.name }))}
          value={type.id}
          onValueChange={(v) => canEdit && onPatch({ typeId: v })}
        />
      </label>
      <label className="grid min-w-0 grid-cols-1 gap-1.5 text-[12.5px] font-medium text-foreground/80">
        Gravidade
        <SimpleSelect
          options={Object.entries(severities).map(([value, label]) => ({ value, label }))}
          value={damage.severity}
          onValueChange={(v) => canEdit && onPatch({ severity: v as Damage["severity"] })}
        />
      </label>
      <div className="grid grid-cols-2 gap-2" data-tour="gut">
        <label className="grid min-w-0 grid-cols-1 gap-1.5 text-[12.5px] font-medium text-foreground/80">
          Urgência
          <SimpleSelect
            options={Object.entries(URGENCY_LABELS).map(([value, label]) => ({ value, label: `${value} · ${label}` }))}
            value={String(damage.urgency)}
            onValueChange={(v) => canEdit && onPatch({ urgency: Number(v) })}
          />
        </label>
        <label className="grid min-w-0 grid-cols-1 gap-1.5 text-[12.5px] font-medium text-foreground/80">
          Tendência
          <SimpleSelect
            options={Object.entries(TREND_LABELS).map(([value, label]) => ({ value, label: `${value} · ${label}` }))}
            value={String(damage.trend)}
            onValueChange={(v) => canEdit && onPatch({ trend: Number(v) })}
          />
        </label>
      </div>
      <div className="grid gap-1 rounded-xl border bg-card p-3 text-[12.5px]">
        <div className="flex items-baseline justify-between">
          <span className="text-muted-foreground">GUT</span>
          <span className="font-medium tabular-nums">{score}</span>
        </div>
        <div className="text-[12px]">{prio.label}</div>
        <div className="mt-1 flex items-baseline justify-between border-t pt-1.5">
          <span className="text-muted-foreground">Custo do tratamento</span>
          <span className="font-medium tabular-nums">{cost == null ? "sem escala" : fmtBRL(cost)}</span>
        </div>
        {price && (
          <div className="text-[11.5px] text-muted-foreground">
            {price.treatment || "Tratamento"} · {fmtBRL(price.priceCents)}/{unitLabels[price.unit]}
            {price.suggested && " (valor sugerido)"}
          </div>
        )}
      </div>
      <label className="grid min-w-0 grid-cols-1 gap-1.5 text-[12.5px] font-medium text-foreground/80">
        Causa provável
        <Textarea defaultValue={damage.cause ?? ""} onBlur={saveText("cause")} readOnly={!canEdit} rows={2} />
      </label>
      <label className="grid min-w-0 grid-cols-1 gap-1.5 text-[12.5px] font-medium text-foreground/80">
        Recomendação
        <Textarea defaultValue={damage.recommendation ?? ""} onBlur={saveText("recommendation")} readOnly={!canEdit} rows={2} placeholder={price?.treatment || undefined} />
      </label>
      <label className="grid min-w-0 grid-cols-1 gap-1.5 text-[12.5px] font-medium text-foreground/80">
        Observações
        <Textarea defaultValue={damage.notes ?? ""} onBlur={saveText("notes")} readOnly={!canEdit} rows={3} />
      </label>
      {canEdit && type.geometry !== "ponto" && (
        <p className="text-[12px] text-muted-foreground">Arraste os vértices brancos na imagem para ajustar o desenho.</p>
      )}
    </div>
  );
}
