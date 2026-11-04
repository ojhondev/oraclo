import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowRight, BookOpen, CheckCircle2, Circle, Clock, GraduationCap } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { LESSONS, TOTAL_MINUTES, TRACKS, lessonsOf } from "@/lib/academy";
import { PageBody, PageHeader } from "@/components/page-header";
import { Progress } from "./ui";

export const metadata: Metadata = { title: "Academy" };

export default async function AcademyPage() {
  const user = await requireUser();
  const rows = await db
    .select({ lessonId: schema.academyProgress.lessonId })
    .from(schema.academyProgress)
    .where(eq(schema.academyProgress.userId, user.id));
  const done = new Set(rows.map((r) => r.lessonId));
  const total = LESSONS.length;
  const doneCount = LESSONS.filter((l) => done.has(l.id)).length;
  const next = LESSONS.find((l) => !done.has(l.id));

  return (
    <>
      <PageHeader
        eyebrow="ArchRay Academy"
        title="Aprenda a usar o ArchRay"
        description="Aulas curtas, com passo a passo, prints de cada tela e um teste rápido no fim. Siga na ordem ou vá direto ao que precisa."
      />
      <PageBody className="grid max-w-6xl gap-6">
        {/* progresso geral e próxima aula */}
        <section className="grid gap-5 rounded-2xl border bg-card p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="grid gap-3">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <p className="text-[17px] font-medium">
                {doneCount === total ? "Você concluiu todas as aulas" : `${doneCount} de ${total} aulas concluídas`}
              </p>
              <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <Clock className="size-3.5" /> {TRACKS.length} trilhas · cerca de {Math.round(TOTAL_MINUTES / 5) * 5} minutos no total
              </p>
            </div>
            <Progress value={doneCount / total} />
          </div>
          <div className="flex flex-wrap gap-2">
            {next && (
              <Link href={`/academy/${next.id}`} className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-4 text-[14px] font-medium text-background hover:opacity-90">
                {doneCount ? "Continuar" : "Começar"}: {next.title} <ArrowRight className="size-4" />
              </Link>
            )}
            <Link href="/academy/glossario" className="inline-flex h-9 items-center gap-2 rounded-lg border px-4 text-[14px] font-medium hover:bg-muted">
              <BookOpen className="size-4" /> Glossário
            </Link>
          </div>
        </section>

        {/* trilhas */}
        <div className="grid gap-5 lg:grid-cols-2">
          {TRACKS.map((t, ti) => {
            const lessons = lessonsOf(t.id);
            const n = lessons.filter((l) => done.has(l.id)).length;
            return (
              <section key={t.id} id={t.id} className="flex flex-col rounded-2xl border bg-card">
                <div className="grid gap-2 border-b p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-lg bg-muted text-[13px] font-semibold tabular-nums">{ti + 1}</span>
                    <h2 className="min-w-0 flex-1 text-[17px] font-medium">{t.title}</h2>
                    <span className="text-[12.5px] text-muted-foreground tabular-nums">
                      {n}/{lessons.length}
                    </span>
                  </div>
                  <p className="text-[13.5px] text-muted-foreground">{t.description}</p>
                  <Progress value={n / lessons.length} className="mt-1" />
                </div>
                <ol className="divide-y">
                  {lessons.map((l) => {
                    const ok = done.has(l.id);
                    return (
                      <li key={l.id}>
                        <Link href={`/academy/${l.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/60">
                          {ok ? <CheckCircle2 className="size-4.5 shrink-0 text-emerald-600" /> : <Circle className="size-4.5 shrink-0 text-muted-foreground/60" />}
                          <span className="min-w-0 flex-1">
                            <span className="block text-[14.5px] leading-snug">{l.title}</span>
                            <span className="block truncate text-[12.5px] text-muted-foreground">{l.summary}</span>
                          </span>
                          <span className="shrink-0 text-[12px] text-muted-foreground tabular-nums">{l.minutes} min</span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
          <section className="flex flex-col justify-between gap-4 rounded-2xl border border-dashed p-5">
            <div className="grid gap-2">
              <GraduationCap className="size-5 text-muted-foreground" />
              <h2 className="text-[17px] font-medium">Prefere aprender fazendo?</h2>
              <p className="text-[13.5px] text-muted-foreground">
                A demonstração guiada leva você pelo fluxo inteiro num caso real, a Igreja do Carmo, em 13 missões, sem mexer nos seus projetos.
              </p>
            </div>
            <Link href="/academy/demonstracao" className="inline-flex items-center gap-1.5 text-[14px] font-medium hover:underline">
              Como funciona a demonstração <ArrowRight className="size-4" />
            </Link>
          </section>
        </div>
      </PageBody>
    </>
  );
}
