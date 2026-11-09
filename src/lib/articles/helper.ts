import type { Post } from "../updates";

/** Data de publicação dos guias. */
export const DATE = "2026-11-09";

/** Fotos próprias do site usadas como capa dos guias. */
export const IMG = {
  fachada: { image: "/site/showcase-fachada.jpg", imageAlt: "Fachada de edifício histórico fotografada para vistoria técnica" },
  vista: { image: "/site/showcase-vista.jpg", imageAlt: "Vista de fachada em escala preparada para o mapa de danos" },
  tablet: { image: "/site/tablet-mapa-de-danos.jpg", imageAlt: "Mapa de danos de fachada aberto num tablet" },
  retificada: { image: "/site/carmo-fachada-retificada.jpg", imageAlt: "Fachada da Igreja do Carmo retificada em escala" },
  igreja2010: { image: "/site/carmo-igreja-2010.jpg", imageAlt: "Igreja do Carmo, na Horta, fotografada em 2010" },
  igreja2021: { image: "/site/carmo-igreja-2021.jpg", imageAlt: "Igreja do Carmo, na Horta, fotografada em 2021" },
  convento: { image: "/site/carmo-convento-2010.jpg", imageAlt: "Fachada do Convento do Carmo, na Horta" },
  arquiteta: { image: "/site/arquiteta-escritorio.jpg", imageAlt: "Arquiteta analisando projeto de restauro no escritório" },
  livros: { image: "/site/notebook-livros.jpg", imageAlt: "Notebook e livros técnicos sobre patologia das construções" },
} as const;

/** Endereços do Estúdio Restaura, para os temas de restauro e patrimônio. */
export const ER = {
  servicos: "https://estudiorestaura.com.br/servicos",
  projetos: "https://estudiorestaura.com.br/projetos",
  sobre: "https://estudiorestaura.com.br/sobre",
  blog: "https://estudiorestaura.com.br/blog",
  contato: "https://estudiorestaura.com.br/contato",
};

type ArticleInput = Omit<Post, "banner" | "author" | "date"> & Partial<Pick<Post, "date" | "author">>;

/** Monta um guia com os campos fixos (data, autor, sem banner no app). */
export const article = (a: ArticleInput): Post => ({ date: DATE, updated: DATE, author: "Equipe ArchRay", banner: "", ...a });
