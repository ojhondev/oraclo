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
  return hit ? { stage: hit[0], progress: hit[1] } : null;
}

/** Argumentos do ODM: modelo 3D real (fachada não é terreno), nuvem em LAS e GLB texturizado, tudo em CPU. */
export function odmArgs(project, projectsDir) {
  return [
    "--project-path", projectsDir,
    "--feature-quality", "high",
    "--pc-quality", "medium",
    "--pc-las",
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

/** Fotos aproveitadas: câmeras que entraram no maior bloco reconstruído. */
export function photosUsed(reconstruction) {
  return Math.max(0, ...reconstruction.map((r) => Object.keys(r.shots ?? {}).length));
}
