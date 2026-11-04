"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { GlossaryTerm } from "@/lib/academy";
import { Input } from "@/components/ui/input";

const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Lista do glossário com busca (ignora acentos). */
export function GlossaryList({ terms, titles }: { terms: GlossaryTerm[]; titles: Record<string, string> }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const f = fold(q.trim());
    return f ? terms.filter((t) => fold(t.term).includes(f) || fold(t.definition).includes(f)) : terms;
  }, [q, terms]);
  return (
    <div className="grid gap-4">
      <label className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar termo" className="pl-9" aria-label="Buscar termo" />
      </label>
      {list.length === 0 && <p className="text-[14px] text-muted-foreground">Nenhum termo encontrado.</p>}
      <dl className="divide-y rounded-2xl border bg-card">
        {list.map((t) => (
          <div key={t.id} id={t.id} className="grid scroll-mt-24 gap-1.5 px-5 py-4 target:bg-muted/60">
            <dt className="text-[15.5px] font-medium">{t.term}</dt>
            <dd className="text-[14px] leading-6 text-foreground/85">{t.definition}</dd>
            {t.lessons?.length ? (
              <dd className="flex flex-wrap gap-1.5 pt-1">
                {t.lessons.map((id) => (
                  <Link key={id} href={`/academy/${id}`} className="rounded-full border px-2.5 py-0.5 text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground">
                    {titles[id] ?? id}
                  </Link>
                ))}
              </dd>
            ) : null}
          </div>
        ))}
      </dl>
    </div>
  );
}
