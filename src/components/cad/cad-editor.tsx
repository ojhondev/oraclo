"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Circle, Copy, DoorOpen, CopyPlus, LayoutTemplate, Download, FlipHorizontal2, Maximize, Minus, MousePointer2, Move, Redo2, Ruler, Spline, Square, Type, Undo2, CircleDashed,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand";
import type { Block, CadDoc, Entity, Layer, P } from "@/lib/cad/types";
import {
  addBlockType, makeBlock, removeBlockType, resetBlockToType, updateBlockOwn, updateBlockType,
  addEntities, addLayer, arrayEntities, copyEntities, editable, mirrorEntities, moveEntities, removeEntities, removeLayer, setEntitiesLayer, uid, updateEntity, updateLayer,
} from "@/lib/cad/doc";
import { distanceTo, extents, findSnap, offsetEntity, ortho, selectInBox, translate, type Snap, type SnapKind } from "@/lib/cad/geometry";
import { fitView, render, toScreen, toWorld, type View } from "@/lib/cad/render";
import { COMMANDS, click, finishPoly, preview, prompt, typedPoint, type DrawTool, type ToolId } from "@/lib/cad/tools";
import { cadToDxf } from "@/lib/cad/dxf";
import { renameDrawing, saveDrawing } from "@/app/(editor)/editor/actions";
import { LayersPanel, PropertiesPanel } from "./panels";
import { BlocksPanel } from "./block-panels";
import { SuggestPanel } from "./suggest-panel";
import { SheetsView } from "./sheets-view";
import { SUGGEST_LAYER, acceptSuggestions, backgroundImage, blockToImage, ensureSuggestLayer, suggestionIds, suggestionsFrom } from "@/lib/cad/suggest";
import { runSuggest } from "@/lib/cad/suggest-client";
import { expandBlock } from "@/lib/cad/blocks";
import { fmtM } from "./fields";

type Drawing = { id: string; name: string; doc: CadDoc; rev: number };
type Grip = { id: string; key: string; p: P };
type Drag =
  | { kind: "pan"; x: number; y: number; view: View }
  | { kind: "box"; a: P }
  | { kind: "move"; from: P; ids: Set<string>; moved: boolean; sx: number; sy: number }
  | { kind: "grip"; grip: Grip; moved: boolean };

const ALL_SNAPS: SnapKind[] = ["ponta", "meio", "centro", "quadrante", "interseção", "perpendicular"];
const DRAW_TOOLS: DrawTool[] = ["line", "poly", "rect", "circle", "arc", "text", "dim"];
const isDraw = (t: ToolId): t is DrawTool => (DRAW_TOOLS as string[]).includes(t);

/** Troca o valor de um ref (fora do render; o compilador do React não acompanha refs passados adiante). */
function setRef<T>(r: { current: T }, v: T) {
  r.current = v;
}

/** Alças de uma entidade (pontos que dá para arrastar). */
function gripsOf(e: Entity): Grip[] {
  switch (e.t) {
    case "line":
      return [{ id: e.id, key: "a", p: e.a }, { id: e.id, key: "b", p: e.b }];
    case "poly":
      return e.pts.map((p, i) => ({ id: e.id, key: `v${i}`, p }));
    case "circle":
      return [{ id: e.id, key: "c", p: e.c }, { id: e.id, key: "r", p: [e.c[0] + e.r, e.c[1]] }];
    case "arc":
      return [{ id: e.id, key: "c", p: e.c }];
    case "text":
    case "block":
      return [{ id: e.id, key: "p", p: e.p }];
    case "dim":
      return [{ id: e.id, key: "a", p: e.a }, { id: e.id, key: "b", p: e.b }];
    default:
      return [];
  }
}

/** Entidade com a alça levada até p. */
function applyGrip(e: Entity, key: string, p: P): Entity {
  switch (e.t) {
    case "line":
      return key === "a" ? { ...e, a: p } : { ...e, b: p };
    case "poly": {
      const i = Number(key.slice(1));
      return { ...e, pts: e.pts.map((q, j) => (j === i ? p : q)) };
    }
    case "circle":
      return key === "c" ? { ...e, c: p } : { ...e, r: Math.max(0.0001, Math.hypot(p[0] - e.c[0], p[1] - e.c[1])) };
    case "arc":
      return { ...e, c: p };
    case "text":
    case "block":
      return { ...e, p };
    case "dim":
      return key === "a" ? { ...e, a: p } : { ...e, b: p };
    default:
      return e;
  }
}

export function CadEditor({ drawing }: { drawing: Drawing }) {
  // ── documento e histórico ─────────────────────────────────────────────
  const [doc, setDoc] = useState<CadDoc>(drawing.doc);
  const docRef = useRef(doc); // sempre atualizado junto com setDoc
  const past = useRef<CadDoc[]>([]);
  const future = useRef<CadDoc[]>([]);
  const [hist, setHist] = useState({ u: 0, r: 0 });
  const syncHist = () => setHist({ u: past.current.length, r: future.current.length });
  const commit = useCallback((next: CadDoc) => {
    past.current.push(docRef.current);
    if (past.current.length > 150) past.current.shift();
    future.current = [];
    docRef.current = next;
    setDoc(next);
    syncHist();
  }, []);
  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(docRef.current);
    docRef.current = prev;
    setDoc(prev);
    syncHist();
  }, []);
  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(docRef.current);
    docRef.current = next;
    setDoc(next);
    syncHist();
  }, []);

  // ── estado da interação ───────────────────────────────────────────────
  const [tool, setToolState] = useState<ToolId>("select");
  const toolRef = useRef<ToolId>("select");
  const [pts, setPtsState] = useState<P[]>([]);
  const ptsRef = useRef<P[]>([]);
  const setPts = (p: P[]) => {
    ptsRef.current = p;
    setPtsState(p);
  };
  const [selected, setSelectedState] = useState<Set<string>>(new Set());
  const selRef = useRef<Set<string>>(new Set());
  const setSelected = (s: Set<string>) => {
    selRef.current = s;
    setSelectedState(s);
    setFocus(null); // o foco automático vale só para o duplo clique
  };
  const [typed, setTypedState] = useState("");
  const typedRef = useRef("");
  const setTyped = (s: string) => {
    typedRef.current = s;
    setTypedState(s);
  };
  const [snapOn, setSnapOn] = useState(true);
  const [orthoOn, setOrthoOn] = useState(false);
  const [gridOn, setGridOn] = useState(true);
  const [keepMirror, setKeepMirror] = useState(true);
  const [textH, setTextH] = useState(0.15);
  const [focus, setFocus] = useState<{ id: string; n: number } | null>(null);
  const [textAsk, setTextAskState] = useState<{ p: P; editId?: string; value: string; left: number; top: number } | null>(null);
  const [coords, setCoords] = useState<P>([0, 0]);
  const [name, setName] = useState(drawing.name);
  const [save, setSave] = useState<"salvo" | "pendente" | "salvando" | "conflito" | "erro">("salvo");

  const [activeType, setActiveTypeState] = useState<string | null>(null);
  const activeTypeRef = useRef<string | null>(null);
  const setActiveType = (id: string | null) => {
    activeTypeRef.current = id;
    setActiveTypeState(id);
  };
  // deslocamento: distância (fica para a próxima vez, como no AutoCAD) e objeto escolhido
  const [offD, setOffDState] = useState<number | null>(null);
  const offDRef = useRef<number | null>(null);
  const setOffD = (v: number | null) => {
    offDRef.current = v;
    setOffDState(v);
  };
  const [offSrc, setOffSrcState] = useState<string | null>(null);
  const offSrcRef = useRef<string | null>(null);
  const setOffSrc = (v: string | null) => {
    offSrcRef.current = v;
    setOffSrcState(v);
  };

  const setTool = useCallback((t: ToolId) => {
    toolRef.current = t;
    setToolState(t);
    setPts([]);
    setTyped("");
    offSrcRef.current = null;
    setOffSrcState(null);
  }, []);

  /** Foco ao montar (ref estável: não rouba o foco do campo de altura a cada render). */
  const focusOnMount = useCallback((el: HTMLInputElement | null) => {
    if (el) requestAnimationFrame(() => el.focus());
  }, []);
  /** Abre a caixa de texto no ponto (posição de tela calculada aqui, fora do render). */
  const askText = (p: P, editId?: string, value = "") => {
    const sc = toScreen(viewRef.current, size.current.w, size.current.h, p);
    setTextAskState({ p, editId, value, left: Math.max(8, Math.min(sc[0], size.current.w - 300)), top: Math.max(8, sc[1] - 48) });
  };

  // ── canvas, vista e desenho ───────────────────────────────────────────
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = useRef({ w: 800, h: 600 });
  const viewRef = useRef<View>({ cx: 0, cy: 0, s: 40 });
  const cursor = useRef<P>([0, 0]);
  const snapRef = useRef<Snap | null>(null);
  const hoverRef = useRef<string | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const boxRef = useRef<{ a: P; b: P } | null>(null);
  const dragPreview = useRef<Entity[]>([]);
  const spaceDown = useRef(false);
  const images = useRef(new Map<string, HTMLImageElement>());
  const frame = useRef(0);
  const fitted = useRef(false);

  const draw = useCallback(() => {
    frame.current = 0;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const { w, h } = size.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const t = toolRef.current;
    const layer = docRef.current.current;
    let prev: Entity[] = dragPreview.current;
    if (!dragRef.current && ptsRef.current.length) {
      prev = preview(t, ptsRef.current, cursor.current, layer);
      // mover/copiar/espelhar: mostra também o resultado
      const sel = docRef.current.entities.filter((e) => selRef.current.has(e.id));
      const base = ptsRef.current[0]!;
      if ((t === "move" || t === "copy") && sel.length) prev = [...prev, ...sel.map((e) => translate(e, cursor.current[0] - base[0], cursor.current[1] - base[1]))];
      if (t === "mirror" && sel.length) prev = [...prev, ...mirrorEntities({ ...docRef.current, entities: sel }, new Set(sel.map((e) => e.id)), base, cursor.current, false).doc.entities];
    }
    if (!dragRef.current && t === "block" && activeTypeRef.current) {
      const b = makeBlock(docRef.current, activeTypeRef.current, cursor.current, layer);
      if (b) prev = expandBlock(b);
    }
    if (!dragRef.current && t === "offset" && offSrcRef.current && offDRef.current) {
      const src = docRef.current.entities.find((e) => e.id === offSrcRef.current);
      const o = src && offsetEntity(src, offDRef.current, cursor.current);
      if (o) prev = [o];
    }
    render(ctx, {
      doc: docRef.current,
      view: viewRef.current,
      w,
      h,
      images: images.current,
      selected: selRef.current,
      hover: hoverRef.current,
      preview: prev,
      snap: snapRef.current,
      box: boxRef.current,
      grid: gridOn,
      dark: true,
    });
  }, [gridOn]);
  const requestDraw = useCallback(() => {
    if (!frame.current) frame.current = requestAnimationFrame(draw);
  }, [draw]);
  useEffect(() => requestDraw(), [doc, selected, pts, tool, gridOn, requestDraw]);

  // imagens de fundo
  useEffect(() => {
    for (const e of doc.entities) {
      if (e.t !== "image" || images.current.has(e.url)) continue;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => requestDraw();
      img.src = e.url;
      images.current.set(e.url, img);
    }
  }, [doc.entities, requestDraw]);

  const zoomExtents = useCallback(() => {
    const b = extents(docRef.current.entities.filter((e) => docRef.current.layers.find((l) => l.id === e.layer)?.visible));
    setRef(viewRef, b ? fitView(b, size.current.w, size.current.h) : { cx: 0, cy: 0, s: 40 });
    requestDraw();
  }, [requestDraw]);

  // tamanho do canvas acompanha a área (e nitidez em telas de alta densidade)
  useEffect(() => {
    const wrap = wrapRef.current, c = canvasRef.current;
    if (!wrap || !c) return;
    const ro = new ResizeObserver(() => {
      const r = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      size.current = { w: r.width, h: r.height };
      c.width = Math.round(r.width * dpr);
      c.height = Math.round(r.height * dpr);
      c.style.width = `${r.width}px`;
      c.style.height = `${r.height}px`;
      if (!fitted.current && r.width > 0) {
        fitted.current = true;
        zoomExtents();
      }
      requestDraw();
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [requestDraw, zoomExtents]);

  // ── salvamento automático ─────────────────────────────────────────────
  const revRef = useRef(drawing.rev);
  const firstDoc = useRef(true);
  useEffect(() => {
    if (firstDoc.current) {
      firstDoc.current = false;
      return;
    }
    if (save === "conflito") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- status do salvamento acompanha cada mudança do documento
    setSave("pendente");
    const t = setTimeout(async () => {
      setSave("salvando");
      try {
        const r = await saveDrawing(drawing.id, docRef.current, revRef.current);
        if ("rev" in r && !("conflict" in r)) {
          revRef.current = r.rev;
          setSave("salvo");
        } else if ("conflict" in r) {
          setSave("conflito");
          toast.error("Este desenho foi salvo em outra aba. Recarregue a página para não perder trabalho.");
        } else {
          setSave("erro");
          toast.error(r.error);
        }
      } catch {
        setSave("erro");
      }
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (save === "pendente" || save === "salvando") e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [save]);

  // ── conversões e encaixe ──────────────────────────────────────────────
  const worldOf = (ev: { clientX: number; clientY: number }): P => {
    const r = canvasRef.current!.getBoundingClientRect();
    return toWorld(viewRef.current, size.current.w, size.current.h, ev.clientX - r.left, ev.clientY - r.top);
  };
  const tol = () => 10 / viewRef.current.s;
  /** Ponto final: encaixe (se ligado) e ortogonal a partir do último ponto. */
  const resolvePoint = (raw: P, from?: P | null): P => {
    let p = raw;
    snapRef.current = null;
    if (snapOn) {
      const s = findSnap(editable(docRef.current).concat(docRef.current.entities.filter((e) => e.t === "image")), raw, {
        tol: tol(),
        kinds: new Set<SnapKind>(ALL_SNAPS),
        from: from ?? null,
      });
      if (s) {
        snapRef.current = s;
        p = s.p;
      }
    }
    if (orthoOn && from && !snapRef.current) p = ortho(from, p);
    return p;
  };
  const hitTest = (p: P): Entity | null => {
    let best: Entity | null = null, bd = tol() * 0.7;
    for (const e of editable(docRef.current)) {
      if (e.t === "image") continue;
      const d = distanceTo(e, p);
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    return best;
  };
  const gripAt = (p: P): Grip | null => {
    if (selRef.current.size !== 1) return null;
    const e = docRef.current.entities.find((x) => selRef.current.has(x.id));
    if (!e) return null;
    return gripsOf(e).find((g) => Math.hypot(g.p[0] - p[0], g.p[1] - p[1]) < tol() * 0.8) ?? null;
  };

  // ── ações ─────────────────────────────────────────────────────────────
  const eraseSelection = useCallback(() => {
    if (!selRef.current.size) return;
    commit(removeEntities(docRef.current, selRef.current));
    setSelected(new Set());
  }, [commit]);

  /** Cota vai para a camada "Cotas" e texto para "Textos" (se existirem e estiverem livres); o resto, para a atual. */
  const layerFor = (t: ToolId) => {
    const d = docRef.current;
    const want = t === "dim" ? "cotas" : t === "text" ? "textos" : t === "block" ? "esquadrias" : null;
    const l = want && d.layers.find((x) => x.name.toLowerCase() === want && !x.locked);
    return l ? l.id : d.current;
  };

  /** Aplica um ponto à ferramenta atual (clique ou medida digitada). */
  const applyPoint = (p: P) => {
    const t = toolRef.current;
    const layer = layerFor(t);
    if (isDraw(t)) {
      const r = click(t, ptsRef.current, p, layer);
      if (r.askText) askText(r.askText);
      if (r.add) commit(addEntities(docRef.current, r.add));
      setPts(r.pts);
      return;
    }
    if (t === "block") {
      const b = activeTypeRef.current && makeBlock(docRef.current, activeTypeRef.current, p, layer);
      if (b) commit(addEntities(docRef.current, [b]));
      else toast.info("Escolha um tipo no painel Blocos.");
      return;
    }
    if (t === "offset") {
      if (!offDRef.current) return void toast.info("Digite a distância (ex.: 0,15) e Enter.");
      if (!offSrcRef.current) {
        const hit = hitTest(p);
        if (hit && ["line", "poly", "circle", "arc"].includes(hit.t)) setOffSrc(hit.id);
        else toast.info("Clique numa linha, polilinha, círculo ou arco.");
        return;
      }
      const src = docRef.current.entities.find((e) => e.id === offSrcRef.current);
      const o = src && offsetEntity(src, offDRef.current, p);
      if (o) commit(addEntities(docRef.current, [{ ...o, id: uid() }]));
      else toast.error("Não dá para deslocar para esse lado com essa distância.");
      setOffSrc(null);
      return;
    }
    if (t === "move" || t === "copy" || t === "mirror") {
      if (!selRef.current.size) {
        toast.info("Selecione o que quer " + (t === "move" ? "mover" : t === "copy" ? "copiar" : "espelhar") + " e use a ferramenta de novo.");
        setTool("select");
        return;
      }
      if (!ptsRef.current.length) return setPts([p]);
      const base = ptsRef.current[0]!;
      if (t === "move") {
        commit(moveEntities(docRef.current, selRef.current, p[0] - base[0], p[1] - base[1]));
        setTool("select");
      } else if (t === "copy") {
        const r = copyEntities(docRef.current, selRef.current, p[0] - base[0], p[1] - base[1]);
        commit(r.doc);
        setPts([base]); // continua copiando a partir da mesma base
      } else {
        const r = mirrorEntities(docRef.current, selRef.current, base, p, keepMirror);
        commit(r.doc);
        setSelected(new Set(r.ids));
        setTool("select");
      }
    }
  };

  const endTool = () => {
    const t = toolRef.current;
    if (t === "poly") {
      const e = finishPoly(ptsRef.current, docRef.current.current, false);
      if (e) commit(addEntities(docRef.current, [e]));
    }
    setPts([]);
    setTyped("");
  };

  const lastCmd = useRef("");
  const runCommand = (raw: string) => {
    const c = COMMANDS[raw.trim().toUpperCase()];
    if (!c) return toast.error(`Comando desconhecido: ${raw}`);
    lastCmd.current = raw.trim().toUpperCase();
    if (c === "erase") return eraseSelection();
    if (c === "undo") return undo();
    if (c === "redo") return redo();
    if (c === "extents") return zoomExtents();
    if (c === "array") return toast.info("Selecione os objetos: a matriz fica no painel Propriedades.");
    if (c === "block") return startBlock(raw.trim().toUpperCase() === "PORTA" ? "porta" : raw.trim().toUpperCase() === "JANELA" ? "janela" : undefined);
    setTool(c);
  };

  /** Ferramenta Bloco: usa o tipo ativo; sem tipo, pega o primeiro (do tipo pedido) ou cria um. */
  const startBlock = (kind?: "janela" | "porta", typeId?: string) => {
    const types = docRef.current.blockTypes ?? [];
    let id = typeId ?? (kind ? types.find((t) => t.params.kind === kind)?.id : activeTypeRef.current ?? types[0]?.id) ?? null;
    if (!id || !types.some((t) => t.id === id)) {
      const r = addBlockType(docRef.current, kind ?? "janela");
      commit(r.doc);
      id = r.id;
    }
    setTool("block");
    setActiveType(id);
  };

  // ── mouse ─────────────────────────────────────────────────────────────
  const onPointerDown = (ev: React.PointerEvent) => {
    // evita que o clique no canvas tire o foco de campos que ele mesmo abre (caixa de texto)
    ev.preventDefault();
    (document.activeElement as HTMLElement | null)?.blur?.();
    canvasRef.current?.setPointerCapture(ev.pointerId);
    const raw = worldOf(ev);
    if (ev.button === 1 || (ev.button === 0 && spaceDown.current)) {
      ev.preventDefault();
      dragRef.current = { kind: "pan", x: ev.clientX, y: ev.clientY, view: { ...viewRef.current } };
      return;
    }
    if (ev.button === 2) {
      endTool();
      return;
    }
    if (ev.button !== 0) return;
    const t = toolRef.current;
    if (t !== "select") {
      applyPoint(resolvePoint(raw, ptsRef.current[ptsRef.current.length - 1]));
      return;
    }
    const grip = gripAt(raw);
    if (grip) {
      dragRef.current = { kind: "grip", grip, moved: false };
      return;
    }
    const hit = hitTest(raw);
    if (hit) {
      const s = new Set(selRef.current);
      if (ev.shiftKey) {
        if (s.has(hit.id)) s.delete(hit.id);
        else s.add(hit.id);
        setSelected(s);
        return;
      }
      if (!s.has(hit.id)) setSelected(new Set([hit.id]));
      dragRef.current = { kind: "move", from: resolvePoint(raw), ids: s.has(hit.id) ? s : new Set([hit.id]), moved: false, sx: ev.clientX, sy: ev.clientY };
      return;
    }
    dragRef.current = { kind: "box", a: raw };
    boxRef.current = { a: raw, b: raw };
  };

  const onPointerMove = (ev: React.PointerEvent) => {
    const raw = worldOf(ev);
    const d = dragRef.current;
    if (d?.kind === "pan") {
      const s = viewRef.current.s;
      setRef(viewRef, { ...d.view, cx: d.view.cx - (ev.clientX - d.x) / s, cy: d.view.cy + (ev.clientY - d.y) / s });
      requestDraw();
      return;
    }
    const t = toolRef.current;
    if (d?.kind === "box") {
      boxRef.current = { a: d.a, b: raw };
    } else if (d?.kind === "move") {
      if (!d.moved && Math.hypot(ev.clientX - d.sx, ev.clientY - d.sy) < 4) return;
      d.moved = true;
      const p = resolvePoint(raw, d.from);
      const dx = p[0] - d.from[0], dy = p[1] - d.from[1];
      dragPreview.current = docRef.current.entities.filter((e) => d.ids.has(e.id)).map((e) => translate(e, dx, dy));
    } else if (d?.kind === "grip") {
      d.moved = true;
      const p = resolvePoint(raw);
      const e = docRef.current.entities.find((x) => x.id === d.grip.id);
      dragPreview.current = e ? [applyGrip(e, d.grip.key, p)] : [];
    } else if (t === "select") {
      snapRef.current = null;
      const hit = hitTest(raw);
      hoverRef.current = hit?.id ?? null;
    } else {
      cursor.current = resolvePoint(raw, ptsRef.current[ptsRef.current.length - 1]);
    }
    if (t === "select" || d) cursor.current = raw;
    setCoords(cursor.current);
    requestDraw();
  };

  const onPointerUp = (ev: React.PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    const raw = worldOf(ev);
    if (d?.kind === "box") {
      boxRef.current = null;
      const small = Math.hypot(raw[0] - d.a[0], raw[1] - d.a[1]) * viewRef.current.s < 4;
      if (small) {
        if (!ev.shiftKey) setSelected(new Set());
      } else {
        const box = { x0: Math.min(d.a[0], raw[0]), y0: Math.min(d.a[1], raw[1]), x1: Math.max(d.a[0], raw[0]), y1: Math.max(d.a[1], raw[1]) };
        const found = selectInBox(editable(docRef.current).filter((e) => e.t !== "image"), box, raw[0] < d.a[0]);
        const s = ev.shiftKey ? new Set(selRef.current) : new Set<string>();
        for (const e of found) s.add(e.id);
        setSelected(s);
      }
    } else if (d?.kind === "move" && d.moved) {
      const p = resolvePoint(raw, d.from);
      commit(moveEntities(docRef.current, d.ids, p[0] - d.from[0], p[1] - d.from[1]));
    } else if (d?.kind === "grip" && d.moved) {
      const e = docRef.current.entities.find((x) => x.id === d.grip.id);
      if (e) commit({ ...docRef.current, entities: docRef.current.entities.map((x) => (x.id === e.id ? applyGrip(e, d.grip.key, resolvePoint(raw)) : x)) });
    }
    dragPreview.current = [];
    snapRef.current = null;
    requestDraw();
  };

  const onDoubleClick = (ev: React.MouseEvent) => {
    const t = toolRef.current;
    if (t === "poly") return endTool();
    if (t !== "select") return;
    const hit = hitTest(worldOf(ev));
    if (!hit) return;
    setSelected(new Set([hit.id]));
    if (hit.t === "text") askText(hit.p, hit.id, hit.s);
    else setFocus((f) => ({ id: hit.id, n: (f?.n ?? 0) + 1 }));
  };

  const onWheel = (ev: React.WheelEvent) => {
    const before = worldOf(ev);
    const f = ev.deltaY > 0 ? 1 / 1.18 : 1.18;
    const v = viewRef.current;
    const s = Math.max(0.5, Math.min(20000, v.s * f));
    const r = canvasRef.current!.getBoundingClientRect();
    const x = ev.clientX - r.left, y = ev.clientY - r.top;
    // mantém o ponto sob o cursor no lugar
    setRef(viewRef, { s, cx: before[0] - (x - size.current.w / 2) / s, cy: before[1] + (y - size.current.h / 2) / s });
    requestDraw();
  };

  // ── teclado ───────────────────────────────────────────────────────────
  const clipboard = useRef<Entity[]>([]);
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (sheetsOpenRef.current) return; // tela das pranchas aberta: atalhos do desenho desligados
      const el = ev.target as HTMLElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) return;
      const k = ev.key;
      const mod = ev.ctrlKey || ev.metaKey;
      if (mod && k.toLowerCase() === "z") return ev.preventDefault(), ev.shiftKey ? redo() : undo();
      if (mod && k.toLowerCase() === "y") return ev.preventDefault(), redo();
      if (mod && k.toLowerCase() === "a") return ev.preventDefault(), setSelected(new Set(editable(docRef.current).filter((e) => e.t !== "image").map((e) => e.id)));
      if (mod && k.toLowerCase() === "c") {
        clipboard.current = docRef.current.entities.filter((e) => selRef.current.has(e.id));
        if (clipboard.current.length) toast.success(`${clipboard.current.length} copiado(s). Ctrl+V cola onde está o cursor.`);
        return;
      }
      if (mod && k.toLowerCase() === "v") {
        const src = clipboard.current;
        const b = extents(src);
        if (!b) return;
        const dx = cursor.current[0] - b.x0, dy = cursor.current[1] - b.y0;
        const copies = src.map((e) => ({ ...translate(e, dx, dy), id: uid(), layer: docRef.current.layers.some((l) => l.id === e.layer) ? e.layer : docRef.current.current }));
        commit(addEntities(docRef.current, copies));
        setSelected(new Set(copies.map((c) => c.id)));
        return;
      }
      if (k === "F3") return ev.preventDefault(), setSnapOn((v) => !v);
      if (k === "F7") return ev.preventDefault(), setGridOn((v) => !v);
      if (k === "F8") return ev.preventDefault(), setOrthoOn((v) => !v);
      if (k === " " && !typedRef.current) {
        ev.preventDefault();
        spaceDown.current = true;
        return;
      }
      if (k === "Escape") {
        if (typedRef.current) return setTyped("");
        if (toolRef.current !== "select") {
          // como no AutoCAD: Esc encerra o comando (a polilinha em andamento é mantida)
          endTool();
          return setTool("select");
        }
        return setSelected(new Set());
      }
      if (k === "Delete") return eraseSelection();
      if (k === "Backspace") {
        if (typedRef.current) setTyped(typedRef.current.slice(0, -1));
        else if (selRef.current.size && toolRef.current === "select") eraseSelection();
        return;
      }
      if (k === "Enter") {
        ev.preventDefault();
        const txt = typedRef.current.trim();
        const t = toolRef.current;
        if (!txt) {
          // Enter vazio: termina a sequência; na seleção, repete o último comando
          if (t === "select" && lastCmd.current) return runCommand(lastCmd.current);
          return endTool();
        }
        setTyped("");
        if (/^[a-zA-ZçÇ]+$/.test(txt)) {
          endTool();
          return runCommand(txt);
        }
        if (t === "offset") {
          const d = Number(txt.replace(",", "."));
          if (d > 0) {
            setOffD(d);
            setOffSrc(null);
          } else toast.error("Distância inválida. Ex.: 0,15");
          return;
        }
        if (t === "circle" && ptsRef.current.length === 1) {
          const r = Number(txt.replace(",", "."));
          if (r > 0) applyPoint([ptsRef.current[0]![0] + r, ptsRef.current[0]![1]]);
          return;
        }
        const p = typedPoint(t, ptsRef.current, cursor.current, txt);
        if (!p) return toast.error("Não entendi a medida. Ex.: 1,20 · 1,2;0,8 · 1,2x0,8");
        if (t === "select") return toast.info("Escolha uma ferramenta antes de digitar uma medida.");
        applyPoint(p);
        return;
      }
      if ((k === "c" || k === "C") && toolRef.current === "poly" && ptsRef.current.length >= 3 && !typedRef.current) {
        const e = finishPoly(ptsRef.current, docRef.current.current, true);
        if (e) commit(addEntities(docRef.current, [e]));
        setPts([]);
        return;
      }
      if (!mod && k.length === 1 && /[\w,.;@×\-ç]/i.test(k)) {
        ev.preventDefault();
        setTyped(typedRef.current + k);
      }
    };
    const onUp = (ev: KeyboardEvent) => {
      if (ev.key === " ") spaceDown.current = false;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapOn, orthoOn, keepMirror, commit, undo, redo, eraseSelection, setTool, zoomExtents]);

  // ── texto ─────────────────────────────────────────────────────────────
  const confirmText = () => {
    if (!textAsk) return;
    const s = textAsk.value.trim();
    if (textAsk.editId) {
      if (s) commit(updateEntity(docRef.current, textAsk.editId, { s }));
    } else if (s) {
      commit(addEntities(docRef.current, [{ id: uid(), layer: layerFor("text"), t: "text", p: textAsk.p, h: textH, s }]));
    }
    setTextAskState(null);
  };

  const exportDxf = () => {
    const blob = new Blob([cadToDxf(docRef.current)], { type: "application/dxf" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w-]+/g, "-").toLowerCase() || "desenho"}.dxf`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── IA assistente ─────────────────────────────────────────────────────
  const [busy, setBusy] = useState<string | null>(null);
  const [sheetsOpen, setSheetsOpenState] = useState(false);
  const sheetsOpenRef = useRef(false);
  const setSheetsOpen = (v: boolean) => {
    setRef(sheetsOpenRef, v);
    setSheetsOpenState(v);
  };
  const searchSimilar = async () => {
    const d = docRef.current;
    const img = backgroundImage(d);
    if (!img) return void toast.error("Este desenho não tem foto de fundo.");
    const sugLayer = d.layers.find((l) => l.name === SUGGEST_LAYER)?.id;
    const blocks = d.entities.filter((e): e is Block => e.t === "block" && e.layer !== sugLayer);
    let seeds = blocks.filter((b) => selRef.current.has(b.id));
    if (!seeds.length) seeds = [...new Map(blocks.map((b) => [b.type, b])).values()].reverse();
    const inside = (n: ReturnType<typeof blockToImage>) => n.x0 >= -0.01 && n.y0 >= -0.01 && n.x1 <= 1.01 && n.y1 <= 1.01 && n.x1 > n.x0 && n.y1 > n.y0;
    seeds = seeds.filter((b) => inside(blockToImage(b, img)));
    if (!seeds.length) return void toast.info("Coloque primeiro um bloco (janela ou porta) em cima de uma janela da foto.");
    setBusy("Começando…");
    try {
      const r = await runSuggest({ url: img.url, seeds: seeds.map((b) => blockToImage(b, img)) }, setBusy);
      const L = ensureSuggestLayer(docRef.current, uid);
      const existing = L.doc.entities.filter((e): e is Block => e.t === "block");
      const sug = suggestionsFrom(r.found, seeds, img, existing, L.id, uid);
      if (!sug.length) toast.info("A IA não achou outras parecidas. Ajuste o bloco-modelo ao vão da foto e tente de novo.");
      else {
        commit(addEntities(L.doc, sug));
        toast.success(`${sug.length} ${sug.length === 1 ? "sugestão" : "sugestões"} em ${(r.ms / 1000).toFixed(1).replace(".", ",")} s. Revise antes de aceitar.`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao procurar parecidas.");
    } finally {
      setBusy(null);
    }
  };
  const sugIds = useMemo(() => new Set(suggestionIds(doc)), [doc]);
  const selSug = [...selected].filter((id) => sugIds.has(id));
  const reviewSuggestions = (accept: boolean, scope: "sel" | "todas") => {
    const ids = new Set(scope === "sel" ? selSug : sugIds);
    if (!ids.size) return;
    commit(accept ? acceptSuggestions(docRef.current, ids, layerFor("block")) : removeEntities(docRef.current, ids));
    setSelected(new Set([...selRef.current].filter((id) => !ids.has(id))));
  };

  const selectedEntities = useMemo(() => doc.entities.filter((e) => selected.has(e.id)), [doc.entities, selected]);
  const currentLayer = doc.layers.find((l) => l.id === doc.current);

  const tools: { id: ToolId; label: string; key: string; icon: React.ElementType }[] = [
    { id: "select", label: "Selecionar", key: "Esc", icon: MousePointer2 },
    { id: "line", label: "Linha", key: "L", icon: Minus },
    { id: "poly", label: "Polilinha", key: "PL", icon: Spline },
    { id: "rect", label: "Retângulo", key: "REC", icon: Square },
    { id: "circle", label: "Círculo", key: "C", icon: Circle },
    { id: "arc", label: "Arco (3 pontos)", key: "A", icon: CircleDashed },
    { id: "text", label: "Texto", key: "T", icon: Type },
    { id: "dim", label: "Cota", key: "DIM", icon: Ruler },
    { id: "move", label: "Mover", key: "M", icon: Move },
    { id: "copy", label: "Copiar", key: "CO", icon: Copy },
    { id: "mirror", label: "Espelhar", key: "MI", icon: FlipHorizontal2 },
    { id: "offset", label: "Deslocar (paralela)", key: "OF", icon: CopyPlus },
    { id: "block", label: "Janela / porta (bloco)", key: "B", icon: DoorOpen },
  ];

  return (
    <div className="flex h-full select-none">
      {/* ferramentas (substitui a barra da plataforma) */}
      <aside className="flex w-12 shrink-0 flex-col items-center gap-1 border-r bg-card py-2">
        <Link href="/lab/cadastro" title="Voltar ao laboratório" className="mb-1 grid size-9 place-items-center rounded-md hover:bg-muted">
          <BrandMark className="h-5" />
        </Link>
        {tools.map((t, i) => (
          <div key={t.id} className="contents">
            {(i === 1 || i === 8) && <div className="my-1 h-px w-7 bg-border" />}
            <button
              onClick={() => (t.id === "block" ? startBlock() : setTool(t.id))}
              title={`${t.label} (${t.key})`}
              className={cn("grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground", tool === t.id && "bg-foreground text-background hover:bg-foreground hover:text-background")}
            >
              <t.icon className="size-[18px]" />
            </button>
          </div>
        ))}
        <div className="mt-auto flex flex-col items-center gap-1">
          <button onClick={undo} disabled={!hist.u} title="Desfazer (Ctrl+Z)" className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30">
            <Undo2 className="size-[18px]" />
          </button>
          <button onClick={redo} disabled={!hist.r} title="Refazer (Ctrl+Y)" className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30">
            <Redo2 className="size-[18px]" />
          </button>
          <button onClick={zoomExtents} title="Mostrar tudo (Z + Enter)" className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted">
            <Maximize className="size-[18px]" />
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* topo */}
        <header className="flex h-11 shrink-0 items-center gap-3 border-b px-3">
          <Link href="/lab/cadastro" className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Laboratório
          </Link>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() && name !== drawing.name && void renameDrawing(drawing.id, name)}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            className="h-7 min-w-0 max-w-[360px] flex-1 rounded-md border border-transparent bg-transparent px-2 text-[14px] font-medium hover:border-border focus:border-border focus:outline-none"
          />
          <span className={cn("text-[12px]", save === "conflito" || save === "erro" ? "text-destructive" : "text-muted-foreground")}>
            {{ salvo: "Salvo", pendente: "Alterações não salvas…", salvando: "Salvando…", conflito: "Conflito: recarregue a página", erro: "Erro ao salvar" }[save]}
          </span>
          <span className="ml-auto flex items-center gap-2 text-[12px] text-muted-foreground">
            Camada atual:
            <span className="flex items-center gap-1.5 text-foreground">
              <span className="size-2.5 rounded-full" style={{ background: currentLayer?.color }} />
              {currentLayer?.name}
            </span>
          </span>
          <button onClick={() => setSheetsOpen(true)} className="flex h-8 items-center gap-1.5 rounded-md border px-3 text-[13px] hover:bg-muted">
            <LayoutTemplate className="size-4" /> Pranchas{doc.sheets?.length ? ` (${doc.sheets.length})` : ""}
          </button>
          <button onClick={exportDxf} className="flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-[13px] text-background hover:opacity-90">
            <Download className="size-4" /> DXF
          </button>
        </header>

        {/* área de desenho */}
        <div ref={wrapRef} className="relative min-h-0 flex-1 overflow-hidden">
          {sheetsOpen && <SheetsView doc={doc} name={name} newId={uid} onChange={(sheets) => commit({ ...docRef.current, sheets })} onClose={() => setSheetsOpen(false)} />}
          <canvas
            ref={canvasRef}
            className={cn("absolute inset-0 touch-none", tool === "select" ? "cursor-default" : "cursor-crosshair")}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={() => {
              snapRef.current = null;
              hoverRef.current = null;
              requestDraw();
            }}
            onDoubleClick={onDoubleClick}
            onWheel={onWheel}
            onContextMenu={(e) => e.preventDefault()}
            onAuxClick={(e) => e.preventDefault()}
          />
          {typed && tool !== "select" && (
            <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-md bg-black/80 px-3 py-1.5 font-mono text-[13px] text-white">
              {typed}
              <span className="animate-pulse">▏</span> <span className="text-white/60">Enter aplica</span>
            </div>
          )}
          {textAsk && (
            <div className="absolute z-10 flex items-center gap-2 rounded-md border bg-card p-1.5 shadow-lg" style={{ left: textAsk.left, top: textAsk.top }}>
              <input
                autoFocus
                ref={focusOnMount}
                value={textAsk.value}
                onChange={(e) => setTextAskState({ ...textAsk, value: e.target.value })}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") confirmText();
                  if (e.key === "Escape") setTextAskState(null);
                }}
                placeholder="Digite o texto e Enter"
                className="h-7 w-56 rounded border bg-background px-2 text-[13px]"
              />
              {!textAsk.editId && (
                <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  altura
                  <input
                    defaultValue={fmtM(textH)}
                    onKeyDown={(e) => e.stopPropagation()}
                    onBlur={(e) => {
                      const v = Number(e.target.value.replace(",", "."));
                      if (v > 0) setTextH(v);
                    }}
                    className="h-7 w-14 rounded border bg-background px-1 text-[12px]"
                  />
                  m
                </label>
              )}
            </div>
          )}
        </div>

        {/* rodapé: coordenadas, modos, instrução e linha de comando */}
        <footer className="flex h-8 shrink-0 items-center gap-3 border-t px-3 text-[12px]">
          <span className="w-44 font-mono tabular-nums text-muted-foreground">
            X {fmtM(coords[0], 3)} · Y {fmtM(coords[1], 3)}
          </span>
          {[
            { on: snapOn, set: setSnapOn, label: "Encaixe", key: "F3" },
            { on: orthoOn, set: setOrthoOn, label: "Orto", key: "F8" },
            { on: gridOn, set: setGridOn, label: "Grade", key: "F7" },
          ].map((m) => (
            <button key={m.label} onClick={() => m.set((v: boolean) => !v)} title={m.key} className={cn("rounded px-1.5 py-0.5", m.on ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}>
              {m.label}
            </button>
          ))}
          {tool === "mirror" && (
            <label className="flex items-center gap-1 text-muted-foreground">
              <input type="checkbox" checked={keepMirror} onChange={(e) => setKeepMirror(e.target.checked)} /> manter original
            </label>
          )}
          <span className="min-w-0 flex-1 truncate text-muted-foreground">{tool === "offset" ? `${offD ? `Distância ${fmtM(offD)} m (digite outra para trocar) · ` : ""}${prompt(tool, !offD ? 0 : offSrc ? 2 : 1)}` : prompt(tool, pts.length)}</span>
          <span className={cn("w-64 truncate whitespace-nowrap rounded border px-2 py-0.5 font-mono", tool === "select" && typed ? "border-foreground" : "text-muted-foreground")}>
            {tool === "select" ? (typed ? `Comando: ${typed}` : "Comando: L, PL, REC, C, T…") : `${typed || "—"}`}
          </span>
        </footer>
      </div>

      {/* camadas e propriedades */}
      <aside className="flex w-72 shrink-0 flex-col overflow-y-auto border-l bg-card">
        <LayersPanel
          doc={doc}
          onLayer={(id, patch: Partial<Layer>) => commit(updateLayer(docRef.current, id, patch))}
          onCurrent={(id) => commit({ ...docRef.current, current: id })}
          onAdd={() => commit(addLayer(docRef.current, `Camada ${docRef.current.layers.length + 1}`))}
          onRemove={(id) => {
            commit(removeLayer(docRef.current, id));
            setSelected(new Set());
          }}
        />
        <SuggestPanel
          hasImage={!!backgroundImage(doc)}
          busy={busy}
          total={sugIds.size}
          selected={selSug.length}
          onSearch={searchSimilar}
          onAccept={(scope) => reviewSuggestions(true, scope)}
          onReject={(scope) => reviewSuggestions(false, scope)}
        />
        <BlocksPanel
          doc={doc}
          active={tool === "block" ? activeType : null}
          onPick={(id) => startBlock(undefined, id)}
          onAdd={(key) => {
            const r = addBlockType(docRef.current, key);
            commit(r.doc);
            setTool("block");
            setActiveType(r.id);
          }}
          onRemove={(id) => {
            commit(removeBlockType(docRef.current, id));
            if (activeTypeRef.current === id) setActiveType(null);
            setSelected(new Set());
          }}
        />
        <PropertiesPanel
          doc={doc}
          selected={selectedEntities}
          focus={focus}
          onEntity={(id, patch) => commit(updateEntity(docRef.current, id, patch))}
          onLayerOf={(layer) => commit(setEntitiesLayer(docRef.current, selRef.current, layer))}
          onDelete={eraseSelection}
          onArray={(cols, rows, dx, dy) => commit(arrayEntities(docRef.current, selRef.current, cols, rows, dx, dy))}
          onEditText={(e) => askText(e.p, e.id, e.s)}
          onBlockParams={(b, patch, scope) => {
            // "todas do tipo" muda o tipo (e as cópias que o seguem); uma cópia com medida própria recebe a mudança também
            let d = scope === "tipo" ? updateBlockType(docRef.current, b.type, { params: patch }) : docRef.current;
            if (scope === "esta" || b.own) d = updateBlockOwn(d, b.id, patch);
            commit(d);
          }}
          onBlockTypeName={(typeId, name) => commit(updateBlockType(docRef.current, typeId, { name }))}
          onBlockReset={(id) => commit(resetBlockToType(docRef.current, id))}
          onSelectType={(typeId) => setSelected(new Set(editable(docRef.current).filter((e) => e.t === "block" && e.type === typeId).map((e) => e.id)))}
        />
      </aside>
    </div>
  );
}
