/// <reference lib="webworker" />
// Worker do "Contorno IA": SlimSAM-77 via ONNX Runtime Web, tudo no navegador.
// O runtime (public/ort, copiado de node_modules por scripts/copy-ort.mjs) é carregado
// sem passar pelo bundler; os modelos vêm do Hugging Face e ficam na Cache Storage.
import type * as Ort from "onnxruntime-web";
import { maskToPolygon, type XY } from "./contour";
import type { Backend, SamRequest, SamResponse, SamRegion } from "./protocol";

declare const self: DedicatedWorkerGlobalScope;

const REPO = "https://huggingface.co/Xenova/slimsam-77-uniform/resolve/5850ab45f587c112167512ffef949107115e26a0/onnx/";
const CACHE = "oraclo-sam-v1";
const SIZE = 1024;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

let ort: typeof Ort | null = null;
let encoder: Ort.InferenceSession | null = null;
let decoder: Ort.InferenceSession | null = null;
let backend: Backend = "wasm";
let bitmap: ImageBitmap | null = null;
let bitmapUrl = "";
let embedding: { region: SamRegion; newW: number; newH: number; emb: Ort.Tensor; pos: Ort.Tensor } | null = null;

const post = (m: SamResponse) => self.postMessage(m);

function polyArea(p: XY[]) {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i]!;
    const [x2, y2] = p[(i + 1) % p.length]!;
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a / 2);
}

async function download(file: string, label: string): Promise<ArrayBuffer> {
  const url = REPO + file;
  let cache: Cache | null = null;
  try {
    cache = await caches.open(CACHE);
    const hit = await cache.match(url);
    if (hit) return await hit.arrayBuffer();
  } catch {
    cache = null; // Cache Storage indisponível (ex.: aba anônima) — baixa sem guardar
  }
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Falha ao baixar o modelo (${res.status}).`);
  const total = Number(res.headers.get("content-length")) || 0;
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.length;
    post({ type: "progress", label, loaded: got, total });
  }
  const buf = new Uint8Array(got);
  let o = 0;
  for (const c of chunks) buf.set(c, (o += c.length) - c.length);
  if (cache) await cache.put(url, new Response(buf, { headers: { "content-type": "application/octet-stream" } })).catch(() => {});
  return buf.buffer;
}

async function init(want: Backend, maxThreads: number) {
  backend = want;
  // webpackIgnore/turbopackIgnore: o runtime é servido como arquivo estático, não empacotado
  const file = want === "webgpu" ? "/ort/ort.webgpu.min.mjs" : "/ort/ort.wasm.min.mjs";
  ort = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ file)) as typeof Ort;
  ort.env.wasm.wasmPaths = "/ort/";
  // núcleos − 1: com todos os núcleos as threads aninhadas no worker às vezes não sobem (trava)
  ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.max(1, Math.min(maxThreads, (navigator.hardwareConcurrency || 2) - 1)) : 1;
  ort.env.logLevel = "error";
  if (want === "webgpu") {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
    if (!gpu || !(await gpu.requestAdapter())) throw new Error("WebGPU indisponível neste navegador/placa.");
  }
  // WebGPU não roda bem modelos quantizados (int8): usa o encoder fp32; o decoder é leve e fica na CPU
  const encFile = want === "webgpu" ? "vision_encoder.onnx" : "vision_encoder_quantized.onnx";
  const [encBuf, decBuf] = await Promise.all([
    download(encFile, "codificador"),
    download("prompt_encoder_mask_decoder_quantized.onnx", "decodificador"),
  ]);
  post({ type: "progress", label: "iniciando", loaded: 0, total: 0 });
  encoder = await ort.InferenceSession.create(new Uint8Array(encBuf), {
    executionProviders: want === "webgpu" ? ["webgpu"] : ["wasm"],
    graphOptimizationLevel: "all",
  });
  decoder = await ort.InferenceSession.create(new Uint8Array(decBuf), { executionProviders: ["wasm"], graphOptimizationLevel: "all" });
  return { threads: ort.env.wasm.numThreads as number };
}

async function loadBitmap(url: string) {
  if (bitmap && bitmapUrl === url) return bitmap;
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error(`Não foi possível ler a imagem da vista (${res.status}).`);
  bitmap?.close();
  bitmap = await createImageBitmap(await res.blob());
  bitmapUrl = url;
  embedding = null;
  return bitmap;
}

async function encode(url: string, region: SamRegion) {
  if (!ort || !encoder) throw new Error("Modelo não carregado.");
  const img = await loadBitmap(url);
  const k = SIZE / Math.max(region.w, region.h);
  const newW = Math.max(1, Math.round(region.w * k));
  const newH = Math.max(1, Math.round(region.h * k));
  const canvas = new OffscreenCanvas(newW, newH);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, region.x, region.y, region.w, region.h, 0, 0, newW, newH);
  const px = ctx.getImageData(0, 0, newW, newH).data;
  // CHW normalizado, preenchido com zero até 1024×1024 (abaixo/à direita), como o SamProcessor
  const data = new Float32Array(3 * SIZE * SIZE);
  for (let y = 0; y < newH; y++) {
    for (let x = 0; x < newW; x++) {
      const i = (y * newW + x) * 4;
      const o = y * SIZE + x;
      for (let c = 0; c < 3; c++) data[c * SIZE * SIZE + o] = (px[i + c]! / 255 - MEAN[c]!) / STD[c]!;
    }
  }
  const t0 = performance.now();
  const out = await encoder.run({ [encoder.inputNames[0]!]: new ort.Tensor("float32", data, [1, 3, SIZE, SIZE]) });
  const ms = performance.now() - t0;
  embedding?.emb.dispose();
  embedding?.pos.dispose();
  embedding = { region, newW, newH, emb: out.image_embeddings!, pos: out.image_positional_embeddings! };
  return ms;
}

async function decode(points: XY[], labels: number[]) {
  if (!ort || !decoder || !embedding) throw new Error("Imagem não codificada.");
  const { region, newW, newH, emb, pos } = embedding;
  const k = newW / region.w;
  // pontos em coordenadas da imagem → espaço redimensionado (≤1024)
  const local: XY[] = points.map(([x, y]) => [(x - region.x) * k, (y - region.y) * k]);
  const n = local.length;
  const feeds: Record<string, Ort.Tensor> = {
    input_points: new ort.Tensor("float32", Float32Array.from(local.flat()), [1, 1, n, 2]),
    input_labels: new ort.Tensor("int64", BigInt64Array.from(labels.map((l) => BigInt(l))), [1, 1, n]),
    image_embeddings: emb,
    image_positional_embeddings: pos,
  };
  const out = await decoder.run(feeds);
  const scores = out.iou_scores!.data as Float32Array;
  const masks = out.pred_masks!; // [1, 1, 3, 256, 256] em logits, relativo ao quadro 1024 com padding
  const [mh, mw] = [masks.dims[3]!, masks.dims[4]!];
  const md = masks.data as Float32Array;
  const sx = mw / SIZE;
  const sy = mh / SIZE;
  const seeds = local.filter((_, i) => labels[i] === 1);
  const results: { points: XY[]; score: number; area: number }[] = [];
  const bin = new Uint8Array(newW * newH);
  for (let m = 0; m < 3; m++) {
    const base = m * mh * mw;
    // upsample bilinear (align_corners=false) só da parte válida, já no tamanho redimensionado
    for (let y = 0; y < newH; y++) {
      const fy = Math.min(mh - 1, Math.max(0, (y + 0.5) * sy - 0.5));
      const y0 = Math.floor(fy);
      const y1 = Math.min(mh - 1, y0 + 1);
      const wy = fy - y0;
      for (let x = 0; x < newW; x++) {
        const fx = Math.min(mw - 1, Math.max(0, (x + 0.5) * sx - 0.5));
        const x0 = Math.floor(fx);
        const x1 = Math.min(mw - 1, x0 + 1);
        const wx = fx - x0;
        const v =
          (md[base + y0 * mw + x0]! * (1 - wx) + md[base + y0 * mw + x1]! * wx) * (1 - wy) +
          (md[base + y1 * mw + x0]! * (1 - wx) + md[base + y1 * mw + x1]! * wx) * wy;
        bin[y * newW + x] = v > 0 ? 1 : 0;
      }
    }
    const poly = maskToPolygon(bin, newW, newH, seeds);
    const pts = poly.map(([x, y]) => [region.x + (x + 0.5) / k, region.y + (y + 0.5) / k] as XY);
    results.push({ points: pts, score: scores[m] ?? 0, area: polyArea(pts) });
  }
  // do mais justo (mancha local) ao mais amplo (parede inteira)
  return results.sort((a, b) => a.area - b.area).map(({ points, score }) => ({ points, score }));
}

self.onmessage = async (e: MessageEvent<SamRequest>) => {
  const msg = e.data;
  try {
    if (msg.type === "init") {
      const { threads } = await init(msg.backend, msg.maxThreads);
      post({ type: "ready", id: msg.id, backend, threads });
    } else if (msg.type === "encode") {
      const ms = await encode(msg.url, msg.region);
      post({ type: "encoded", id: msg.id, ms });
    } else if (msg.type === "decode") {
      const masks = await decode(msg.points, msg.labels);
      post({ type: "decoded", id: msg.id, masks });
    }
  } catch (err) {
    post({ type: "error", id: msg.id, message: (err as Error)?.message || String(err) });
  }
};
