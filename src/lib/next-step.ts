/**
 * Caminho do projeto, em linguagem simples: capturar → preparar a imagem → marcar danos → gerar laudo.
 * Áreas e vistorias continuam disponíveis, mas não bloqueiam ninguém: a vistoria do dia nasce sozinha.
 */
export type NextStepId = "capturar" | "vista" | "danos" | "laudo";

export type NextStep = { id: NextStepId; title: string; body: string; done: number; total: number };

export const STEP_LABELS: { id: NextStepId; label: string }[] = [
  { id: "capturar", label: "Capturar" },
  { id: "vista", label: "Preparar a imagem" },
  { id: "danos", label: "Marcar danos" },
  { id: "laudo", label: "Gerar laudo" },
];

export function nextStep(c: { captures: number; models: number; vistas: number; damages: number }): NextStep {
  const total = STEP_LABELS.length;
  if (c.vistas > 0 && c.damages > 0) {
    return { id: "laudo", done: 3, total, title: "Gere o laudo", body: "Confira o resumo e as prioridades, e gere o laudo em PDF." };
  }
  if (c.vistas > 0) {
    return { id: "danos", done: 2, total, title: "Marque os danos na imagem", body: "Quantidades, orçamento e prioridades são calculados sozinhos." };
  }
  if (c.models > 0) {
    return { id: "vista", done: 1, total, title: "Gere a imagem da fachada", body: "Abra o modelo 3D, informe uma medida real e gere a imagem em escala." };
  }
  if (c.captures > 0) {
    return { id: "vista", done: 1, total, title: "Prepare a imagem da fachada", body: "Abra a captura para gerar o modelo 3D, ou use uma foto de frente e uma medida real." };
  }
  return { id: "capturar", done: 0, total, title: "Comece filmando a fachada", body: "Ande devagar de ponta a ponta com o celular. O ArchRay cuida do resto." };
}
