import Link from "next/link";
import { BrandLogo, BrandMark } from "@/components/brand";
import { SITE } from "@/lib/site/site-copy";
import type { Lang } from "@/lib/site/lang";
import { Credito } from "@/components/credito";
import "@/components/credito.css";
import { Rise } from "@/components/eng/motion";

/** Rodapé preto (v2, padrão do Scale): marca à esquerda e colunas de links com títulos em mono caixa-alta. */
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
    <footer className="site-ink overflow-x-clip px-4 pt-24 pb-10 sm:px-6 sm:pt-28 lg:px-8">
      <div className="grid gap-14 lg:grid-cols-[1.1fr_2fr] lg:gap-16">
        <div>
          <Link href="/" className="flex items-center gap-2.5" aria-label="ArchRay">
            <BrandMark className="site-mark h-[34px]" />
            <BrandLogo className="site-logo h-[17px]" />
          </Link>
          <p className="mt-6 max-w-xs text-[15px] leading-6 text-muted-foreground">{s.footer.blurb}</p>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {groups.map((g) => (
            <div key={g.label}>
              <p className="font-mono text-[11px] tracking-[0.05em] text-white/50 uppercase">{g.label}</p>
              <ul className="mt-5 grid gap-2.5 text-[15px] text-white/80">
                {g.items!.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} {...(l.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})} className="hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* frase gigante em caixa-alta, de ponta a ponta (padrão do Scale) */}
      <Rise amount={90} className="mt-24 border-t border-white/15 pt-10 sm:mt-28">
        <p className="font-mono text-[11px] tracking-[0.05em] text-white/50 uppercase">{en ? "A service by Estúdio Restaura" : "Um serviço do Estúdio Restaura"}</p>
        <p aria-hidden className="mt-6 text-[12.4vw] leading-[0.86] font-medium tracking-[-0.045em] text-white uppercase sm:text-[9.6vw] lg:text-[8.3vw]">
          {en ? (
            <>
              No laser.
              <br />
              No drone.
              <br />
              <span className="text-white/45">Report ready.</span>
            </>
          ) : (
            <>
              Sem laser.
              <br />
              Sem drone.
              <br />
              <span className="text-white/45">Laudo pronto.</span>
            </>
          )}
        </p>
      </Rise>

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

      <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12.5px] text-muted-foreground">
          © {new Date().getFullYear()} ArchRay · {en ? "a product of Estúdio Restaura" : "um produto Estúdio Restaura"}
        </p>
        <Credito site="ArchRay" />
      </div>
    </footer>
  );
}
