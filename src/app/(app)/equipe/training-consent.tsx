"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { setTrainingConsent } from "./actions";

export function TrainingConsent({ consent, since, canManage }: { consent: boolean; since: string | null; canManage: boolean }) {
  const [busy, start] = useTransition();
  return (
    <section className="grid gap-3 rounded-2xl border bg-card p-5">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-medium">Ajudar a treinar a IA do ArchRay</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Com a sua autorização, os danos que a equipe validou (a imagem da vista, o contorno e a classe) e as sugestões rejeitadas
            entram na base que treina a detecção automática. Nada é publicado, e você pode revogar quando quiser: a partir daí, seus dados deixam de entrar na base.
          </p>
        </div>
        <Switch
          checked={consent}
          disabled={!canManage || busy}
          aria-label="Autorizar uso para treinar a IA"
          onCheckedChange={(v) =>
            start(async () => {
              try {
                await setTrainingConsent(v);
                toast.success(v ? "Obrigado! Os danos validados vão ajudar a treinar a IA." : "Autorização revogada.");
              } catch (e) {
                toast.error((e as Error).message);
              }
            })
          }
        />
      </div>
      <p className="text-[12.5px] text-muted-foreground">
        {consent
          ? `Autorizado${since ? ` em ${since}` : ""}.`
          : canManage
            ? "Não autorizado. Desligado por padrão (LGPD): só entra com o seu sim."
            : "Não autorizado. Só um administrador pode mudar."}
      </p>
    </section>
  );
}
