"use client";

// Roda o levantamento cadastral num worker descartável (a tela não trava enquanto procura).
import type { CadastroRequest, CadastroResponse } from "./cadastro.worker";

export type CadastroOutcome = Extract<CadastroResponse, { type: "done" }>;

export function runCadastro(req: CadastroRequest, onProgress?: (label: string) => void): Promise<CadastroOutcome> {
  return new Promise((resolve, reject) => {
    const w = new Worker(new URL("./cadastro.worker.ts", import.meta.url), { type: "module" });
    const done = () => w.terminate();
    w.onmessage = (e: MessageEvent<CadastroResponse>) => {
      const m = e.data;
      if (m.type === "progress") return onProgress?.(m.label);
      done();
      if (m.type === "error") reject(new Error(m.message));
      else resolve(m);
    };
    w.onerror = (e) => {
      e.preventDefault();
      done();
      reject(new Error(e.message || "Falha no worker do levantamento."));
    };
    w.postMessage(req);
  });
}
