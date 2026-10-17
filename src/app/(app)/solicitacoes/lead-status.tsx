"use client";

import { useTransition } from "react";
import { SimpleSelect } from "@/components/form";
import { setLeadStatus } from "./actions";

const OPTIONS = [
  { value: "novo", label: "Novo" },
  { value: "em_contato", label: "Em contato" },
  { value: "proposta", label: "Proposta enviada" },
  { value: "fechado", label: "Fechado" },
  { value: "descartado", label: "Descartado" },
];

export function LeadStatus({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  return (
    <div className={pending ? "w-48 opacity-60" : "w-48"}>
      <SimpleSelect options={OPTIONS} value={status} onValueChange={(v) => start(() => setLeadStatus(id, v))} />
    </div>
  );
}
