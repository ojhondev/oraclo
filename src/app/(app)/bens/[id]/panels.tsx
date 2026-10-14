"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Box, Camera, Images, Loader2, Plus, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/form";
import { elementKinds, purposes } from "@/lib/labels";
import { addAreaTemplate, addCampaign, addElement } from "../actions";

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
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            {tplPending ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
            Usar áreas típicas de:
          </span>
          {([
            ["edificacao", "Edificação"],
            ["industria", "Indústria / galpão"],
            ["igreja", "Igreja / patrimônio"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              disabled={tplPending}
              onClick={() => start(() => addAreaTemplate(siteId, k))}
              className="font-medium underline-offset-4 hover:underline"
            >
              {label}
            </button>
          ))}
        </div>
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

type Origem = "celular" | "fotos" | "modelo";

/**
 * Três formas de alimentar uma campanha: capturar em campo com o celular, enviar fotos
 * que o escritório já tem ou importar um modelo 3D pronto (laser, outro software).
 */
export function NewCaptureForm({
  action,
  elements,
  canImportModel,
}: {
  action: (form: FormData) => Promise<void>;
  elements: { value: string; label: string }[];
  canImportModel: boolean;
}) {
  const [pending, start] = useTransition();
  const [origem, setOrigem] = useState<Origem>("celular");
  // ref: o clique define a origem antes do envio (o estado só atualizaria no próximo render)
  const origemRef = useRef<Origem>("celular");
  const btn = (o: Origem, icon: React.ReactNode, label: string, variant: "default" | "outline") => (
    <Button type="submit" size="sm" variant={variant} className="h-9" disabled={pending} onClick={() => {
        origemRef.current = o;
        setOrigem(o);
      }}>
      {pending && origem === o ? <Loader2 className="animate-spin" /> : icon} {label}
    </Button>
  );
  return (
    <form
      action={(fd) => {
        fd.set("origem", origemRef.current);
        start(() => action(fd));
      }}
      className="mt-3 grid gap-2 rounded-xl bg-muted/60 p-2"
    >
      <SimpleSelect
        name="elementId"
        options={elements}
        allowNone
        noneLabel="Área (opcional)"
        className="h-9 w-full bg-card"
      />
      <div className="flex flex-wrap gap-1.5" data-tour="captura">
        {btn("celular", <Camera />, "Capturar com celular", "default")}
        {btn("fotos", <Images />, "Enviar fotos", "outline")}
        {canImportModel && btn("modelo", <Box />, "Importar modelo 3D", "outline")}
      </div>
    </form>
  );
}
