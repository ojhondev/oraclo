"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form";
import { changePassword, updateProfile } from "./actions";

function Feedback({ state }: { state: { error?: string; ok?: string } | null }) {
  if (state?.error) return <p className="text-sm text-destructive">{state.error}</p>;
  if (state?.ok) return <p className="text-sm text-success">{state.ok}</p>;
  return null;
}

export function ProfileForm({ name, email, professionalId }: { name: string; email: string; professionalId: string | null }) {
  const [state, action, pending] = useActionState(updateProfile, null);
  return (
    <form action={action} className="grid gap-4">
      <Field label="Nome completo" htmlFor="name" hint="Como deve aparecer no carimbo, no campo Responsável.">
        <Input id="name" name="name" required defaultValue={name} autoComplete="name" />
      </Field>
      <Field
        label="Registro profissional"
        htmlFor="professionalId"
        hint="Ex.: CAU A123456-7 ou CREA-MG 123456/D. Opcional; sai ao lado do nome no carimbo."
      >
        <Input id="professionalId" name="professionalId" defaultValue={professionalId ?? ""} placeholder="CAU A123456-7" />
      </Field>
      <Field label="E-mail" hint="Usado para entrar. Para trocar, fale com o administrador da organização.">
        <Input value={email} disabled readOnly />
      </Field>
      <Feedback state={state} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />} Salvar perfil
        </Button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="grid gap-4">
      <Field label="Senha atual" htmlFor="current">
        <Input id="current" name="current" type="password" required autoComplete="current-password" />
      </Field>
      <Field label="Nova senha" htmlFor="next" hint="Pelo menos 8 caracteres.">
        <Input id="next" name="next" type="password" required minLength={8} autoComplete="new-password" />
      </Field>
      <Feedback state={state} />
      <div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />} Trocar senha
        </Button>
      </div>
    </form>
  );
}
