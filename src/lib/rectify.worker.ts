/// <reference lib="webworker" />
import { renderRows, type RenderJob } from "./rectify";

/**
 * Retificação fora da thread da página: a foto é decodificada uma vez (e reduzida se passar de
 * ~36 MP, para caber na memória de celulares) e cada pedido gera a imagem em blocos, com progresso.
 */

type Req =
  | { type: "load"; bitmap: ImageBitmap }
  | { type: "render"; id: number; job: Omit<RenderJob, "srcScale">; quality: number; mime: "image/jpeg" | "image/png" };

const MAX_SRC_PX = 36e6;
let src: { data: Uint8ClampedArray; w: number; h: number; scale: number } | null = null;

const post = (msg: unknown) => (self as unknown as Worker).postMessage(msg);

self.onmessage = async (e: MessageEvent<Req>) => {
  const m = e.data;
  try {
    if (m.type === "load") {
      let bmp = m.bitmap;
      let scale = 1;
      if (bmp.width * bmp.height > MAX_SRC_PX) {
        scale = Math.sqrt(MAX_SRC_PX / (bmp.width * bmp.height));
        const small = await createImageBitmap(bmp, { resizeWidth: Math.round(bmp.width * scale), resizeHeight: Math.round(bmp.height * scale), resizeQuality: "high" });
        bmp.close();
        bmp = small;
      }
      const c = new OffscreenCanvas(bmp.width, bmp.height);
      const ctx = c.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(bmp, 0, 0);
      src = { data: ctx.getImageData(0, 0, bmp.width, bmp.height).data, w: bmp.width, h: bmp.height, scale };
      bmp.close();
      post({ type: "loaded", scale });
      return;
    }
    if (m.type === "render") {
      if (!src) throw new Error("Foto não carregada.");
      const job: RenderJob = { ...m.job, srcScale: src.scale };
      const { width: W, height: H } = job;
      const out = new OffscreenCanvas(W, H);
      const octx = out.getContext("2d")!;
      const rowsPerChunk = Math.max(1, Math.floor(600_000 / W));
      for (let y0 = 0; y0 < H; y0 += rowsPerChunk) {
        const rows = Math.min(rowsPerChunk, H - y0);
        const block = octx.createImageData(W, rows);
        renderRows(src.data, src.w, src.h, job, block.data, y0, rows);
        octx.putImageData(block, 0, y0);
        post({ type: "progress", id: m.id, p: Math.min(1, (y0 + rows) / H) });
      }
      const blob = await out.convertToBlob({ type: m.mime, quality: m.quality });
      post({ type: "done", id: m.id, blob });
    }
  } catch (err) {
    post({ type: "error", id: "id" in m ? m.id : -1, message: (err as Error).message || "Falha ao retificar." });
  }
};
