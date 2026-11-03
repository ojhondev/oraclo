/// <reference lib="webworker" />
// Worker da detecção automática: baixa a imagem da vista, reduz para o tamanho de análise
// e roda os detectores. Sempre o motor clássico (cv-2, src/lib/detect/detect.ts); se houver um
// modelo treinado publicado (public/modelos/modelo.json), ele assume as classes em que provou ser
// melhor (src/lib/detect/ml.ts). Tudo no navegador, sem custo de servidor.
import type * as Ort from "onnxruntime-web";
import { detectDamages, type Detection, type QualityWarning } from "./detect";
import { coveredCodes, enabledClasses, runModel, type ModelCard } from "./ml";

declare const self: DedicatedWorkerGlobalScope;

export type DetectRequest = { url: string; maxSide: number };
export type DetectResponse =
  | { type: "progress"; label: string }
  | { type: "done"; detections: Detection[]; quality: QualityWarning[]; engines: string[]; ms: number; size: [number, number] }
  | { type: "error"; message: string };

const post = (m: DetectResponse) => self.postMessage(m);
const CACHE = "archray-modelos-v1";

/** Ficha do modelo publicada, ou null (sem modelo, ou nenhuma classe ligada). */
async function loadCard(): Promise<ModelCard | null> {
  try {
    const res = await fetch("/modelos/modelo.json", { cache: "no-cache" });
    if (!res.ok) return null;
    const card = (await res.json()) as ModelCard;
    return enabledClasses(card).length ? card : null;
  } catch {
    return null;
  }
}

/** Modelo ONNX (fica na Cache Storage: baixa uma vez por versão). */
async function loadModel(card: ModelCard): Promise<{ ort: typeof Ort; session: Ort.InferenceSession }> {
  // webpackIgnore/turbopackIgnore: o runtime é servido como arquivo estático, não empacotado
  const ort = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ "/ort/ort.wasm.min.mjs" as string)) as typeof Ort;
  ort.env.wasm.wasmPaths = "/ort/";
  ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1)) : 1;
  ort.env.logLevel = "error";
  const url = `/modelos/${card.file}`;
  const download = async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Modelo indisponível (${res.status}).`);
    return res.arrayBuffer();
  };
  let buf: ArrayBuffer;
  try {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(url);
    if (hit) buf = await hit.arrayBuffer();
    else {
      buf = await download();
      await cache.put(url, new Response(buf.slice(0))).catch(() => {});
    }
  } catch {
    buf = await download(); // Cache Storage indisponível (ex.: aba anônima)
  }
  const session = await ort.InferenceSession.create(new Uint8Array(buf), { executionProviders: ["wasm"], graphOptimizationLevel: "all" });
  return { ort, session };
}

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
    const classic = detectDamages(px, w, h);
    let detections = classic.detections;
    const engines = ["cv-2"];
    const card = await loadCard();
    if (card) {
      try {
        post({ type: "progress", label: `Carregando o modelo ${card.version}` });
        const { ort, session } = await loadModel(card);
        const learned = await runModel(ort, session, px, w, h, card, (d, t) => post({ type: "progress", label: `Modelo ${card.version}: recorte ${d} de ${t}` }));
        // o modelo assume as classes em que provou ser melhor; o cv-2 segue com as demais
        const covered = coveredCodes(card);
        detections = [...learned, ...classic.detections.filter((d) => !covered.has(d.code))];
        engines.unshift(card.version);
      } catch {
        // modelo indisponível neste navegador: segue só com o cv-2
      }
    }
    // de volta para pixels da vista (centro do pixel analisado)
    const scaled = detections.map((d) => ({
      ...d,
      points: d.points.map(([x, y]) => [Math.round((x + 0.5) * sx * 10) / 10, Math.round((y + 0.5) * sy * 10) / 10] as [number, number]),
    }));
    post({ type: "done", detections: scaled, quality: classic.quality, engines, ms: performance.now() - t0, size: [w, h] });
  } catch (err) {
    post({ type: "error", message: (err as Error)?.message || String(err) });
  }
};
