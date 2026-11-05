/**
 * Captura por vídeo: em vez de guardar o arquivo inteiro (pesado para enviar do campo), o ArchRay
 * filma e guarda só o quadro mais nítido de cada janela de tempo. Os quadros usam a mesma fila
 * de envio das fotos e seguem para a fotogrametria no motor.
 */
import { isBlurry, measureSharpness } from "./capture-queue";

/** Duração de cada janela: um quadro guardado por janela. */
export const FRAME_WINDOW_MS = 800;
/** Teto de quadros por captura: limita o armazenamento e o tempo de processamento. */
export const MAX_FRAMES = 240;
/** Abaixo disso a fotogrametria não tem material para reconstruir uma fachada. */
export const MIN_FRAMES = 20;
const JPEG_QUALITY = 0.85;
/** Diferença média (0–255) abaixo da qual a imagem é a mesma: o celular está parado. */
const STILL_DIFF = 1.5;
/** Janelas seguidas descartadas por tremor antes de aceitar a melhor disponível, para não abrir buraco. */
const MAX_GAP = 2;

export type FrameVerdict = "guardar" | "parado" | "tremido";

/** Decide o destino do melhor quadro da janela. `diff` é nulo no primeiro quadro. */
export function judgeFrame({ sharpness, recent, diff, gap }: { sharpness: number | null; recent: number[]; diff: number | null; gap: number }): FrameVerdict {
  if (diff != null && diff < STILL_DIFF) return "parado";
  if (isBlurry(sharpness, recent) && gap < MAX_GAP) return "tremido";
  return "guardar";
}

/** Aviso ao vivo: metade das últimas janelas tremidas = está andando rápido demais. */
export function tooFast(verdicts: FrameVerdict[]) {
  const last = verdicts.slice(-4);
  return last.length >= 2 && last.filter((v) => v === "tremido").length * 2 >= last.length;
}

export function meanDiff(a: Uint8ClampedArray, b: Uint8ClampedArray) {
  const n = Math.min(a.length, b.length);
  if (!n) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += Math.abs(a[i]! - b[i]!);
  return sum / n;
}

/** Miniatura 32×24 em cinza, para comparar dois quadros rapidamente. */
function grayThumb(source: CanvasImageSource) {
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 24;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return new Uint8ClampedArray();
  ctx.drawImage(source, 0, 0, 32, 24);
  const { data } = ctx.getImageData(0, 0, 32, 24);
  const out = new Uint8ClampedArray(32 * 24);
  for (let i = 0; i < out.length; i++) out[i] = 0.299 * data[i * 4]! + 0.587 * data[i * 4 + 1]! + 0.114 * data[i * 4 + 2]!;
  return out;
}

export type Frame = { blob: Blob; type: string; name: string; width: number; height: number; sharpness: number | null };

/** Recebe imagens ao longo de uma janela e, ao fechá-la, devolve o melhor quadro (ou nada). */
export class FrameSelector {
  private canvas = document.createElement("canvas");
  private best: number | null = null;
  private filled = false;
  private thumb: Uint8ClampedArray | null = null;
  private lastThumb: Uint8ClampedArray | null = null;
  private recent: number[] = [];
  private gap = 0;
  kept = 0;
  verdicts: FrameVerdict[] = [];

  offer(source: CanvasImageSource, w: number, h: number) {
    const s = measureSharpness(source, w, h);
    if (this.filled && (s ?? 0) <= (this.best ?? 0)) return;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.canvas.getContext("2d")?.drawImage(source, 0, 0, w, h);
    this.best = s;
    this.filled = true;
    this.thumb = grayThumb(source);
  }

  async closeWindow(): Promise<Frame | null> {
    if (!this.filled) return null;
    const sharpness = this.best;
    const diff = this.lastThumb && this.thumb ? meanDiff(this.lastThumb, this.thumb) : null;
    const verdict = judgeFrame({ sharpness, recent: this.recent, diff, gap: this.gap });
    this.verdicts = [...this.verdicts, verdict].slice(-8);
    this.filled = false;
    this.best = null;
    if (sharpness != null) this.recent = [...this.recent, sharpness].slice(-20);
    if (verdict !== "guardar") {
      if (verdict === "tremido") this.gap++;
      return null;
    }
    this.gap = 0;
    this.lastThumb = this.thumb;
    const blob = await new Promise<Blob | null>((r) => this.canvas.toBlob(r, "image/jpeg", JPEG_QUALITY));
    if (!blob) return null;
    this.kept++;
    return {
      blob,
      type: "image/jpeg",
      name: `quadro-${String(this.kept).padStart(4, "0")}.jpg`,
      width: this.canvas.width,
      height: this.canvas.height,
      sharpness,
    };
  }
}

/** Extrai os quadros de um vídeo já gravado (galeria). Vídeos longos usam janelas maiores, para caber no teto. */
export async function framesFromVideo(file: File, onFrame: (f: Frame) => Promise<void>, onProgress: (pct: number) => void) {
  const url = URL.createObjectURL(file);
  const v = document.createElement("video");
  v.muted = true;
  v.playsInline = true;
  v.preload = "auto";
  v.src = url;
  try {
    await new Promise<void>((resolve, reject) => {
      v.onloadeddata = () => resolve();
      v.onerror = () => reject(new Error("Este navegador não abriu o vídeo. Tente MP4 ou grave pelo ArchRay."));
    });
    const windowS = Math.max(FRAME_WINDOW_MS / 1000, v.duration / MAX_FRAMES);
    const seek = (t: number) =>
      new Promise<void>((resolve) => {
        v.onseeked = () => resolve();
        v.currentTime = t;
      });
    const sel = new FrameSelector();
    for (let t = 0; t < v.duration && sel.kept < MAX_FRAMES; t += windowS) {
      for (const k of [0.25, 0.75]) {
        await seek(Math.min(v.duration, t + windowS * k));
        sel.offer(v, v.videoWidth, v.videoHeight);
      }
      const frame = await sel.closeWindow();
      if (frame) await onFrame(frame);
      onProgress(Math.min(100, Math.round(((t + windowS) / v.duration) * 100)));
    }
    return sel.kept;
  } finally {
    URL.revokeObjectURL(url);
    v.removeAttribute("src");
  }
}
