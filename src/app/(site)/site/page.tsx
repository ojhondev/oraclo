import type { Metadata } from "next";
import { getLang } from "@/lib/site/get-lang";
import { SITE } from "@/lib/site/site-copy";
import { getArticles } from "@/lib/updates";
import { EngHome } from "@/components/eng/home";

// Servida em "/" para quem não está logado (reescrita em src/proxy.ts).
export async function generateMetadata(): Promise<Metadata> {
  const t = SITE[await getLang()].home;
  return { title: { absolute: t.metaTitle }, description: t.metaDescription, alternates: { canonical: "/" } };
}

/** Home do site (v2, 2026-11-17): linguagem de engenharia, rolagem contínua e ilustrações em curvas de nível. */
export default async function SitePage() {
  const lang = await getLang();
  const guides = getArticles()
    .slice(0, 5)
    .map((a) => ({ slug: a.slug, title: a.title, category: a.category, summary: a.summary }));
  return <EngHome lang={lang} guides={guides} />;
}
