"use client";

import { useState, useTransition } from "react";
import { Check, CheckCircle2, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { AcademyQuestion } from "@/lib/academy";
import { setLessonDone } from "./actions";
import { cn } from "@/lib/utils";

/** Teste rápido: responde, vê se acertou e a explicação. */
export function Quiz({ questions }: { questions: AcademyQuestion[] }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const answered = picked.filter((p) => p != null).length;
  const right = picked.filter((p, i) => p === questions[i]!.answer).length;
  return (
    <section className="grid gap-4 rounded-2xl border bg-card p-5" aria-labelledby="teste-rapido">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="teste-rapido" className="text-[17px] font-medium">
          Teste rápido
        </h2>
        {answered === questions.length && (
          <span className="text-[13px] text-muted-foreground">
            {right} de {questions.length} {right === 1 ? "acerto" : "acertos"}
          </span>
        )}
      </div>
      {questions.map((q, qi) => {
        const p = picked[qi];
        return (
          <fieldset key={q.q} className="grid gap-2">
            <legend className="mb-2 text-[14.5px] font-medium">
              {qi + 1}. {q.q}
            </legend>
            {q.options.map((o, oi) => {
              const chosen = p === oi;
              const correct = oi === q.answer;
              return (
                <button
                  key={o}
                  type="button"
                  disabled={p != null}
                  onClick={() => setPicked((arr) => arr.map((v, k) => (k === qi ? oi : v)))}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-[14px] transition-colors",
                    p == null && "hover:bg-muted",
                    p != null && correct && "border-emerald-600/50 bg-emerald-600/10",
                    chosen && !correct && "border-red-600/40 bg-red-600/10",
                  )}
                >
                  <span className="grid size-5 shrink-0 place-items-center rounded-full border text-[11px]">
                    {p != null && correct ? <Check className="size-3" /> : chosen ? <X className="size-3" /> : String.fromCharCode(65 + oi)}
                  </span>
                  {o}
                </button>
              );
            })}
            {p != null && <p className={cn("rounded-lg px-3 py-2 text-[13.5px]", p === q.answer ? "bg-emerald-600/10" : "bg-muted")}>{q.explain}</p>}
          </fieldset>
        );
      })}
      {answered > 0 && (
        <button type="button" onClick={() => setPicked(questions.map(() => null))} className="inline-flex items-center gap-1.5 justify-self-start text-[13px] text-muted-foreground hover:text-foreground">
          <RotateCcw className="size-3.5" /> Responder de novo
        </button>
      )}
    </section>
  );
}

/** Marcar a aula como concluída (progresso salvo por usuário). */
export function DoneButton({ lessonId, initial }: { lessonId: string; initial: boolean }) {
  const [done, setDone] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <Button
      variant={done ? "secondary" : "default"}
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            setDone(await setLessonDone(lessonId, !done));
          } catch {
            toast.error("Não foi possível salvar o progresso.");
          }
        })
      }
    >
      {done ? (
        <>
          <CheckCircle2 /> Aula concluída
        </>
      ) : (
        <>
          <Check /> Marcar como concluída
        </>
      )}
    </Button>
  );
}
