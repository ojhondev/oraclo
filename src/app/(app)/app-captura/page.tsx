import { redirect } from "next/navigation";

/** Página antiga do passo a passo: o conteúdo foi para a Ajuda; a lista de capturas fica em /capturas. */
export default function OldCaptureAppPage() {
  redirect("/capturas");
}
