import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
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
