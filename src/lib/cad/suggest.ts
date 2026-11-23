/**
 * IA assistente do ArchRay CAD: conversa entre o desenho (metros, Y para cima) e a foto de fundo
 * (fração 0..1 da imagem, Y para baixo), para usar blocos como "janela-modelo" na busca de
 * parecidas e trazer o que foi achado como blocos sugeridos na camada "Sugestões".
 * Puro, testado em tests/cad.test.ts.
 */
import type { Block, CadDoc, Img, Layer } from "./types";

export const SUGGEST_LAYER = "Sugestões";
/** Caixa na foto, em fração da imagem (0..1), Y para baixo. */
export type NBox = { x0: number; y0: number; x1: number; y1: number };
export type Found = NBox & { family: number; score: number };

/** Foto de fundo do desenho (a primeira imagem visível, ou a primeira). */
export function backgroundImage(d: CadDoc): Img | null {
  const imgs = d.entities.filter((e): e is Img => e.t === "image");
  return imgs.find((i) => d.layers.find((l) => l.id === i.layer)?.visible) ?? imgs[0] ?? null;
}

/** Vão do bloco (sem moldura) em fração da foto. */
export function blockToImage(b: Block, img: Img): NBox {
  const u = (x: number) => (x - img.p[0]) / img.w;
  const v = (y: number) => 1 - (y - img.p[1]) / img.h;
  return { x0: u(b.p[0]), x1: u(b.p[0] + b.params.w), y0: v(b.p[1] + b.params.h), y1: v(b.p[1]) };
}

/** Caixa da foto em metros no desenho. */
export function imageToWorld(n: NBox, img: Img) {
  const x0 = img.p[0] + n.x0 * img.w, x1 = img.p[0] + n.x1 * img.w;
  const y0 = img.p[1] + (1 - n.y1) * img.h, y1 = img.p[1] + (1 - n.y0) * img.h;
  return { x0, y0, x1, y1 };
}

const iou = (a: { x0: number; y0: number; x1: number; y1: number }, b: typeof a) => {
  const ix = Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0));
  const iy = Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
  const inter = ix * iy;
  const u = (a.x1 - a.x0) * (a.y1 - a.y0) + (b.x1 - b.x0) * (b.y1 - b.y0) - inter;
  return u > 0 ? inter / u : 0;
};
const openingBox = (b: Block) => ({ x0: b.p[0], y0: b.p[1], x1: b.p[0] + b.params.w, y1: b.p[1] + b.params.h });

/** Camada "Sugestões" (cria se não existir; laranja, destravada e visível). */
export function ensureSuggestLayer(d: CadDoc, newId: () => string): { doc: CadDoc; id: string } {
  const l = d.layers.find((x) => x.name === SUGGEST_LAYER);
  if (l) return { doc: l.visible && !l.locked ? d : { ...d, layers: d.layers.map((x) => (x.id === l.id ? { ...x, visible: true, locked: false } : x)) }, id: l.id };
  const nl: Layer = { id: newId(), name: SUGGEST_LAYER, color: "#f59e0b", weight: 1.2, visible: true, locked: false, opacity: 1 };
  return { doc: { ...d, layers: [...d.layers, nl] }, id: nl.id };
}

/**
 * Achados → blocos sugeridos do mesmo tipo do modelo (família = índice do modelo), centrados no
 * achado. Medida até 20% diferente da do tipo: fica a do tipo; mais que isso: a achada, como medida própria. Pula o que já tem
 * bloco (inclusive o próprio modelo e sugestões anteriores).
 */
export function suggestionsFrom(found: Found[], seeds: Block[], img: Img, existing: Block[], layer: string, newId: () => string): Block[] {
  const taken = existing.map(openingBox);
  const out: Block[] = [];
  for (const f of [...found].sort((a, b) => b.score - a.score)) {
    const seed = seeds[f.family];
    if (!seed) continue;
    const w = imageToWorld(f, img);
    const cx = (w.x0 + w.x1) / 2, cy = (w.y0 + w.y1) / 2;
    // medida parecida com a do tipo (±20%): usa a do tipo; senão, a achada, como medida própria
    const fw = w.x1 - w.x0, fh = w.y1 - w.y0;
    const same = Math.abs(fw / seed.params.w - 1) <= 0.2 && Math.abs(fh / seed.params.h - 1) <= 0.2;
    const params = same ? { ...seed.params } : { ...seed.params, w: Math.round(fw * 100) / 100, h: Math.round(fh * 100) / 100 };
    const b: Block = { id: newId(), layer, t: "block", type: seed.type, p: [cx - params.w / 2, cy - params.h / 2], params, own: same ? seed.own : true };
    const box = openingBox(b);
    if (taken.some((t) => iou(t, box) > 0.25)) continue;
    taken.push(box);
    out.push(b);
  }
  return out;
}

/** Ids dos blocos na camada Sugestões. */
export function suggestionIds(d: CadDoc): string[] {
  const l = d.layers.find((x) => x.name === SUGGEST_LAYER);
  return l ? d.entities.filter((e) => e.layer === l.id).map((e) => e.id) : [];
}

/** Aceita sugestões: vão para a camada de destino (Esquadrias). */
export function acceptSuggestions(d: CadDoc, ids: Set<string>, target: string): CadDoc {
  return { ...d, entities: d.entities.map((e) => (ids.has(e.id) ? { ...e, layer: target } : e)) };
}
