"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { findLesson } from "@/lib/academy";

/** Marca (ou desmarca) uma aula da Academy como concluída pelo usuário. */
export async function setLessonDone(lessonId: string, done: boolean) {
  const user = await requireUser();
  const id = z.string().max(80).parse(lessonId);
  if (!findLesson(id)) throw new Error("Aula não encontrada.");
  if (done)
    await db.insert(schema.academyProgress).values({ userId: user.id, lessonId: id }).onConflictDoNothing();
  else
    await db
      .delete(schema.academyProgress)
      .where(and(eq(schema.academyProgress.userId, user.id), eq(schema.academyProgress.lessonId, id)));
  revalidatePath("/academy");
  return done;
}
