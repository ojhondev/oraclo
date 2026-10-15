import Link from "next/link";
import { fmtPostDate, type Post } from "@/lib/updates";

export function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/index/${post.slug}`} className="group block">
      <Cover title={post.title} />
      <h3 className="mt-4 text-[17px] leading-6 font-medium group-hover:underline group-hover:underline-offset-4">{post.title}</h3>
      <p className="mt-1 text-[14px] font-medium text-muted-foreground">
        {post.category} · {fmtPostDate(post.date, "short")}
      </p>
    </Link>
  );
}

/** Capa gerada: o símbolo do ArchRay sobre um campo neutro (sem fotos de terceiros). */
export function Cover({ title, large }: { title: string; large?: boolean }) {
  return (
    <div className="relative grid aspect-[16/10] place-items-center overflow-hidden rounded-2xl bg-muted" aria-label={title}>
      <svg viewBox="0 0 723 508" aria-hidden className={large ? "w-[34%]" : "w-[30%]"}>
        <rect width="723" height="508" fill="var(--foreground)" />
        <ellipse cx="360.2" cy="253.5" rx="372.4" ry="193.7" transform="rotate(-24.82 360.2 253.5)" fill="var(--muted)" />
      </svg>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:48px_48px] opacity-60 mix-blend-multiply dark:mix-blend-screen" />
    </div>
  );
}
