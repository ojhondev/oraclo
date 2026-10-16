import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { demoStatus } from "@/lib/demo";

/** Progresso do tour guiado (o que já foi feito no projeto de demonstração). */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  return NextResponse.json(await demoStatus(user.orgId), { headers: { "Cache-Control": "no-store" } });
}
