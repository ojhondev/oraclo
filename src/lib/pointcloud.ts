/**
 * Leitores de nuvem de pontos para o navegador: LAS (não compactado), PLY (ascii e
 * binário) e texto (XYZ/PTS/TXT). As coordenadas são lidas em precisão dupla e
 * recentradas antes de virar Float32 — sem isso, nuvens georreferenciadas (UTM, na
 * casa dos 7.000.000 m) perdem precisão de dezenas de centímetros.
 * Nuvens muito grandes são reduzidas (amostragem regular) para caber no navegador.
 */

export type PointCloud = {
  positions: Float32Array; // xyz relativos à origem
  colors: Uint8Array | null; // rgb 0–255
  count: number;
  total: number; // pontos no arquivo (antes da redução)
  origin: [number, number, number]; // deslocamento somado de volta para coordenadas reais
  min: [number, number, number]; // relativos
  max: [number, number, number];
};

export const MAX_POINTS = 6_000_000;

class Builder {
  positions: Float32Array;
  colors: Uint8Array | null;
  n = 0;
  min: [number, number, number] = [Infinity, Infinity, Infinity];
  max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  constructor(capacity: number, hasColor: boolean, public origin: [number, number, number]) {
    this.positions = new Float32Array(capacity * 3);
    this.colors = hasColor ? new Uint8Array(capacity * 3) : null;
  }
  push(x: number, y: number, z: number, r = 0, g = 0, b = 0) {
    const i = this.n * 3;
    if (i + 3 > this.positions.length) return;
    const px = x - this.origin[0];
    const py = y - this.origin[1];
    const pz = z - this.origin[2];
    this.positions[i] = px;
    this.positions[i + 1] = py;
    this.positions[i + 2] = pz;
    if (this.colors) {
      this.colors[i] = r;
      this.colors[i + 1] = g;
      this.colors[i + 2] = b;
    }
    if (px < this.min[0]) this.min[0] = px;
    if (py < this.min[1]) this.min[1] = py;
    if (pz < this.min[2]) this.min[2] = pz;
    if (px > this.max[0]) this.max[0] = px;
    if (py > this.max[1]) this.max[1] = py;
    if (pz > this.max[2]) this.max[2] = pz;
    this.n++;
  }
  done(total: number): PointCloud {
    return {
      positions: this.positions.subarray(0, this.n * 3),
      colors: this.colors ? this.colors.subarray(0, this.n * 3) : null,
      count: this.n,
      total,
      origin: this.origin,
      min: this.min,
      max: this.max,
    };
  }
}

/* ───────────── LAS ───────────── */

const LAS_RGB_OFFSET: Record<number, number> = { 2: 20, 3: 28, 5: 28, 7: 30, 8: 30, 10: 30 };

export function parseLAS(buf: ArrayBuffer): PointCloud {
  const dv = new DataView(buf);
  const sig = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3));
  if (sig !== "LASF") throw new Error("Arquivo LAS inválido.");
  const headerSize = dv.getUint16(94, true);
  const dataOffset = dv.getUint32(96, true);
  const rawFormat = dv.getUint8(104);
  if (rawFormat & 0x80) throw new Error("Este LAS está compactado (LAZ). Envie em LAS sem compactação ou PLY para visualizar.");
  const format = rawFormat & 0x3f;
  const recLen = dv.getUint16(105, true);
  let total = dv.getUint32(107, true);
  if (headerSize >= 375) {
    const big = Number(dv.getBigUint64(247, true));
    if (big > 0) total = big;
  }
  total = Math.min(total, Math.floor((buf.byteLength - dataOffset) / recLen));
  const scale = [dv.getFloat64(131, true), dv.getFloat64(139, true), dv.getFloat64(147, true)];
  const off = [dv.getFloat64(155, true), dv.getFloat64(163, true), dv.getFloat64(171, true)];
  const maxX = dv.getFloat64(179, true), minX = dv.getFloat64(187, true);
  const maxY = dv.getFloat64(195, true), minY = dv.getFloat64(203, true);
  const minZ = dv.getFloat64(219, true);
  // origem no centro da planta e na cota mínima (cabeçalho); se o cabeçalho vier zerado, usa o offset
  const origin: [number, number, number] =
    Number.isFinite(minX + maxX + minY + maxY + minZ) && maxX >= minX
      ? [(minX + maxX) / 2, (minY + maxY) / 2, minZ]
      : [off[0]!, off[1]!, off[2]!];

  const rgbAt = LAS_RGB_OFFSET[format];
  const stride = Math.max(1, Math.ceil(total / MAX_POINTS));
  const b = new Builder(Math.ceil(total / stride), rgbAt != null, origin);
  // cores LAS são 16 bits; muitos softwares gravam 0–255 — detecta pela amostra
  let colorShift = 0;
  if (rgbAt != null) {
    for (let i = 0; i < Math.min(total, 2000); i++) {
      const p = dataOffset + i * recLen + rgbAt;
      if (dv.getUint16(p, true) > 255 || dv.getUint16(p + 2, true) > 255 || dv.getUint16(p + 4, true) > 255) {
        colorShift = 8;
        break;
      }
    }
  }
  for (let i = 0; i < total; i += stride) {
    const p = dataOffset + i * recLen;
    const x = dv.getInt32(p, true) * scale[0]! + off[0]!;
    const y = dv.getInt32(p + 4, true) * scale[1]! + off[1]!;
    const z = dv.getInt32(p + 8, true) * scale[2]! + off[2]!;
    if (rgbAt != null) {
      const q = p + rgbAt;
      b.push(x, y, z, dv.getUint16(q, true) >> colorShift, dv.getUint16(q + 2, true) >> colorShift, dv.getUint16(q + 4, true) >> colorShift);
    } else b.push(x, y, z);
  }
  return b.done(total);
}

/* ───────────── PLY ───────────── */

const PLY_TYPES: Record<string, [number, (dv: DataView, o: number, le: boolean) => number]> = {
  char: [1, (d, o) => d.getInt8(o)], int8: [1, (d, o) => d.getInt8(o)],
  uchar: [1, (d, o) => d.getUint8(o)], uint8: [1, (d, o) => d.getUint8(o)],
  short: [2, (d, o, l) => d.getInt16(o, l)], int16: [2, (d, o, l) => d.getInt16(o, l)],
  ushort: [2, (d, o, l) => d.getUint16(o, l)], uint16: [2, (d, o, l) => d.getUint16(o, l)],
  int: [4, (d, o, l) => d.getInt32(o, l)], int32: [4, (d, o, l) => d.getInt32(o, l)],
  uint: [4, (d, o, l) => d.getUint32(o, l)], uint32: [4, (d, o, l) => d.getUint32(o, l)],
  float: [4, (d, o, l) => d.getFloat32(o, l)], float32: [4, (d, o, l) => d.getFloat32(o, l)],
  double: [8, (d, o, l) => d.getFloat64(o, l)], float64: [8, (d, o, l) => d.getFloat64(o, l)],
};

export function parsePLY(buf: ArrayBuffer): PointCloud {
  const bytes = new Uint8Array(buf);
  const head = new TextDecoder().decode(bytes.subarray(0, Math.min(bytes.length, 65536)));
  const endIdx = head.indexOf("end_header");
  if (!head.startsWith("ply") || endIdx < 0) throw new Error("Arquivo PLY inválido.");
  const lineEnd = head.indexOf("\n", endIdx);
  const bodyStart = new TextEncoder().encode(head.slice(0, lineEnd + 1)).length;
  const lines = head.slice(0, endIdx).split(/\r?\n/);
  const format = lines.find((l) => l.startsWith("format"))?.split(/\s+/)[1] ?? "ascii";
  const elements: { name: string; count: number; props: { name: string; type: string; list?: [string, string] }[] }[] = [];
  for (const l of lines) {
    const t = l.trim().split(/\s+/);
    if (t[0] === "element") elements.push({ name: t[1]!, count: Number(t[2]), props: [] });
    else if (t[0] === "property" && elements.length) {
      const el = elements[elements.length - 1]!;
      if (t[1] === "list") el.props.push({ name: t[4]!, type: "list", list: [t[2]!, t[3]!] });
      else el.props.push({ name: t[2]!, type: t[1]! });
    }
  }
  if (elements[0]?.name !== "vertex") throw new Error("PLY sem vértices no início do arquivo.");
  const vertex = elements[0]!;
  const idx = (names: string[]) => vertex.props.findIndex((p) => names.includes(p.name));
  const ix = idx(["x"]), iy = idx(["y"]), iz = idx(["z"]);
  const ir = idx(["red", "r", "diffuse_red"]), ig = idx(["green", "g", "diffuse_green"]), ib = idx(["blue", "b", "diffuse_blue"]);
  if (ix < 0 || iy < 0 || iz < 0) throw new Error("PLY sem coordenadas x, y, z.");
  const hasColor = ir >= 0 && ig >= 0 && ib >= 0;
  const total = vertex.count;
  const stride = Math.max(1, Math.ceil(total / MAX_POINTS));

  if (format === "ascii") {
    const text = new TextDecoder().decode(bytes.subarray(bodyStart));
    let pos = 0;
    let origin: [number, number, number] | null = null;
    let b: Builder | null = null;
    for (let i = 0; i < total; i++) {
      const nl = text.indexOf("\n", pos);
      const line = text.slice(pos, nl < 0 ? undefined : nl);
      pos = nl + 1;
      if (i % stride) continue;
      const v = line.trim().split(/\s+/).map(Number);
      if (!origin) {
        origin = [v[ix]!, v[iy]!, v[iz]!];
        b = new Builder(Math.ceil(total / stride), hasColor, origin);
      }
      b!.push(v[ix]!, v[iy]!, v[iz]!, hasColor ? v[ir]! : 0, hasColor ? v[ig]! : 0, hasColor ? v[ib]! : 0);
    }
    if (!b) throw new Error("PLY vazio.");
    return b.done(total);
  }

  const le = format === "binary_little_endian";
  if (vertex.props.some((p) => p.type === "list")) throw new Error("PLY com listas nos vértices não é suportado.");
  const offsets: number[] = [];
  let recLen = 0;
  for (const p of vertex.props) {
    const t = PLY_TYPES[p.type];
    if (!t) throw new Error(`Tipo de propriedade PLY desconhecido: ${p.type}`);
    offsets.push(recLen);
    recLen += t[0];
  }
  const read = (k: number) => PLY_TYPES[vertex.props[k]!.type]![1];
  const rx = read(ix), ry = read(iy), rz = read(iz);
  const rr = hasColor ? read(ir) : null, rg = hasColor ? read(ig) : null, rb = hasColor ? read(ib) : null;
  const colorIs16 = hasColor && ["ushort", "uint16"].includes(vertex.props[ir]!.type);
  const colorIsFloat = hasColor && ["float", "float32", "double", "float64"].includes(vertex.props[ir]!.type);
  const dv = new DataView(buf);
  const o0 = bodyStart;
  const origin: [number, number, number] = [rx(dv, o0 + offsets[ix]!, le), ry(dv, o0 + offsets[iy]!, le), rz(dv, o0 + offsets[iz]!, le)];
  const b = new Builder(Math.ceil(total / stride), hasColor, origin);
  const conv = (c: number) => (colorIsFloat ? Math.round(c * 255) : colorIs16 ? c >> 8 : c);
  const n = Math.min(total, Math.floor((buf.byteLength - o0) / recLen));
  for (let i = 0; i < n; i += stride) {
    const p = o0 + i * recLen;
    b.push(
      rx(dv, p + offsets[ix]!, le),
      ry(dv, p + offsets[iy]!, le),
      rz(dv, p + offsets[iz]!, le),
      rr ? conv(rr(dv, p + offsets[ir]!, le)) : 0,
      rg ? conv(rg(dv, p + offsets[ig]!, le)) : 0,
      rb ? conv(rb(dv, p + offsets[ib]!, le)) : 0,
    );
  }
  return b.done(total);
}

/* ───────────── XYZ / PTS / TXT ───────────── */

export function parseXYZ(buf: ArrayBuffer): PointCloud {
  const text = new TextDecoder().decode(buf);
  const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#") && !l.startsWith("//"));
  // PTS começa com a contagem numa linha só
  if (lines[0] && /^\s*\d+\s*$/.test(lines[0])) lines.shift();
  const first = lines[0]?.trim().split(/[\s,;]+/).map(Number) ?? [];
  if (first.length < 3 || first.slice(0, 3).some((v) => !Number.isFinite(v))) throw new Error("Arquivo de pontos em texto inválido (esperado: x y z [r g b]).");
  // 6 colunas = x y z r g b; 7 colunas = x y z intensidade r g b (PTS)
  const rgbAt = first.length >= 7 ? 4 : first.length === 6 ? 3 : -1;
  const total = lines.length;
  const stride = Math.max(1, Math.ceil(total / MAX_POINTS));
  const b = new Builder(Math.ceil(total / stride), rgbAt >= 0, [first[0]!, first[1]!, first[2]!]);
  for (let i = 0; i < total; i += stride) {
    const v = lines[i]!.trim().split(/[\s,;]+/).map(Number);
    if (rgbAt >= 0) b.push(v[0]!, v[1]!, v[2]!, v[rgbAt]!, v[rgbAt + 1]!, v[rgbAt + 2]!);
    else b.push(v[0]!, v[1]!, v[2]!);
  }
  return b.done(total);
}

export function parsePointCloud(format: string, buf: ArrayBuffer) {
  if (format === "las") return parseLAS(buf);
  if (format === "ply") return parsePLY(buf);
  return parseXYZ(buf);
}
