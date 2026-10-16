import Link from "next/link";
import { BrandLogo, BrandMark } from "@/components/brand";

const COLS: { title: string; links: { href: string; label: string }[] }[] = [
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
];

export function SiteFooter() {
  return (
    <footer className="px-4 pt-20 pb-10 sm:px-6 lg:px-8">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <Link href="/" className="flex items-center gap-2" aria-label="ArchRay">
            <BrandMark className="h-[18px]" />
            <BrandLogo className="site-logo h-[17px]" />
          </Link>
          <p className="mt-4 max-w-xs text-[14px] leading-6 text-muted-foreground">
            Mapa de danos com IA. Aponte os danos, e o orçamento e o laudo saem prontos.
          </p>
        </div>
        {COLS.map((c) => (
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
        <span>Fotos do case Carmo da Horta: Wikimedia Commons (domínio público e CC BY-SA), créditos em Histórias.</span>
      </div>
    </footer>
  );
}
