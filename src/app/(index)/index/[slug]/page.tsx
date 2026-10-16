import Link from "next/link";
import { notFound } from "next/navigation";
import { POSTS, fmtPostDate, getPost, getPosts, type PostBlock } from "@/lib/updates";
import { getLang } from "@/lib/site/get-lang";
import { PostCard } from "../../post-card";
import { ShareButton, Toc } from "./toc";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/index/[slug]">) {
  const post = getPost((await params).slug, await getLang());
  return post ? { title: post.title, description: post.summary } : {};
}

function Block({ b }: { b: PostBlock }) {
  if ("p" in b) return <p>{b.p}</p>;
  if ("list" in b)
    return (
      <ul className="grid list-disc gap-2 pl-5 marker:text-muted-foreground">
        {b.list.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    );
  if ("callout" in b)
    return (
      <figure className="-mx-1 my-4 border-l-2 border-foreground py-1 pl-5 sm:-mx-6 sm:pl-6">
        <blockquote className="text-[22px] leading-[1.35] font-medium tracking-[-0.02em]">{b.callout}</blockquote>
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
  const more = getPosts(lang).filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <article className="px-4 pb-24 sm:px-8">
      {/* cabeçalho centralizado */}
      <header className="mx-auto max-w-[800px] pt-16 text-center sm:pt-24">
        <p className="text-[14px] font-medium">
          {fmtPostDate(post.date, "long", lang)}
          <Link href="/index" className="ml-3 text-muted-foreground hover:text-foreground">
            {post.category}
          </Link>
        </p>
        <h1 className="mt-6 text-[38px] leading-[1.05] font-medium tracking-[-0.03em] text-balance sm:text-[56px]">{post.title}</h1>
        <p className="mx-auto mt-6 max-w-[520px] text-[17px] leading-7 text-balance">{post.summary}</p>
        <div className="mx-auto mt-12 flex max-w-[600px] items-center justify-between border-t pt-4 text-[14px] font-medium">
          <span className="text-muted-foreground">{post.author}</span>
          <ShareButton title={post.title} lang={lang} />
        </div>
      </header>

      {/* sumário fixo à esquerda + texto numa coluna estreita */}
      <div className="mx-auto mt-14 grid max-w-[1100px] gap-10 lg:grid-cols-[180px_minmax(0,600px)] lg:justify-center lg:gap-16">
        <Toc items={post.sections.map((s) => ({ id: s.id, title: s.title }))} label={en ? "On this page" : "Nesta página"} />
        <div className="grid gap-6 text-[17px] leading-7 tracking-[-0.01em]">
          {post.intro.map((t) => (
            <p key={t}>{t}</p>
          ))}
          {post.sections.map((s) => (
            <section key={s.id} id={s.id} className="grid scroll-mt-24 gap-6">
              <h2 className="mt-8 text-[29px] leading-[1.3] font-medium tracking-[-0.015em]">{s.title}</h2>
              {s.blocks.map((b, i) => (
                <Block key={i} b={b} />
              ))}
            </section>
          ))}

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
          <h2 className="text-[22px] font-medium tracking-[-0.01em]">{en ? "Keep reading" : "Continuar lendo"}</h2>
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
