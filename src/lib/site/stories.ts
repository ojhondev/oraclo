/**
 * Histórias: casos montados no ArchRay. Só casos reais ou com dados públicos — nada de
 * depoimentos inventados. Créditos de imagem sempre junto.
 */

import { locale, type Lang } from "./lang";

export type Story = {
  slug: string;
  title: string;
  summary: string;
  /** ISO (aaaa-mm-dd). */
  date: string;
  segment: string;
  place: string;
  cover: string;
  coverAlt: string;
  credits: string[];
};

export const STORIES: Story[] = [
  {
    slug: "carmo-da-horta",
    title: "Igreja e Convento do Carmo: um mapa de danos a partir de fotos públicas",
    summary:
      "Duas fotos de 2010, antes do restauro, viraram vistas em escala, 11 danos contornados com IA, orçamento por tipo de tratamento e prioridades GUT — sem ir a campo e sem instalar nada.",
    date: "2026-10-15",
    segment: "Patrimônio",
    place: "Horta, ilha do Faial, Açores",
    cover: "/site/carmo-convento-2010.jpg",
    coverAlt: "Fachada do pátio do Convento do Carmo da Horta em 2010, com manchas e vegetação",
    credits: [
      "Convento do Carmo e Igreja de N. Sra. do Carmo (2010): José Luís Ávila Silveira / Pedro Noronha e Costa — domínio público, Wikimedia Commons.",
      "Igreja do Carmo (2021): Vitor Oliveira — CC BY-SA 2.0, Wikimedia Commons.",
    ],
  },
];

/** Textos das histórias em inglês (mesmo slug, mesmas imagens). */
const STORIES_EN: Record<string, Pick<Story, "title" | "summary" | "segment" | "place" | "coverAlt" | "credits">> = {
  "carmo-da-horta": {
    title: "Church and Convent of Carmo: a damage map built from public photos",
    summary:
      "Two photos from 2010, before the restoration, became scaled views, 11 damages outlined with AI, a budget by treatment type and GUT priorities — without a site visit and without installing anything.",
    segment: "Heritage",
    place: "Horta, Faial Island, Azores",
    coverAlt: "Courtyard facade of the Carmo Convent in Horta in 2010, with stains and plant growth",
    credits: [
      "Carmo Convent and Church of Our Lady of Carmo (2010): José Luís Ávila Silveira / Pedro Noronha e Costa — public domain, Wikimedia Commons.",
      "Carmo Church (2021): Vitor Oliveira — CC BY-SA 2.0, Wikimedia Commons.",
    ],
  },
};

/** Histórias no idioma do site. */
export const getStories = (lang: Lang): Story[] => (lang === "en" ? STORIES.map((s) => ({ ...s, ...(STORIES_EN[s.slug] ?? {}) })) : STORIES);

export const fmtStoryDate = (iso: string, lang: Lang = "pt") =>
  new Intl.DateTimeFormat(locale(lang), { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));
