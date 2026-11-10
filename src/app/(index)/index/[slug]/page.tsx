import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { POSTS, fmtPostDate, getArticles, getPost, getPosts, isArticle, type PostBlock } from "@/lib/updates";
import { Rich, plain } from "../../rich";
import { getLang } from "@/lib/site/get-lang";
import { Cover, PostCard } from "../../post-card";
import { ShareButton, Toc } from "./toc";

export function generateStaticParams() {
  return [...POSTS, ...getArticles()].map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/index/[slug]">): Promise<Metadata> {
  const post = getPost((await params).slug, await getLang());
  if (!post) return {};
  const url = `/index/${post.slug}`;
  return {
    title: { absolute: `${post.seoTitle ?? post.title} · ArchRay` },
    description: plain(post.summary),
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.seoTitle ?? post.title,
      description: plain(post.summary),
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [post.author],
    },
  };
}

function Block({ b }: { b: PostBlock }) {
  if ("p" in b)
    return (
      <p>
        <Rich text={b.p} />
      </p>
    );
  if ("list" in b)
    return (
      <ul className="grid list-disc gap-2 pl-5 marker:text-muted-foreground">
        {b.list.map((t) => (
          <li key={t}>
            <Rich text={t} />
          </li>
        ))}
      </ul>
    );
  if ("callout" in b)
    return (
      <figure className="-mx-1 my-4 border-l-2 border-foreground py-1 pl-5 sm:-mx-6 sm:pl-6">
        <blockquote className="text-[22px] leading-[1.35] font-medium tracking-[-0.02em]">
          <Rich text={b.callout} />
        </blockquote>
      </figure>
    );
  return (
    <figure className="my-2">
      <div className="overflow-x-auto">
        <table className="w-full text-[14px] leading-6">
          <thead>
            <tr className="border-b">
              {b.table.head.map((h) => (
                <th key={h} className="py-2 pr-4 text-left font-normal text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.table.rows.map((r) => (
              <tr key={r.join()} className="border-b">
                {r.map((c, i) => (
                  <td key={i} className="py-2.5 pr-4">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {b.table.caption && <figcaption className="mt-2 text-[14px] leading-6 text-muted-foreground">{b.table.caption}</figcaption>}
    </figure>
  );
}

export default async function PostPage({ params }: PageProps<"/index/[slug]">) {
  const lang = await getLang();
  const en = lang === "en";
  const post = getPost((await params).slug, lang);
  if (!post) notFound();
  const article = isArticle(post.slug);
  // artigos sugerem outros artigos da mesma categoria primeiro
  const pool = article ? getArticles() : getPosts(lang);
  const more = [...pool.filter((p) => p.slug !== post.slug && p.category === post.category), ...pool.filter((p) => p.slug !== post.slug && p.category !== post.category)].slice(0, 3);
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://archray.com.br";
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: plain(post.summary),
      image: [`${base}/index/${post.slug}/opengraph-image`],
      datePublished: post.date,
      dateModified: post.updated ?? post.date,
      inLanguage: "pt-BR",
      author: { "@type": "Organization", name: post.author, url: base },
      publisher: { "@type": "Organization", name: "ArchRay", url: base, logo: { "@type": "ImageObject", url: `${base}/icon.png` } },
      mainEntityOfPage: `${base}/index/${post.slug}`,
      keywords: post.keywords?.join(", "),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ArchRay", item: base },
        { "@type": "ListItem", position: 2, name: "Index", item: `${base}/index` },
        { "@type": "ListItem", position: 3, name: post.title, item: `${base}/index/${post.slug}` },
      ],
    },
    ...(post.faq?.length
      ? [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: post.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: plain(f.a) } })),
          },
        ]
      : []),
  ];

  return (
    <article className="px-4 pb-24 sm:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      {/* cabeçalho centralizado */}
      <header className="mx-auto max-w-[1100px] pt-12 sm:pt-16">
        <p className="a-tag">
          <Link href="/index" className="hover:text-foreground">
            {post.category}
          </Link>
          <span>{fmtPostDate(post.date, "long", lang)}</span>
        </p>
        <h1 className="mt-5 max-w-[22ch] text-[38px] leading-[1.06] sm:text-[60px]">{post.title}</h1>
        <p className="a-serif mt-6 max-w-[48ch] text-[20px] leading-[1.45] sm:text-[23px]">{post.summary}</p>
        <Cover slug={post.slug} title={post.title} image={post.image} imageAlt={post.imageAlt} aspect="aspect-[21/9]" className="mt-10" priority />
        <div className="mt-6 flex items-center justify-between border-b pb-4 text-[14px]">
          <span className="text-muted-foreground">{post.author}</span>
          <ShareButton title={post.title} lang={lang} />
        </div>
      </header>

      {/* sumário fixo à esquerda + texto numa coluna estreita */}
      <div className="mx-auto mt-14 grid max-w-[1100px] gap-10 lg:grid-cols-[180px_minmax(0,600px)] lg:justify-center lg:gap-16">
        <Toc items={[...post.sections.map((s) => ({ id: s.id, title: s.title })), ...(post.faq?.length ? [{ id: "perguntas", title: "Perguntas frequentes" }] : [])]} label={en ? "On this page" : "Nesta página"} />
        <div className="a-serif grid gap-6 text-[19px] leading-[1.6]">
          {post.intro.map((t) => (
            <p key={t}>
              <Rich text={t} />
            </p>
          ))}
          {post.sections.map((s) => (
            <section key={s.id} id={s.id} className="grid scroll-mt-24 gap-6">
              <h2 className="mt-8 text-[26px] leading-[1.25]">{s.title}</h2>
              {s.blocks.map((b, i) => (
                <Block key={i} b={b} />
              ))}
            </section>
          ))}
          {post.faq?.length ? (
            <section id="perguntas" className="grid scroll-mt-24 gap-5">
              <h2 className="mt-8 text-[26px] leading-[1.25]">Perguntas frequentes</h2>
              {post.faq.map((f) => (
                <div key={f.q} className="grid gap-2">
                  <h3 className="font-sans text-[17px] font-semibold leading-snug">{f.q}</h3>
                  <p>
                    <Rich text={f.a} />
                  </p>
                </div>
              ))}
            </section>
          ) : null}
          {article && (
            <aside className="mt-6 grid gap-3 rounded-[12px] border p-6 font-sans text-[15px] leading-6">
              <p className="text-[18px] font-semibold">Do vídeo ao laudo com o ArchRay</p>
              <p className="text-muted-foreground">
                Filme a fachada com o celular e receba modelo 3D, imagem em escala, mapa de danos, quantitativos, orçamento e laudo em PDF.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/cadastro" className="rounded-full bg-foreground px-4 py-2 font-medium text-background">
                  Começar grátis
                </Link>
                <Link href="/tecnologia" className="rounded-full border px-4 py-2 font-medium">
                  Ver a tecnologia
                </Link>
              </div>
            </aside>
          )}

          <div className="mt-12 grid gap-8 border-t pt-8 text-[14px] leading-6">
            <div>
              <Link href="/index" className="inline-flex rounded-full bg-muted px-3 py-1 font-medium">
                {new Date(`${post.date}T12:00:00`).getFullYear()}
              </Link>
            </div>
            <div>
              <h2 className="text-muted-foreground">{en ? "Author" : "Autor"}</h2>
              <p className="mt-1">{post.author}</p>
            </div>
            {post.notes && (
              <div>
                <h2 className="text-muted-foreground">{en ? "Notes" : "Notas"}</h2>
                <ol className="mt-2 grid gap-3">
                  {post.notes.map((n, i) => (
                    <li key={n} className="grid grid-cols-[20px_1fr]">
                      <span className="text-muted-foreground">{i + 1}</span>
                      <p>{n}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>

      {more.length > 0 && (
        <section className="mx-auto mt-24 max-w-[1100px] border-t pt-8">
          <h2 className="text-[13.5px] font-bold">{en ? "Keep reading" : "Continuar lendo"}</h2>
          <ul className="mt-6 grid gap-6 sm:grid-cols-3">
            {more.map((p) => (
              <li key={p.slug}>
                <PostCard post={p} lang={lang} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
