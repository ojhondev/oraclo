"use client";

// Cliente do worker do SlimSAM: tenta WebGPU e cai para WASM (CPU) se falhar.
import type { XY } from "./contour";
import type { Backend, SamMask, SamRegion, SamRequest, SamResponse } from "./protocol";

export type SamProgress = { label: string; loaded: number; total: number };
type Pending = { resolve: (m: SamResponse) => void; reject: (e: Error) => void };
type Omit2<T> = T extends unknown ? Omit<T, "id"> : never;

// Se o WebGPU já falhou neste navegador, vai direto para a CPU (evita baixar o modelo fp32 à toa)
const GPU_KEY = "archray-sam-webgpu-falhou";
function gpuFailed() {
  try {
    return localStorage.getItem(GPU_KEY) === "1";
  } catch {
    return false;
  }
}
function markGpuFailed() {
  try {
    localStorage.setItem(GPU_KEY, "1");
  } catch {
    // sem localStorage: tenta de novo na próxima vez
  }
}

class SamClient {
  private worker: Worker | null = null;
  private seq = 0;
  private pending = new Map<number, Pending>();
  private ready: Promise<{ backend: Backend; threads: number }> | null = null;
  onProgress: ((p: SamProgress) => void) | null = null;
  private onInitStart: (() => void) | null = null;
  backend: Backend | null = null;
  threads = 1;

  private spawn() {
    this.worker?.terminate();
    const w = new Worker(new URL("./sam.worker.ts", import.meta.url), { type: "module" });
    w.onmessage = (e: MessageEvent<SamResponse>) => {
      const m = e.data;
      if (m.type === "progress") {
        if (m.label === "iniciando") this.onInitStart?.();
        return this.onProgress?.(m);
      }
      const p = this.pending.get(m.id);
      if (!p) return;
      this.pending.delete(m.id);
      if (m.type === "error") p.reject(new Error(m.message));
      else p.resolve(m);
    };
    w.onerror = (e) => {
      e.preventDefault();
      for (const p of this.pending.values()) p.reject(new Error(e.message || "Falha no worker da IA."));
      this.pending.clear();
    };
    this.worker = w;
  }

  private call<T extends SamResponse["type"]>(req: Omit2<SamRequest>): Promise<Extract<SamResponse, { type: T }>> {
    const id = ++this.seq;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (m: SamResponse) => void, reject });
      this.worker!.postMessage({ ...req, id } as SamRequest);
    });
  }

  private async start(backend: Backend, maxThreads = 4) {
    this.spawn();
    // Criar a sessão às vezes trava (threads do WASM que não sobem): depois do download,
    // espera no máximo 10 s e desiste — quem chamou tenta de novo com 1 thread.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stuck = new Promise<never>((_, reject) => {
      this.onInitStart = () => {
        timer = setTimeout(() => reject(new Error("A IA não iniciou a tempo.")), 10_000);
      };
    });
    try {
      const r = await Promise.race([this.call<"ready">({ type: "init", backend, maxThreads }), stuck]);
      this.backend = r.backend;
      this.threads = r.threads;
      return { backend: r.backend, threads: r.threads };
    } finally {
      clearTimeout(timer);
      this.onInitStart = null;
    }
  }

  private async startWasm() {
    try {
      return await this.start("wasm");
    } catch (e) {
      console.warn("[contorno IA] WASM com várias threads falhou, tentando com 1:", e);
      this.pending.clear();
      return await this.start("wasm", 1);
    }
  }

  /** Carrega o modelo (uma vez). WebGPU primeiro; qualquer erro → WASM. */
  load() {
    this.ready ??= (async () => {
      const hasGpu = typeof navigator !== "undefined" && "gpu" in navigator && !gpuFailed();
      if (hasGpu) {
        try {
          return await this.start("webgpu");
        } catch (e) {
          console.warn("[contorno IA] WebGPU falhou, usando WASM:", e);
          markGpuFailed();
        }
      }
      return await this.startWasm();
    })().catch((e) => {
      this.ready = null;
      this.worker?.terminate();
      this.worker = null;
      throw e;
    });
    return this.ready;
  }

  async encode(url: string, region: SamRegion) {
    await this.load();
    for (;;) {
      try {
        // placa fraca pode perder o dispositivo / threads podem travar sem responder: limite de tempo
        const limit = this.backend === "webgpu" ? 45_000 : 120_000;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const timeout = new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error("A IA não respondeu a tempo.")), limit);
        });
        try {
          return (await Promise.race([this.call<"encoded">({ type: "encode", url, region }), timeout])).ms;
        } finally {
          clearTimeout(timer);
        }
      } catch (e) {
        this.pending.clear();
        if (this.backend === "webgpu") {
          // WebGPU carregou mas falhou ao rodar (ex.: "device lost"): refaz na CPU e lembra
          console.warn("[contorno IA] WebGPU falhou ao codificar, usando WASM:", e);
          markGpuFailed();
          this.ready = this.startWasm();
        } else if (this.threads > 1) {
          console.warn("[contorno IA] WASM com várias threads falhou ao codificar, tentando com 1:", e);
          this.ready = this.start("wasm", 1);
        } else {
          throw e;
        }
        await this.ready;
      }
    }
  }

  async decode(points: XY[], labels: number[]): Promise<SamMask[]> {
    return (await this.call<"decoded">({ type: "decode", points, labels })).masks;
  }
}

let client: SamClient | null = null;
export const getSam = () => (client ??= new SamClient());
