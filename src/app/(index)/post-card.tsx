import Image from "next/image";
import Link from "next/link";
import { fmtPostDate, type Post } from "@/lib/updates";
import type { Lang } from "@/lib/site/lang";
import { Illo, type IlloName } from "@/components/site/illo";

/** Ilustração de cada publicação do Index (mídia própria, sem fotos). */
const POST_ILLO: Record<string, IlloName> = {
  "comparar-vistorias": "comparar",
  "deteccao-automatica-de-danos": "deteccao",
  "archray-mapa-de-danos-com-ia": "retifica",
};
export const postIllo = (slug: string): IlloName => POST_ILLO[slug] ?? "grade";

/** Publicação em cartão: etiqueta, ilustração, título em negrito e resumo. */
export function PostCard({ post, lang = "pt", image = true }: { post: Post; lang?: Lang; image?: boolean }) {
  return (
    <Link href={`/index/${post.slug}`} className="group block">
      <p className="a-tag">
        {post.category} · {fmtPostDate(post.date, "short", lang)}
      </p>
      {image && <Cover slug={post.slug} title={post.title} image={post.image} imageAlt={post.imageAlt} className="mt-3" />}
      <h3 className="a-title mt-3 text-[19px] leading-snug group-hover:underline group-hover:underline-offset-4">{post.title}</h3>
      <p className="mt-2 line-clamp-4 text-[14.5px] leading-6 text-muted-foreground">{post.summary}</p>
    </Link>
  );
}

/** Capa da publicação: a ilustração do tema. */
export function Cover({
  slug,
  title,
  className,
  aspect = "aspect-[4/3]",
  image,
  imageAlt,
  priority = false,
}: {
  slug: string;
  title: string;
  className?: string;
  aspect?: string;
  image?: string;
  imageAlt?: string;
  priority?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-[8px] ${aspect} ${className ?? ""}`} aria-label={image ? undefined : title}>
      <div className="size-full transition-transform duration-700 group-hover:scale-[1.03]">
        {image ? (
          <Image src={image} alt={imageAlt ?? title} fill sizes="(max-width: 768px) 100vw, 1100px" className="object-cover" priority={priority} />
        ) : (
          <Illo name={postIllo(slug)} />
        )}
      </div>
    </div>
  );
}
