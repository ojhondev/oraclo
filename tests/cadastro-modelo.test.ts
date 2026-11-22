import { describe, expect, it } from "vitest";
import { aplicarAoTipo, alterarTipo, alterarVao, desenhoDoModelo, medidas, modeloDaDeteccao, type Modelo } from "@/lib/cadastro/model";
import { drawingDxf } from "@/lib/cadastro/drawing";

function base(): Modelo {
  return {
    versao: 1,
    largura: 10,
    altura: 6,
    tipos: [{ id: "A", nome: "Tipo A", largura: 1.2, altura: 1.8, folhas: 2, montantes: 1, travessas: 2, moldura: { lateral: 0.15, topo: 0.15, base: 0.1 }, arco: { base: 0.05, raio: 0.75, anel: 0.12 } }],
    vaos: [
      { id: "v1", tipo: "A", x: 1, y: 1 },
      { id: "v2", tipo: "A", x: 4, y: 1 },
      { id: "v3", tipo: "A", x: 7, y: 1 },
    ],
    faixas: [{ id: "f1", y: 3.5, altura: 0.3 }],
    ornamentos: [],
  };
}

describe("modelo paramétrico: a medida digitada manda", () => {
  it("mudar o tipo muda todas as janelas dele, mantendo o eixo de cada uma", () => {
    const m = alterarTipo(base(), "A", { largura: 1.3 });
    for (const v of m.vaos) expect(medidas(m, v).largura).toBe(1.3);
    // eixo da primeira: 1,00 + 1,20/2 = 1,60 antes e depois
    expect(m.vaos[0]!.x + 1.3 / 2).toBeCloseTo(1.6);
  });

  it("'só esta janela' muda só ela, e a medida de campo fica marcada", () => {
    const m = alterarVao(base(), "v2", { largura: 1.25, medido: { largura: true } });
    expect(medidas(m, m.vaos[1]!).largura).toBe(1.25);
    expect(medidas(m, m.vaos[0]!).largura).toBe(1.2);
    expect(m.vaos[1]!.medido?.largura).toBe(true);
  });

  it("medida própria confirmada em campo não é atropelada quando o tipo muda", () => {
    let m = alterarVao(base(), "v2", { largura: 1.25, medido: { largura: true } });
    m = alterarTipo(m, "A", { largura: 1.4 });
    expect(medidas(m, m.vaos[1]!).largura).toBe(1.25);
    expect(medidas(m, m.vaos[0]!).largura).toBe(1.4);
  });

  it("'aplicar a todas do tipo' leva a medida de uma janela para o tipo", () => {
    let m = alterarVao(base(), "v1", { largura: 1.22, altura: 1.83 });
    m = aplicarAoTipo(m, "v1");
    expect(m.tipos[0]).toMatchObject({ largura: 1.22, altura: 1.83 });
    expect(m.vaos.every((v) => v.largura === undefined)).toBe(true);
  });

  it("o desenho sai do modelo: moldura simétrica, arco com anel, blocos e cotas", () => {
    const d = desenhoDoModelo(base());
    expect(d.blocks).toHaveLength(1);
    expect(d.inserts).toHaveLength(3);
    expect(d.arcs).toHaveLength(6); // arco externo e interno nas três janelas
    const molduras = d.segs.filter((s) => s.layer === "MOLDURAS");
    const xs = molduras.flatMap((s) => [s.a[0], s.b[0]]).filter((x) => x < 2.5);
    expect(Math.min(...xs)).toBeCloseTo(0.85); // 1,00 − 0,15
    expect(Math.max(...xs)).toBeCloseTo(2.35); // 1,00 + 1,20 + 0,15
    expect(d.labels.some((l) => l.text === "1,20 × 1,80")).toBe(true);
    expect(drawingDxf(d)).toContain("JANELA-A");
  });
});

describe("modelo paramétrico: rascunho a partir da detecção", () => {
  it("converte para metros, deixa a moldura simétrica e só cria medida própria quando difere", () => {
    const m = modeloDaDeteccao({
      facade: { x0: 0, y0: 0, x1: 1000, y1: 600 },
      bands: [{ y: 300, strength: 1 }, { y: 305, strength: 1 }],
      vaos: [
        { x0: 100, y0: 300, x1: 220, y1: 480, family: 0 },
        { x0: 400, y0: 300, x1: 521, y1: 480, family: 0 },
        { x0: 700, y0: 300, x1: 850, y1: 480, family: 0 },
      ],
      detalhes: { 0: { caixa: { x0: 100, y0: 300, x1: 220, y1: 480 }, detalhe: { mullionsX: [0.5], mullionsY: [0.33, 0.66], frame: { top: 0.1, bottom: 0.05, left: 0.2, right: 0.1 }, arch: null } } },
      mmPerPixel: 10,
    });
    expect(m.largura).toBe(10);
    expect(m.tipos).toHaveLength(1);
    const t = m.tipos[0]!;
    expect(t.largura).toBe(1.21);
    expect(t.moldura.lateral).toBeCloseTo(0.15 * 1.21, 2); // arredondado ao milímetro
    expect(t.montantes).toBe(1);
    expect(t.travessas).toBe(2);
    expect(m.vaos[0]).toMatchObject({ x: 1, y: 1.2 });
    expect(m.vaos[1]!.largura).toBeUndefined();
    expect(m.vaos[2]!.largura).toBe(1.5);
    expect(m.faixas).toHaveLength(1);
  });
});
