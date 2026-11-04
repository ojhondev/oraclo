import { LESSONS_A } from "./lessons-a";
import { LESSONS_B } from "./lessons-b";
import type { AcademyLesson, AcademyTrack, GlossaryTerm } from "./types";

export type * from "./types";

export const TRACKS: AcademyTrack[] = [
  { id: "fundamentos", title: "Fundamentos", description: "O que é o ArchRay, os conceitos e como se movimentar na plataforma." },
  { id: "projeto", title: "Projeto e vistoria", description: "Cadastrar o imóvel, organizar áreas e registrar cada visita." },
  { id: "vistas", title: "Vistas em escala", description: "Da foto, da planta ou do modelo 3D à imagem onde tudo pode ser medido." },
  { id: "mapa", title: "Mapa de danos", description: "Desenhar, contornar com IA, revisar sugestões e editar cada dano." },
  { id: "entregaveis", title: "Prioridade, orçamento e entregáveis", description: "GUT, tabela de preços, laudo, prancha e DXF." },
  { id: "acompanhar", title: "Acompanhar o imóvel", description: "Comparar vistorias e ver o que mudou." },
  { id: "conta", title: "Equipe e conta", description: "Convites, papéis, perfil e senha." },
];

export const LESSONS: AcademyLesson[] = [...LESSONS_A, ...LESSONS_B];

export const lessonsOf = (track: string) => LESSONS.filter((l) => l.track === track);
export const findLesson = (id: string) => LESSONS.find((l) => l.id === id);

/** Aula anterior e seguinte, na ordem da Academy. */
export function neighbors(id: string) {
  const i = LESSONS.findIndex((l) => l.id === id);
  return { prev: i > 0 ? LESSONS[i - 1] : undefined, next: i >= 0 && i < LESSONS.length - 1 ? LESSONS[i + 1] : undefined };
}

export const TOTAL_MINUTES = LESSONS.reduce((s, l) => s + l.minutes, 0);

/** Caminho da imagem: nome em public/academy, ou caminho absoluto. */
export const imageSrc = (src: string) => (src.startsWith("/") ? src : `/academy/${src}.jpg`);

export { GLOSSARY } from "./glossary";
export type { GlossaryTerm };
