import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { BrandLogo, BrandMark } from "@/components/brand";
import { SITE } from "@/lib/site/site-copy";
import type { Lang } from "@/lib/site/lang";

/** Rodapé escuro na estrutura da Anthropic: marca à esquerda, grupos de links em acordeão à direita. */
export function SiteFooter({ lang }: { lang: Lang }) {
  const en = lang === "en";
  const s = SITE[lang];
  const groups = [
    ...s.nav.left.filter((m) => m.items),
    { label: en ? "Resources" : "Recursos", items: [
      { href: "/index", label: "Index" },
      { href: "/historias", label: en ? "Cases" : "Casos" },
      { href: "/docs", label: en ? "Documentation" : "Documentação" },
      { href: "/compromissos", label: en ? "Commitments" : "Compromissos" },
    ] },
    ...s.nav.right,
  ];
  return (
    <footer className="site-ink mt-24 px-4 pt-16 pb-10 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <div>
          <Link href="/" className="flex items-center gap-2.5" aria-label="ArchRay">
            <BrandMark className="h-[30px]" />
            <BrandLogo className="site-logo h-[19px]" />
          </Link>
          <p className="mt-5 max-w-xs text-[14px] leading-6 text-muted-foreground">{s.footer.blurb}</p>
        </div>
        <div>
          {groups.map((g) => (
            <details key={g.label} className="group border-t last:border-b">
              <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[14px] [&::-webkit-details-marker]:hidden">
                {g.label}
                <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <ul className="grid gap-2 pb-5 text-[14px] text-muted-foreground sm:grid-cols-2">
                {g.items!.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} {...(l.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})} className="hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </div>

      {/* produto exclusivo do Estúdio Restaura */}
      <a
        href="https://estudiorestaura.com.br"
        target="_blank"
        rel="noreferrer"
        className="a-card group mt-16 flex flex-col gap-4 p-6 transition-colors hover:bg-[var(--site-pill)] sm:flex-row sm:items-center sm:justify-between sm:p-8"
      >
        <div>
          <p className="font-mono text-[11.5px] tracking-[0.08em] text-muted-foreground uppercase">{en ? "An exclusive product of" : "Um produto exclusivo do"}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/estudio-restaura-branco.png" alt="Estúdio Restaura" width={600} height={152} className="mt-3 block h-10 w-auto sm:h-12" />
        </div>
        <p className="max-w-md text-[14px] leading-6 text-muted-foreground sm:text-right">
          {en
            ? "Architecture, conservation and restoration. ArchRay was developed and is maintained by Estúdio Restaura."
            : "Arquitetura, conservação e restauro. O ArchRay foi desenvolvido e é mantido pelo Estúdio Restaura."}
          <span className="mt-1 block font-medium text-foreground group-hover:underline group-hover:underline-offset-4">estudiorestaura.com.br ↗</span>
        </p>
      </a>

      <p className="mt-10 text-[12.5px] text-muted-foreground">
        © {new Date().getFullYear()} ArchRay · {en ? "a product of Estúdio Restaura" : "um produto Estúdio Restaura"}
      </p>
    </footer>
  );
}
