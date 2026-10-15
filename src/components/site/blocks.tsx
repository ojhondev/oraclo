import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtPostDate, type Post } from "@/lib/updates";
import { fmtStoryDate, type Story } from "@/lib/site/stories";
import { Cover } from "@/app/(index)/post-card";

/** Título de seção com "Ver tudo" à direita (padrão da home da OpenAI). */
export function SectionHead({ title, href, more = "Ver tudo" }: { title: string; href?: string; more?: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="text-[26px] leading-tight font-medium tracking-[-0.02em] sm:text-[32px]">{title}</h2>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1 text-[14px] text-muted-foreground hover:text-foreground">
          {more} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export function Meta({ label, date }: { label: string; date: string }) {
  return (
    <p className="text-[13px]">
      <span className="font-medium">{label}</span>
      <span className="ml-2 text-muted-foreground">{date}</span>
    </p>
  );
}

/** Item de lista do Index: miniatura quadrada + título + categoria e data. */
export function PostRow({ post }: { post: Post }) {
  return (
    <Link href={`/index/${post.slug}`} className="group grid grid-cols-[96px_1fr] items-center gap-4 sm:grid-cols-[120px_1fr] sm:gap-5">
      <div className="overflow-hidden rounded-xl [&>div]:aspect-square [&>div]:rounded-xl">
        <Cover title={post.title} />
      </div>
      <div className="min-w-0">
        <h3 className="text-[16px] leading-snug font-medium group-hover:underline group-hover:underline-offset-4 sm:text-[17px]">{post.title}</h3>
        <div className="mt-2">
          <Meta label={post.category} date={fmtPostDate(post.date, "short")} />
        </div>
      </div>
    </Link>
  );
}

/** Card alto de história (imagem grande, título por baixo). */
export function StoryCard({ story, large }: { story: Story; large?: boolean }) {
  return (
    <Link href={`/historias/${story.slug}`} className="group block">
      <div className={cn("relative overflow-hidden rounded-2xl bg-muted", large ? "aspect-[16/10]" : "aspect-[4/5]")}>
        <Image
          src={story.cover}
          alt={story.coverAlt}
          fill
          sizes={large ? "(min-width: 1024px) 60vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </div>
      <h3 className="mt-4 text-[17px] leading-snug font-medium group-hover:underline group-hover:underline-offset-4">{story.title}</h3>
      <div className="mt-2">
        <Meta label={story.segment} date={fmtStoryDate(story.date)} />
      </div>
    </Link>
  );
}

/** Card de segmento (ArchRay para empresas). */
export function SegmentCard({ href, title, text, index }: { href: string; title: string; text: string; index: number }) {
  return (
    <Link href={href} className="group flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-2xl bg-muted p-6 sm:aspect-[4/4.4]">
      <SegmentArt index={index} />
      <div>
        <h3 className="text-[20px] leading-snug font-medium tracking-[-0.01em]">{title}</h3>
        <p className="mt-2 text-[14.5px] leading-6 text-muted-foreground">{text}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-[14px] font-medium">
          Saiba mais <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

/** Desenhos de linha simples (preto e branco) para os segmentos. */
function SegmentArt({ index }: { index: number }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.5 } as const;
  return (
    <svg viewBox="0 0 160 100" className="h-24 w-auto text-foreground/70" aria-hidden>
      {index === 0 && (
        <g {...common}>
          <path d="M20 90V40l30-24 30 24v50" />
          <path d="M80 90V30h60v60" />
          <path d="M42 90V62h16v28M92 46h12v14H92zM116 46h12v14h-12zM92 70h12v14H92zM116 70h12v14h-12z" />
          <path d="M50 16V6" />
          <circle cx="38" cy="50" r="5" strokeDasharray="2 2" />
        </g>
      )}
      {index === 1 && (
        <g {...common}>
          <path d="M30 90V12h100v78" />
          {[24, 40, 56, 72].map((y) => (
            <path key={y} d={`M44 ${y}h12v8H44zM74 ${y}h12v8H74zM104 ${y}h12v8h-12z`} />
          ))}
          <path d="M60 34l6 10-4 8 7 12" strokeDasharray="3 2" />
          <path d="M20 90h120" />
        </g>
      )}
      {index === 2 && (
        <g {...common}>
          <path d="M30 90V44h100v46" />
          <path d="M24 44l56-30 56 30" />
          <path d="M70 90V62a10 10 0 0120 0v28" />
          <path d="M80 14V2M74 7h12" />
          <path d="M44 56h10v14H44zM106 56h10v14h-10z" />
        </g>
      )}
    </svg>
  );
}
