"use client";

import { useState, useTransition } from "react";
import { Box, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimpleSelect } from "@/components/form";

/** Importa um modelo 3D pronto (GLB, nuvem de pontos): escolhe a vistoria e a área e abre a captura. */
export function ImportModelForm({
  action,
  campaigns,
  elements,
}: {
  action: (campaignId: string, form: FormData) => Promise<void>;
  campaigns: { value: string; label: string }[];
  elements: { value: string; label: string }[];
}) {
  const [campaignId, setCampaignId] = useState(campaigns[0]?.value ?? "");
  const [elementId, setElementId] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-3 sm:max-w-md"
      action={() => {
        const fd = new FormData();
        fd.set("origem", "modelo");
        if (elementId && elementId !== "__none") fd.set("elementId", elementId);
        start(() => action(campaignId, fd));
      }}
    >
      <label className="grid gap-1 text-[13px]">
        <span className="text-muted-foreground">Vistoria</span>
        <SimpleSelect options={campaigns} value={campaignId} onValueChange={setCampaignId} />
      </label>
      <label className="grid gap-1 text-[13px]">
        <span className="text-muted-foreground">Área (opcional)</span>
        <SimpleSelect options={elements} value={elementId || "__none"} onValueChange={setElementId} allowNone noneLabel="Nenhuma" />
      </label>
      <div>
        <Button type="submit" disabled={pending || !campaignId}>
          {pending ? <Loader2 className="animate-spin" /> : <Box />} Importar modelo 3D
        </Button>
      </div>
    </form>
  );
}
