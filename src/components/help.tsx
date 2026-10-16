"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowLeft, ChevronRight, CircleHelp, Compass, Lightbulb, Search } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DemoLauncher } from "@/components/demo-tour";
import { HELP_TOPICS, suggestedTopics, type HelpTopic } from "@/lib/help";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Evento global para reabrir o tour guiado (ouvido pelo componente Tour). */
export const TOUR_EVENT = "oraclo:tour";

function Article({ topic }: { topic: HelpTopic }) {
  return (
    <article className="grid gap-4 text-[14px] leading-relaxed">
      <div>
        <p className="text-[12.5px] text-muted-foreground">{topic.category}</p>
        <h3 className="text-[19px] font-medium leading-tight">{topic.title}</h3>
      </div>
      {topic.blocks.map((b, i) => {
        if ("p" in b) return <p key={i}>{b.p}</p>;
        if ("tip" in b)
          return (
            <p key={i} className="flex gap-2 rounded-xl bg-muted p-3 text-[13.5px]">
              <Lightbulb className="mt-0.5 size-4 shrink-0" /> {b.tip}
            </p>
          );
        if ("steps" in b)
          return (
            <ol key={i} className="grid gap-2">
              {b.steps.map((s, j) => (
                <li key={j} className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border text-[12px]">{j + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          );
        return (
          <ul key={i} className="grid list-disc gap-1.5 pl-5">
            {b.list.map((s, j) => (
              <li key={j}>{s}</li>
            ))}
          </ul>
        );
      })}
    </article>
  );
}

function TopicButton({ t, onClick }: { t: HelpTopic; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted">
      <span className="grid min-w-0 flex-1 leading-tight">
        <span className="truncate text-[14px]">{t.title}</span>
        <span className="truncate text-[12.5px] text-muted-foreground">{t.summary}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

/** Botão "Ajuda" fixo no canto inferior direito + painel lateral com os tópicos. */
export function HelpCenter() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [topicId, setTopicId] = useState<string | null>(null);
  const topic = HELP_TOPICS.find((t) => t.id === topicId) ?? null;
  const suggested = useMemo(() => suggestedTopics(pathname), [pathname]);
  const results = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return null;
    return HELP_TOPICS.filter((t) =>
      norm([t.title, t.summary, t.category, ...t.blocks.flatMap((b) => ("p" in b ? [b.p] : "tip" in b ? [b.tip] : "steps" in b ? b.steps : b.list))].join(" ")).includes(q),
    );
  }, [query]);
  const categories = [...new Set(HELP_TOPICS.map((t) => t.category))];

  return (
    <>
      <button
        data-tour="ajuda"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-40 flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-[14px] font-medium text-primary-foreground shadow-lg transition-transform hover:scale-[1.03] print:hidden"
      >
        <CircleHelp className="size-4" /> Ajuda
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-[420px]">
          <SheetTitle className="sr-only">Ajuda</SheetTitle>
          <div className="flex items-center gap-2 border-b px-4 py-3 pr-12">
            {topic ? (
              <button onClick={() => setTopicId(null)} className="flex items-center gap-1.5 text-[14px] text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-4" /> Todos os tópicos
              </button>
            ) : (
              <span className="flex items-center gap-2 text-[16px] font-medium">
                <CircleHelp className="size-4" /> Ajuda
              </span>
            )}
          </div>
          <div className="thin-scroll min-h-0 flex-1 overflow-y-auto p-4">
            {topic ? (
              <Article topic={topic} />
            ) : (
              <div className="grid gap-5">
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar na ajuda" className="h-10 pl-9" />
                </div>
                {results ? (
                  results.length ? (
                    <div className="-mx-3 grid">{results.map((t) => <TopicButton key={t.id} t={t} onClick={() => setTopicId(t.id)} />)}</div>
                  ) : (
                    <p className="text-[14px] text-muted-foreground">Nada encontrado para “{query}”.</p>
                  )
                ) : (
                  <>
                    {suggested.length > 0 && (
                      <section>
                        <p className="mb-1 text-[12.5px] text-muted-foreground">Para esta tela</p>
                        <div className="-mx-3 grid">{suggested.map((t) => <TopicButton key={t.id} t={t} onClick={() => setTopicId(t.id)} />)}</div>
                      </section>
                    )}
                    {categories.map((c) => (
                      <section key={c}>
                        <p className="mb-1 text-[12.5px] text-muted-foreground">{c}</p>
                        <div className="-mx-3 grid">
                          {HELP_TOPICS.filter((t) => t.category === c).map((t) => (
                            <TopicButton key={t.id} t={t} onClick={() => setTopicId(t.id)} />
                          ))}
                        </div>
                      </section>
                    ))}
                    <button
                      onClick={() => {
                        setOpen(false);
                        window.dispatchEvent(new Event(TOUR_EVENT));
                      }}
                      className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[14px] hover:bg-muted"
                    >
                      <Compass className="size-4" /> Refazer o tour guiado
                    </button>
                    <div className="grid gap-2 rounded-xl border p-3">
                      <p className="text-[14px] font-medium">Demonstração guiada</p>
                      <p className="text-[12.5px] text-muted-foreground">10 missões com a Igreja do Carmo: retificar, apontar danos, IA, GUT, orçamento e laudo.</p>
                      <div className="flex flex-wrap gap-2" onClick={() => setOpen(false)}>
                        <DemoLauncher variant="button" />
                        <Button size="sm" variant="outline" asChild>
                          <a href="/docs" target="_blank" rel="noreferrer">
                            Documentação
                          </a>
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
