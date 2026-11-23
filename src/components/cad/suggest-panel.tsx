"use client";

import { Check, Loader2, Sparkles, X } from "lucide-react";

/** IA assistente: procurar na foto as parecidas com os blocos-modelo e revisar as sugestões. */
export function SuggestPanel({ hasImage, busy, total, selected, onSearch, onAccept, onReject }: {
  hasImage: boolean;
  /** Etapa em andamento (null = parado). */
  busy: string | null;
  /** Sugestões no desenho. */
  total: number;
  /** Sugestões selecionadas agora. */
  selected: number;
  onSearch: () => void;
  onAccept: (scope: "sel" | "todas") => void;
  onReject: (scope: "sel" | "todas") => void;
}) {
  return (
    <section className="grid gap-2 border-b p-3 text-[12.5px]">
      <p className="flex items-center gap-1.5 text-[12px] font-medium">
        <Sparkles className="size-3.5 text-amber-500" /> IA assistente
      </p>
      {!hasImage ? (
        <p className="text-[12px] text-muted-foreground">Este desenho não tem foto de fundo. Comece um desenho a partir de uma vista para a IA procurar janelas e portas.</p>
      ) : (
        <>
          <p className="text-[12px] text-muted-foreground">
            Coloque um bloco em cima de uma janela da foto e ajuste a medida. Selecione e procure as parecidas. Sem nada selecionado, a IA usa um bloco de cada tipo.
          </p>
          <button
            onClick={onSearch}
            disabled={!!busy}
            className="flex h-8 items-center justify-center gap-1.5 rounded-md bg-foreground text-[12.5px] text-background hover:opacity-90 disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            {busy ?? "Procurar parecidas na foto"}
          </button>
        </>
      )}
      {selected > 0 && (
        <div className="grid gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 p-2">
          <span className="text-[12px]">{selected === 1 ? "Sugestão da IA selecionada" : `${selected} sugestões selecionadas`}</span>
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={() => onAccept("sel")} className="flex h-7 items-center justify-center gap-1 rounded-md bg-foreground text-[12px] text-background">
              <Check className="size-3.5" /> Aceitar
            </button>
            <button onClick={() => onReject("sel")} className="flex h-7 items-center justify-center gap-1 rounded-md border text-[12px] hover:bg-muted">
              <X className="size-3.5" /> Recusar
            </button>
          </div>
        </div>
      )}
      {total > 0 && (
        <div className="grid gap-1.5">
          <span className="text-[12px] text-muted-foreground">
            {total} {total === 1 ? "sugestão" : "sugestões"} em laranja tracejado. Clique numa para revisar só ela, ou:
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={() => onAccept("todas")} className="h-7 rounded-md border text-[12px] hover:bg-muted">
              Aceitar todas
            </button>
            <button onClick={() => onReject("todas")} className="h-7 rounded-md border text-[12px] text-destructive hover:bg-muted">
              Recusar todas
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
