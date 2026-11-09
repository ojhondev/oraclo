import type { MetadataRoute } from "next";
import { getArticles, POSTS } from "@/lib/updates";
import { STORIES } from "@/lib/site/stories";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://archray.com.br";

/** Mapa do site para o Google: páginas públicas, publicações do Index, artigos e histórias. */
export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" = "monthly", lastModified?: string) => ({
    url: `${BASE}${path}`,
    priority,
    changeFrequency,
    lastModified: lastModified ? new Date(`${lastModified}T12:00:00`) : undefined,
  });
  return [
    page("/", 1, "weekly"),
    page("/tecnologia", 0.9),
    page("/empresas", 0.8),
    page("/index", 0.8, "weekly"),
    page("/historias", 0.6),
    page("/empresa", 0.5),
    page("/contato", 0.6),
    page("/compromissos", 0.4),
    page("/docs", 0.5),
    page("/marcador", 0.4),
    ...getArticles().map((a) => page(`/index/${a.slug}`, 0.7, "monthly", a.updated ?? a.date)),
    ...POSTS.map((p) => page(`/index/${p.slug}`, 0.5, "monthly", p.date)),
    ...STORIES.map((s) => page(`/historias/${s.slug}`, 0.6)),
  ];
}
