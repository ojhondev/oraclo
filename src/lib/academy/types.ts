/**
 * Academy: aulas de uso do ArchRay, com passo a passo, prints anotados e teste rápido.
 * Texto com **negrito** e [[termo]] / [[termo|texto]] (link para o glossário).
 */

export type AcademyImage = {
  /** Arquivo em public/academy (sem extensão) ou caminho absoluto (/docs/…). */
  src: string;
  alt: string;
  caption?: string;
  /** Legenda das marcas numeradas do print, na ordem 1, 2, 3… */
  marks?: string[];
};

export type AcademyBlock =
  | { h: string }
  | { p: string }
  | { list: string[] }
  | { steps: string[] }
  | { img: AcademyImage }
  | { tip: string }
  | { warn: string }
  | { keys: [string, string][] }
  | { table: { head: string[]; rows: string[][] } };

export type AcademyQuestion = { q: string; options: string[]; answer: number; explain: string };

export type AcademyLesson = {
  id: string;
  track: string;
  title: string;
  summary: string;
  minutes: number;
  objectives: string[];
  blocks: AcademyBlock[];
  /** Erros comuns e como resolver. */
  pitfalls?: { q: string; a: string }[];
  check?: AcademyQuestion[];
  practice?: { label: string; href: string };
};

export type AcademyTrack = { id: string; title: string; description: string };

export type GlossaryTerm = { id: string; term: string; definition: string; lessons?: string[] };
