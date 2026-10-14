/**
 * Seleção de quadros de vídeo no próprio aparelho (navegador). Em vez de enviar o vídeo
 * inteiro (centenas de MB), percorre o vídeo, mede a nitidez de vários candidatos em cada
 * janela de tempo e fica só com o melhor — descartando os tremidos e os repetidos (quando
 * a pessoa ficou parada). Os quadros escolhidos saem como JPEG na resolução do vídeo.
 */
import { measureSharpness } from "@/lib/capture-queue";

export type VideoFrame = { blob: Blob; width: number; height: number; sharpness: number | null; time: number };

export type ExtractStats = {
  progress: number; // 0–1
  kept: number;
  blurry: number;
  duplicate: number;
  duration: number;
  width: number;
  height: number;
};

type Options = {
  /** Quadros por segundo a manter (antes dos descartes). */
  fps?: number;
  /** Candidatos avaliados por janela — o mais nítido vence. */
  candidates?: number;
  signal?: AbortSignal;
  onFrame: (f: VideoFrame) => Promise<void>;
  onProgress?: (s: ExtractStats) => void;
};

function loadVideo(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.src = URL.createObjectURL(file);
    v.onloadedmetadata = () => resolve(v);
    v.onerror = () => reject(new Error("Este navegador não conseguiu abrir o vídeo. Tente MP4 (H.264) ou grave pelo Oraclo."));
  });
}

function seek(v: HTMLVideoElement, t: number) {
  return new Promise<void>((resolve) => {
    const done = () => {
      v.removeEventListener("seeked", done);
      resolve();
    };
    v.addEventListener("seeked", done);
    v.currentTime = Math.min(t, Math.max(0, v.duration - 0.001));
  });
}

/** Miniatura 32×18 em cinza para detectar quadros quase iguais (pessoa parada). */
function thumb(src: CanvasImageSource, w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 18;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(src, 0, 0, w, h, 0, 0, 32, 18);
  const d = ctx.getImageData(0, 0, 32, 18).data;
  const g = new Float32Array(32 * 18);
  for (let i = 0; i < g.length; i++) g[i] = 0.299 * d[i * 4]! + 0.587 * d[i * 4 + 1]! + 0.114 * d[i * 4 + 2]!;
  return g;
}

const diff = (a: Float32Array, b: Float32Array) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i]! - b[i]!);
  return s / a.length;
};

export async function extractFrames(file: File, opts: Options) {
  const fps = opts.fps ?? 2.5;
  const candidates = opts.candidates ?? 3;
  const v = await loadVideo(file);
  try {
    // alguns navegadores (iPhone) só permitem buscar quadros depois de um play
    try {
      await v.play();
      v.pause();
    } catch {}
    const W = v.videoWidth;
    const H = v.videoHeight;
    const duration = v.duration;
    if (!W || !H || !Number.isFinite(duration) || duration <= 0) throw new Error("Vídeo sem imagem ou duração inválida.");

    const full = document.createElement("canvas");
    full.width = W;
    full.height = H;
    const fctx = full.getContext("2d")!;

    const stats: ExtractStats = { progress: 0, kept: 0, blurry: 0, duplicate: 0, duration, width: W, height: H };
    const recent: number[] = [];
    let lastThumb: Float32Array | null = null;
    const windowLen = 1 / fps;

    for (let t0 = 0; t0 < duration; t0 += windowLen) {
      if (opts.signal?.aborted) throw new DOMException("Cancelado", "AbortError");
      // avalia N candidatos na janela e guarda o mais nítido
      let best: { t: number; s: number } | null = null;
      for (let k = 0; k < candidates; k++) {
        const t = t0 + (windowLen * (k + 0.5)) / candidates;
        if (t >= duration) break;
        await seek(v, t);
        const s = measureSharpness(v, W, H) ?? 0;
        if (!best || s > best.s) best = { t, s };
      }
      if (!best) continue;
      await seek(v, best.t);
      fctx.drawImage(v, 0, 0, W, H);

      // descarta tremido (bem abaixo da mediana recente) e repetido (quase igual ao último mantido)
      const median = recent.length >= 4 ? [...recent].sort((a, b) => a - b)[Math.floor(recent.length / 2)]! : null;
      const th = thumb(full, W, H);
      if ((median != null && best.s < median * 0.45) || best.s < 8) stats.blurry++;
      else if (lastThumb && diff(th, lastThumb) < 2.2) stats.duplicate++;
      else {
        const blob = await new Promise<Blob | null>((r) => full.toBlob(r, "image/jpeg", 0.93));
        if (blob) {
          await opts.onFrame({ blob, width: W, height: H, sharpness: best.s, time: best.t });
          stats.kept++;
          lastThumb = th;
        }
      }
      recent.push(best.s);
      if (recent.length > 20) recent.shift();
      stats.progress = Math.min(1, (t0 + windowLen) / duration);
      opts.onProgress?.({ ...stats });
    }
    stats.progress = 1;
    opts.onProgress?.({ ...stats });
    return stats;
  } finally {
    URL.revokeObjectURL(v.src);
    v.removeAttribute("src");
    v.load();
  }
}
