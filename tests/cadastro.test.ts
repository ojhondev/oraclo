import { describe, expect, it } from "vitest";
import { regularize } from "@/lib/cadastro/regularize";
import { findSimilar } from "@/lib/cadastro/similar";
import { floorsOf, toGray } from "@/lib/cadastro/complete";
import { buildDrawing, drawingDxf } from "@/lib/cadastro/drawing";
import { profileLines } from "@/lib/cadastro/detail";
import type { Vao } from "@/lib/cadastro/analyze";

const vao = (x0: number, y0: number, x1: number, y1: number): Vao => ({ x0, y0, x1, y1, arched: false, score: 0.9 });

/** Fachada sintética: parede clara com uma grade de janelas (vidro escuro com caixilho em cruz). */
function synthetic(w = 400, h = 300, cols = [60, 170, 280], rows = [40, 170], ww = 50, wh = 70) {
  const px = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const n = (i * 2654435761) % 13; // textura leve do reboco
    px.set([222 + n, 214 + n, 200 + n, 255], i * 4);
  }
  for (const cx of cols)
    for (const cy of rows)
      for (let y = cy; y < cy + wh; y++)
        for (let x = cx; x < cx + ww; x++) {
          const frame = x === cx + ww / 2 || y === cy + wh / 2 || x < cx + 3 || x > cx + ww - 4 || y < cy + 3 || y > cy + wh - 4;
          const v = frame ? 245 : 45;
          px.set([v, v, v + 8, 255], (y * w + x) * 4);
        }
  return { px, w, h };
}

describe("levantamento cadastral: limpeza pela lógica da fachada", () => {
  it("alinha verga e peitoril na fiada, iguala larguras parecidas e alinha os eixos (ruído de medição pequeno)", () => {
    const r = regularize(
      [vao(10, 20, 30, 61), vao(50, 21, 70.8, 60), vao(90, 19.5, 109.4, 61.5), vao(11, 100, 31, 141), vao(49.5, 101, 70, 140), vao(90.5, 99.5, 110, 141.5)],
      { x0: 0, y0: 0, x1: 120, y1: 160 },
    );
    expect(r.rows).toHaveLength(2);
    expect(r.columns).toBe(3);
    const top = r.vaos.filter((v) => v.row === 0);
    expect(new Set(top.map((v) => v.y0)).size).toBe(1);
    expect(new Set(top.map((v) => v.y1)).size).toBe(1);
    expect(new Set(r.vaos.map((v) => Math.round(v.x1 - v.x0))).size).toBe(1);
    // mesmo eixo nos dois andares
    for (const c of [0, 1, 2]) {
      const xs = r.vaos.filter((v) => v.col === c).map((v) => v.x0);
      expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(0.01);
    }
  });

  it("não mistura porta e janela da mesma fiada e junta achados repetidos", () => {
    const r = regularize([vao(10, 20, 30, 60), vao(50, 20, 70, 95), vao(10.5, 20.5, 30.5, 60.5)], { x0: 0, y0: 0, x1: 100, y1: 100 });
    expect(r.vaos).toHaveLength(2);
    const alturas = r.vaos.map((v) => v.y1 - v.y0).sort((a, b) => a - b);
    expect(alturas[1]! - alturas[0]!).toBeGreaterThan(20);
  });

  it("andares saem das faixas, ignorando faixas coladas", () => {
    const f = floorsOf([{ y: 100, strength: 1 }, { y: 104, strength: 1 }, { y: 200, strength: 1 }], { x0: 0, y0: 0, x1: 100, y1: 300 });
    expect(f).toHaveLength(3);
  });

  it("não deforma: diferença grande de tamanho não é igualada", () => {
    const r = regularize([vao(10, 20, 30, 60), vao(50, 20, 75, 60)], { x0: 0, y0: 0, x1: 100, y1: 100 });
    const ws = r.vaos.map((v) => v.x1 - v.x0).sort((a, b) => a - b);
    expect(ws).toEqual([20, 25]);
  });

  it("junta as folhas empilhadas de uma janela alta", () => {
    const r = regularize([vao(10, 10, 30, 40), vao(10.5, 42, 30.5, 72)], { x0: 0, y0: 0, x1: 100, y1: 100 });
    expect(r.vaos).toHaveLength(1);
    expect(r.vaos[0]!.y1 - r.vaos[0]!.y0).toBeGreaterThan(60);
  });
});

describe("levantamento cadastral: modo semiautomático", () => {
  it("a partir de uma janela marcada, acha as outras iguais da grade", () => {
    const { px, w, h } = synthetic();
    const found = findSimilar(toGray(px, w, h), { x0: 60, y0: 40, x1: 110, y1: 110 }, { x0: 0, y0: 0, x1: w - 1, y1: h - 1 }, { scales: [1] });
    expect(found.length).toBe(6);
  });
});

describe("levantamento cadastral: desenho técnico", () => {
  it("converte para metros com origem embaixo à esquerda e gera DXF com as camadas", () => {
    const d = buildDrawing({ facade: { x0: 0, y0: 0, x1: 1000, y1: 500 }, bands: [{ y: 250, strength: 1 }], vaos: [vao(100, 300, 200, 450)], mmPerPixel: 10 });
    expect(d.width).toBeCloseTo(10);
    expect(d.height).toBeCloseTo(5);
    expect(d.vaos[0]).toMatchObject({ x0: 1, x1: 2 });
    expect(d.vaos[0]!.y0).toBeCloseTo(0.5); // base do vão a 0,50 m do chão
    expect(d.labels.some((l) => l.text === "1,00 × 1,50")).toBe(true);
    const dxf = drawingDxf(d);
    for (const layer of ["CAD-CONTORNO", "CAD-FAIXAS", "CAD-VAOS", "CAD-COTAS"]) expect(dxf).toContain(layer);
  });
});

describe("levantamento cadastral: detalhamento das janelas", () => {
  it("acha os montantes num perfil de caixilho (claro sobre vidro escuro)", () => {
    // 60 px de largura, vidro escuro (50) com caixilho claro (230) em 20 e 40
    const p = Array.from({ length: 61 }, (_, i) => (Math.abs(i - 20) <= 1 || Math.abs(i - 40) <= 1 ? 230 : 50));
    const lines = profileLines(p, 6);
    expect(lines).toHaveLength(2);
    expect(lines[0]!).toBeCloseTo(20 / 60, 1);
    expect(lines[1]!).toBeCloseTo(40 / 60, 1);
  });

  it("vidro liso não inventa montante", () => {
    expect(profileLines(Array.from({ length: 60 }, () => 80), 6)).toHaveLength(0);
  });

  it("cada tipo de janela vira um bloco no DXF, inserido em todos os vãos do tipo", () => {
    const d = buildDrawing({
      facade: { x0: 0, y0: 0, x1: 1000, y1: 500 },
      bands: [],
      vaos: [{ ...vao(100, 100, 200, 250), family: 0 }, { ...vao(400, 100, 500, 250), family: 0 }],
      mmPerPixel: 10,
      details: { 0: { mullionsX: [0.5], mullionsY: [0.5], frame: { top: 0.1, bottom: 0.1, left: 0.1, right: 0.1 }, arch: { cy: -0.2, r: 0.6, inner: 0.45 } } },
    });
    expect(d.blocks).toHaveLength(1);
    expect(d.inserts).toHaveLength(2);
    expect(d.arcs.length).toBe(4); // arco externo e interno em cada vão
    const dxf = drawingDxf(d);
    expect(dxf).toContain("JANELA-A");
    for (const layer of ["CAD-ESQUADRIAS", "CAD-MOLDURAS", "CAD-ARCOS"]) expect(dxf).toContain(layer);
  });
});
