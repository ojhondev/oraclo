/** Próximo passo sugerido na tela de Projeto, na ordem natural do trabalho: áreas → vistoria → vista → danos → laudo. */
export type NextStepId = "areas" | "vistoria" | "vista" | "danos" | "laudo";

export type NextStep = { id: NextStepId; title: string; body: string; done: number; total: number };

export function nextStep(c: { elements: number; campaigns: number; vistas: number; damages: number }): NextStep {
  const total = 5;
  if (c.elements === 0) {
    return { id: "areas", done: 0, total, title: "Cadastre as áreas do imóvel", body: "Fachadas, pavimentos, cobertura… Cada vista e cada dano fica ligado a uma área." };
  }
  if (c.campaigns === 0) {
    return { id: "vistoria", done: 1, total, title: "Crie a primeira vistoria", body: "Uma vistoria é a visita ao imóvel numa data. Ela agrupa as vistas, os danos e as fotos de campo." };
  }
  if (c.vistas === 0) {
    return { id: "vista", done: 2, total, title: "Crie a primeira vista", body: "Retifique a foto de uma fachada (4 cantos e uma medida) ou importe uma planta em escala." };
  }
  if (c.damages === 0) {
    return { id: "danos", done: 3, total, title: "Aponte os danos na vista", body: "Marque pontos, linhas e áreas. Quantidades, orçamento e prioridade GUT saem sozinhos." };
  }
  return { id: "laudo", done: 4, total, title: "Gere o laudo", body: "Confira o resumo e as prioridades, e gere o laudo de estado de conservação em PDF." };
}
