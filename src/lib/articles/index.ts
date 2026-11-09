/**
 * Guias técnicos do Index (artigos para busca). Só em português, com links internos entre si
 * e para o Estúdio Restaura nos temas de restauro e patrimônio. Capas: fotos de /public/site.
 */
import type { Post } from "../updates";
import { MAPA_DE_DANOS } from "./mapa-de-danos";
import { PATOLOGIAS } from "./patologias";
import { INSPECAO } from "./inspecao";
import { TECNOLOGIA } from "./tecnologia";
import { RESTAURO } from "./restauro";

export const ARTICLES: Post[] = [...MAPA_DE_DANOS, ...PATOLOGIAS, ...INSPECAO, ...TECNOLOGIA, ...RESTAURO];
