"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SimpleSelect } from "@/components/form";
import { addPartner, removePartner } from "../../bim/actions";

export function PartnerForm() {
  const [state, action, pending] = useActionState(addPartner, null);
  return (
    <div className="grid gap-2">
      <form action={action} className="flex flex-wrap gap-2">
        <Input name="email" type="email" required placeholder="email@parceiro.com.br" className="min-w-56 flex-1" />
        <SimpleSelect
          name="platformRole"
          options={[
            { value: "parceiro", label: "Parceiro modelador" },
            { value: "operador", label: "Operador (equipe)" },
          ]}
          defaultValue="parceiro"
          className="w-52"
        />
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <UserPlus />} Adicionar
        </Button>
      </form>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.ok && <p className="text-sm">{state.ok}</p>}
    </div>
  );
}

export function PartnerRow({ person, isMe }: { person: { id: string; name: string; email: string; orgName: string; role: string }; isMe: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <li className="flex flex-wrap items-center gap-3 px-5 py-3">
      <span className="grid min-w-0 flex-1 leading-tight">
        <span className="truncate text-[14.5px]">
          {person.name} {isMe && <span className="text-[12px] text-muted-foreground">(você)</span>}
        </span>
        <span className="truncate text-[12.5px] text-muted-foreground">
          {person.email} · {person.orgName}
        </span>
      </span>
      <Badge variant="secondary">{person.role === "fixo" ? "Operador (configuração)" : person.role === "operador" ? "Operador" : "Parceiro"}</Badge>
      {person.role !== "fixo" && !isMe && (
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Remover acesso da operação"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await removePartner(person.id);
              if (r?.error) toast.error(r.error);
              else {
                toast.success(r?.ok ?? "Removido.");
                router.refresh();
              }
            })
          }
        >
          {pending ? <Loader2 className="animate-spin" /> : <X />}
        </Button>
      )}
    </li>
  );
}
