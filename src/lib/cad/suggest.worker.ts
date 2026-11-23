/// <reference lib="webworker" />
// IA assistente do ArchRay CAD: procura na foto as janelas/portas parecidas com os blocos-modelo
// (correlação + bordas, como no laboratório), alinha em fiadas e devolve caixas em fração da foto.
// Roda no navegador, sem custo de servidor.
import { toGray } from "../cadastro/complete";
import { edgesOf } from "../cadastro/refine";
import { assignFamilies, findSimilar, type Match } from "../cadastro/similar";
import { regularize } from "../cadastro/regularize";
import type { Found, NBox } from "./suggest";

declare const self: DedicatedWorkerGlobalScope;

export type SuggestRequest = { url: string; seeds: NBox[]; maxSide?: number; minScore?: number };
export type SuggestResponse = { type: "progress"; label: string } | { type: "done"; found: Found[]; ms: number } | { type: "error"; message: string };

const post = (m: SuggestResponse) => self.postMessage(m);

self.onmessage = async (e: MessageEvent<SuggestRequest>) => {
  const t0 = performance.now();
  try {
    const { url, seeds } = e.data;
    post({ type: "progress", label: "Carregando a foto" });
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error("Não foi possível baixar a foto do desenho.");
    const bmp = await createImageBitmap(await res.blob());
    const max = e.data.maxSide ?? 1200;
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
    // reduz em etapas (bordas finas serrilham se reduzir de uma vez)
    let src: ImageBitmap | OffscreenCanvas = bmp;
    let sw = bmp.width, sh = bmp.height;
    while (sw / 2 >= w * 1.05) {
      const half = new OffscreenCanvas(Math.round(sw / 2), Math.round(sh / 2));
      const hc = half.getContext("2d")!;
      hc.imageSmoothingQuality = "high";
      hc.drawImage(src, 0, 0, half.width, half.height);
      src = half;
      sw = half.width;
      sh = half.height;
    }
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, 0, 0, w, h);
    const px = ctx.getImageData(0, 0, w, h).data;
    const gray = toGray(px, w, h);
    const edges = edgesOf(gray);
    const all = { x0: 0, y0: 0, x1: w, y1: h };
    const scaled = seeds.map((s) => ({ x0: s.x0 * w, y0: s.y0 * h, x1: s.x1 * w, y1: s.y1 * h }));

    const matches: (Match & { family: number })[] = [];
    for (const [family, sd] of scaled.entries()) {
      post({ type: "progress", label: seeds.length > 1 ? `Procurando parecidas com o modelo ${family + 1} de ${seeds.length}` : "Procurando parecidas" });
      for (const m of findSimilar(gray, sd, all, { edges, minScore: e.data.minScore ?? 0.42 })) matches.push({ ...m, family });
    }
    post({ type: "progress", label: "Alinhando em fiadas" });
    const reg = regularize(matches.map((m) => ({ ...m, arched: false })), all);
    const vaos = scaled.length ? assignFamilies(gray, reg.vaos, scaled) : [];
    const found: Found[] = vaos.map((v) => ({ x0: v.x0 / w, y0: v.y0 / h, x1: v.x1 / w, y1: v.y1 / h, family: v.family ?? 0, score: v.score }));
    post({ type: "done", found, ms: Math.round(performance.now() - t0) });
  } catch (err) {
    post({ type: "error", message: err instanceof Error ? err.message : "Falha ao procurar parecidas." });
  }
};
