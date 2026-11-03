"use client";

// Roda a detecção automática num worker descartável (libera a memória ao terminar).
import type { DetectResponse } from "./detect.worker";
import type { Detection, QualityWarning } from "./detect";

export type DetectOutcome = { detections: Detection[]; quality: QualityWarning[]; ms: number; size: [number, number] };

/** Lado maior da imagem analisada: detalhe para fissuras sem travar computadores modestos. */
export const DETECT_MAX_SIDE = 2200;

export function runDetection(url: string, onProgress?: (label: string) => void): Promise<DetectOutcome> {
  return new Promise((resolve, reject) => {
    const w = new Worker(new URL("./detect.worker.ts", import.meta.url), { type: "module" });
    const done = () => w.terminate();
    w.onmessage = (e: MessageEvent<DetectResponse>) => {
      const m = e.data;
      if (m.type === "progress") return onProgress?.(m.label);
      done();
      if (m.type === "error") reject(new Error(m.message));
      else resolve({ detections: m.detections, quality: m.quality, ms: m.ms, size: m.size });
    };
    w.onerror = (e) => {
      e.preventDefault();
      done();
      reject(new Error(e.message || "Falha no worker da detecção."));
    };
    w.postMessage({ url, maxSide: DETECT_MAX_SIDE });
  });
}
