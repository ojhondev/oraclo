import Link from "next/link";
import { MARK_PATH } from "@/components/brand";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtPostDate, type Post } from "@/lib/updates";
import { fmtStoryDate, type Story } from "@/lib/site/stories";
import type { Lang } from "@/lib/site/lang";

/** Cabeçalho de seção entre linhas finas, título curto em negrito e "Ver tudo" à direita (como a Anthropic). */
export function SectionHead({ title, href, more = "Ver tudo" }: { title: string; href?: string; more?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-y py-3" data-reveal="fade">
      <h2 className="text-[13.5px] leading-tight font-bold">{title}</h2>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">
          {more} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

/** Etiqueta "··· Categoria  data". */
export function Meta({ label, date, extra }: { label: string; date: string; extra?: string }) {
  return (
    <p className="a-tag">
      <span>{label}</span>
      <span>{date}</span>
      {extra && <span>{extra}</span>}
    </p>
  );
}

/** Capa gerada para publicações do Index: símbolo do ArchRay sobre grade em fundo bege (sem fotos de terceiros). */
export function SiteCover({ className }: { className?: string }) {
  return (
    <div className={cn("relative grid place-items-center overflow-hidden bg-[var(--site-band)]", className)} aria-hidden>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--site-grid)_1px,transparent_1px),linear-gradient(to_bottom,var(--site-grid)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <svg viewBox="0 0 723 508" className="relative w-[34%] transition-transform duration-500 group-hover:scale-105">
        <path d={MARK_PATH} fill="var(--foreground)" fillRule="evenodd" />
      </svg>
    </div>
  );
}

/** Publicação do Index: capa, etiqueta e título em negrito. */
export function PostRow({ post, delay = 0, lang = "pt" }: { post: Post; delay?: number; lang?: Lang }) {
  return (
    <Link href={`/index/${post.slug}`} className="group block" data-reveal data-reveal-delay={delay}>
      <SiteCover className="aspect-[4/3] rounded-[8px]" />
      <div className="mt-4">
        <Meta label={post.category} date={fmtPostDate(post.date, "short", lang)} />
      </div>
      <h3 className="a-title mt-2 text-[19px] leading-snug text-balance group-hover:underline group-hover:underline-offset-4">{post.title}</h3>
    </Link>
  );
}

/** Card de caso: imagem (com paralaxe), etiqueta e título em negrito. */
export function StoryCard({ story, large, delay = 0, lang = "pt" }: { story: Story; large?: boolean; delay?: number; lang?: Lang }) {
  return (
    <Link href={`/historias/${story.slug}`} className="group block" data-reveal data-reveal-delay={delay}>
      <div className={cn("relative overflow-hidden rounded-[8px] bg-[var(--site-band)]", large ? "aspect-[16/9]" : "aspect-[4/5]")}>
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
      <div className="mt-4">
        <Meta label={story.segment} date={fmtStoryDate(story.date, lang)} />
      </div>
      <h3 className={cn("a-title mt-2 leading-snug text-balance group-hover:underline group-hover:underline-offset-4", large ? "text-[26px] sm:text-[34px]" : "text-[19px]")}>
        {story.title}
      </h3>
    </Link>
  );
}

/** Card de segmento (setores atendidos): cartão bege com desenho de linha. */
export function SegmentCard({ href, title, text, index, delay = 0, more = "Saiba mais" }: { href: string; title: string; text: string; index: number; delay?: number; more?: string }) {
  return (
    <Link
      href={href}
      className="a-card group flex aspect-[4/4.4] flex-col justify-between overflow-hidden p-8 transition-colors hover:bg-[var(--site-band)]"
      data-reveal
      data-reveal-delay={delay}
    >
      <SegmentArt index={index} />
      <div>
        <h3 className="a-title text-[21px] leading-snug">{title}</h3>
        <p className="mt-2 text-[14.5px] leading-6 text-muted-foreground">{text}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-[14px] font-medium">
          {more} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

/** Desenhos de linha simples para os segmentos (sobem um pouco no hover). */
function SegmentArt({ index }: { index: number }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.4 } as const;
  return (
    <svg viewBox="0 0 160 100" className="h-24 w-auto text-[var(--site-clay)] transition-transform duration-500 group-hover:-translate-y-1" aria-hidden>
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
