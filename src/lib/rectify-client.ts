"use client";

import { renderRows, type RenderJob } from "./rectify";

type Job = Omit<RenderJob, "srcScale">;

/**
 * Ponte com o Web Worker de retificação. Sem OffscreenCanvas (navegadores antigos), roda na
 * própria página, em blocos, para não congelar a tela.
 */
export class RectifyEngine {
  private worker: Worker | null = null;
  private seq = 0;
  private pending = new Map<number, { resolve: (b: Blob) => void; reject: (e: Error) => void; onProgress?: (p: number) => void }>();
  private fallback: { data: Uint8ClampedArray; w: number; h: number } | null = null;
  private ready: Promise<void> = Promise.resolve();

  async load(file: Blob) {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    if (typeof OffscreenCanvas !== "undefined" && typeof Worker !== "undefined") {
      this.worker?.terminate();
      const w = new Worker(new URL("./rectify.worker.ts", import.meta.url), { type: "module" });
      this.worker = w;
      this.ready = new Promise((res, rej) => {
        w.onmessage = (e) => {
          const m = e.data;
          if (m.type === "loaded") res();
          else if (m.type === "progress") this.pending.get(m.id)?.onProgress?.(m.p);
          else if (m.type === "done") {
            this.pending.get(m.id)?.resolve(m.blob);
            this.pending.delete(m.id);
          } else if (m.type === "error") {
            if (m.id === -1) rej(new Error(m.message));
            this.pending.get(m.id)?.reject(new Error(m.message));
            this.pending.delete(m.id);
          }
        };
        w.onerror = (e) => rej(new Error(e.message || "Falha no processamento."));
      });
      w.postMessage({ type: "load", bitmap }, [bitmap]);
      await this.ready;
      return;
    }
    const c = document.createElement("canvas");
    c.width = bitmap.width;
    c.height = bitmap.height;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(bitmap, 0, 0);
    this.fallback = { data: ctx.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height };
    bitmap.close();
  }

  async render(job: Job, opts: { mime?: "image/jpeg" | "image/png"; quality?: number; onProgress?: (p: number) => void } = {}): Promise<Blob> {
    const mime = opts.mime ?? "image/jpeg";
    const quality = opts.quality ?? 0.9;
    if (this.worker) {
      await this.ready;
      const id = ++this.seq;
      return new Promise<Blob>((resolve, reject) => {
        this.pending.set(id, { resolve, reject, onProgress: opts.onProgress });
        this.worker!.postMessage({ type: "render", id, job, quality, mime });
      });
    }
    if (!this.fallback) throw new Error("Foto não carregada.");
    const { data, w, h } = this.fallback;
    const out = document.createElement("canvas");
    out.width = job.width;
    out.height = job.height;
    const octx = out.getContext("2d")!;
    const rowsPerChunk = Math.max(1, Math.floor(300_000 / job.width));
    for (let y0 = 0; y0 < job.height; y0 += rowsPerChunk) {
      const rows = Math.min(rowsPerChunk, job.height - y0);
      const block = octx.createImageData(job.width, rows);
      renderRows(data, w, h, { ...job, srcScale: 1 }, block.data, y0, rows);
      octx.putImageData(block, 0, y0);
      opts.onProgress?.(Math.min(1, (y0 + rows) / job.height));
      await new Promise((r) => setTimeout(r, 0));
    }
    return new Promise((res, rej) => out.toBlob((b) => (b ? res(b) : rej(new Error("Falha ao gerar a imagem."))), mime, quality));
  }

  dispose() {
    this.worker?.terminate();
    this.worker = null;
    this.fallback = null;
  }
}
