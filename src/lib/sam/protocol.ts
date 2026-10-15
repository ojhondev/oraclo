import type { XY } from "./contour";

export type Backend = "webgpu" | "wasm";
/** Recorte da imagem (pixels da imagem original) que foi codificado. */
export type SamRegion = { x: number; y: number; w: number; h: number };
export type SamMask = { points: XY[]; score: number };

export type SamRequest =
  | { type: "init"; id: number; backend: Backend; maxThreads: number }
  | { type: "encode"; id: number; url: string; region: SamRegion }
  | { type: "decode"; id: number; points: XY[]; labels: number[] };

export type SamResponse =
  | { type: "progress"; label: string; loaded: number; total: number }
  | { type: "ready"; id: number; backend: Backend; threads: number }
  | { type: "encoded"; id: number; ms: number }
  | { type: "decoded"; id: number; masks: SamMask[] }
  | { type: "error"; id: number; message: string };
