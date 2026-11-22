/**
 * Modelo paramétrico do levantamento cadastral: a fachada vista EXATAMENTE de frente, em metros
 * (origem no canto inferior esquerdo, y para cima). A detecção só preenche um rascunho; o que o
 * arquiteto digita prevalece. Tipos de janela funcionam como blocos de CAD: mudar o tipo muda todas
 * as janelas dele; uma janela pode ter medida própria ("só esta"). Puro, testado em
 * tests/cadastro-modelo.test.ts.
 */
import type { Band, Box } from "./analyze";
import type { WindowDetail } from "./detail";
import { addDimensions, fmt, type Arc, type BlockDef, type Drawing, type Insert, type Label, type Layer, type Seg } from "./drawing";

export type Tipo = {
  id: string;
  nome: string;
  largura: number;
  altura: number;
  /** Folhas (divisões principais) e, dentro de cada folha, montantes; travessas na altura toda. */
  folhas: number;
  montantes: number;
  travessas: number;
  /** Moldura: lateral (igual dos dois lados), topo e base, em metros. 0 = sem moldura. */
  moldura: { lateral: number; topo: number; base: number };
  /** Arco acima da moldura: `base` = altura do nascimento do arco acima do topo da moldura. */
  arco: { base: number; raio: number; anel: number } | null;
};
/** Campos que o arquiteto confirmou com medida de campo (trena). */
export type Medido = Partial<Record<"largura" | "altura" | "x" | "y", boolean>>;
export type Vao = { id: string; tipo: string; x: number; y: number; largura?: number; altura?: number; medido?: Medido };
export type Faixa = { id: string; y: number; altura: number };
export type Ornamento = { id: string; pontos: [number, number][]; fechado: boolean };
export type Modelo = { versao: 1; largura: number; altura: number; tipos: Tipo[]; vaos: Vao[]; faixas: Faixa[]; ornamentos: Ornamento[] };

export const novoId = () => Math.random().toString(36).slice(2, 10);
const r3 = (n: number) => Math.round(n * 1000) / 1000;

export const tipoDe = (m: Modelo, v: Vao) => m.tipos.find((t) => t.id === v.tipo)!;
/** Medidas efetivas de um vão: a própria (se houver) ou a do tipo. */
export function medidas(m: Modelo, v: Vao) {
  const t = tipoDe(m, v);
  return { x: v.x, y: v.y, largura: v.largura ?? t.largura, altura: v.altura ?? t.altura };
}

/**
 * "Só esta janela": muda posição ou medida própria do vão. Mudar a largura mantém o EIXO (centro)
 * no lugar; mudar a altura mantém o peitoril (base). Posição digitada junto vale como está.
 */
export function alterarVao(m: Modelo, id: string, patch: Partial<Omit<Vao, "id">>): Modelo {
  return {
    ...m,
    vaos: m.vaos.map((v) => {
      if (v.id !== id) return v;
      let x = v.x;
      if (patch.largura !== undefined && patch.x === undefined) x = r3(v.x - (patch.largura - medidas(m, v).largura) / 2);
      return { ...v, ...patch, x: patch.x ?? x, medido: { ...v.medido, ...patch.medido } };
    }),
  };
}

/**
 * "Todas deste tipo": muda o tipo (vale para todos os vãos dele). Vãos sem medida própria acompanham;
 * os que têm medida própria confirmada em campo continuam com a dela.
 */
export function alterarTipo(m: Modelo, id: string, patch: Partial<Omit<Tipo, "id">>): Modelo {
  const t = m.tipos.find((x) => x.id === id);
  // janelas que acompanham a largura do tipo mantêm o eixo no lugar
  const dw = t && patch.largura !== undefined ? patch.largura - t.largura : 0;
  return {
    ...m,
    tipos: m.tipos.map((x) => (x.id === id ? { ...x, ...patch, moldura: { ...x.moldura, ...patch.moldura }, arco: patch.arco === undefined ? x.arco : patch.arco } : x)),
    vaos: dw ? m.vaos.map((v) => (v.tipo === id && v.largura === undefined ? { ...v, x: r3(v.x - dw / 2) } : v)) : m.vaos,
  };
}

/** Joga a medida própria de um vão para o tipo inteiro e limpa as medidas próprias iguais. */
export function aplicarAoTipo(m: Modelo, vaoId: string): Modelo {
  const v = m.vaos.find((x) => x.id === vaoId);
  if (!v) return m;
  const { largura, altura } = medidas(m, v);
  const next = alterarTipo(m, v.tipo, { largura, altura });
  return { ...next, vaos: next.vaos.map((x) => (x.tipo === v.tipo && !x.medido?.largura && !x.medido?.altura ? { ...x, largura: undefined, altura: undefined } : x)) };
}

/** Geometria de um tipo para um vão de largura w e altura h (origem no canto inferior esquerdo). */
export function geometriaTipo(t: Tipo, w: number, h: number): { segs: (Seg & { layer: Layer })[]; arcs: Arc[] } {
  const segs: (Seg & { layer: Layer })[] = [];
  const arcs: Arc[] = [];
  const L = (a: [number, number], b: [number, number], layer: Layer) => segs.push({ a, b, layer });
  // folhas e montantes (distribuídos por igual)
  const folhas = Math.max(1, Math.round(t.folhas));
  const fw = w / folhas;
  for (let f = 1; f < folhas; f++) L([f * fw, 0], [f * fw, h], "ESQUADRIAS");
  for (let f = 0; f < folhas; f++) for (let i = 1; i <= t.montantes; i++) L([f * fw + (i * fw) / (t.montantes + 1), 0], [f * fw + (i * fw) / (t.montantes + 1), h], "ESQUADRIAS");
  for (let i = 1; i <= t.travessas; i++) L([0, (i * h) / (t.travessas + 1)], [w, (i * h) / (t.travessas + 1)], "ESQUADRIAS");
  const { lateral, topo, base } = t.moldura;
  if (lateral || topo || base) {
    const x0 = -lateral, x1 = w + lateral, y0 = -base, y1 = h + topo;
    L([x0, y0], [x1, y0], "MOLDURAS");
    L([x1, y0], [x1, y1], "MOLDURAS");
    L([x1, y1], [x0, y1], "MOLDURAS");
    L([x0, y1], [x0, y0], "MOLDURAS");
  }
  if (t.arco && t.arco.raio > 0) {
    const c: [number, number] = [w / 2, h + topo + t.arco.base];
    arcs.push({ c, r: t.arco.raio, a0: 0, a1: 180, layer: "ARCOS" });
    if (t.arco.anel > 0 && t.arco.anel < t.arco.raio) arcs.push({ c, r: t.arco.raio - t.arco.anel, a0: 0, a1: 180, layer: "ARCOS" });
    L([c[0] - t.arco.raio, c[1]], [c[0] + t.arco.raio, c[1]], "ARCOS");
  }
  return { segs, arcs };
}

/** Desenho técnico do modelo (DXF e prévia saem dele): blocos por tipo, cotas e níveis. */
export function desenhoDoModelo(m: Modelo): Drawing {
  const W = m.largura, H = m.altura;
  const segs: Drawing["segs"] = [];
  const arcs: Arc[] = [];
  const labels: Label[] = [];
  const L = (a: [number, number], b: [number, number], layer: Layer) => segs.push({ a, b, layer });
  const txt = Math.max(0.12, Math.min(0.3, W / 90));
  L([0, 0], [W, 0], "CONTORNO");
  L([W, 0], [W, H], "CONTORNO");
  L([W, H], [0, H], "CONTORNO");
  L([0, H], [0, 0], "CONTORNO");
  const bandYs: number[] = [];
  for (const f of [...m.faixas].sort((a, b) => a.y - b.y)) {
    L([0, f.y], [W, f.y], "FAIXAS");
    if (f.altura > 0) L([0, f.y + f.altura], [W, f.y + f.altura], "FAIXAS");
    bandYs.push(f.y);
  }
  const blocks: BlockDef[] = [];
  const inserts: Insert[] = [];
  m.tipos.forEach((t, i) => {
    const geo = geometriaTipo(t, t.largura, t.altura);
    blocks.push({ name: `JANELA-${String.fromCharCode(65 + (i % 26))}`, w: t.largura, h: t.altura, ...geo });
  });
  const boxes: Box[] = [];
  for (const v of m.vaos) {
    const t = tipoDe(m, v);
    const d = medidas(m, v);
    const box = { x0: d.x, y0: d.y, x1: d.x + d.largura, y1: d.y + d.altura };
    boxes.push(box);
    L([box.x0, box.y0], [box.x1, box.y0], "VAOS");
    L([box.x1, box.y0], [box.x1, box.y1], "VAOS");
    L([box.x1, box.y1], [box.x0, box.y1], "VAOS");
    L([box.x0, box.y1], [box.x0, box.y0], "VAOS");
    labels.push({ at: [(box.x0 + box.x1) / 2, box.y0 - txt * 1.6], text: `${fmt(d.largura)} × ${fmt(d.altura)}`, size: txt * 0.8, layer: "TEXTOS" });
    // detalhe: geometria do tipo na medida deste vão (moldura e arco não esticam; caixilho acompanha)
    const geo = geometriaTipo(t, d.largura, d.altura);
    const blk = blocks[m.tipos.indexOf(t)]!;
    inserts.push({ block: blk.name, at: [d.x, d.y], sx: d.largura / t.largura, sy: d.altura / t.altura });
    for (const g of geo.segs) segs.push({ a: [d.x + g.a[0], d.y + g.a[1]], b: [d.x + g.b[0], d.y + g.b[1]], layer: g.layer });
    for (const a of geo.arcs) arcs.push({ ...a, c: [d.x + a.c[0], d.y + a.c[1]] });
  }
  for (const o of m.ornamentos) {
    for (let i = 0; i < o.pontos.length - 1; i++) L(o.pontos[i]!, o.pontos[i + 1]!, "ORNAMENTOS");
    if (o.fechado && o.pontos.length > 2) L(o.pontos[o.pontos.length - 1]!, o.pontos[0]!, "ORNAMENTOS");
  }
  addDimensions(segs, labels, boxes, bandYs, W, H, txt);
  return { width: W, height: H, segs, arcs, labels, vaos: boxes, blocks, inserts };
}

/**
 * Rascunho a partir da detecção (pixels da imagem analisada). Moldura sai simétrica (média dos
 * lados), medidas em metros arredondadas ao milímetro; medida própria só quando difere do tipo.
 */
export function modeloDaDeteccao(input: {
  facade: Box;
  bands: Band[];
  /** Vãos já regularizados, com o tipo (família = índice do modelo). */
  vaos: (Box & { family?: number })[];
  /** Detalhe de cada tipo (pelo índice da família) e a caixa do vão-modelo usada para medi-lo. */
  detalhes: Record<number, { detalhe: WindowDetail; caixa: Box }>;
  mmPerPixel: number;
}): Modelo {
  const k = input.mmPerPixel / 1000;
  const f = input.facade;
  const X = (px: number) => (px - f.x0) * k;
  const Y = (py: number) => (f.y1 - py) * k;
  const familias = [...new Set(input.vaos.map((v) => v.family ?? 0))].sort((a, b) => a - b);
  const tipos: Tipo[] = familias.map((fam, i) => {
    const membros = input.vaos.filter((v) => (v.family ?? 0) === fam);
    const med = (a: number[]) => [...a].sort((p, q) => p - q)[a.length >> 1]!;
    const w = med(membros.map((v) => (v.x1 - v.x0) * k));
    const h = med(membros.map((v) => (v.y1 - v.y0) * k));
    const d = input.detalhes[fam];
    const det = d?.detalhe;
    const bwPx = d ? d.caixa.x1 - d.caixa.x0 : 1;
    const lateral = det ? ((det.frame.left + det.frame.right) / 2) * w : 0;
    const topo = det ? det.frame.top * h : 0;
    const base = det ? det.frame.bottom * h : 0;
    let arco: Tipo["arco"] = null;
    if (det?.arch && d) {
      const raio = det.arch.r * bwPx * k;
      const centroY = Y(d.caixa.y0 + det.arch.cy * bwPx);
      const topoVao = Y(d.caixa.y0);
      arco = { base: r3(Math.max(0, centroY - (topoVao + topo))), raio: r3(raio), anel: r3(det.arch.inner ? (det.arch.r - det.arch.inner) * bwPx * k : 0) };
    }
    return {
      id: novoId(),
      nome: `Tipo ${String.fromCharCode(65 + i)}`,
      largura: r3(w),
      altura: r3(h),
      folhas: 1,
      montantes: det?.mullionsX.length ?? 0,
      travessas: det?.mullionsY.length ?? 0,
      moldura: { lateral: r3(lateral), topo: r3(topo), base: r3(base) },
      arco,
    };
  });
  const tipoDaFam = new Map(familias.map((fam, i) => [fam, tipos[i]!]));
  const vaos: Vao[] = input.vaos.map((v) => {
    const t = tipoDaFam.get(v.family ?? 0)!;
    const w = r3((v.x1 - v.x0) * k), h = r3((v.y1 - v.y0) * k);
    return { id: novoId(), tipo: t.id, x: r3(X(v.x0)), y: r3(Y(v.y1)), largura: Math.abs(w - t.largura) > 0.03 ? w : undefined, altura: Math.abs(h - t.altura) > 0.03 ? h : undefined };
  });
  const ys = input.bands.map((b) => r3(Y(b.y))).sort((a, b) => a - b).filter((y, i, a) => i === 0 || y - a[i - 1]! > 0.15);
  return { versao: 1, largura: r3((f.x1 - f.x0) * k), altura: r3((f.y1 - f.y0) * k), tipos, vaos, faixas: ys.map((y) => ({ id: novoId(), y, altura: 0 })), ornamentos: [] };
}
