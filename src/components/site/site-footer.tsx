import Link from "next/link";
import { BrandLogo, BrandMark } from "@/components/brand";
import type { Lang } from "@/lib/site/lang";

type Col = { title: string; links: { href: string; label: string }[] };

const COLS: Record<Lang, Col[]> = {
  pt: [
    {
      title: "Serviço",
      links: [
        { href: "/#produto", label: "O que entregamos" },
        { href: "/#como-funciona", label: "Como funciona" },
        { href: "/#fachada", label: "Tecnologia própria" },
        { href: "/#perguntas", label: "Perguntas frequentes" },
        { href: "/contato", label: "Solicitar diagnóstico" },
      ],
    },
    {
      title: "Setores",
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
        { href: "/historias", label: "Casos" },
        { href: "/index", label: "Index" },
        { href: "/docs", label: "Documentação" },
      ],
    },
    {
      title: "Clientes",
      links: [
        { href: "/login", label: "Área do cliente" },
        { href: "/contato", label: "Fale com um especialista" },
      ],
    },
  ],
  en: [
    {
      title: "Service",
      links: [
        { href: "/#produto", label: "What we deliver" },
        { href: "/#como-funciona", label: "How it works" },
        { href: "/#fachada", label: "In-house technology" },
        { href: "/#perguntas", label: "FAQ" },
        { href: "/contato", label: "Request a diagnosis" },
      ],
    },
    {
      title: "Sectors",
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
        { href: "/historias", label: "Cases" },
        { href: "/index", label: "Index" },
        { href: "/docs", label: "Docs" },
      ],
    },
    {
      title: "Clients",
      links: [
        { href: "/login", label: "Client area" },
        { href: "/contato", label: "Talk to a specialist" },
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
              ? "ArchRay is Estúdio Restaura's diagnosis arm: damage maps, budgets and condition reports, produced by restoration architects with in-house technology."
              : "O ArchRay é o braço de diagnóstico do Estúdio Restaura: mapa de danos, orçamento e laudo, feitos por arquitetos de restauro com tecnologia própria."}
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
