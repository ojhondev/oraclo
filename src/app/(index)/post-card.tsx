import Link from "next/link";
import { fmtPostDate, type Post } from "@/lib/updates";
import type { Lang } from "@/lib/site/lang";

export function PostCard({ post, lang = "pt" }: { post: Post; lang?: Lang }) {
  return (
    <Link href={`/index/${post.slug}`} className="group block">
      <Cover title={post.title} />
      <h3 className="mt-4 text-[17px] leading-6 font-medium group-hover:underline group-hover:underline-offset-4">{post.title}</h3>
      <p className="mt-1 text-[14px] font-medium text-muted-foreground">
        {post.category} · {fmtPostDate(post.date, "short", lang)}
      </p>
    </Link>
  );
}

/** Capa gerada: o símbolo do ArchRay sobre um campo neutro (sem fotos de terceiros). */
export function Cover({ title, large }: { title: string; large?: boolean }) {
  return (
    <div className="relative grid aspect-[16/10] place-items-center overflow-hidden rounded-2xl bg-muted" aria-label={title}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/icone.png" alt="" aria-hidden width={374} height={458} className={large ? "relative z-10 h-[46%] w-auto" : "relative z-10 h-[40%] w-auto"} />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:48px_48px] opacity-60 mix-blend-multiply dark:mix-blend-screen" />
    </div>
  );
}
