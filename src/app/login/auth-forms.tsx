"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, signup } from "./actions";

export function TextField({ id, label, ...props }: { id: string; label: string } & React.ComponentProps<"input">) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} required className="h-11 rounded-xl" {...props} />
    </div>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="grid gap-4">
      <TextField id="email" label="E-mail" type="email" autoComplete="email" />
      <TextField id="password" label="Senha" type="password" autoComplete="current-password" />
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="lg" className="mt-2 h-11 rounded-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        Entrar
      </Button>
    </form>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, null);
  return (
    <form action={action} className="grid gap-4">
      <TextField id="org" label="Empresa ou escritório" placeholder="Ex.: Silva Arquitetura e Engenharia" autoComplete="organization" />
      <TextField id="name" label="Seu nome" autoComplete="name" />
      <TextField id="email" label="E-mail" type="email" autoComplete="email" />
      <TextField id="password" label="Senha" type="password" autoComplete="new-password" minLength={8} />
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="lg" className="mt-2 h-11 rounded-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        Criar conta
      </Button>
    </form>
  );
}
