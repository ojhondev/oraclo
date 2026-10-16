import Link from "next/link";
import { BrandLogo, BrandMark } from "@/components/brand";
import type { Lang } from "@/lib/site/lang";

type Col = { title: string; links: { href: string; label: string }[] };

const COLS: Record<Lang, Col[]> = {
  pt: [
    {
      title: "Produto",
      links: [
        { href: "/#produto", label: "Visão geral" },
        { href: "/#fachada", label: "Fachada em escala" },
        { href: "/#contorno", label: "Contorno com IA" },
        { href: "/#orcamento", label: "Orçamento e GUT" },
        { href: "/#laudo", label: "Laudo e pranchas" },
      ],
    },
    {
      title: "Soluções",
      links: [
        { href: "/empresas#restauro", label: "Estúdios de restauro" },
        { href: "/empresas#inspecao", label: "Inspeção predial" },
        { href: "/empresas#retrofit", label: "Retrofit e manutenção" },
        { href: "/empresas#patrimonio", label: "Patrimônio" },
      ],
    },
    {
      title: "Recursos",
      links: [
        { href: "/docs", label: "Documentação" },
        { href: "/index", label: "Index" },
        { href: "/historias", label: "Histórias" },
        { href: "/empresas", label: "ArchRay para empresas" },
      ],
    },
    {
      title: "Conta",
      links: [
        { href: "/cadastro", label: "Criar conta" },
        { href: "/login", label: "Entrar" },
      ],
    },
  ],
  en: [
    {
      title: "Product",
      links: [
        { href: "/#produto", label: "Overview" },
        { href: "/#fachada", label: "Facades to scale" },
        { href: "/#contorno", label: "AI outlining" },
        { href: "/#orcamento", label: "Budget and GUT" },
        { href: "/#laudo", label: "Reports and drawings" },
      ],
    },
    {
      title: "Solutions",
      links: [
        { href: "/empresas#restauro", label: "Restoration studios" },
        { href: "/empresas#inspecao", label: "Building inspection" },
        { href: "/empresas#retrofit", label: "Retrofit and maintenance" },
        { href: "/empresas#patrimonio", label: "Heritage" },
      ],
    },
    {
      title: "Resources",
      links: [
        { href: "/docs", label: "Docs" },
        { href: "/index", label: "Index" },
        { href: "/historias", label: "Stories" },
        { href: "/empresas", label: "ArchRay for business" },
      ],
    },
    {
      title: "Account",
      links: [
        { href: "/cadastro", label: "Sign up" },
        { href: "/login", label: "Log in" },
      ],
    },
  ],
};

export function SiteFooter({ lang }: { lang: Lang }) {
  const en = lang === "en";
  return (
    <footer className="px-4 pt-20 pb-10 sm:px-6 lg:px-8">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <Link href="/" className="flex items-center gap-2" aria-label="ArchRay">
            <BrandMark className="h-[18px]" />
            <BrandLogo className="site-logo h-[17px]" />
          </Link>
          <p className="mt-4 max-w-xs text-[14px] leading-6 text-muted-foreground">
            {en
              ? "AI damage mapping. Point out the damage, and the budget and the report come out ready."
              : "Mapa de danos com IA. Aponte os danos, e o orçamento e o laudo saem prontos."}
          </p>
        </div>
        {COLS[lang].map((c) => (
          <div key={c.title}>
            <p className="text-[13px] font-medium">{c.title}</p>
            <ul className="mt-3 grid gap-2 text-[14px] text-muted-foreground">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-[12.5px] text-muted-foreground">
        <span>© {new Date().getFullYear()} ArchRay</span>
        <span>
          {en
            ? "Carmo da Horta case photos: Wikimedia Commons (public domain and CC BY-SA), credits in Stories."
            : "Fotos do case Carmo da Horta: Wikimedia Commons (domínio público e CC BY-SA), créditos em Histórias."}
        </span>
      </div>
    </footer>
  );
}
