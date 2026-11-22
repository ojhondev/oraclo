/**
 * Detalhamento de um vão (janela-modelo de cada tipo): caixilho (montantes e travessas), moldura
 * em volta e arco/luneta acima. Tudo relativo ao vão, para ser aplicado a todos os vãos do mesmo
 * tipo (como um bloco de CAD). Puro, testado em tests/cadastro.test.ts.
 */
import type { Box } from "./analyze";
import type { Gray } from "./complete";
import { hSupport, vSupport, type Edges } from "./refine";

export type WindowDetail = {
  /** Montantes (verticais) e travessas (horizontais), em fração do vão (0..1, y a partir do topo). */
  mullionsX: number[];
  mullionsY: number[];
  /** Moldura: quanto ela se estende para fora do vão em cada lado, em fração da largura/altura. 0 = não achou. */
  frame: { top: number; bottom: number; left: number; right: number };
  /** Arco acima do vão: centro (dy a partir do topo do vão, negativo = acima) e raio, em fração da largura. */
  arch: { cy: number; r: number; inner: number | null } | null;
};

const movingAvg = (a: number[], k: number) =>
  a.map((_, i) => {
    let s = 0, n = 0;
    for (let j = Math.max(0, i - k); j <= Math.min(a.length - 1, i + k); j++) {
      s += a[j]!;
      n++;
    }
    return s / n;
  });

/**
 * Linhas internas de um perfil (média de tons ao longo de um eixo): picos ou vales que destoam da
 * média móvel, separados por pelo menos `minGap` e longe das bordas.
 */
export function profileLines(profile: number[], minGap: number): number[] {
  const n = profile.length;
  if (n < 8) return [];
  const smooth = movingAvg(profile, 1);
  const base = movingAvg(smooth, Math.max(3, Math.round(n * 0.12)));
  const dev = smooth.map((v, i) => v - base[i]!);
  // polaridade: caixilho claro sobre vidro escuro (picos) ou escuro sobre claro (vales)
  const pos = Math.max(...dev), neg = -Math.min(...dev);
  const sign = pos >= neg ? 1 : -1;
  const d = dev.map((v) => v * sign);
  const peak = Math.max(...d);
  if (peak < 6) return [];
  const cand: { i: number; v: number }[] = [];
  // linhas fracas (montantes finos) contam a partir de 30% da mais forte
  for (let i = 2; i < n - 2; i++) if (d[i]! >= Math.max(peak * 0.3, 5) && d[i]! >= d[i - 1]! && d[i]! >= d[i + 1]!) cand.push({ i, v: d[i]! });
  cand.sort((a, b) => b.v - a.v);
  const edge = Math.max(2, Math.round(n * 0.08));
  const picked: number[] = [];
  for (const c of cand) if (c.i > edge && c.i < n - 1 - edge && picked.every((p) => Math.abs(p - c.i) >= minGap)) picked.push(c.i);
  return picked.sort((a, b) => a - b).map((i) => Math.round((i / (n - 1)) * 1000) / 1000);
}

/** Primeiro deslocamento para fora (3 px até `max`) em que há uma borda paralela forte. */
function outward(f: (d: number) => number, max: number) {
  let best = 0, bestS = 0;
  for (let d = 3; d <= max; d++) {
    const s = f(d);
    if (s >= 0.5 && s > bestS) {
      bestS = s;
      best = d;
    } else if (bestS >= 0.5 && s < bestS * 0.6) break; // passou do pico da moldura
  }
  return best;
}

/** Apoio de borda ao longo de um arco superior (10° a 170°). */
function arcSupport(e: Edges, cx: number, cy: number, r: number) {
  let n = 0, tot = 0;
  for (let a = 10; a <= 170; a += 4) {
    const t = (a * Math.PI) / 180;
    const x = Math.round(cx + r * Math.cos(t));
    const y = Math.round(cy - r * Math.sin(t));
    if (x < 1 || y < 1 || x >= e.w - 1 || y >= e.h - 1) continue;
    tot++;
    let m = 0;
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const i = (y + dy) * e.w + (x + dx);
        m = Math.max(m, e.gx[i]!, e.gy[i]!);
      }
    if (m >= e.t) n++;
  }
  return tot ? n / tot : 0;
}

export function detailWindow(g: Gray, e: Edges, b: Box): WindowDetail {
  const x0 = Math.round(b.x0), x1 = Math.round(b.x1), y0 = Math.round(b.y0), y1 = Math.round(b.y1);
  const bw = x1 - x0, bh = y1 - y0;
  // caixilho: perfis de tom dentro do vão (sem as bordas)
  const ix0 = x0 + Math.round(bw * 0.06), ix1 = x1 - Math.round(bw * 0.06);
  const iy0 = y0 + Math.round(bh * 0.06), iy1 = y1 - Math.round(bh * 0.06);
  const colProf: number[] = [];
  for (let x = x0; x <= x1; x++) {
    let s = 0;
    for (let y = iy0; y <= iy1; y++) s += g.data[y * g.w + x]!;
    colProf.push(s / Math.max(1, iy1 - iy0 + 1));
  }
  const rowProf: number[] = [];
  for (let y = y0; y <= y1; y++) {
    let s = 0;
    for (let x = ix0; x <= ix1; x++) s += g.data[y * g.w + x]!;
    rowProf.push(s / Math.max(1, ix1 - ix0 + 1));
  }
  const mullionsX = profileLines(colProf, Math.max(3, Math.round(bw * 0.12)));
  const mullionsY = profileLines(rowProf, Math.max(3, Math.round(bh * 0.1)));

  // moldura: próxima borda paralela forte por fora de cada lado
  const top = outward((d) => hSupport(e, y0 - d, x0, x1), Math.round(bh * 0.3));
  const bottom = outward((d) => hSupport(e, y1 + d, x0, x1), Math.round(bh * 0.3));
  const left = outward((d) => vSupport(e, x0 - d, y0, y1), Math.round(bw * 0.35));
  const right = outward((d) => vSupport(e, x1 + d, y0, y1), Math.round(bw * 0.35));
  const frame = { top: top / bh, bottom: bottom / bh, left: left / bw, right: right / bw };

  // arco: semicírculo acima do vão (luneta, verga em arco), centrado no eixo do vão
  const cx = (x0 + x1) / 2;
  const outerW = bw + left + right;
  const topY = y0 - top;
  let arch: WindowDetail["arch"] = null;
  let best = 0;
  for (let r = outerW * 0.42; r <= outerW * 0.7; r += Math.max(1, outerW * 0.02))
    for (let cy = topY - outerW * 0.25; cy <= topY + outerW * 0.1; cy += Math.max(1, outerW * 0.02)) {
      const s = arcSupport(e, cx, cy, r);
      if (s > best) {
        best = s;
        arch = { cy: (cy - y0) / bw, r: r / bw, inner: null };
      }
    }
  // prova de controle: o mesmo arco deslocado meia largura para os lados não pode ter quase o mesmo
  // apoio (senão é textura de pedra, não arco)
  if (arch) {
    const R = arch.r * bw, CY = y0 + arch.cy * bw;
    const control = Math.max(arcSupport(e, cx - outerW * 0.5, CY, R), arcSupport(e, cx + outerW * 0.5, CY, R));
    if (best < 0.62 || best - control < 0.25) arch = null;
  }
  if (!arch) arch = null;
  else {
    // anel do arco: segundo arco concêntrico mais interno
    const R = arch.r * bw, CY = y0 + arch.cy * bw;
    let bi = 0, inner: number | null = null;
    for (let r = R * 0.7; r <= R * 0.94; r += Math.max(1, R * 0.02)) {
      const s = arcSupport(e, cx, CY, r);
      if (s > bi) {
        bi = s;
        inner = r / bw;
      }
    }
    if (bi >= 0.5) arch.inner = inner;
  }
  return { mullionsX, mullionsY, frame, arch };
}
