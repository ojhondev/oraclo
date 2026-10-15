import Link from "next/link";
import { POSTS, fmtPostDate } from "@/lib/updates";
import { Cover, PostCard } from "./post-card";

export const metadata = { title: "Index", description: "Novidades e melhorias da plataforma ArchRay." };

export default function IndexPage() {
  const [first, ...rest] = POSTS;
  return (
    <div className="px-4 pt-14 pb-24 sm:px-8 sm:pt-20">
      <h1 className="text-[44px] leading-[1.05] font-medium tracking-[-0.03em] sm:text-[60px]">Index</h1>
      <p className="mt-3 max-w-xl text-[17px] leading-7 text-muted-foreground">Novidades, melhorias e o que estamos construindo no ArchRay.</p>

      {first && (
        <Link href={`/index/${first.slug}`} className="group mt-12 grid gap-6 border-t pt-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
          <Cover title={first.title} large />
          <div className="flex flex-col justify-center">
            <p className="text-[14px] font-medium">
              {first.category} <span className="ml-2 text-muted-foreground">{fmtPostDate(first.date)}</span>
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
              <PostCard post={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
