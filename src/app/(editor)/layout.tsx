import { requireUser } from "@/lib/auth";

/**
 * Área do editor (ArchRay CAD, laboratório): tela inteira, sem a barra lateral da plataforma.
 * O editor traz a própria barra de ferramentas.
 */
export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  await requireUser(["admin"]);
  return <div className="h-dvh overflow-hidden bg-background text-foreground">{children}</div>;
}
