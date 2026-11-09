/**
 * Treinador da captura em vídeo: decide, a cada janela, qual instrução mostrar na tela de gravação.
 * Puro (sem DOM), testado em tests/capture-coach.test.ts.
 */
import type { FrameVerdict } from "./video-frames";

/** Meta de quadros de uma boa captura de fachada (o teto é MAX_FRAMES). */
export const TARGET_FRAMES = 180;

/** Como a imagem atual "parece", medido numa miniatura 32×24 em tons de cinza. */
export type Look = { dark: boolean; sky: boolean; flat: boolean };

/** Lê a miniatura: escura demais, céu ocupando o topo, ou parede lisa sem detalhe para medir. */
export function lookOf(gray: ArrayLike<number>, w = 32, h = 24): Look {
  const n = Math.min(gray.length, w * h);
  if (!n) return { dark: false, sky: false, flat: false };
  let sum = 0;
  for (let i = 0; i < n; i++) sum += gray[i]!;
  const mean = sum / n;
  // topo (terço de cima): muito claro e uniforme = céu
  const top = Math.floor(h / 3) * w;
  let ts = 0;
  let tq = 0;
  for (let i = 0; i < top; i++) {
    ts += gray[i]!;
    tq += gray[i]! * gray[i]!;
  }
  const tMean = ts / top;
  const tStd = Math.sqrt(Math.max(0, tq / top - tMean * tMean));
  // detalhe: diferença média entre vizinhos (parede lisa quase não tem)
  let grad = 0;
  let cnt = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w - 1; x++) {
      const i = y * w + x;
      if (i + 1 >= n) break;
      grad += Math.abs(gray[i + 1]! - gray[i]!);
      cnt++;
    }
  }
  const detail = cnt ? grad / cnt : 0;
  return { dark: mean < 45, sky: tMean > 200 && tStd < 14, flat: mean >= 45 && detail < 2.2 };
}

export type Coach = { tone: "ok" | "warn" | "done"; title: string; hint?: string; step: number };

/** Etapas mostradas na barra de progresso, na ordem em que acontecem. */
export const COACH_STEPS = ["Passada 1", "Passada 2", "Quinas e detalhes"] as const;

/** Instrução da vez: primeiro os problemas (do mais grave), depois a etapa do roteiro. */
export function coach({ kept, verdicts, look, fast }: { kept: number; verdicts: FrameVerdict[]; look: Look | null; fast: boolean }): Coach {
  const p = kept / TARGET_FRAMES;
  const step = p < 0.45 ? 0 : p < 0.75 ? 1 : 2;
  const last3 = verdicts.slice(-3);
  if (fast) return { tone: "warn", title: "Mais devagar", hint: "A imagem está tremendo. Diminua o passo.", step };
  if (last3.length === 3 && last3.every((v) => v === "parado")) return { tone: "warn", title: "Continue andando", hint: "Parado não gera profundidade. Ande de lado, sem girar.", step };
  if (look?.dark) return { tone: "warn", title: "Pouca luz", hint: "Procure um horário mais claro ou chegue mais perto.", step };
  if (look?.sky) return { tone: "warn", title: "Muito céu no quadro", hint: "Abaixe um pouco a câmera: o céu não é reconstruído.", step };
  if (look?.flat) return { tone: "warn", title: "Parede lisa", hint: "Chegue mais perto ou inclua quinas e janelas no quadro.", step };
  if (kept >= TARGET_FRAMES) return { tone: "done", title: "Ótimo, já pode parar", hint: "Se quiser, continue para reforçar algum trecho.", step: 2 };
  if (kept < 8) return { tone: "ok", title: "Comece numa ponta da fachada", hint: "Câmera reta, na altura do peito, com a fachada inteira no quadro.", step };
  if (step === 0) return { tone: "ok", title: "Passada 1: ande de lado", hint: "Devagar, de ponta a ponta, câmera reta para a fachada.", step };
  if (step === 1) return { tone: "ok", title: "Passada 2: afaste-se e mire para cima", hint: "Volte pela fachada pegando a parte alta e o beiral.", step };
  return { tone: "ok", title: "Contorne as quinas em arco", hint: "Vire a esquina devagar e chegue perto das partes lisas.", step };
}
