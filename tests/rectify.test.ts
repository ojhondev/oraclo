import { describe, expect, it } from "vitest";
import {
  apply,
  distort,
  estimateLens,
  fitHomography,
  inv3,
  lensFor,
  outputSize,
  photoExtent,
  solveRectification,
  undistort,
  type Control,
  type Extent,
  type Pt,
} from "@/lib/rectify";

/** Verdade conhecida: plano (m) → foto (px), com perspectiva forte. */
const H_TRUE = [100, 20, 300, -10, 90, 200, 0.0002, 0.0001, 1];
const W = 4000;
const H = 3000;
const toImg = (p: Pt) => apply(H_TRUE, p);
const corners: Pt[] = [[0, 0], [10, 0], [10, 6], [0, 6]];
const controls = (lens = lensFor(W, H, 0)): Control[] => corners.map((p) => ({ img: distort(toImg(p), lens), plane: p }));

describe("homografia", () => {
  it("reproduz exatamente 4 pares de pontos", () => {
    const src = corners.map(toImg);
    const Hm = fitHomography(src, corners);
    src.forEach((s, i) => {
      const [x, y] = apply(Hm, s);
      expect(x).toBeCloseTo(corners[i]![0], 8);
      expect(y).toBeCloseTo(corners[i]![1], 8);
    });
  });

  it("recupera pontos internos fora dos 4 usados no ajuste", () => {
    const Hm = fitHomography(corners.map(toImg), corners);
    const [x, y] = apply(Hm, toImg([3.7, 2.2]));
    expect(x).toBeCloseTo(3.7, 8);
    expect(y).toBeCloseTo(2.2, 8);
  });

  it("com pontos a mais, ajusta por mínimos quadrados e tolera pouco ruído", () => {
    const plane: Pt[] = [...corners, [5, 3], [2, 4], [8, 1]];
    const noise = [0.2, -0.3, 0.25, -0.2, 0.15, -0.1, 0.3];
    const img = plane.map((p, i) => {
      const q = toImg(p);
      return [q[0] + noise[i]!, q[1] - noise[i]! * 0.5] as Pt;
    });
    const Hm = fitHomography(img, plane);
    for (let i = 0; i < plane.length; i++) {
      const [x, y] = apply(Hm, img[i]!);
      expect(Math.hypot(x - plane[i]![0], y - plane[i]![1])).toBeLessThan(0.02); // < 2 cm com ruído de 0,3 px
    }
  });

  it("exige pelo menos 4 pontos e inverte matrizes", () => {
    expect(() => fitHomography([[0, 0], [1, 1], [2, 2]], [[0, 0], [1, 1], [2, 2]])).toThrow();
    const inv = inv3(H_TRUE);
    const [x, y] = apply(inv, toImg([4, 2]));
    expect(x).toBeCloseTo(4, 8);
    expect(y).toBeCloseTo(2, 8);
    expect(() => inv3([1, 2, 3, 2, 4, 6, 3, 6, 9])).toThrow();
  });
});

describe("lente", () => {
  it("distort e undistort são inversas", () => {
    const L = lensFor(W, H, 0.08);
    for (const p of [[100, 100], [2000, 1500], [3900, 2900], [50, 2800]] as Pt[]) {
      const [x, y] = undistort(distort(p, L), L);
      expect(x).toBeCloseTo(p[0], 3);
      expect(y).toBeCloseTo(p[1], 3);
    }
  });

  it("sem distorção (k1 = 0) não altera nada", () => {
    expect(distort([123, 456], lensFor(W, H, 0))).toEqual([123, 456]);
  });

  it("estima k1 a partir de linhas que deveriam ser retas", () => {
    const trueL = lensFor(W, H, 0.06);
    const lines: Pt[][] = [];
    for (const y of [300, 1000, 1500, 2000, 2700]) {
      lines.push(Array.from({ length: 12 }, (_, i) => distort([200 + i * 300, y] as Pt, trueL)));
    }
    for (const x of [400, 1500, 2600, 3600]) {
      lines.push(Array.from({ length: 10 }, (_, i) => distort([x, 200 + i * 280] as Pt, trueL)));
    }
    const est = estimateLens(lines, W, H);
    expect(est.lens.k1).toBeCloseTo(0.06, 2);
    expect(est.rmsAfter).toBeLessThan(est.rmsBefore);
    expect(est.rmsAfter).toBeLessThan(0.5);
  });

  it("distort e undistort continuam inversas com dois termos (k1 e k2)", () => {
    const L = { ...lensFor(W, H, 0.05), k2: -0.04 };
    for (const p of [[100, 100], [2000, 1500], [3900, 2900], [50, 2800]] as Pt[]) {
      const [x, y] = undistort(distort(p, L), L);
      expect(x).toBeCloseTo(p[0], 3);
      expect(y).toBeCloseTo(p[1], 3);
    }
  });

  /** Linhas retas (horizontais e verticais, até os cantos) vistas por uma lente com k1 e k2. */
  const gridLines = (L: ReturnType<typeof lensFor>) => {
    const lines: Pt[][] = [];
    for (const y of [60, 700, 1500, 2300, 2940]) lines.push(Array.from({ length: 14 }, (_, i) => distort([40 + i * 300, y] as Pt, L)));
    for (const x of [60, 1000, 2000, 3000, 3940]) lines.push(Array.from({ length: 12 }, (_, i) => distort([x, 40 + i * 260] as Pt, L)));
    return lines;
  };

  it("com muitas linhas até os cantos, recupera k1 e k2 de uma grande-angular", () => {
    const trueL = { ...lensFor(W, H, 0.04), k2: -0.05 };
    const est = estimateLens(gridLines(trueL), W, H);
    expect(est.lens.k2).toBeDefined();
    expect(est.rmsAfter).toBeLessThan(0.5);
    // k1 e k2 são correlacionados: o que importa é o efeito. Corrigir com a lente estimada leva cada ponto de volta
    for (const x of [0, 1000, 2000, 3000, 4000]) {
      for (const y of [0, 750, 1500, 2250, 3000]) {
        const back = undistort(distort([x, y], trueL), est.lens);
        expect(Math.hypot(back[0] - x, back[1] - y), `(${x}, ${y})`).toBeLessThan(2); // px
      }
    }
    // o termo único sozinho deixaria curvatura residual bem maior
    const poucas = estimateLens(gridLines(trueL).slice(0, 5), W, H);
    expect(poucas.lens.k2).toBeUndefined(); // poucas linhas: não arrisca o segundo termo
  });

  it("não inventa k2 quando a lente só tem k1", () => {
    const est = estimateLens(gridLines(lensFor(W, H, 0.06)), W, H);
    expect(est.lens.k1).toBeCloseTo(0.06, 2);
    expect(est.lens.k2).toBeUndefined();
  });

  it("sem linhas válidas devolve lente neutra", () => {
    expect(estimateLens([[[0, 0], [1, 1]]], W, H).lens.k1).toBe(0);
  });
});

describe("solução da retificação", () => {
  it("leva os pontos de controle para o plano e mede exatamente na conferência", () => {
    const sol = solveRectification({
      controls: controls(),
      lens: lensFor(W, H, 0),
      // trena: 5 m na horizontal, a meia altura
      checks: [{ a: toImg([2.5, 3]), b: toImg([7.5, 3]), meters: 5 }],
    });
    controls().forEach((c) => {
      const [x, y] = apply(sol.Hip, c.img);
      expect(x).toBeCloseTo(c.plane[0], 6);
      expect(y).toBeCloseTo(c.plane[1], 6);
    });
    expect(sol.checks[0]!.measured).toBeCloseTo(5, 6);
    expect(Math.abs(sol.checks[0]!.errMm)).toBeLessThan(0.01);
    expect(sol.checkRmsMm).toBeLessThan(0.01);
  });

  it("detecta o erro quando a medida da trena não bate (conferência 2% maior)", () => {
    const sol = solveRectification({
      controls: controls(),
      lens: lensFor(W, H, 0),
      checks: [{ a: toImg([2.5, 3]), b: toImg([7.5, 3]), meters: 5.1 }],
    });
    expect(sol.checks[0]!.errPct).toBeCloseTo(-100 / 51, 1); // -1,96 %
    expect(sol.checkRmsMm).toBeGreaterThan(90);
  });

  it("a precisão estimada piora quando a conferência erra", () => {
    const ok = solveRectification({ controls: controls(), lens: lensFor(W, H, 0), checks: [{ a: toImg([2.5, 3]), b: toImg([7.5, 3]), meters: 5 }] });
    const bad = solveRectification({ controls: controls(), lens: lensFor(W, H, 0), checks: [{ a: toImg([2.5, 3]), b: toImg([7.5, 3]), meters: 5.1 }] });
    expect(ok.precisionMm).toBeGreaterThan(0);
    expect(bad.precisionMm).toBeGreaterThan(ok.precisionMm);
  });

  it("corrige a lente quando ela é conhecida", () => {
    const L = lensFor(W, H, 0.05);
    const sol = solveRectification({ controls: controls(L), lens: L, checks: [{ a: distort(toImg([2.5, 3]), L), b: distort(toImg([7.5, 3]), L), meters: 5 }] });
    expect(sol.checks[0]!.measured).toBeCloseTo(5, 5);
  });

  it("o RMS do resíduo divide pelos graus de liberdade (pontos − 4)", () => {
    // 6 pontos com ruído: RMS = sqrt(Σ r² / (6 − 4))
    const extra: Control[] = [
      { img: [toImg([5, 3])[0] + 3, toImg([5, 3])[1] - 2], plane: [5, 3] },
      { img: [toImg([2, 4])[0] - 2, toImg([2, 4])[1] + 3], plane: [2, 4] },
    ];
    const sol = solveRectification({ controls: [...controls(), ...extra], lens: lensFor(W, H, 0) });
    const soma = sol.residualsMm.reduce((s, r) => s + r * r, 0);
    expect(sol.residualsMm.some((r) => r > 1)).toBe(true);
    expect(sol.residualRmsMm).toBeCloseTo(Math.sqrt(soma / 2), 8);
  });

  it("com exatamente 4 pontos não há graus de liberdade para o RMS", () => {
    expect(solveRectification({ controls: controls(), lens: lensFor(W, H, 0) }).residualRmsMm).toBeNull();
  });

  it("com mais de 4 pontos, informa o resíduo de cada um", () => {
    const extra: Control = { img: toImg([5, 3]), plane: [5, 3] };
    const sol = solveRectification({ controls: [...controls(), extra], lens: lensFor(W, H, 0) });
    expect(sol.residualsMm).toHaveLength(5);
    expect(sol.residualRmsMm).not.toBeNull();
    expect(Math.max(...sol.residualsMm)).toBeLessThan(0.01);
  });
});

describe("validação dos pontos de controle", () => {
  // nenhum extra fica na diagonal dos cantos (três pontos alinhados quebrariam o ajuste sem eles)
  const planeExtra: Pt[] = [[3, 1], [7, 5], [2, 4], [8, 1], [5, 3]];
  const all = (shiftIndex: number | null, shiftPx = 0): Control[] =>
    [...corners, ...planeExtra].map((p, i) => {
      const q = toImg(p);
      return { img: i === shiftIndex ? ([q[0] + shiftPx, q[1] - shiftPx * 0.6] as Pt) : q, plane: p };
    });
  const solve = (c: Control[]) => solveRectification({ controls: c, lens: lensFor(W, H, 0) });

  it("dados exatos: ninguém é suspeito e o erro de previsão é desprezível", () => {
    const sol = solve(all(null));
    expect(sol.suspects).toEqual([]);
    expect(sol.looMm).toHaveLength(9);
    expect(sol.looRmsMm!).toBeLessThan(0.01);
  });

  it("um clique errado em um ponto extra é apontado como suspeito", () => {
    const sol = solve(all(6, 40)); // ponto de índice 6 deslocado 40 px
    expect(sol.suspects).toEqual([6]);
  });

  it("pontos de controle alinhados não derrubam a validação", () => {
    // o centro (5, 3) fica na diagonal dos cantos: sem um canto, sobram três pontos alinhados
    const sol = solve([...corners, [5, 3]].map((p) => ({ img: toImg(p as Pt), plane: p as Pt })));
    expect(sol.looMm).toHaveLength(5);
    expect(sol.looMm!.some((e) => e === null)).toBe(true);
    expect(Number.isFinite(sol.precisionMm)).toBe(true);
  });

  it("com 5 pontos há erro de previsão, mas ainda não dá para apontar o culpado", () => {
    const sol = solve(all(null).slice(0, 5));
    expect(sol.looMm).toHaveLength(5);
    expect(sol.suspects).toEqual([]);
    expect(solve(all(null).slice(0, 4)).looMm).toBeNull();
  });

  it("a precisão estimada considera o erro de previsão fora da amostra", () => {
    const limpo = solve(all(null));
    const sujo = solve(all(6, 40));
    expect(sujo.looRmsMm!).toBeGreaterThan(limpo.looRmsMm! + 100);
    expect(sujo.precisionMm).toBeGreaterThanOrEqual(1.96 * sujo.looRmsMm! * 0.999);
    expect(sujo.precisionMm).toBeGreaterThan(limpo.precisionMm);
  });
});

describe("extensão e resolução da saída", () => {
  const sol = solveRectification({ controls: controls(), lens: lensFor(W, H, 0) });
  const ref: Extent = [0, 0, 10, 6];

  it("o plano inteiro contém o retângulo de referência e respeita o limite de 1×", () => {
    const e = photoExtent(sol, W, H, ref);
    expect(e[0]).toBeLessThanOrEqual(0);
    expect(e[1]).toBeLessThanOrEqual(0);
    expect(e[2]).toBeGreaterThanOrEqual(10);
    expect(e[3]).toBeGreaterThanOrEqual(6);
    expect(e[0]).toBeGreaterThanOrEqual(-10);
    expect(e[2]).toBeLessThanOrEqual(20);
  });

  it("dimensiona a saída pela resolução da foto e limita o lado maior", () => {
    const out = outputSize(sol, corners.map(toImg), ref);
    expect(out.width).toBeGreaterThan(0);
    expect(out.height).toBeGreaterThan(0);
    expect(out.mmPerPixel).toBeGreaterThan(0);
    // proporção do retângulo de referência (10 × 6 m)
    expect(out.width / out.height).toBeCloseTo(10 / 6, 1);
    const small = outputSize(sol, corners.map(toImg), ref, 500);
    expect(Math.max(small.width, small.height)).toBeLessThanOrEqual(501);
    expect(small.mmPerPixel).toBeGreaterThan(out.mmPerPixel);
  });
});
