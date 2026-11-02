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
    <footer className="site-ink mt-24 px-4 pt-20 pb-10 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <div>
          <Link href="/" className="flex items-center gap-2.5 text-foreground" aria-label="ArchRay">
            <BrandMark className="h-[40px]" />
            <BrandLogo className="site-logo h-[19px]" />
          </Link>
          <p className="mt-5 max-w-xs text-[14px] leading-6 text-muted-foreground">
            {en
              ? "ArchRay is Estúdio Restaura's diagnosis arm: damage maps, budgets and condition reports, produced by restoration architects with in-house technology."
              : "O ArchRay é o braço de diagnóstico do Estúdio Restaura: mapa de danos, orçamento e laudo, feitos por arquitetos de restauro com tecnologia própria."}
          </p>
        </div>
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 xl:grid-cols-4">
        {COLS[lang].map((c) => (
          <div key={c.title} className="border-t pt-4">
            <p className="text-[13px] font-semibold">{c.title}</p>
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
      </div>

      {/* produto exclusivo do Estúdio Restaura */}
      <a
        href="https://estudiorestaura.com.br"
        target="_blank"
        rel="noreferrer"
        className="a-card group mt-16 flex flex-col gap-4 p-6 transition-colors hover:bg-[var(--site-pill)] sm:flex-row sm:items-center sm:justify-between sm:p-8"
      >
        <div>
          <p className="text-[12.5px] font-medium tracking-wide text-muted-foreground uppercase">{en ? "An exclusive product of" : "Um produto exclusivo do"}</p>
          {/* o rodapé é sempre escuro: logo branca */}
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

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-[12.5px] text-muted-foreground">
        <span>
          © {new Date().getFullYear()} ArchRay · {en ? "a product of Estúdio Restaura" : "um produto Estúdio Restaura"}
        </span>
        <span>
          {en
            ? "Carmo da Horta case photos: Wikimedia Commons (public domain and CC BY-SA), credits in Cases."
            : "Fotos do caso Carmo da Horta: Wikimedia Commons (domínio público e CC BY-SA), créditos em Casos."}
        </span>
      </div>
    </footer>
  );
}
