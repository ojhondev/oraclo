import Link from "next/link";
import { MARK_PATH } from "@/components/brand";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtPostDate, type Post } from "@/lib/updates";
import { fmtStoryDate, type Story } from "@/lib/site/stories";

/** Título de seção com "Ver tudo" à direita (padrão da home da OpenAI). */
export function SectionHead({ title, href, more = "Ver tudo" }: { title: string; href?: string; more?: string }) {
  return (
    <div className="flex items-end justify-between gap-4" data-reveal="fade">
      <h2 className="text-[22px] leading-tight font-medium tracking-[-0.015em] sm:text-[26px]">{title}</h2>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1 text-[13.5px] font-medium text-foreground/80 hover:text-foreground">
          {more} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export function Meta({ label, date, extra }: { label: string; date: string; extra?: string }) {
  return (
    <p className="text-[12.5px]">
      <span className="font-medium">{label}</span>
      <span className="ml-2 text-muted-foreground">{date}</span>
      {extra && <span className="ml-2 text-muted-foreground">{extra}</span>}
    </p>
  );
}

/** Capa gerada para publicações do Index: símbolo do ArchRay sobre grade (sem fotos de terceiros). */
export function SiteCover({ className }: { className?: string }) {
  return (
    <div className={cn("relative grid place-items-center overflow-hidden bg-secondary", className)} aria-hidden>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--site-grid)_1px,transparent_1px),linear-gradient(to_bottom,var(--site-grid)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <svg viewBox="0 0 723 508" className="relative w-[38%] transition-transform duration-500 group-hover:scale-105">
        <path d={MARK_PATH} fill="var(--foreground)" fillRule="evenodd" />
      </svg>
    </div>
  );
}

/** Linha do Index: miniatura quadrada + título + categoria e data. */
export function PostRow({ post, delay = 0 }: { post: Post; delay?: number }) {
  return (
    <Link href={`/index/${post.slug}`} className="group grid grid-cols-[104px_1fr] items-center gap-5 sm:grid-cols-[150px_1fr]" data-reveal data-reveal-delay={delay}>
      <SiteCover className="aspect-square rounded-lg" />
      <div className="min-w-0">
        <h3 className="text-[16px] leading-snug font-medium text-balance group-hover:underline group-hover:underline-offset-4 sm:text-[17px]">{post.title}</h3>
        <div className="mt-2">
          <Meta label={post.category} date={fmtPostDate(post.date, "short")} />
        </div>
      </div>
    </Link>
  );
}

/** Card de história: imagem (com paralaxe) e título por baixo. */
export function StoryCard({ story, large, delay = 0 }: { story: Story; large?: boolean; delay?: number }) {
  return (
    <Link href={`/historias/${story.slug}`} className="group block" data-reveal data-reveal-delay={delay}>
      <div className={cn("relative overflow-hidden rounded-lg bg-secondary", large ? "aspect-[16/9]" : "aspect-[4/5]")}>
        <div className="absolute inset-0" data-parallax="0.06">
          <Image
            src={story.cover}
            alt={story.coverAlt}
            fill
            sizes={large ? "(min-width: 1024px) 70vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"}
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </div>
      </div>
      <h3 className={cn("mt-4 leading-snug font-medium text-balance group-hover:underline group-hover:underline-offset-4", large ? "text-[24px] sm:text-[30px]" : "text-[17px]")}>
        {story.title}
      </h3>
      <div className="mt-2">
        <Meta label={story.segment} date={fmtStoryDate(story.date)} />
      </div>
    </Link>
  );
}

/** Card de segmento (ArchRay para empresas). */
export function SegmentCard({ href, title, text, index, delay = 0 }: { href: string; title: string; text: string; index: number; delay?: number }) {
  return (
    <Link
      href={href}
      className="group flex aspect-[4/4.6] flex-col justify-between overflow-hidden rounded-lg border bg-[var(--site-elev)] p-6 transition-colors hover:border-foreground/25"
      data-reveal
      data-reveal-delay={delay}
    >
      <SegmentArt index={index} />
      <div>
        <h3 className="text-[20px] leading-snug font-medium tracking-[-0.01em]">{title}</h3>
        <p className="mt-2 text-[14.5px] leading-6 text-muted-foreground">{text}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-[13.5px] font-medium">
          Saiba mais <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

/** Desenhos de linha simples para os segmentos (traço some e reaparece no hover). */
function SegmentArt({ index }: { index: number }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.4 } as const;
  return (
    <svg viewBox="0 0 160 100" className="h-24 w-auto text-foreground/70 transition-transform duration-500 group-hover:-translate-y-1" aria-hidden>
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
