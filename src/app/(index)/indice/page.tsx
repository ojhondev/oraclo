import Link from "next/link";
import type { Metadata } from "next";
import { fmtPostDate, getPosts } from "@/lib/updates";
import { getLang } from "@/lib/site/get-lang";
import { Cover, PostCard } from "../post-card";

export async function generateMetadata(): Promise<Metadata> {
  const en = (await getLang()) === "en";
  return { title: "Index", description: en ? "News and improvements on the ArchRay platform." : "Novidades e melhorias da plataforma ArchRay." };
}

export default async function IndexPage() {
  const lang = await getLang();
  const [first, ...rest] = getPosts(lang);
  return (
    <div className="px-4 pt-14 pb-24 sm:px-8 sm:pt-20">
      <h1 className="text-[44px] leading-[1.05] font-medium tracking-[-0.03em] sm:text-[60px]">Index</h1>
      <p className="mt-3 max-w-xl text-[17px] leading-7 text-muted-foreground">
        {lang === "en" ? "News, improvements and what we are building at ArchRay." : "Novidades, melhorias e o que estamos construindo no ArchRay."}
      </p>

      {first && (
        <Link href={`/index/${first.slug}`} className="group mt-12 grid gap-6 border-t pt-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
          <Cover title={first.title} large />
          <div className="flex flex-col justify-center">
            <p className="text-[14px] font-medium">
              {first.category} <span className="ml-2 text-muted-foreground">{fmtPostDate(first.date, "long", lang)}</span>
            </p>
            <h2 className="mt-3 text-[30px] leading-[1.15] font-medium tracking-[-0.02em] group-hover:underline group-hover:underline-offset-4">
              {first.title}
            </h2>
            <p className="mt-3 text-[16px] leading-7 text-muted-foreground">{first.summary}</p>
          </div>
        </Link>
      )}

      {rest.length > 0 && (
        <ul className="mt-14 grid gap-x-6 gap-y-12 border-t pt-8 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => (
            <li key={p.slug}>
              <PostCard post={p} lang={lang} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
