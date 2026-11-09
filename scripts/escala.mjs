// Escala automática pelo marcador ArchRay: acha os marcadores ArUco nos quadros, usa as câmeras
// calculadas pela fotogrametria (OpenSfM) para medir o marcador no modelo e compara com o tamanho real.
// Funções puras testadas em tests/escala.test.ts; a leitura das imagens fica em detectInImage.
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { AR } = require("js-aruco2");

/**
 * O marcador impresso (folha A4): dois quadrados ArUco do dicionário ARUCO_MIP_36h12.
 * `side` é o lado do quadrado preto, em metros; `gap` é a distância entre os centros.
 * Mudou aqui, mude também a página /marcador.
 */
export const MARKER = { dictionary: "ARUCO_MIP_36h12", ids: [7, 23], side: 0.09, gap: 0.16 };

/** Diferença tolerada entre as medidas independentes (lados de cada quadrado e distância entre eles). */
export const MAX_SPREAD = 0.03;

let detector = null;
/** Acha os marcadores numa imagem RGBA. Devolve [{ id, corners: [[x,y]×4] }] em pixels. */
export function detectMarkers(width, height, rgba) {
  detector ??= new AR.Detector({ dictionaryName: MARKER.dictionary });
  return detector
    .detectImage(width, height, rgba)
    .filter((m) => MARKER.ids.includes(m.id))
    .map((m) => ({ id: m.id, corners: m.corners.map((c) => [c.x, c.y]) }));
}

/** SVG de um marcador (para a página de impressão e para os testes). */
export function markerSvg(id) {
  return new AR.Dictionary(MARKER.dictionary).generateSVG(id);
}

/* ── geometria ── */
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a) => Math.hypot(a[0], a[1], a[2]);

/** Rotação de Rodrigues (OpenSfM: mundo → câmera). */
export function rodrigues(r) {
  const th = Math.hypot(r[0], r[1], r[2]);
  if (th < 1e-12) return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const [x, y, z] = r.map((v) => v / th);
  const c = Math.cos(th), s = Math.sin(th), C = 1 - c;
  return [c + x * x * C, x * y * C - z * s, x * z * C + y * s, y * x * C + z * s, c + y * y * C, y * z * C - x * s, z * x * C - y * s, z * y * C + x * s, c + z * z * C];
}
const mul = (R, v) => [R[0] * v[0] + R[1] * v[1] + R[2] * v[2], R[3] * v[0] + R[4] * v[1] + R[5] * v[2], R[6] * v[0] + R[7] * v[1] + R[8] * v[2]];

/** Pixel → raio normalizado da câmera (sem distorção), no modelo de câmera do OpenSfM. */
export function bearing(camera, px, py, width, height) {
  const s = Math.max(width, height);
  const nx = (px + 0.5 - width / 2) / s;
  const ny = (py + 0.5 - height / 2) / s;
  const brown = camera.projection_type === "brown";
  const fx = brown ? camera.focal_x : camera.focal;
  const fy = brown ? camera.focal_y : camera.focal;
  const dx = (nx - (brown ? camera.c_x ?? 0 : 0)) / fx;
  const dy = (ny - (brown ? camera.c_y ?? 0 : 0)) / fy;
  const k1 = camera.k1 ?? 0, k2 = camera.k2 ?? 0, k3 = brown ? camera.k3 ?? 0 : 0;
  const p1 = brown ? camera.p1 ?? 0 : 0, p2 = brown ? camera.p2 ?? 0 : 0;
  // inverte a distorção por iteração (converge rápido para lentes de celular)
  let x = dx, y = dy;
  for (let i = 0; i < 20; i++) {
    const r2 = x * x + y * y;
    const rad = 1 + k1 * r2 + k2 * r2 * r2 + k3 * r2 * r2 * r2;
    const tx = 2 * p1 * x * y + p2 * (r2 + 2 * x * x);
    const ty = p1 * (r2 + 2 * y * y) + 2 * p2 * x * y;
    x = (dx - tx) / rad;
    y = (dy - ty) / rad;
  }
  return [x, y, 1];
}

/** Projeta um ponto do mundo num pixel (inverso de bearing; usado nos testes). */
export function project(camera, shot, X, width, height) {
  const R = rodrigues(shot.rotation);
  const c = mul(R, X).map((v, i) => v + shot.translation[i]);
  let x = c[0] / c[2], y = c[1] / c[2];
  const brown = camera.projection_type === "brown";
  const k1 = camera.k1 ?? 0, k2 = camera.k2 ?? 0, k3 = brown ? camera.k3 ?? 0 : 0;
  const p1 = brown ? camera.p1 ?? 0 : 0, p2 = brown ? camera.p2 ?? 0 : 0;
  const r2 = x * x + y * y;
  const rad = 1 + k1 * r2 + k2 * r2 * r2 + k3 * r2 * r2 * r2;
  [x, y] = [x * rad + 2 * p1 * x * y + p2 * (r2 + 2 * x * x), y * rad + p1 * (r2 + 2 * y * y) + 2 * p2 * x * y];
  const fx = brown ? camera.focal_x : camera.focal, fy = brown ? camera.focal_y : camera.focal;
  const s = Math.max(width, height);
  return [(x * fx + (brown ? camera.c_x ?? 0 : 0)) * s + width / 2 - 0.5, (y * fy + (brown ? camera.c_y ?? 0 : 0)) * s + height / 2 - 0.5];
}

/** Triangula um ponto visto por várias câmeras: [{ shot, ray }] → [x,y,z] (mínimos quadrados). */
export function triangulate(views) {
  if (views.length < 2) return null;
  const A = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const b = [0, 0, 0];
  for (const { shot, ray } of views) {
    const R = rodrigues(shot.rotation);
    const t = shot.translation;
    // direção no mundo e centro da câmera: C = -Rᵀt, d = Rᵀ·ray
    const Rt = [R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]];
    const d = mul(Rt, ray);
    const dn = norm(d);
    const u = d.map((v) => v / dn);
    const C = mul(Rt, t).map((v) => -v);
    // (I − uuᵀ)(X − C) = 0
    const M = [1 - u[0] * u[0], -u[0] * u[1], -u[0] * u[2], -u[1] * u[0], 1 - u[1] * u[1], -u[1] * u[2], -u[2] * u[0], -u[2] * u[1], 1 - u[2] * u[2]];
    for (let i = 0; i < 9; i++) A[i] += M[i];
    const mc = mul(M, C);
    for (let i = 0; i < 3; i++) b[i] += mc[i];
  }
  // resolve A·X = b (3×3, Cramer)
  const det = (m) => m[0] * (m[4] * m[8] - m[5] * m[7]) - m[1] * (m[3] * m[8] - m[5] * m[6]) + m[2] * (m[3] * m[7] - m[4] * m[6]);
  const D = det(A);
  if (Math.abs(D) < 1e-12) return null;
  const col = (k) => A.map((v, i) => (i % 3 === k ? b[Math.floor(i / 3)] : v));
  return [det(col(0)) / D, det(col(1)) / D, det(col(2)) / D];
}

/** Ângulo máximo entre os raios: com raios quase paralelos a triangulação não vale. */
function maxAngle(views) {
  const dirs = views.map(({ shot, ray }) => {
    const R = rodrigues(shot.rotation);
    const d = mul([R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]], ray);
    const n = norm(d);
    return d.map((v) => v / n);
  });
  let best = 0;
  for (let i = 0; i < dirs.length; i++) for (let j = i + 1; j < dirs.length; j++) {
    const c = Math.min(1, Math.abs(dirs[i][0] * dirs[j][0] + dirs[i][1] * dirs[j][1] + dirs[i][2] * dirs[j][2]));
    best = Math.max(best, Math.acos(c));
  }
  return (best * 180) / Math.PI;
}

/**
 * Escala a partir das detecções: detections = [{ image, width, height, markers }], reconstruction = o
 * maior bloco do reconstruction.json. Devolve null (sem marcador suficiente) ou o resultado com a
 * conferência entre medidas independentes.
 */
export function scaleFromDetections(detections, reconstruction) {
  const obs = new Map(); // "id:canto" → views
  for (const d of detections) {
    const shot = reconstruction.shots[d.image];
    if (!shot) continue;
    const camera = reconstruction.cameras[shot.camera];
    if (!camera) continue;
    for (const m of d.markers) {
      m.corners.forEach(([x, y], k) => {
        const key = `${m.id}:${k}`;
        if (!obs.has(key)) obs.set(key, []);
        obs.get(key).push({ shot, ray: bearing(camera, x, y, d.width, d.height) });
      });
    }
  }
  const corners = {};
  for (const [key, views] of obs) {
    if (views.length < 3 || maxAngle(views) < 3) continue;
    const p = triangulate(views);
    if (p) corners[key] = { p, views: views.length };
  }
  const measures = []; // { kind, units, meters }
  const centers = {};
  for (const id of MARKER.ids) {
    const c = [0, 1, 2, 3].map((k) => corners[`${id}:${k}`]?.p);
    if (c.some((p) => !p)) continue;
    for (let k = 0; k < 4; k++) measures.push({ kind: `lado ${id}`, units: norm(sub(c[k], c[(k + 1) % 4])), meters: MARKER.side, a: c[k], b: c[(k + 1) % 4] });
    centers[id] = [0, 1, 2].map((i) => (c[0][i] + c[1][i] + c[2][i] + c[3][i]) / 4);
  }
  const [ia, ib] = MARKER.ids;
  if (centers[ia] && centers[ib]) measures.push({ kind: "entre marcadores", units: norm(sub(centers[ia], centers[ib])), meters: MARKER.gap, a: centers[ia], b: centers[ib] });
  if (!measures.length) return null;

  const factors = measures.map((m) => m.meters / m.units).sort((x, y) => x - y);
  // mediana: um canto mal detectado não puxa o resultado
  const factor = factors[Math.floor(factors.length / 2)];
  const spread = factors.length > 1 ? factors[factors.length - 1] / factors[0] - 1 : null;
  // a medida mais longa e confiável vira a referência gravada (dois pontos, como na calibração manual)
  const ref = measures.find((m) => m.kind === "entre marcadores") ?? measures[0];
  return {
    factor,
    meters: ref.meters,
    a: ref.a,
    b: ref.b,
    markers: Object.keys(centers).length,
    measures: measures.length,
    spread,
    images: detections.filter((d) => d.markers.length).length,
    doubtful: spread == null || spread > MAX_SPREAD || Object.keys(centers).length < 2,
  };
}
