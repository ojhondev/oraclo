import { describe, expect, it } from "vitest";
import { ARTICLE_ILLO } from "@/lib/articles/illos";
import { ILLO_NAMES } from "@/components/site/illo";
import { ARTICLES } from "@/lib/articles";
import { POSTS } from "@/lib/updates";
import { STORIES } from "@/lib/site/stories";

const SITE_ROUTES = ["/", "/tecnologia", "/empresas", "/empresa", "/contato", "/compromissos", "/docs", "/historias", "/index", "/marcador", "/cadastro"];

function allText(a: (typeof ARTICLES)[number]) {
  const parts: string[] = [a.summary, ...a.intro, ...(a.faq ?? []).flatMap((f) => [f.q, f.a])];
  for (const s of a.sections)
    for (const b of s.blocks) {
      if ("p" in b) parts.push(b.p);
      else if ("list" in b) parts.push(...b.list);
      else if ("callout" in b) parts.push(b.callout);
      else parts.push(...b.table.rows.flat(), ...(b.table.caption ? [b.table.caption] : []));
    }
  return parts.join("\n");
}

describe("guias técnicos do Index", () => {
  it("são 30, com endereços únicos e sem colidir com as novidades", () => {
    expect(ARTICLES).toHaveLength(30);
    const slugs = ARTICLES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(30);
    for (const p of POSTS) expect(slugs).not.toContain(p.slug);
  });

  it("cada link interno aponta para uma página que existe", () => {
    const valid = new Set([...ARTICLES.map((a) => `/index/${a.slug}`), ...POSTS.map((p) => `/index/${p.slug}`), ...STORIES.map((s) => `/historias/${s.slug}`), ...SITE_ROUTES]);
    for (const a of ARTICLES) {
      for (const m of allText(a).matchAll(/\]\(([^)\s]+)\)/g)) {
        const href = m[1]!;
        if (href.startsWith("http")) {
          expect(href, `${a.slug}: link externo`).toMatch(/^https:\/\/estudiorestaura\.com\.br\//);
          continue;
        }
        expect(valid.has(href), `${a.slug} → ${href}`).toBe(true);
      }
    }
  });

  it("cada artigo liga a pelo menos três outros e não liga a si mesmo", () => {
    for (const a of ARTICLES) {
      const links = [...allText(a).matchAll(/\]\(\/index\/([^)]+)\)/g)].map((m) => m[1]);
      expect(links, a.slug).not.toContain(a.slug);
      expect(new Set(links).size, a.slug).toBeGreaterThanOrEqual(3);
    }
  });

  it("título e resumo cabem no resultado do Google; capa, palavras-chave e perguntas presentes", () => {
    for (const a of ARTICLES) {
      expect((a.seoTitle ?? a.title).length + " · ArchRay".length, a.slug).toBeLessThanOrEqual(70);
      expect(a.summary.length, a.slug).toBeLessThanOrEqual(200);
      expect(a.keywords?.length, a.slug).toBeGreaterThanOrEqual(3);
      expect(a.faq?.length, a.slug).toBeGreaterThanOrEqual(2);
      expect(ARTICLE_ILLO[a.slug], `${a.slug}: sem ilustração`).toBeTruthy();
      expect(ILLO_NAMES as string[], a.slug).toContain(ARTICLE_ILLO[a.slug]);
    }
  });

  it("os temas de restauro e patrimônio citam o Estúdio Restaura", () => {
    for (const a of ARTICLES.filter((x) => x.category === "Restauro e patrimônio")) expect(allText(a), a.slug).toMatch(/estudiorestaura\.com\.br/);
  });
});

describe("capas ilustradas", () => {
  it("cada guia tem uma ilustração própria, sem repetir", () => {
    const used = ARTICLES.map((a) => ARTICLE_ILLO[a.slug]);
    expect(new Set(used).size).toBe(ARTICLES.length);
    for (const a of ARTICLES) expect(a.image, a.slug).toBeUndefined();
  });
});
