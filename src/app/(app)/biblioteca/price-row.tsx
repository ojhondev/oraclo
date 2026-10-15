"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { unitLabels, type Price, type PriceUnit } from "@/lib/pricing";
import { resetPrice, savePrice } from "./actions";

const toReais = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

/** Tratamento + preço unitário de um tipo de dano, editável inline. */
export function PriceRow({ typeId, price, canEdit }: { typeId: string; price: Price; canEdit: boolean }) {
  const [treatment, setTreatment] = useState(price.treatment);
  const [value, setValue] = useState(toReais(price.priceCents));
  const [unit, setUnit] = useState<PriceUnit>(price.unit);
  const [pending, start] = useTransition();
  const dirty = treatment !== price.treatment || value !== toReais(price.priceCents) || unit !== price.unit;

  if (!canEdit) {
    return (
      <p className="text-[12px] text-muted-foreground">
        {price.treatment || "Tratamento"} · <b className="font-medium text-foreground">R$ {toReais(price.priceCents)}</b>/{unitLabels[price.unit]}
      </p>
    );
  }

  function save() {
    const reais = Number(value.replace(/\./g, "").replace(",", "."));
    if (!(reais >= 0)) return toast.error("Preço inválido.");
    start(async () => {
      try {
        await savePrice({ typeId, treatment, unit, reais });
        toast.success("Preço salvo.");
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <div className="mt-1.5 grid gap-1.5">
      <Input
        value={treatment}
        onChange={(e) => setTreatment(e.target.value)}
        placeholder="Tratamento (ex.: recomposição de reboco)"
        className="h-8 text-[12.5px]"
        aria-label="Tratamento"
      />
      <div className="flex items-center gap-1.5">
        <span className="text-[12px] text-muted-foreground">R$</span>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode="decimal"
          className="h-8 w-24 text-right text-[12.5px] tabular-nums"
          aria-label="Preço unitário"
          onKeyDown={(e) => e.key === "Enter" && dirty && save()}
        />
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as PriceUnit)}
          className="h-8 rounded-md border bg-background px-1.5 text-[12.5px]"
          aria-label="Unidade"
        >
          {(Object.keys(unitLabels) as PriceUnit[]).map((u) => (
            <option key={u} value={u}>
              por {unitLabels[u]}
            </option>
          ))}
        </select>
        {price.suggested && !dirty && <span className="text-[11px] text-muted-foreground">sugerido</span>}
        <div className="ml-auto flex gap-1">
          {!price.suggested && !dirty && (
            <Button
              variant="ghost"
              size="icon-sm"
              title="Voltar ao valor sugerido"
              aria-label="Voltar ao valor sugerido"
              disabled={pending}
              onClick={() => start(() => resetPrice(typeId))}
            >
              <RotateCcw />
            </Button>
          )}
          {dirty && (
            <Button size="icon-sm" onClick={save} disabled={pending} aria-label="Salvar preço">
              {pending ? <Loader2 className="animate-spin" /> : <Check />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
