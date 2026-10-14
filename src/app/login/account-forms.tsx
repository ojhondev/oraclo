"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TextField } from "./auth-forms";
import { acceptInvite, requestPasswordReset, resetPassword } from "./account-actions";

function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" size="lg" className="mt-2 h-11 rounded-full" disabled={pending}>
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}

export function AcceptInviteForm({ token, email }: { token: string; email: string }) {
  const [state, action, pending] = useActionState(acceptInvite.bind(null, token), null);
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label>E-mail</Label>
        <Input value={email} readOnly disabled className="h-11 rounded-xl" />
      </div>
      <TextField id="name" label="Seu nome completo" autoComplete="name" />
      <TextField id="password" label="Crie uma senha" type="password" autoComplete="new-password" minLength={8} />
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Submit pending={pending}>Entrar na equipe</Submit>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, null);
  if (state?.ok) return <p className="text-[14px] leading-relaxed">{state.ok}</p>;
  return (
    <form action={action} className="grid gap-4">
      <TextField id="email" label="E-mail da sua conta" type="email" autoComplete="email" />
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Submit pending={pending}>Enviar link</Submit>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword.bind(null, token), null);
  return (
    <form action={action} className="grid gap-4">
      <TextField id="password" label="Nova senha" type="password" autoComplete="new-password" minLength={8} />
      <TextField id="confirm" label="Repita a nova senha" type="password" autoComplete="new-password" minLength={8} />
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Submit pending={pending}>Salvar e entrar</Submit>
    </form>
  );
}
