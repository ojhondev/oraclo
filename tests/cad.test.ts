import { describe, expect, it } from "vitest";
import { arcFrom3, atDistance, bbox, dimGeometry, distanceTo, findSnap, mirror, ortho, selectInBox, translate } from "@/lib/cad/geometry";
import { arrayEntities, copyEntities, editable, mirrorEntities, moveEntities, newDoc, normalizeDoc, removeLayer, updateLayer } from "@/lib/cad/doc";
import type { Entity, Line, P, Poly } from "@/lib/cad/types";

const line = (id: string, a: [number, number], b: [number, number]): Line => ({ id, layer: "L", t: "line", a, b });
const rect = (id: string, x: number, y: number, w: number, h: number): Poly => ({ id, layer: "L", t: "poly", closed: true, pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]] });

describe("ArchRay CAD: geometria", () => {
  it("distância até linha, círculo e arco", () => {
    expect(distanceTo(line("a", [0, 0], [10, 0]), [5, 2])).toBeCloseTo(2);
    expect(distanceTo({ id: "c", layer: "L", t: "circle", c: [0, 0], r: 5 }, [8, 0])).toBeCloseTo(3);
    // arco do 1º quadrante: ponto no 3º quadrante mede até a ponta mais perto
    const arc: Entity = { id: "r", layer: "L", t: "arc", c: [0, 0], r: 1, a0: 0, a1: Math.PI / 2 };
    expect(distanceTo(arc, [0.5, 0.5])).toBeCloseTo(1 - Math.SQRT1_2);
    expect(distanceTo(arc, [-1, 0])).toBeCloseTo(Math.SQRT2);
  });

  it("encaixe: ponta antes de meio, interseção de duas linhas e perpendicular", () => {
    const es = [line("a", [0, 0], [10, 0]), line("b", [5, -5], [5, 5])];
    const all = new Set(["ponta", "meio", "interseção", "centro", "quadrante", "perpendicular", "grade"] as const);
    expect(findSnap(es, [0.2, 0.1], { tol: 0.5, kinds: all })!.kind).toBe("ponta");
    const x = findSnap(es, [5.1, 0.1], { tol: 0.5, kinds: all })!;
    expect(x.kind === "interseção" || x.kind === "meio").toBe(true);
    expect(x.p[0]).toBeCloseTo(5);
    const perp = findSnap([line("a", [0, 0], [10, 0])], [3.1, 0.2], { tol: 0.5, kinds: new Set(["perpendicular"]), from: [3, 4] })!;
    expect(perp.p).toEqual([3, 0]);
  });

  it("modo ortogonal e medida digitada", () => {
    expect(ortho([0, 0], [5, 1])).toEqual([5, 0]);
    expect(ortho([0, 0], [1, 5])).toEqual([0, 5]);
    const p = atDistance([0, 0], [3, 4], 10);
    expect(p[0]).toBeCloseTo(6);
    expect(p[1]).toBeCloseTo(8);
  });

  it("seleção por janela pega só o que está inteiro; por cruzamento pega o que encosta", () => {
    const es = [rect("dentro", 1, 1, 2, 2), rect("meio", 4, 1, 4, 2), rect("fora", 20, 20, 1, 1)];
    const box = { x0: 0, y0: 0, x1: 5, y1: 5 };
    expect(selectInBox(es, box, false).map((e) => e.id)).toEqual(["dentro"]);
    expect(selectInBox(es, box, true).map((e) => e.id).sort()).toEqual(["dentro", "meio"]);
  });

  it("arco por três pontos (anti-horário) e caixa do arco", () => {
    const a = arcFrom3([1, 0], [0, 1], [-1, 0])!;
    expect(a.r).toBeCloseTo(1);
    expect(a.c[0]).toBeCloseTo(0);
    const b = bbox({ id: "x", layer: "L", t: "arc", ...a });
    expect(b.y1).toBeCloseTo(1);
    expect(b.y0).toBeCloseTo(0);
  });

  it("cota: linha deslocada para a esquerda e comprimento", () => {
    const g = dimGeometry([0, 0], [4, 0], 1);
    expect(g.length).toBe(4);
    expect(g.da).toEqual([0, 1]);
  });

  it("mover e espelhar", () => {
    expect(translate(line("a", [0, 0], [1, 0]), 2, 3)).toMatchObject({ a: [2, 3], b: [3, 3] });
    const m = mirror(line("a", [1, 0], [2, 1]), [0, 0], [0, 1]);
    expect(m.a[0]).toBeCloseTo(-1);
    expect(m.b[0]).toBeCloseTo(-2);
  });
});

describe("ArchRay CAD: documento", () => {
  it("desenho com foto: camada Foto travada e semitransparente, fora do que se edita", () => {
    const d = newDoc({ url: "x.jpg", w: 10, h: 8 });
    const foto = d.layers.find((l) => l.name === "Foto")!;
    expect(foto.locked).toBe(true);
    expect(foto.opacity).toBeLessThan(1);
    expect(editable(d)).toHaveLength(0);
    const destravada = updateLayer(d, foto.id, { locked: false });
    expect(editable(destravada)).toHaveLength(1);
  });

  it("mover, copiar, espelhar com cópia e matriz", () => {
    let d = newDoc();
    d = { ...d, entities: [{ ...line("a", [0, 0], [1, 0]), layer: d.current }] };
    d = moveEntities(d, new Set(["a"]), 1, 0);
    expect((d.entities[0] as Line).a).toEqual([1, 0]);
    const c = copyEntities(d, new Set(["a"]), 0, 2);
    expect(c.doc.entities).toHaveLength(2);
    const m = mirrorEntities(c.doc, new Set(["a"]), [0, 0], [0, 1], true);
    expect(m.doc.entities).toHaveLength(3);
    const arr = arrayEntities(d, new Set(["a"]), 4, 2, 3, 5);
    expect(arr.entities).toHaveLength(8);
  });

  it("apagar camada leva junto o que está nela e nunca apaga a última", () => {
    let d = newDoc();
    const l = d.layers[1]!.id;
    d = { ...d, entities: [{ ...line("a", [0, 0], [1, 0]), layer: l }] };
    expect(removeLayer(d, l).entities).toHaveLength(0);
    const uma = { ...d, layers: [d.layers[0]!] };
    expect(removeLayer(uma, uma.layers[0]!.id).layers).toHaveLength(1);
  });

  it("documento inválido do banco vira desenho novo", () => {
    expect(normalizeDoc(null).v).toBe(1);
    expect(normalizeDoc({ v: 2 }).layers.length).toBeGreaterThan(0);
  });
});

import { click, finishPoly, parsePair, preview, typedPoint } from "@/lib/cad/tools";
import { cadToDxf, dxfLayerName } from "@/lib/cad/dxf";

describe("ArchRay CAD: ferramentas", () => {
  it("linha em cadeia: cada clique cria uma linha a partir do último ponto", () => {
    let r = click("line", [], [0, 0], "L");
    expect(r.add).toBeUndefined();
    r = click("line", r.pts, [2, 0], "L");
    expect(r.add![0]).toMatchObject({ t: "line", a: [0, 0], b: [2, 0] });
    r = click("line", r.pts, [2, 3], "L");
    expect(r.add![0]).toMatchObject({ a: [2, 0], b: [2, 3] });
  });

  it("retângulo por dois cantos e por largura x altura digitada", () => {
    const r = click("rect", [[1, 1]], [3, 2], "L");
    expect(r.add![0]).toMatchObject({ t: "poly", closed: true });
    const p = typedPoint("rect", [[1, 1]], [5, 5], "1,2x0,8")!;
    expect(p[0]).toBeCloseTo(2.2);
    expect(p[1]).toBeCloseTo(1.8);
    // cursor à esquerda e abaixo: cresce para o outro lado
    const q = typedPoint("rect", [[1, 1]], [0, 0], "1x1")!;
    expect(q).toEqual([0, 0]);
  });

  it("comprimento digitado segue a direção do cursor; dx;dy é relativo", () => {
    const p = typedPoint("line", [[0, 0]], [10, 0], "1,5")!;
    expect(p).toEqual([1.5, 0]);
    expect(typedPoint("line", [[1, 1]], [10, 0], "2;3")).toEqual([3, 4]);
    expect(parsePair("@1,5;2")).toEqual([1.5, 2]);
  });

  it("círculo, arco por três pontos, cota e polilinha", () => {
    expect(click("circle", [[0, 0]], [0, 2], "L").add![0]).toMatchObject({ t: "circle", r: 2 });
    const arc = click("arc", [[1, 0], [0, 1]], [-1, 0], "L").add![0]!;
    expect(arc.t).toBe("arc");
    const dim = click("dim", [[0, 0], [4, 0]], [2, 1.5], "L").add![0]!;
    expect(dim).toMatchObject({ t: "dim", off: 1.5 });
    expect(finishPoly([[0, 0], [1, 0], [1, 1]], "L", true)).toMatchObject({ closed: true });
    expect(finishPoly([[0, 0], [1, 0]], "L", true)).toBeNull();
    expect(preview("rect", [[0, 0]], [2, 1], "L")[0]).toMatchObject({ t: "poly" });
  });
});

describe("ArchRay CAD: DXF", () => {
  it("uma camada DXF por camada (nome sem acento), entidades e cota como linhas + texto; foto fica de fora", () => {
    const d = newDoc({ url: "x.jpg", w: 10, h: 8 });
    const l = d.layers.find((x) => x.name === "Esquadrias")!.id;
    d.entities.push({ id: "a", layer: l, t: "line", a: [0, 0], b: [1, 0] }, { id: "b", layer: l, t: "dim", a: [0, 0], b: [2, 0], off: 0.5 });
    const s = cadToDxf(d);
    expect(s).toContain("ESQUADRIAS");
    expect(s).toContain("2,00");
    expect(s).not.toContain("x.jpg");
    expect(dxfLayerName("Cotas de nível")).toBe("COTAS-DE-NIVEL");
  });
});

import { BLOCK_PRESETS, blockPieces, expandBlock, riseOf } from "@/lib/cad/blocks";
import { addBlockType, makeBlock, removeBlockType, resetBlockToType, updateBlockOwn, updateBlockType } from "@/lib/cad/doc";
import { offsetEntity } from "@/lib/cad/geometry";
import type { Block } from "@/lib/cad/types";

describe("ArchRay CAD: blocos (janela e porta)", () => {
  const janela = BLOCK_PRESETS.find((p) => p.key === "janela")!.params;

  it("janela reta: vão, moldura, peitoril, caixilho e divisões; caixa inclui moldura e peitoril", () => {
    const b: Block = { id: "b", layer: "L", t: "block", type: "T", p: [10, 5], params: janela };
    const box = bbox(b);
    expect(box.x0).toBeCloseTo(10 - janela.moldura - 0.04);
    expect(box.x1).toBeCloseTo(10 + janela.w + janela.moldura + 0.04);
    expect(box.y0).toBeCloseTo(5 - janela.peitoril);
    expect(box.y1).toBeCloseTo(5 + janela.h + janela.moldura);
    // 1 montante (2 colunas) + 2 travessas (3 linhas) entre as peças
    expect(blockPieces(janela).filter((q) => q.t === "line").length).toBeGreaterThanOrEqual(4 + 3 + 4 + 4 + 3);
    // clicar dentro do vão pega o bloco
    expect(distanceTo(b, [10.6, 5.7])).toBe(0);
  });

  it("arco pleno: raio = meia largura, arcos concêntricos (vão, moldura, caixilho) e bandeira", () => {
    const p = { ...janela, top: "pleno" as const, w: 1, h: 2 };
    expect(riseOf(p)).toBe(0.5);
    const arcs = blockPieces(p).filter((q) => q.t === "arc") as { c: P; r: number }[];
    expect(arcs.map((a) => a.r).sort()).toEqual([0.5 - p.frame, 0.5, 0.5 + p.moldura].sort());
    for (const a of arcs) expect(a.c).toEqual([0.5, 1.5]);
    const abatido = blockPieces({ ...p, top: "abatido", rise: 0.2 }).filter((q) => q.t === "arc")[0] as { r: number };
    expect(abatido.r).toBeCloseTo((0.5 * 0.5 + 0.2 * 0.2) / (2 * 0.2));
  });

  it("mudar o tipo muda todas as cópias, menos a que tem medida própria; voltar ao tipo", () => {
    let d = newDoc();
    const r = addBlockType(d, "janela");
    d = r.doc;
    const a = makeBlock(d, r.id, [0, 0], d.current)!, b = makeBlock(d, r.id, [3, 0], d.current)!;
    d = { ...d, entities: [a, b] };
    d = updateBlockOwn(d, b.id, { w: 0.8 });
    d = updateBlockType(d, r.id, { params: { w: 1.5 }, name: "J1" });
    const [A, B] = d.entities as Block[];
    expect(A!.params.w).toBe(1.5);
    expect(B!.params.w).toBe(0.8);
    expect(d.blockTypes![0]!.name).toBe("J1");
    d = resetBlockToType(d, b.id);
    expect((d.entities[1] as Block).params.w).toBe(1.5);
    expect(removeBlockType(d, r.id).entities).toHaveLength(0);
    // nomes automáticos não se repetem
    expect(addBlockType(addBlockType(newDoc(), "janela").doc, "janela").doc.blockTypes!.map((t) => t.name)).toEqual(["Janela A", "Janela B"]);
  });

  it("mover e espelhar bloco; DXF com BLOCK e INSERT", () => {
    const b: Block = { id: "b", layer: "L", t: "block", type: "T", p: [1, 0], params: janela };
    expect(translate(b, 2, 1).p).toEqual([3, 1]);
    expect(mirror(b, [0, 0], [0, 1]).p[0]).toBeCloseTo(-1 - janela.w);
    expect(expandBlock(b).every((e) => e.layer === "L")).toBe(true);
    const d = newDoc();
    const r = addBlockType(d, "janela");
    const doc = { ...r.doc, entities: [makeBlock(r.doc, r.id, [0, 0], d.current)!, makeBlock(r.doc, r.id, [3, 0], d.current)!] };
    const s = cadToDxf(doc);
    expect(s).toContain("JANELA-A");
    expect(s.match(/\nINSERT\r?\n/g)?.length).toBe(2);
  });
});

describe("ArchRay CAD: deslocar (offset)", () => {
  it("linha para o lado do clique, círculo para dentro/fora, retângulo cresce por igual", () => {
    expect(offsetEntity(line("a", [0, 0], [10, 0]), 0.5, [3, -2])).toMatchObject({ a: [0, -0.5], b: [10, -0.5] });
    const c = { id: "c", layer: "L", t: "circle" as const, c: [0, 0] as P, r: 2 };
    expect(offsetEntity(c, 0.5, [0.2, 0])).toMatchObject({ r: 1.5 });
    expect(offsetEntity(c, 0.5, [5, 0])).toMatchObject({ r: 2.5 });
    expect(offsetEntity(c, 3, [0.2, 0])).toBeNull();
    const r = offsetEntity(rect("r", 0, 0, 2, 1), 0.1, [-1, 0.5]) as Poly;
    const b = bbox(r);
    expect(b.x0).toBeCloseTo(-0.1);
    expect(b.x1).toBeCloseTo(2.1);
    expect(b.y0).toBeCloseTo(-0.1);
    expect(b.y1).toBeCloseTo(1.1);
    const inner = bbox(offsetEntity(rect("r", 0, 0, 2, 1), 0.1, [1, 0.5])!);
    expect(inner.x0).toBeCloseTo(0.1);
  });
});

import { acceptSuggestions, backgroundImage, blockToImage, ensureSuggestLayer, imageToWorld, suggestionIds, suggestionsFrom } from "@/lib/cad/suggest";

describe("ArchRay CAD: IA assistente (sugestões)", () => {
  const img = { id: "i", layer: "F", t: "image" as const, url: "x.jpg", p: [0, 0] as P, w: 20, h: 10 };
  const janela = BLOCK_PRESETS.find((p) => p.key === "janela")!.params;

  it("bloco ↔ foto: fração da imagem com Y para baixo, ida e volta", () => {
    const b: Block = { id: "b", layer: "L", t: "block", type: "T", p: [2, 5], params: { ...janela, w: 1, h: 2 } };
    const n = blockToImage(b, img);
    for (const [k, v] of Object.entries({ x0: 0.1, x1: 0.15, y0: 0.3, y1: 0.5 })) expect(n[k as keyof typeof n]).toBeCloseTo(v);
    const w = imageToWorld(n, img);
    expect(w.x0).toBeCloseTo(2);
    expect(w.y0).toBeCloseTo(5);
    expect(w.y1).toBeCloseTo(7);
  });

  it("achados viram blocos do tipo do modelo, centrados, sem repetir o que já existe", () => {
    let id = 0;
    const nid = () => `s${id++}`;
    const seed: Block = { id: "b", layer: "L", t: "block", type: "T", p: [2, 5], params: { ...janela, w: 1, h: 2 } };
    const found = [
      { ...blockToImage(seed, img), family: 0, score: 0.9 }, // o próprio modelo
      { x0: 0.3, x1: 0.36, y0: 0.3, y1: 0.5, family: 0, score: 0.8 }, // outra, um pouco maior
      { x0: 0.301, x1: 0.359, y0: 0.3, y1: 0.5, family: 0, score: 0.7 }, // duplicada
    ];
    const out = suggestionsFrom(found, [seed], img, [seed], "SUG", nid);
    expect(out).toHaveLength(1);
    expect(out[0]!.type).toBe("T");
    expect(out[0]!.params.w).toBe(1);
    expect(out[0]!.p[0]).toBeCloseTo(6.6 - 0.5);
    expect(out[0]!.layer).toBe("SUG");
    // bem maior que o modelo: vem com a medida achada, como medida própria
    const big = suggestionsFrom([{ x0: 0.5, x1: 0.6, y0: 0.2, y1: 0.5, family: 0, score: 0.8 }], [seed], img, [seed], "SUG", nid)[0]!;
    expect(big.own).toBe(true);
    expect(big.params.w).toBeCloseTo(2);
    expect(big.params.h).toBeCloseTo(3);
  });

  it("camada Sugestões: cria uma vez, aceitar leva para a camada de destino", () => {
    let d = newDoc({ url: "x.jpg", w: 20, h: 10 });
    expect(backgroundImage(d)!.url).toBe("x.jpg");
    const r = ensureSuggestLayer(d, () => "SUG");
    d = r.doc;
    expect(ensureSuggestLayer(d, () => "outra").id).toBe("SUG");
    d = { ...d, entities: [...d.entities, { id: "s1", layer: "SUG", t: "block", type: "T", p: [0, 0], params: janela }] };
    expect(suggestionIds(d)).toEqual(["s1"]);
    d = acceptSuggestions(d, new Set(["s1"]), "ESQ");
    expect(suggestionIds(d)).toEqual([]);
  });
});
