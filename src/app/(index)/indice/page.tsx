import Link from "next/link";
import type { Metadata } from "next";
import { fmtPostDate, getPosts } from "@/lib/updates";
import { getLang } from "@/lib/site/get-lang";
import { Cover, PostCard } from "../post-card";

export async function generateMetadata(): Promise<Metadata> {
  const en = (await getLang()) === "en";
  return { title: "Index", description: en ? "News and improvements on the ArchRay platform." : "Novidades e melhorias da plataforma ArchRay." };
}

/** Index na estrutura da redação da Anthropic: "Últimas" e grade editorial em três colunas com o destaque no centro. */
export default async function IndexPage() {
  const lang = await getLang();
  const en = lang === "en";
  const posts = getPosts(lang);
  const [first, ...rest] = posts;
  const left = rest.filter((_, i) => i % 2 === 0);
  const right = rest.filter((_, i) => i % 2 === 1);
  const today = fmtPostDate(new Date().toISOString().slice(0, 10), "long", lang);

  return (
    <div className="px-4 pt-10 pb-8 sm:px-6 lg:px-8">
      <div className="flex items-baseline justify-between border-y py-3">
        <h1 className="text-[13.5px] font-bold">{en ? "Latest" : "Últimas"}</h1>
        <span className="text-[12.5px] text-muted-foreground">{today}</span>
      </div>

      {first && (
        <div className="grid gap-10 pt-8 lg:grid-cols-[1fr_2fr_1fr] lg:gap-0">
          {/* coluna esquerda: publicações com ilustração */}
          <ul className="order-2 grid content-start gap-10 lg:order-1 lg:border-r lg:pr-6">
            {left.map((p) => (
              <li key={p.slug}>
                <PostCard post={p} lang={lang} />
              </li>
            ))}
            <li>
              <Link href="/historias/carmo-da-horta" className="group block">
                <p className="a-tag">{en ? "Case" : "Caso"}</p>
                <h3 className="a-title mt-3 text-[19px] leading-snug group-hover:underline group-hover:underline-offset-4">
                  {en ? "Carmo Church, Horta: the complete diagnosis" : "Igreja do Carmo, Horta: o diagnóstico completo"}
                </h3>
              </Link>
            </li>
          </ul>

          {/* centro: destaque */}
          <Link href={`/index/${first.slug}`} className="group order-1 block lg:order-2 lg:px-6">
            <p className="a-tag">
              {first.category} · {fmtPostDate(first.date, "short", lang)}
            </p>
            <Cover slug={first.slug} title={first.title} aspect="aspect-[16/10]" className="mt-3" />
            <h2 className="mt-5 text-[30px] leading-[1.12] group-hover:underline group-hover:underline-offset-4 sm:text-[38px]">{first.title}</h2>
            <p className="mt-3 max-w-[60ch] text-[16px] leading-7 text-muted-foreground">{first.summary}</p>
          </Link>

          {/* coluna direita: lista só de texto */}
          <ul className="order-3 grid content-start lg:border-l lg:pl-6">
            {right.map((p) => (
              <li key={p.slug} className="border-b py-6 first:pt-0">
                <PostCard post={p} lang={lang} image={false} />
              </li>
            ))}
            <li className="py-6 first:pt-0">
              <Link href="/tecnologia" className="group block">
                <p className="a-tag">{en ? "Technology" : "Tecnologia"}</p>
                <h3 className="a-title mt-3 text-[19px] leading-snug group-hover:underline group-hover:underline-offset-4">
                  {en ? "Inside the ArchRay engine" : "Por dentro do motor do ArchRay"}
                </h3>
                <p className="mt-2 text-[14.5px] leading-6 text-muted-foreground">
                  {en
                    ? "Rectification, detection, AI outline, survey comparison and reports — how each part works."
                    : "Retificação, detecção, contorno IA, comparação de vistorias e laudo — como cada parte funciona."}
                </p>
              </Link>
            </li>
          </ul>
        </div>
      )}

      {/* todas as publicações, em lista */}
      <div className="mt-20 flex items-baseline justify-between border-y py-3">
        <h2 className="text-[13.5px] font-bold">{en ? "All posts" : "Todas as publicações"}</h2>
      </div>
      <ul>
        {posts.map((p) => (
          <li key={p.slug} className="border-b">
            <Link href={`/index/${p.slug}`} className="group grid gap-2 py-6 md:grid-cols-[180px_minmax(0,1fr)_minmax(0,1.3fr)] md:gap-8">
              <span className="a-tag">
                {p.category} · {fmtPostDate(p.date, "short", lang)}
              </span>
              <span className="a-title text-[19px] leading-snug group-hover:underline group-hover:underline-offset-4">{p.title}</span>
              <span className="text-[14.5px] leading-6 text-muted-foreground">{p.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
