/// <reference lib="webworker" />
// Worker da detecção automática: baixa a imagem da vista, reduz para o tamanho de análise
// e roda os detectores (src/lib/detect/detect.ts). Tudo no navegador, sem custo de servidor.
import { detectDamages, type Detection, type QualityWarning } from "./detect";

declare const self: DedicatedWorkerGlobalScope;

export type DetectRequest = { url: string; maxSide: number };
export type DetectResponse =
  | { type: "progress"; label: string }
  | { type: "done"; detections: Detection[]; quality: QualityWarning[]; ms: number; size: [number, number] }
  | { type: "error"; message: string };

const post = (m: DetectResponse) => self.postMessage(m);

self.onmessage = async (e: MessageEvent<DetectRequest>) => {
  const t0 = performance.now();
  try {
    post({ type: "progress", label: "Lendo a imagem da vista" });
    const res = await fetch(e.data.url, { mode: "cors" });
    if (!res.ok) throw new Error(`Não foi possível ler a imagem da vista (${res.status}).`);
    const bmp = await createImageBitmap(await res.blob());
    const k = Math.min(1, e.data.maxSide / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * k));
    const h = Math.max(1, Math.round(bmp.height * k));
    const ctx = new OffscreenCanvas(w, h).getContext("2d", { willReadFrequently: true })!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bmp, 0, 0, w, h);
    const px = ctx.getImageData(0, 0, w, h).data;
    const sx = bmp.width / w;
    const sy = bmp.height / h;
    bmp.close();
    post({ type: "progress", label: "Procurando danos" });
    const { detections, quality } = detectDamages(px, w, h);
    // de volta para pixels da vista (centro do pixel analisado)
    const scaled = detections.map((d) => ({
      ...d,
      points: d.points.map(([x, y]) => [Math.round((x + 0.5) * sx * 10) / 10, Math.round((y + 0.5) * sy * 10) / 10] as [number, number]),
    }));
    post({ type: "done", detections: scaled, quality, ms: performance.now() - t0, size: [w, h] });
  } catch (err) {
    post({ type: "error", message: (err as Error)?.message || String(err) });
  }
};
