/// <reference lib="webworker" />
// Worker do levantamento cadastral (módulo experimental): baixa a vista, reduz para análise e
// roda faixas + busca das janelas parecidas + limpeza + detalhe, devolvendo o rascunho do modelo
// paramétrico. Tudo no navegador, sem custo de servidor.
import { analyzeFacade, type Box } from "./analyze";
import { toGray } from "./complete";
import { edgesOf } from "./refine";
import { assignFamilies, findSimilar, type Match } from "./similar";
import { regularize } from "./regularize";
import { detailWindow } from "./detail";
import { modeloDaDeteccao, type Modelo } from "./model";

declare const self: DedicatedWorkerGlobalScope;

export type CadastroRequest = {
  url: string;
  /** mm por pixel da imagem ORIGINAL. */
  mmPerPixel: number;
  /** Janelas-modelo marcadas, em pixels da imagem original (uma por tipo). */
  seeds: Box[];
  maxSide?: number;
};
export type CadastroResponse =
  | { type: "progress"; label: string }
  | { type: "done"; modelo: Modelo; facade: Box; width: number; height: number; achados: number; porTipo: number[]; brutos: number[]; ms: number }
  | { type: "error"; message: string };

const post = (m: CadastroResponse) => self.postMessage(m);

self.onmessage = async (e: MessageEvent<CadastroRequest>) => {
  const t0 = performance.now();
  try {
    const { url, mmPerPixel, seeds } = e.data;
    post({ type: "progress", label: "Carregando a vista" });
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error("Não foi possível baixar a imagem da vista.");
    const bmp = await createImageBitmap(await res.blob());
    const max = e.data.maxSide ?? 1200;
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
    // reduz em etapas (metade por vez) com suavização alta: reduzir de uma vez serrilha as bordas
    // finas, e é nelas que a moldura e o caixilho são medidos
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

    post({ type: "progress", label: "Lendo faixas e contorno" });
    const a = analyzeFacade(px, w, h);
    const gray = toGray(px, w, h);
    const edges = edgesOf(gray);
    const scaled = seeds.map((s) => ({ x0: s.x0 * k, y0: s.y0 * k, x1: s.x1 * k, y1: s.y1 * k }));

    const matches: (Match & { family: number })[] = [];
    for (const [family, sd] of scaled.entries()) {
      post({ type: "progress", label: `Procurando janelas do tipo ${String.fromCharCode(65 + family)}` });
      for (const m of findSimilar(gray, sd, a.facade, { edges, minScore: 0.42 })) matches.push({ ...m, family });
    }
    post({ type: "progress", label: "Alinhando e detalhando" });
    const reg = regularize(matches.map((m) => ({ ...m, arched: false })), a.facade);
    const models = matches.filter((m) => m.seed).sort((p, q) => p.family - q.family);
    const vaos = models.length ? assignFamilies(gray, reg.vaos, models) : [];
    const detalhes = Object.fromEntries(models.map((m) => [m.family, { detalhe: detailWindow(gray, edges, m), caixa: m }]));
    const modelo = modeloDaDeteccao({ facade: a.facade, bands: a.bands, vaos, detalhes, mmPerPixel: mmPerPixel / k });
    const facade = { x0: a.facade.x0 / k, y0: a.facade.y0 / k, x1: a.facade.x1 / k, y1: a.facade.y1 / k };
    const porTipo = scaled.map((_, i) => vaos.filter((v) => v.family === i).length);
    const brutos = scaled.map((_, i) => matches.filter((m) => m.family === i).length);
    post({ type: "done", modelo, facade, width: bmp.width, height: bmp.height, achados: vaos.length, porTipo, brutos, ms: Math.round(performance.now() - t0) });
  } catch (err) {
    post({ type: "error", message: err instanceof Error ? err.message : "Falha no levantamento." });
  }
};
