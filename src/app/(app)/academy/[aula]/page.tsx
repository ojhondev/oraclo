import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ArrowLeft, ArrowRight, Clock, ExternalLink, Target } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { TRACKS, findLesson, lessonsOf, neighbors } from "@/lib/academy";
import { PageBody } from "@/components/page-header";
import { DemoLauncher } from "@/components/demo-tour";
import { Block } from "../ui";
import { DoneButton, Quiz } from "../lesson-client";

export async function generateMetadata({ params }: PageProps<"/academy/[aula]">): Promise<Metadata> {
  const lesson = findLesson((await params).aula);
  return { title: lesson ? `${lesson.title} · Academy` : "Academy" };
}

export default async function LessonPage({ params }: PageProps<"/academy/[aula]">) {
  const { aula } = await params;
  const lesson = findLesson(aula);
  if (!lesson) notFound();
  const user = await requireUser();
  const [row] = await db
    .select({ id: schema.academyProgress.id })
    .from(schema.academyProgress)
    .where(and(eq(schema.academyProgress.userId, user.id), eq(schema.academyProgress.lessonId, lesson.id)));
  const track = TRACKS.find((t) => t.id === lesson.track)!;
  const inTrack = lessonsOf(track.id);
  const pos = inTrack.findIndex((l) => l.id === lesson.id) + 1;
  const { prev, next } = neighbors(lesson.id);

  return (
    <PageBody className="mx-auto grid w-full max-w-3xl gap-6 pt-8 xl:max-w-4xl">
      <nav className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground" aria-label="Caminho">
        <Link href="/academy" className="hover:text-foreground">
          Academy
        </Link>
        <span>/</span>
        <Link href={`/academy#${track.id}`} className="hover:text-foreground">
          {track.title}
        </Link>
      </nav>

      <header className="grid gap-3">
        <p className="label">
          Aula {pos} de {inTrack.length}
        </p>
        <h1 className="h-display text-[28px] leading-tight sm:text-[34px]">{lesson.title}</h1>
        <p className="text-[16px] text-muted-foreground">{lesson.summary}</p>
        <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <Clock className="size-3.5" /> {lesson.minutes} min
        </p>
      </header>

      <section className="grid gap-2 rounded-2xl border bg-card p-5">
        <p className="flex items-center gap-2 text-[14px] font-medium">
          <Target className="size-4 text-muted-foreground" /> Nesta aula você vai
        </p>
        <ul className="grid gap-1 pl-6 text-[14px] text-foreground/85">
          {lesson.objectives.map((o) => (
            <li key={o} className="list-disc marker:text-muted-foreground">
              {o}
            </li>
          ))}
        </ul>
      </section>

      <article className="grid gap-5">
        {lesson.blocks.map((b, i) => (
          <Block key={i} block={b} />
        ))}
      </article>

      {lesson.pitfalls?.length ? (
        <section className="grid gap-2">
          <h2 className="text-[19px] font-medium">Problemas comuns</h2>
          {lesson.pitfalls.map((p) => (
            <details key={p.q} className="group rounded-xl border bg-card px-4 py-3">
              <summary className="cursor-pointer list-none text-[14.5px] font-medium marker:hidden">
                <span className="mr-2 inline-block text-muted-foreground transition-transform group-open:rotate-90">›</span>
                {p.q}
              </summary>
              <p className="mt-2 pl-4 text-[14px] text-foreground/85">{p.a}</p>
            </details>
          ))}
        </section>
      ) : null}

      {lesson.check?.length ? <Quiz questions={lesson.check} /> : null}

      <section className="flex flex-wrap items-center gap-3 rounded-2xl border bg-muted/40 p-5">
        <DoneButton lessonId={lesson.id} initial={!!row} />
        {lesson.id === "demonstracao" && <DemoLauncher variant="button" />}
        {lesson.practice && (
          <Link href={lesson.practice.href} className="inline-flex h-9 items-center gap-2 rounded-lg border bg-background px-4 text-[14px] font-medium hover:bg-muted">
            <ExternalLink className="size-4" /> Praticar: {lesson.practice.label}
          </Link>
        )}
      </section>

      <nav className="grid gap-3 border-t pt-5 sm:grid-cols-2" aria-label="Outras aulas">
        {prev ? (
          <Link href={`/academy/${prev.id}`} className="grid gap-0.5 rounded-xl border p-4 hover:bg-muted/60">
            <span className="flex items-center gap-1 text-[12.5px] text-muted-foreground">
              <ArrowLeft className="size-3.5" /> Anterior
            </span>
            <span className="text-[14.5px]">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/academy/${next.id}`} className="grid gap-0.5 rounded-xl border p-4 text-right hover:bg-muted/60">
            <span className="flex items-center justify-end gap-1 text-[12.5px] text-muted-foreground">
              Próxima <ArrowRight className="size-3.5" />
            </span>
            <span className="text-[14.5px]">{next.title}</span>
          </Link>
        ) : (
          <Link href="/academy" className="grid gap-0.5 rounded-xl border p-4 text-right hover:bg-muted/60">
            <span className="text-[12.5px] text-muted-foreground">Fim das aulas</span>
            <span className="text-[14.5px]">Voltar à Academy</span>
          </Link>
        )}
      </nav>
    </PageBody>
  );
}
