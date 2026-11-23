"use client";

// Roda a busca de parecidas num worker descartável (a tela não trava).
import type { SuggestRequest, SuggestResponse } from "./suggest.worker";

export function runSuggest(req: SuggestRequest, onProgress?: (label: string) => void): Promise<Extract<SuggestResponse, { type: "done" }>> {
  return new Promise((resolve, reject) => {
    const w = new Worker(new URL("./suggest.worker.ts", import.meta.url), { type: "module" });
    w.onmessage = (e: MessageEvent<SuggestResponse>) => {
      const m = e.data;
      if (m.type === "progress") return onProgress?.(m.label);
      w.terminate();
      if (m.type === "error") reject(new Error(m.message));
      else resolve(m);
    };
    w.onerror = (e) => {
      e.preventDefault();
      w.terminate();
      reject(new Error(e.message || "Falha no worker da IA."));
    };
    w.postMessage(req);
  });
}
