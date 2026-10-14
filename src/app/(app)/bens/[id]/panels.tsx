"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Loader2, Plus, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/form";
import { elementKinds, purposes } from "@/lib/labels";
import { addCampaign, addChurchTemplate, addElement } from "../actions";

const toOptions = (o: Record<string, string>) => Object.entries(o).map(([value, label]) => ({ value, label }));

/** Limpa o formulário depois de um envio bem-sucedido. */
function useResetOnSuccess(state: { error?: string } | null, pending: boolean) {
  const ref = useRef<HTMLFormElement>(null);
  const was = useRef(false);
  useEffect(() => {
    if (was.current && !pending && !state?.error) ref.current?.reset();
    was.current = pending;
  }, [pending, state]);
  return ref;
}

export function AddElementForm({ siteId, empty }: { siteId: string; empty: boolean }) {
  const [state, action, pending] = useActionState(addElement.bind(null, siteId), null);
  const [tplPending, start] = useTransition();
  const ref = useResetOnSuccess(state, pending);
  return (
    <div className="grid gap-2">
      <form ref={ref} action={action} className="flex flex-wrap gap-2">
        <Input name="name" placeholder="Ex.: Fachada principal" className="min-w-48 flex-1" required />
        <SimpleSelect name="kind" options={toOptions(elementKinds)} defaultValue="fachada" className="w-44" />
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Plus />} Adicionar
        </Button>
      </form>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {empty && (
        <button
          type="button"
          onClick={() => start(() => addChurchTemplate(siteId))}
          disabled={tplPending}
          className="flex w-fit items-center gap-1.5 text-[13px] font-medium text-brand hover:underline"
        >
          {tplPending ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
          Usar as partes típicas de uma igreja
        </button>
      )}
    </div>
  );
}

export function AddCampaignForm({ siteId, today }: { siteId: string; today: string }) {
  const [state, action, pending] = useActionState(addCampaign.bind(null, siteId), null);
  const ref = useResetOnSuccess(state, pending);
  return (
    <div className="grid gap-2">
      <form ref={ref} action={action} className="flex flex-wrap gap-2">
        <Input name="name" placeholder="Ex.: Levantamento inicial" className="min-w-48 flex-1" required />
        <SimpleSelect name="purpose" options={toOptions(purposes)} defaultValue="levantamento" className="w-44" />
        <Input name="date" type="date" defaultValue={today} className="w-40" required />
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Plus />} Nova campanha
        </Button>
      </form>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </div>
  );
}
