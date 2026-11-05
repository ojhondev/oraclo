// Partes puras do motor 3D (sem rede nem processo), testadas em tests/motor.test.ts.
import { closeSync, openSync, readSync } from "node:fs";

/** Etapa do ODM → etapa mostrada no ArchRay e progresso ao iniciá-la (%). */
export const ODM_STAGES = {
  dataset: ["triagem", 5],
  split: ["triagem", 8],
  merge: ["triagem", 9],
  opensfm: ["alinhamento", 10],
  openmvs: ["nuvem_densa", 40],
  odm_filterpoints: ["nuvem_densa", 58],
  odm_meshing: ["malha", 62],
  mvs_texturing: ["malha", 72],
  odm_georeferencing: ["otimizacao", 88],
  odm_dem: ["otimizacao", 90],
  odm_orthophoto: ["otimizacao", 91],
  odm_report: ["otimizacao", 92],
  odm_postprocess: ["otimizacao", 93],
};

/** Lê "Running opensfm stage" numa linha do log do ODM. */
export function stageFromLine(line) {
  const m = line.match(/Running (\w+) stage/);
  const hit = m && ODM_STAGES[m[1]];
  return hit ? { odm: m[1], stage: hit[0], progress: hit[1] } : null;
}

/** Qualidade do processamento. No rápido, cada imagem só é comparada com as vizinhas da sequência. */
export const QUALITIES = {
  rapido: { maxSide: 2560, suffix: "-rapido", args: ["--feature-quality", "high", "--pc-quality", "low", "--pc-skip-geometric", "--matcher-order", "12", "--mesh-size", "120000"] },
  alta: { maxSide: null, suffix: "", args: ["--feature-quality", "high", "--pc-quality", "medium"] },
};

export const qualityOf = (q) => QUALITIES[q] ?? QUALITIES.rapido;

/** Detalhe do andamento dentro de uma etapa, a partir dos arquivos que o ODM já gravou. */
export function stepDetail(odmStage, { features, matches, depths, total }) {
  if (!total) return null;
  const part = (n) => Math.min(1, n / total);
  if (odmStage === "opensfm") {
    if (matches > 0) return { progress: Math.round(25 + 15 * part(matches)), text: `Comparando a imagem ${Math.min(matches, total)} de ${total}` };
    if (features > 0) return { progress: Math.round(10 + 15 * part(features)), text: `Analisando a imagem ${Math.min(features, total)} de ${total}` };
  }
  if (odmStage === "openmvs" && depths > 0) return { progress: Math.round(40 + 18 * part(depths)), text: `Calculando a imagem ${Math.min(depths, total)} de ${total}` };
  return null;
}

/** Argumentos do ODM: modelo 3D real (fachada não é terreno), nuvem em LAS e GLB texturizado, tudo em CPU. */
export function odmArgs(project, projectsDir, quality = "rapido") {
  return [
    "--project-path", projectsDir,
    ...qualityOf(quality).args,
    "--pc-las",
    "--pc-filter", "3",
    "--use-3dmesh",
    "--gltf",
    "--skip-orthophoto",
    "--skip-report",
    "--no-gpu",
    "--max-concurrency", "4",
    project,
  ];
}

/** Linha de comando do ODM no Windows (a variável evita o erro "winrun.bat não é reconhecido"). */
export function odmCommand(odmDir, args) {
  return `"set NoDefaultCurrentDirectoryInExePath=& cd /d ${odmDir}& winrun.bat ${args.join(" ")} <NUL"`;
}

/** Número de pontos no cabeçalho de um LAS (o campo de 64 bits vale a partir da versão 1.4). */
export function lasPointCount(header) {
  if (header.length < 111) return null;
  const minor = header[25];
  if (minor >= 4 && header.length >= 255) {
    const n = Number(header.readBigUInt64LE(247));
    if (n > 0) return n;
  }
  return header.readUInt32LE(107);
}

export function readLasCount(file) {
  const fd = openSync(file, "r");
  try {
    const b = Buffer.alloc(375);
    const n = readSync(fd, b, 0, 375, 0);
    return lasPointCount(b.subarray(0, n));
  } finally {
    closeSync(fd);
  }
}

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (v) => {
  const n = Math.hypot(...v) || 1;
  return v.map((x) => x / n);
};
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** Matriz de rotação de um vetor de Rodrigues (formato do OpenSfM: mundo → câmera). */
export function rodrigues([x, y, z]) {
  const t = Math.hypot(x, y, z) || 1e-12;
  const [a, b, c] = [x / t, y / t, z / t];
  const s = Math.sin(t), k = Math.cos(t), v = 1 - k;
  return [
    [k + a * a * v, a * b * v - c * s, a * c * v + b * s],
    [b * a * v + c * s, k + b * b * v, b * c * v - a * s],
    [c * a * v - b * s, c * b * v + a * s, k + c * c * v],
  ];
}

/** Menor autovetor de uma matriz simétrica 3×3 (iteração de potência sobre cI − A). */
function smallestEigen(A) {
  const c = A[0][0] + A[1][1] + A[2][2] + 1e-9;
  let v = unit([0.31, 0.53, 0.79]);
  for (let i = 0; i < 300; i++) {
    v = unit([0, 1, 2].map((r) => c * v[r] - dot(A[r], v)));
  }
  return v;
}

/**
 * Nivela o modelo sem GPS, pela orientação das câmeras. Ao filmar, o eixo lateral da câmera fica quase
 * horizontal mesmo quando ela aponta para cima, então a vertical é a direção perpendicular a todos esses
 * eixos. Numa passada reta eles são quase paralelos: por isso o "para cima" médio das câmeras entra
 * como desempate. Devolve o quaternion [x,y,z,w] que leva a vertical a +Z e a direção de frente da
 * fachada, na mesma rotação (para onde olhar ao abrir).
 */
export function levelFromShots(shots) {
  const rows = shots.map((s) => rodrigues(s.rotation));
  if (rows.length < 3) return null;
  const sumUp = [0, 0, 0];
  const sumView = [0, 0, 0];
  const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const [x, y, z] of rows) {
    for (let i = 0; i < 3; i++) {
      sumUp[i] -= y[i]; // o eixo y da imagem aponta para baixo
      sumView[i] += z[i];
      for (let j = 0; j < 3; j++) A[i][j] += x[i] * x[j];
    }
  }
  const m = unit(sumUp);
  const lambda = 0.01 * rows.length;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) A[i][j] += lambda * ((i === j ? 1 : 0) - m[i] * m[j]);
  let up = smallestEigen(A);
  if (dot(up, m) < 0) up = up.map((v) => -v);
  // base nivelada: X lateral, Y em frente, Z para cima
  const view = unit(sumView.map((v, i) => v - dot(sumView, up) * up[i]));
  const right = unit(cross(view, up));
  const front = cross(up, right);
  const R = [right, front, up]; // linhas: modelo → nivelado
  const q = quaternionOf(R);
  return { quaternion: q, up, tilt: Math.round((Math.acos(Math.min(1, Math.abs(up[2]))) * 180) / Math.PI) };
}

function quaternionOf(m) {
  const t = m[0][0] + m[1][1] + m[2][2];
  let x, y, z, w;
  if (t > 0) {
    const s = 0.5 / Math.sqrt(t + 1);
    w = 0.25 / s;
    x = (m[2][1] - m[1][2]) * s;
    y = (m[0][2] - m[2][0]) * s;
    z = (m[1][0] - m[0][1]) * s;
  } else if (m[0][0] > m[1][1] && m[0][0] > m[2][2]) {
    const s = 2 * Math.sqrt(1 + m[0][0] - m[1][1] - m[2][2]);
    w = (m[2][1] - m[1][2]) / s;
    x = 0.25 * s;
    y = (m[0][1] + m[1][0]) / s;
    z = (m[0][2] + m[2][0]) / s;
  } else if (m[1][1] > m[2][2]) {
    const s = 2 * Math.sqrt(1 + m[1][1] - m[0][0] - m[2][2]);
    w = (m[0][2] - m[2][0]) / s;
    x = (m[0][1] + m[1][0]) / s;
    y = 0.25 * s;
    z = (m[1][2] + m[2][1]) / s;
  } else {
    const s = 2 * Math.sqrt(1 + m[2][2] - m[0][0] - m[1][1]);
    w = (m[1][0] - m[0][1]) / s;
    x = (m[0][2] + m[2][0]) / s;
    y = (m[1][2] + m[2][1]) / s;
    z = 0.25 * s;
  }
  return [x, y, z, w];
}

/** Fotos aproveitadas: câmeras que entraram no maior bloco reconstruído. */
export function photosUsed(reconstruction) {
  return Math.max(0, ...reconstruction.map((r) => Object.keys(r.shots ?? {}).length));
}
