"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, SimpleSelect } from "@/components/form";
import { siteKinds, protectionLevels, protectionBodies, states } from "@/lib/labels";
import type { schema } from "@/lib/db";

type Site = typeof schema.sites.$inferSelect;
type Action = (state: { error?: string } | null, form: FormData) => Promise<{ error?: string } | null>;

const toOptions = (o: Record<string, string>) => Object.entries(o).map(([value, label]) => ({ value, label }));

export function SiteForm({ action, site, cancelHref }: { action: Action; site?: Site; cancelHref: string }) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="grid max-w-3xl gap-8">
      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome do bem" htmlFor="name" className="sm:col-span-2">
          <Input id="name" name="name" required defaultValue={site?.name} placeholder="Ex.: Igreja Matriz de Nossa Senhora do Pilar" />
        </Field>
        <Field label="Tipo">
          <SimpleSelect name="kind" options={toOptions(siteKinds)} defaultValue={site?.kind ?? "igreja"} />
        </Field>
        <Field label="Período / data de construção" htmlFor="period">
          <Input id="period" name="period" defaultValue={site?.period ?? ""} placeholder="Ex.: séc. XVIII, 1711–1733" />
        </Field>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <p className="label sm:col-span-2">Proteção</p>
        <Field label="Nível de proteção">
          <SimpleSelect name="protection" options={toOptions(protectionLevels)} defaultValue={site?.protection ?? "nenhuma"} />
        </Field>
        <Field label="Órgão de proteção" htmlFor="protectionBody">
          <Input id="protectionBody" name="protectionBody" list="bodies" defaultValue={site?.protectionBody ?? ""} placeholder="IPHAN, CONDEPHAAT…" />
          <datalist id="bodies">
            {protectionBodies.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </Field>
        <Field label="Nº do processo / inscrição" htmlFor="processNumber" className="sm:col-span-2">
          <Input id="processNumber" name="processNumber" defaultValue={site?.processNumber ?? ""} placeholder="Ex.: Livro do Tombo de Belas Artes, inscr. 123" />
        </Field>
      </section>

      <section className="grid gap-4 sm:grid-cols-[1fr_1fr_120px]">
        <p className="label sm:col-span-3">Localização</p>
        <Field label="Endereço" htmlFor="address" className="sm:col-span-3">
          <Input id="address" name="address" defaultValue={site?.address ?? ""} />
        </Field>
        <Field label="Cidade" htmlFor="city" className="sm:col-span-2">
          <Input id="city" name="city" defaultValue={site?.city ?? ""} />
        </Field>
        <Field label="UF">
          <SimpleSelect name="state" options={states} defaultValue={site?.state} allowNone />
        </Field>
      </section>

      <Field label="Descrição / histórico" htmlFor="description">
        <Textarea id="description" name="description" rows={4} defaultValue={site?.description ?? ""} />
      </Field>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {site ? "Salvar alterações" : "Cadastrar bem"}
        </Button>
        <Button variant="ghost" asChild>
          <Link href={cancelHref}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
