/**
 * Formatos aceitos como resultado do processamento. "viewable" = o visualizador 3D
 * do navegador consegue abrir; os demais ficam só para download (E57, LAZ, OBJ…).
 */
export type OutputKind = "nuvem" | "malha" | "pdf";

export const MODEL_FORMATS: Record<string, { kind: OutputKind; label: string; viewable: boolean; upAxis: "y" | "z" }> = {
  e57: { kind: "nuvem", label: "Nuvem E57", viewable: false, upAxis: "z" },
  las: { kind: "nuvem", label: "Nuvem LAS", viewable: true, upAxis: "z" },
  laz: { kind: "nuvem", label: "Nuvem LAZ (compactada)", viewable: false, upAxis: "z" },
  ply: { kind: "nuvem", label: "Nuvem PLY", viewable: true, upAxis: "z" },
  xyz: { kind: "nuvem", label: "Nuvem XYZ", viewable: true, upAxis: "z" },
  pts: { kind: "nuvem", label: "Nuvem PTS", viewable: true, upAxis: "z" },
  txt: { kind: "nuvem", label: "Nuvem TXT", viewable: true, upAxis: "z" },
  glb: { kind: "malha", label: "Malha GLB", viewable: true, upAxis: "y" },
  obj: { kind: "malha", label: "Malha OBJ", viewable: false, upAxis: "y" },
  fbx: { kind: "malha", label: "Malha FBX", viewable: false, upAxis: "y" },
  zip: { kind: "malha", label: "Pacote ZIP", viewable: false, upAxis: "y" },
  pdf: { kind: "pdf", label: "Relatório PDF", viewable: false, upAxis: "z" },
};

export const ACCEPTED_EXTENSIONS = Object.keys(MODEL_FORMATS).map((e) => `.${e}`).join(",");

export function formatOf(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const f = MODEL_FORMATS[ext];
  return f ? { ext, ...f } : null;
}

/** Escala calibrada: metros por unidade do modelo e os dois pontos (na cena do visualizador) usados. */
export type ModelScale = {
  factor: number;
  meters: number;
  a: [number, number, number];
  b: [number, number, number];
  at: string;
};

export type OutputMeta = { viewable?: boolean; upAxis?: "y" | "z"; source?: string; scale?: ModelScale };
