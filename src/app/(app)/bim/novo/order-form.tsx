"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, SimpleSelect } from "@/components/form";
import { DISCIPLINES, estimate, fmtMoney, FORMATS, LODS, type Lod } from "@/lib/bim";
import { createOrder } from "../actions";

type BaseOption = { value: string; label: string };

function Choice({ checked, onClick, title, summary, type = "checkbox" }: { checked: boolean; onClick: () => void; title: string; summary?: string; type?: "checkbox" | "radio" }) {
  return (
    <button
      type="button"
      role={type}
      aria-checked={checked}
      onClick={onClick}
      className={cn("flex items-start gap-3 rounded-xl border p-3 text-left transition-colors", checked ? "border-foreground bg-muted/60" : "hover:bg-muted/40")}
    >
      <span className={cn("mt-0.5 grid size-4 shrink-0 place-items-center border", type === "radio" ? "rounded-full" : "rounded", checked && "border-foreground bg-foreground text-background")}>
        {checked && <Check className="size-3" />}
      </span>
      <span className="grid gap-0.5">
        <span className="text-[14px] font-medium">{title}</span>
        {summary && <span className="text-[12.5px] text-muted-foreground">{summary}</span>}
      </span>
    </button>
  );
}

export function OrderForm({ sites, basesBySite, defaultSiteId }: { sites: BaseOption[]; basesBySite: Record<string, BaseOption[]>; defaultSiteId?: string }) {
  const [state, action, pending] = useActionState(createOrder, null);
  const [siteId, setSiteId] = useState(defaultSiteId ?? sites[0]?.value ?? "");
  const [area, setArea] = useState("");
  const [lod, setLod] = useState<Lod>("200");
  const [disciplines, setDisciplines] = useState<string[]>(["arquitetura"]);
  const [formats, setFormats] = useState<string[]>(["rvt", "ifc"]);
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const areaNum = Number(area.replace(/\./g, "").replace(",", ".")) || 0;
  const est = useMemo(() => estimate({ areaM2: areaNum, lod, disciplines, formats }), [areaNum, lod, disciplines, formats]);
  const bases = basesBySite[siteId] ?? [];

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid content-start gap-8">
        {/* valores dos botões de escolha vão como campos ocultos */}
        <input type="hidden" name="lod" value={lod} />
        {disciplines.map((d) => <input key={d} type="hidden" name="disciplines" value={d} />)}
        {formats.map((f) => <input key={f} type="hidden" name="formats" value={f} />)}

        <section className="grid gap-4 sm:grid-cols-2">
          <p className="label sm:col-span-2">1. Projeto e base</p>
          <Field label="Projeto">
            <SimpleSelect name="siteId" options={sites} value={siteId} onValueChange={setSiteId} placeholder="Escolha o projeto" />
          </Field>
          <Field label="Base da modelagem" hint={bases.length ? "Captura ou nuvem que a equipe vai usar." : "Nenhuma captura concluída ainda — a equipe combina a base com você."}>
            <SimpleSelect key={siteId} name="captureId" options={bases} allowNone noneLabel="Definir com a equipe" defaultValue={bases[0]?.value} />
          </Field>
          <Field label="Área a modelar (m²)" htmlFor="areaM2" hint="Área construída aproximada do que será modelado.">
            <Input id="areaM2" name="areaM2" inputMode="decimal" required value={area} onChange={(e) => setArea(e.target.value)} placeholder="Ex.: 1.200" />
          </Field>
          <Field label="Prazo desejado" htmlFor="desiredDate" hint="Opcional.">
            <Input id="desiredDate" name="desiredDate" type="date" />
          </Field>
        </section>

        <section className="grid gap-3">
          <p className="label">2. Nível de detalhe</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {(Object.keys(LODS) as Lod[]).map((k) => (
              <Choice key={k} type="radio" checked={lod === k} onClick={() => setLod(k)} title={LODS[k].label} summary={LODS[k].summary} />
            ))}
          </div>
        </section>

        <section className="grid gap-3">
          <p className="label">3. Disciplinas</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {Object.entries(DISCIPLINES).map(([k, d]) => (
              <Choice key={k} checked={disciplines.includes(k)} onClick={() => setDisciplines((l) => (k === "arquitetura" && l.length === 1 && l[0] === k ? l : toggle(l, k)))} title={d.label} summary={d.summary} />
            ))}
          </div>
        </section>

        <section className="grid gap-3">
          <p className="label">4. Formatos de entrega</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {Object.entries(FORMATS).map(([k, f]) => (
              <Choice key={k} checked={formats.includes(k)} onClick={() => setFormats((l) => (l.length === 1 && l[0] === k ? l : toggle(l, k)))} title={f.label} summary={k === "ifc" ? "Sem custo extra." : undefined} />
            ))}
          </div>
          <Field label="Versão do software" htmlFor="softwareVersions" hint="Opcional. Ex.: Revit 2024, Archicad 27.">
            <Input id="softwareVersions" name="softwareVersions" />
          </Field>
        </section>

        <Field label="Observações" htmlFor="notes">
          <Textarea id="notes" name="notes" rows={4} placeholder="O que é prioridade, o que pode ficar de fora, padrões do escritório (templates, famílias, níveis)…" />
        </Field>
      </div>

      {/* resumo e estimativa */}
      <aside className="h-fit rounded-2xl border bg-card p-5 lg:sticky lg:top-6">
        <p className="label">Estimativa</p>
        <p className="mt-1 text-[32px] font-medium tracking-tight tabular-nums">{areaNum > 0 ? fmtMoney(est.cents) : "—"}</p>
        <p className="text-[13.5px] text-muted-foreground">{areaNum > 0 ? `Prazo estimado: ${est.days} dias úteis após a aprovação` : "Informe a área para estimar."}</p>
        <dl className="mt-4 grid gap-1.5 border-t pt-4 text-[13px]">
          <div className="flex justify-between"><dt className="text-muted-foreground">Área</dt><dd>{areaNum > 0 ? `${areaNum.toLocaleString("pt-BR")} m²` : "—"}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Detalhe</dt><dd>{LODS[lod].label}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Disciplinas</dt><dd className="text-right">{disciplines.map((d) => DISCIPLINES[d as keyof typeof DISCIPLINES].label).join(", ")}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Formatos</dt><dd className="text-right">{formats.map((f) => FORMATS[f as keyof typeof FORMATS].label).join(", ")}</dd></div>
        </dl>
        <p className="mt-4 text-[12px] text-muted-foreground">É uma estimativa: a equipe confere a base e envia o orçamento final para você aprovar. Nada é cobrado antes da aprovação.</p>
        {state?.error && <p className="mt-3 text-sm text-destructive">{state.error}</p>}
        <Button type="submit" size="lg" className="mt-4 w-full" disabled={pending || !siteId}>
          {pending && <Loader2 className="animate-spin" />} Solicitar orçamento
        </Button>
        <Button variant="ghost" className="mt-1 w-full" asChild>
          <Link href="/bim">Cancelar</Link>
        </Button>
      </aside>
    </form>
  );
}
