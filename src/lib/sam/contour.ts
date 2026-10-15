// Máscara binária → polígono simplificado. Funções puras (rodam no worker do SAM).

export type XY = [number, number];

/** Rótulos dos componentes 4-conexos de `mask` (0 = fundo). Devolve rótulos e tamanho de cada um. */
function label(mask: Uint8Array, w: number, h: number) {
  const lab = new Int32Array(w * h);
  const sizes = [0];
  const stack: number[] = [];
  for (let i = 0; i < w * h; i++) {
    if (!mask[i] || lab[i]) continue;
    const id = sizes.length;
    let n = 0;
    lab[i] = id;
    stack.push(i);
    while (stack.length) {
      const j = stack.pop()!;
      n++;
      const x = j % w;
      if (x > 0 && mask[j - 1] && !lab[j - 1]) { lab[j - 1] = id; stack.push(j - 1); }
      if (x < w - 1 && mask[j + 1] && !lab[j + 1]) { lab[j + 1] = id; stack.push(j + 1); }
      if (j >= w && mask[j - w] && !lab[j - w]) { lab[j - w] = id; stack.push(j - w); }
      if (j < w * (h - 1) && mask[j + w] && !lab[j + w]) { lab[j + w] = id; stack.push(j + w); }
    }
    sizes.push(n);
  }
  return { lab, sizes };
}

/** Contorno externo (Moore, 8-vizinhos) do componente `id`, a partir do pixel mais acima/à esquerda. */
function trace(lab: Int32Array, w: number, h: number, id: number): XY[] {
  let start = -1;
  for (let i = 0; i < w * h; i++) if (lab[i] === id) { start = i; break; }
  if (start < 0) return [];
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && lab[y * w + x] === id;
  // vizinhos no sentido horário, começando à esquerda
  const dx = [-1, -1, 0, 1, 1, 1, 0, -1];
  const dy = [0, -1, -1, -1, 0, 1, 1, 1];
  const sx = start % w;
  const sy = (start - sx) / w;
  const out: XY[] = [[sx, sy]];
  let x = sx;
  let y = sy;
  let dir = 0; // de onde viemos (o pixel à esquerda do inicial é fundo)
  let firstMove = -1;
  const limit = 4 * w * h;
  for (let step = 0; step < limit; step++) {
    let move = -1;
    for (let k = 0; k < 8; k++) {
      const d = (dir + k) % 8;
      if (inside(x + dx[d]!, y + dy[d]!)) {
        move = d;
        break;
      }
    }
    if (move < 0) break; // pixel isolado
    // critério de Jacob: só termina ao sair do início na mesma direção da primeira vez
    if (x === sx && y === sy) {
      if (move === firstMove) break;
      if (firstMove < 0) firstMove = move;
    }
    x += dx[move]!;
    y += dy[move]!;
    dir = (move + 6) % 8; // recomeça a busca 90° antes da direção tomada
    if (!(x === sx && y === sy)) out.push([x, y]);
  }
  return out;
}

function dpRec(p: XY[], a: number, b: number, eps: number, keep: Uint8Array) {
  let max = 0;
  let idx = -1;
  const [ax, ay] = p[a]!;
  const [bx, by] = p[b]!;
  const len = Math.hypot(bx - ax, by - ay) || 1;
  for (let i = a + 1; i < b; i++) {
    const [px, py] = p[i]!;
    const d = Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / len;
    if (d > max) { max = d; idx = i; }
  }
  if (idx >= 0 && max > eps) {
    keep[idx] = 1;
    dpRec(p, a, idx, eps, keep);
    dpRec(p, idx, b, eps, keep);
  }
}

/** Douglas–Peucker para polígono fechado (divide no ponto mais distante do primeiro). */
export function simplifyClosed(p: XY[], eps: number): XY[] {
  if (p.length <= 4) return p;
  let far = 0;
  let best = -1;
  for (let i = 1; i < p.length; i++) {
    const d = Math.hypot(p[i]![0] - p[0]![0], p[i]![1] - p[0]![1]);
    if (d > best) { best = d; far = i; }
  }
  const ring = [...p, p[0]!];
  const keep = new Uint8Array(ring.length);
  keep[0] = keep[far] = keep[ring.length - 1] = 1;
  dpRec(ring, 0, far, eps, keep);
  dpRec(ring, far, ring.length - 1, eps, keep);
  return ring.filter((_, i) => keep[i]).slice(0, -1);
}

/**
 * Polígono do objeto da máscara: une os componentes que contêm algum ponto positivo
 * (ou usa o maior, se nenhum contém), contorna o maior deles e simplifica até `maxVertices`.
 */
export function maskToPolygon(mask: Uint8Array, w: number, h: number, seeds: XY[], maxVertices = 80): XY[] {
  const { lab, sizes } = label(mask, w, h);
  if (sizes.length <= 1) return [];
  let id = 0;
  for (const [sx, sy] of seeds) {
    const x = Math.round(sx);
    const y = Math.round(sy);
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const l = lab[y * w + x]!;
    if (l && (!id || sizes[l]! > sizes[id]!)) id = l;
  }
  if (!id) for (let i = 1; i < sizes.length; i++) if (!id || sizes[i]! > sizes[id]!) id = i;
  if (sizes[id]! < 9) return [];
  const ring = trace(lab, w, h, id);
  if (ring.length < 3) return [];
  const simplify = (r: XY[], max: number, base: number) => {
    let eps = base;
    let p = simplifyClosed(r, eps);
    while (p.length > max) {
      eps *= 1.4;
      p = simplifyClosed(r, eps);
    }
    return p;
  };
  const eps = Math.max(1, Math.sqrt(sizes[id]!) / 120);
  let poly = simplify(ring, maxVertices, eps);
  if (poly.length < 3) return [];
  // furos (ex.: janela dentro de uma mancha): descontados com um "corte" até o contorno externo
  for (const hole of holes(lab, w, h, id, sizes[id]!)) {
    const hp = simplify(hole, 24, eps);
    if (hp.length >= 3) poly = bridge(poly, hp);
  }
  return poly;
}

function signedArea(p: XY[]) {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i]!;
    const [x2, y2] = p[(i + 1) % p.length]!;
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

/** Contornos dos vazios do componente `id` (fundo cercado por ele), do maior ao menor. */
function holes(lab: Int32Array, w: number, h: number, id: number, size: number): XY[][] {
  const inv = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) inv[i] = lab[i] === id ? 0 : 1;
  const bg = label(inv, w, h);
  // fundo que toca a borda não é furo
  const outside = new Set<number>();
  for (let x = 0; x < w; x++) {
    outside.add(bg.lab[x]!);
    outside.add(bg.lab[(h - 1) * w + x]!);
  }
  for (let y = 0; y < h; y++) {
    outside.add(bg.lab[y * w]!);
    outside.add(bg.lab[y * w + w - 1]!);
  }
  const min = Math.max(64, size * 0.004);
  const ids: number[] = [];
  for (let i = 1; i < bg.sizes.length; i++) if (!outside.has(i) && bg.sizes[i]! >= min) ids.push(i);
  return ids
    .sort((a, b) => bg.sizes[b]! - bg.sizes[a]!)
    .slice(0, 8)
    .map((i) => trace(bg.lab, w, h, i))
    .filter((r) => r.length >= 3);
}

/** Junta um furo ao polígono num anel único (orientação inversa), ligando os vértices mais próximos. */
function bridge(outer: XY[], hole: XY[]): XY[] {
  const hl = Math.sign(signedArea(outer)) === Math.sign(signedArea(hole)) ? [...hole].reverse() : hole;
  let bi = 0;
  let bj = 0;
  let best = Infinity;
  for (let i = 0; i < outer.length; i++) {
    for (let j = 0; j < hl.length; j++) {
      const d = (outer[i]![0] - hl[j]![0]) ** 2 + (outer[i]![1] - hl[j]![1]) ** 2;
      if (d < best) {
        best = d;
        bi = i;
        bj = j;
      }
    }
  }
  const h = [...hl.slice(bj), ...hl.slice(0, bj), hl[bj]!];
  return [...outer.slice(0, bi + 1), ...h, outer[bi]!, ...outer.slice(bi + 1)];
}
