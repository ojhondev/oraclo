"use server";

import { revalidatePath } from "next/cache";
import { editors, requireUser } from "@/lib/auth";
import { ensureDemo, resetDemo } from "@/lib/demo";

/** Abre (criando se preciso) o projeto de demonstração do tour guiado. */
export async function startDemo() {
  const user = await requireUser(editors);
  const id = await ensureDemo(user.orgId, user.id);
  revalidatePath("/");
  return id;
}

/** Apaga tudo o que foi feito na demonstração e recomeça com o projeto vazio. */
export async function restartDemo() {
  const user = await requireUser(editors);
  const id = await resetDemo(user.orgId, user.id);
  revalidatePath("/");
  return id;
}
