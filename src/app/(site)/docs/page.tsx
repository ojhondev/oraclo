import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight, Lightbulb, Play, Wrench } from "lucide-react";
import { getUser } from "@/lib/auth";
import { DOC_FAQ, DOC_FLOW, DOC_GLOSSARY, DOC_STEPS } from "@/lib/site/docs";
import { DocsToc } from "@/components/site/docs-toc";

export const metadata: Metadata = {
  title: "Documentação",
  description: "Aprenda o ArchRay passo a passo: da foto da fachada ao laudo, com prints de cada tela — retificação, danos, Contorno IA, GUT, orçamento e laudo.",
};

export default async function DocsPage() {
  const user = await getUser();
  const demoHref = user ? "/" : "/cadastro";
  const toc = [
    ...DOC_STEPS.map((s, i) => ({ id: s.id, title: s.title, n: i + 1 })),
    { id: "glossario", title: "Glossário" },
    { id: "perguntas", title: "Perguntas frequentes" },
  ];

  return (
    <div className="px-4 pb-28 sm:px-6 lg:px-8">
      {/* abertura */}
      <header className="mx-auto max-w-[900px] pt-20 text-center sm:pt-28">
        <p className="site-fade-in text-[14px] font-medium text-muted-foreground">Documentação</p>
        <h1 className="site-fade-in mt-5 text-[40px] leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-[68px]" style={{ "--d": "120ms" } as React.CSSProperties}>
          Aprenda o ArchRay em {DOC_STEPS.length} etapas
        </h1>
        <p className="site-fade-in mx-auto mt-6 max-w-[620px] text-[17px] leading-7 text-balance text-muted-foreground" style={{ "--d": "240ms" } as React.CSSProperties}>
          Do cadastro do imóvel ao laudo pronto, com as telas reais de cada passo. Sem jargão: se é a sua primeira vez, comece pela etapa 1.
        </p>
        <div className="site-fade-in mt-8 flex flex-wrap justify-center gap-3" style={{ "--d": "340ms" } as React.CSSProperties}>
          <Link href={demoHref} className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-[15px] font-medium text-background hover:opacity-85">
            <Play className="size-4" /> {user ? "Fazer a demonstração guiada" : "Criar conta e praticar"}
          </Link>
          <a href="#conta" className="inline-flex h-11 items-center gap-1.5 rounded-full border px-6 text-[15px] font-medium hover:bg-secondary">
            Ir para a etapa 1 <ArrowRight className="size-4" />
          </a>
        </div>

        {/* o fluxo em uma linha */}
        <ol className="mx-auto mt-14 flex max-w-[860px] flex-wrap items-center justify-center gap-x-1.5 gap-y-2 text-[13.5px]" data-reveal>
          {DOC_FLOW.map((f, i) => (
            <li key={f} className="flex items-center gap-1.5">
              <span className="rounded-full border bg-card px-3 py-1.5">
                <span className="mr-1.5 text-muted-foreground tabular-nums">{i + 1}</span>
                {f}
              </span>
              {i < DOC_FLOW.length - 1 && <ChevronRight className="size-3.5 text-muted-foreground" />}
            </li>
          ))}
        </ol>
      </header>

      <div className="mx-auto mt-20 grid max-w-[1180px] gap-12 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-16">
        <DocsToc items={toc} />

        <div className="min-w-0">
          {DOC_STEPS.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 border-t py-14 first:border-t-0 first:pt-0">
              <div className="max-w-[720px]" data-reveal>
                <p className="flex items-center gap-2 text-[13.5px] font-medium text-muted-foreground">
                  <span className="grid size-7 place-items-center rounded-full bg-foreground text-[12.5px] text-background tabular-nums">{i + 1}</span>
                  Etapa {i + 1} de {DOC_STEPS.length}
                </p>
                <h2 className="mt-4 text-[28px] leading-[1.15] font-medium tracking-[-0.02em] text-balance sm:text-[36px]">{s.title}</h2>
                <p className="mt-3 text-[17px] leading-7 text-muted-foreground">{s.lead}</p>

                <ol className="mt-7 grid gap-3.5">
                  {s.steps.map((t, k) => (
                    <li key={k} className="grid grid-cols-[30px_1fr] gap-2 text-[16px] leading-7">
                      <span className="mt-0.5 grid size-6 place-items-center rounded-full border text-[12px] text-muted-foreground tabular-nums">{k + 1}</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {s.shot && (
                <figure className="mt-9" data-reveal="scale">
                  <a href={s.shot.src} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-black/30 transition-transform hover:scale-[1.005]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.shot.src} alt={s.shot.alt} loading="lazy" className="block h-auto w-full" />
                  </a>
                  <figcaption className="mt-3 text-[13.5px] text-muted-foreground">{s.shot.caption}</figcaption>
                </figure>
              )}

              {(s.tips?.length || s.issues?.length) && (
                <div className="mt-8 grid max-w-[720px] gap-3" data-reveal>
                  {s.tips?.map((t) => (
                    <p key={t} className="flex gap-3 rounded-xl border bg-card px-4 py-3 text-[14.5px] leading-6">
                      <Lightbulb className="mt-0.5 size-4 shrink-0" />
                      <span>
                        <b className="font-medium">Dica: </b>
                        {t}
                      </span>
                    </p>
                  ))}
                  {s.issues?.map((x) => (
                    <details key={x.q} className="group rounded-xl border px-4 py-3 text-[14.5px] leading-6">
                      <summary className="flex cursor-pointer list-none items-center gap-3 font-medium">
                        <Wrench className="size-4 shrink-0" />
                        <span className="flex-1">Algo deu errado? {x.q}</span>
                        <ChevronRight className="size-4 shrink-0 transition-transform group-open:rotate-90" />
                      </summary>
                      <p className="mt-2 pl-7 text-muted-foreground">{x.a}</p>
                    </details>
                  ))}
                </div>
              )}
            </section>
          ))}

          <section id="glossario" className="scroll-mt-24 border-t py-14">
            <h2 className="text-[28px] font-medium tracking-[-0.02em] sm:text-[36px]" data-reveal>
              Glossário
            </h2>
            <dl className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2" data-reveal>
              {DOC_GLOSSARY.map((g) => (
                <div key={g.term} className="border-t pt-4">
                  <dt className="text-[15px] font-medium">{g.term}</dt>
                  <dd className="mt-1 text-[14.5px] leading-6 text-muted-foreground">{g.def}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section id="perguntas" className="scroll-mt-24 border-t py-14">
            <h2 className="text-[28px] font-medium tracking-[-0.02em] sm:text-[36px]" data-reveal>
              Perguntas frequentes
            </h2>
            <div className="mt-8 grid max-w-[760px]" data-reveal>
              {DOC_FAQ.map((f) => (
                <details key={f.q} className="group border-b py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-medium">
                    {f.q}
                    <ChevronRight className="size-4 shrink-0 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-2 text-[15px] leading-7 text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-3xl border bg-card px-6 py-12 text-center sm:px-12" data-reveal>
            <h2 className="text-[26px] leading-tight font-medium tracking-[-0.02em] text-balance sm:text-[34px]">Pronto para praticar?</h2>
            <p className="mx-auto mt-3 max-w-[520px] text-[16px] leading-7 text-muted-foreground">
              A demonstração guiada repete todas estas etapas num caso real, em 10 missões — e pode ser refeita do zero quantas vezes você quiser.
            </p>
            <Link href={demoHref} className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-[15px] font-medium text-background hover:opacity-85">
              <Play className="size-4" /> {user ? "Começar a demonstração" : "Criar conta grátis"}
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
