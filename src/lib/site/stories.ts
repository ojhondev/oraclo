/**
 * Histórias: casos montados no ArchRay. Só casos reais ou com dados públicos — nada de
 * depoimentos inventados. Créditos de imagem sempre junto.
 */

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

export const fmtStoryDate = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));
