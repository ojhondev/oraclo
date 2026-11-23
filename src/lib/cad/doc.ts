/**
 * Operações sobre o desenho (imutáveis, para desfazer/refazer por histórico de versões).
 * Puro, testado em tests/cad.test.ts.
 */
import { mirror, translate } from "./geometry";
import { BLOCK_PRESETS, cleanParams } from "./blocks";
import type { Block, BlockParams, BlockType, CadDoc, Entity, Layer, P } from "./types";

export const uid = () => Math.random().toString(36).slice(2, 10);

/** Camadas padrão de um levantamento de fachada. */
export function defaultLayers(): Layer[] {
  const L = (name: string, color: string, weight = 1): Layer => ({ id: uid(), name, color, weight, visible: true, locked: false, opacity: 1 });
  return [L("Contorno", "#e8e8e8", 1.6), L("Esquadrias", "#5aa9ff"), L("Molduras", "#c9c9c9"), L("Ornamentos", "#4ade80"), L("Cotas", "#ff6b6b", 0.8), L("Textos", "#ffffff", 0.8)];
}

/** Desenho novo; com imagem, ela vai numa camada "Foto" travada e semitransparente. */
export function newDoc(image?: { url: string; w: number; h: number }): CadDoc {
  const layers = defaultLayers();
  const entities: Entity[] = [];
  if (image) {
    const foto: Layer = { id: uid(), name: "Foto", color: "#888888", weight: 1, visible: true, locked: true, opacity: 0.6 };
    layers.unshift(foto);
    entities.push({ id: uid(), layer: foto.id, t: "image", url: image.url, p: [0, 0], w: image.w, h: image.h });
  }
  return { v: 1, layers, current: layers.find((l) => l.name === "Contorno")!.id, entities };
}

export const layerOf = (d: CadDoc, e: Entity) => d.layers.find((l) => l.id === e.layer);
/** Entidades que podem ser clicadas/editadas: camada visível e destravada. */
export const editable = (d: CadDoc) => d.entities.filter((e) => {
  const l = layerOf(d, e);
  return l && l.visible && !l.locked;
});

export function addEntities(d: CadDoc, es: Entity[]): CadDoc {
  return { ...d, entities: [...d.entities, ...es] };
}

export function updateEntity(d: CadDoc, id: string, patch: Partial<Entity>): CadDoc {
  return { ...d, entities: d.entities.map((e) => (e.id === id ? ({ ...e, ...patch } as Entity) : e)) };
}

export function removeEntities(d: CadDoc, ids: Set<string>): CadDoc {
  return { ...d, entities: d.entities.filter((e) => !ids.has(e.id)) };
}

export function moveEntities(d: CadDoc, ids: Set<string>, dx: number, dy: number): CadDoc {
  return { ...d, entities: d.entities.map((e) => (ids.has(e.id) ? translate(e, dx, dy) : e)) };
}

/** Copia as entidades deslocadas; devolve o desenho e os ids novos. */
export function copyEntities(d: CadDoc, ids: Set<string>, dx: number, dy: number): { doc: CadDoc; ids: string[] } {
  const copies = d.entities.filter((e) => ids.has(e.id)).map((e) => ({ ...translate(e, dx, dy), id: uid() }));
  return { doc: addEntities(d, copies), ids: copies.map((c) => c.id) };
}

/** Espelha (mantendo ou não o original). */
export function mirrorEntities(d: CadDoc, ids: Set<string>, a: P, b: P, keep: boolean): { doc: CadDoc; ids: string[] } {
  const src = d.entities.filter((e) => ids.has(e.id));
  if (keep) {
    const copies = src.map((e) => ({ ...mirror(e, a, b), id: uid() }));
    return { doc: addEntities(d, copies), ids: copies.map((c) => c.id) };
  }
  return { doc: { ...d, entities: d.entities.map((e) => (ids.has(e.id) ? mirror(e, a, b) : e)) }, ids: [...ids] };
}

/** Matriz retangular: `cols` × `rows` cópias com espaçamento dx/dy (o original conta como a primeira). */
export function arrayEntities(d: CadDoc, ids: Set<string>, cols: number, rows: number, dx: number, dy: number): CadDoc {
  const src = d.entities.filter((e) => ids.has(e.id));
  const copies: Entity[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) if (r || c) for (const e of src) copies.push({ ...translate(e, c * dx, r * dy), id: uid() });
  return addEntities(d, copies);
}

export function setEntitiesLayer(d: CadDoc, ids: Set<string>, layer: string): CadDoc {
  return { ...d, entities: d.entities.map((e) => (ids.has(e.id) ? { ...e, layer } : e)) };
}

export function updateLayer(d: CadDoc, id: string, patch: Partial<Layer>): CadDoc {
  return { ...d, layers: d.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)) };
}

export function addLayer(d: CadDoc, name: string, color = "#ffffff"): CadDoc {
  const l: Layer = { id: uid(), name, color, weight: 1, visible: true, locked: false, opacity: 1 };
  return { ...d, layers: [...d.layers, l], current: l.id };
}

/** Apaga a camada e o que está nela (nunca a última). */
export function removeLayer(d: CadDoc, id: string): CadDoc {
  if (d.layers.length <= 1) return d;
  const layers = d.layers.filter((l) => l.id !== id);
  return { ...d, layers, entities: d.entities.filter((e) => e.layer !== id), current: d.current === id ? layers[0]!.id : d.current };
}

/** Confere e normaliza um documento vindo do banco (versão, camada atual válida). */
export function normalizeDoc(raw: unknown): CadDoc {
  const d = raw as CadDoc;
  if (!d || d.v !== 1 || !Array.isArray(d.layers) || !Array.isArray(d.entities)) return newDoc();
  const current = d.layers.some((l) => l.id === d.current) ? d.current : d.layers[0]?.id ?? "";
  return { ...d, current, blockTypes: Array.isArray(d.blockTypes) ? d.blockTypes : [] };
}

// ── blocos ─────────────────────────────────────────────────────────────

/** Cria um tipo a partir de um modelo, com nome livre ("Janela A", "Janela B"…). */
export function addBlockType(d: CadDoc, presetKey: string): { doc: CadDoc; id: string } {
  const preset = BLOCK_PRESETS.find((p) => p.key === presetKey) ?? BLOCK_PRESETS[0]!;
  const types = d.blockTypes ?? [];
  const prefix = preset.params.kind === "porta" ? "Porta" : "Janela";
  let n = 0, name = "";
  do name = `${prefix} ${String.fromCharCode(65 + (n % 26))}${n >= 26 ? Math.floor(n / 26) : ""}`;
  while (types.some((t) => t.name === name) && ++n < 500);
  const t: BlockType = { id: uid(), name, params: { ...preset.params } };
  return { doc: { ...d, blockTypes: [...types, t] }, id: t.id };
}

export const blockType = (d: CadDoc, id: string) => (d.blockTypes ?? []).find((t) => t.id === id);

/** Novo bloco do tipo, com o canto inferior esquerdo do vão em p. */
export function makeBlock(d: CadDoc, typeId: string, p: P, layer: string): Block | null {
  const t = blockType(d, typeId);
  return t ? { id: uid(), layer, t: "block", type: t.id, p, params: { ...t.params } } : null;
}

/** Muda o tipo (nome e/ou medidas) e todas as cópias dele sem medida própria. */
export function updateBlockType(d: CadDoc, typeId: string, patch: { name?: string; params?: Partial<BlockParams> }): CadDoc {
  const t = blockType(d, typeId);
  if (!t) return d;
  const params = patch.params ? cleanParams({ ...t.params, ...patch.params }) : t.params;
  return {
    ...d,
    blockTypes: (d.blockTypes ?? []).map((x) => (x.id === typeId ? { ...x, name: patch.name ?? x.name, params } : x)),
    entities: d.entities.map((e) => (e.t === "block" && e.type === typeId && !e.own ? { ...e, params } : e)),
  };
}

/** Medida própria só para este bloco (deixa de seguir o tipo). */
export function updateBlockOwn(d: CadDoc, id: string, params: Partial<BlockParams>): CadDoc {
  return { ...d, entities: d.entities.map((e) => (e.t === "block" && e.id === id ? { ...e, own: true, params: cleanParams({ ...e.params, ...params }) } : e)) };
}

/** Volta o bloco às medidas do tipo. */
export function resetBlockToType(d: CadDoc, id: string): CadDoc {
  return {
    ...d,
    entities: d.entities.map((e) => {
      if (e.t !== "block" || e.id !== id) return e;
      const t = blockType(d, e.type);
      return t ? { ...e, own: false, params: { ...t.params } } : e;
    }),
  };
}

/** Apaga o tipo e as cópias dele. */
export function removeBlockType(d: CadDoc, typeId: string): CadDoc {
  return { ...d, blockTypes: (d.blockTypes ?? []).filter((t) => t.id !== typeId), entities: d.entities.filter((e) => !(e.t === "block" && e.type === typeId)) };
}
