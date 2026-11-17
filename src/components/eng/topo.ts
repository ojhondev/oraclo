/**
 * Curvas de nível de um "terreno" sintético (soma de morros gaussianos e ondulações), extraídas
 * por marching squares. Puro (sem DOM): devolve um caminho SVG por nível, em coordenadas 0..w × 0..h.
 */

type Hill = { x: number; y: number; r: number; a: number };

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function topoPaths({ w, h, levels = 9, cols = 72, seed = 7 }: { w: number; h: number; levels?: number; cols?: number; seed?: number }) {
  const rand = rng(seed);
  const hills: Hill[] = Array.from({ length: 7 }, () => ({ x: rand(), y: rand(), r: 0.12 + rand() * 0.22, a: (rand() > 0.3 ? 1 : -0.6) * (0.5 + rand()) }));
  const field = (u: number, v: number) => {
    let z = 0.15 * Math.sin(u * 7.3 + v * 2.1) + 0.1 * Math.cos(v * 9.7 - u * 3.3);
    for (const hl of hills) {
      const dx = (u - hl.x) * (w / h);
      const dy = v - hl.y;
      z += hl.a * Math.exp(-(dx * dx + dy * dy) / (hl.r * hl.r));
    }
    return z;
  };
  const rows = Math.round(cols * (h / w));
  const g: number[][] = [];
  let lo = Infinity;
  let hi = -Infinity;
  for (let j = 0; j <= rows; j++) {
    const row: number[] = [];
    for (let i = 0; i <= cols; i++) {
      const z = field(i / cols, j / rows);
      row.push(z);
      lo = Math.min(lo, z);
      hi = Math.max(hi, z);
    }
    g.push(row);
  }
  const cw = w / cols;
  const ch = h / rows;
  const out: string[] = [];
  for (let l = 1; l <= levels; l++) {
    const t = lo + ((hi - lo) * l) / (levels + 1);
    let d = "";
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const a = g[j]![i]!, b = g[j]![i + 1]!, c = g[j + 1]![i + 1]!, e = g[j + 1]![i]!;
        const idx = (a > t ? 8 : 0) | (b > t ? 4 : 0) | (c > t ? 2 : 0) | (e > t ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        const x = i * cw;
        const y = j * ch;
        const lerp = (p: number, q: number) => (t - p) / (q - p);
        const top: [number, number] = [x + cw * lerp(a, b), y];
        const right: [number, number] = [x + cw, y + ch * lerp(b, c)];
        const bottom: [number, number] = [x + cw * lerp(e, c), y + ch];
        const left: [number, number] = [x, y + ch * lerp(a, e)];
        const seg = (p: [number, number], q: [number, number]) => (d += `M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${q[0].toFixed(1)} ${q[1].toFixed(1)}`);
        switch (idx) {
          case 1: case 14: seg(left, bottom); break;
          case 2: case 13: seg(bottom, right); break;
          case 3: case 12: seg(left, right); break;
          case 4: case 11: seg(top, right); break;
          case 5: seg(left, top); seg(bottom, right); break;
          case 6: case 9: seg(top, bottom); break;
          case 7: case 8: seg(left, top); break;
          case 10: seg(top, right); seg(left, bottom); break;
        }
      }
    }
    if (d) out.push(d);
  }
  return out;
}
