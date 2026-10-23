"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FileText, Loader2, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toDraft, TEXT_FIELDS, type LaudoText, type TextField } from "@/lib/laudo-text";
import { saveLaudoDraft } from "./laudo-actions";

type Values = Record<TextField, string> & { includeBudget: boolean };

const LONG: { key: TextField; label: string; hint: string; rows: number }[] = [
  { key: "title", label: "Título", hint: "Aparece na capa e nas propriedades do PDF.", rows: 1 },
  { key: "scope", label: "Objeto e finalidade", hint: "Opcional. Para que serve o laudo e o que foi (e o que não foi) avaliado. Vira uma seção própria.", rows: 4 },
  { key: "methodology", label: "Metodologia", hint: "Texto padrão do ArchRay. Edite para descrever o seu método. Linha em branco separa os parágrafos.", rows: 10 },
  { key: "summary", label: "Resumo do diagnóstico", hint: "Gerado dos números do projeto. Se editar, os números deixam de se atualizar sozinhos.", rows: 5 },
  { key: "conclusion", label: "Conclusões e recomendações gerais", hint: "Opcional. Parecer do profissional e ordem sugerida de intervenção. Vira uma seção própria.", rows: 6 },
  { key: "limitations", label: "Ressalvas e limitações", hint: "Opcional. O que não pôde ser verificado (áreas inacessíveis, ensaios não feitos).", rows: 4 },
];

const SIGNER: { key: TextField; label: string; placeholder?: string }[] = [
  { key: "signerName", label: "Nome" },
  { key: "signerRole", label: "Cargo / função" },
  { key: "signerRegistry", label: "Registro profissional", placeholder: "CAU A123456-7 / CREA 123456/D" },
  { key: "artRrt", label: "ART / RRT nº", placeholder: "Opcional" },
];

/**
 * Editor do laudo: cada campo já vem com o texto padrão; só o que for alterado fica salvo no rascunho.
 * "Gerar PDF" salva e abre o PDF.
 */
export function LaudoEditor({
  siteId,
  campaignId,
  defaults,
  initial,
  pdfHref,
  canEdit,
}: {
  siteId: string;
  campaignId: string | null;
  defaults: Record<TextField, string>;
  initial: LaudoText;
  pdfHref: string;
  canEdit: boolean;
}) {
  const [values, setValues] = useState<Values>(initial);
  const [pending, start] = useTransition();
  const set = <K extends keyof Values>(k: K, v: Values[K]) => setValues((s) => ({ ...s, [k]: v }));
  const changed = (k: TextField) => values[k].trim() !== defaults[k].trim();
  const nChanged = (Object.keys(TEXT_FIELDS) as TextField[]).filter(changed).length + (values.includeBudget ? 0 : 1);

  const save = async (open: boolean): Promise<void> => {
    const res = await saveLaudoDraft(siteId, campaignId, toDraft(values, defaults));
    if ("error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(open ? "Rascunho salvo. Gerando o PDF…" : "Rascunho salvo.");
    if (open) window.open(pdfHref, "_blank", "noopener");
  };

  const field = (k: TextField, rows: number, placeholder?: string) => {
    const max = TEXT_FIELDS[k];
    return rows === 1 ? (
      <Input value={values[k]} maxLength={max} placeholder={placeholder} disabled={!canEdit} onChange={(e) => set(k, e.target.value)} />
    ) : (
      <Textarea value={values[k]} maxLength={max} rows={rows} placeholder={placeholder} disabled={!canEdit} onChange={(e) => set(k, e.target.value)} className="min-h-0 text-[13.5px] leading-relaxed" />
    );
  };

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 rounded-2xl border bg-card p-5">
        {LONG.map(({ key, label, hint, rows }) => (
          <label key={key} className="grid gap-1.5">
            <span className="flex flex-wrap items-baseline gap-2">
              <span className="text-[14px] font-medium">{label}</span>
              {changed(key) && <span className="rounded-full bg-muted px-2 text-[11px] text-muted-foreground">editado</span>}
              {canEdit && changed(key) && (
                <button type="button" onClick={() => set(key, defaults[key])} className="ml-auto inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground">
                  <RotateCcw className="size-3" /> Restaurar padrão
                </button>
              )}
            </span>
            <span className="text-[12.5px] text-muted-foreground">{hint}</span>
            {field(key, rows)}
          </label>
        ))}
      </div>

      <div className="grid gap-4 rounded-2xl border bg-card p-5">
        <div>
          <h3 className="text-[14px] font-medium">Responsável técnico</h3>
          <p className="mt-1 text-[12.5px] text-muted-foreground">Sai na capa e no bloco de assinatura. O padrão é o seu perfil.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {SIGNER.map(({ key, label, placeholder }) => (
            <label key={key} className="grid gap-1 text-[13px]">
              <span className="text-muted-foreground">{label}</span>
              {field(key, 1, placeholder)}
            </label>
          ))}
        </div>
        <label className="flex items-center gap-3 border-t pt-4 text-[13.5px]">
          <Switch checked={values.includeBudget} disabled={!canEdit} onCheckedChange={(v) => set("includeBudget", v)} />
          Incluir o orçamento estimado no laudo
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {canEdit ? (
          <>
            <Button variant="outline" disabled={pending} onClick={() => start(() => save(false))}>
              {pending ? <Loader2 className="animate-spin" /> : <Save />} Salvar rascunho
            </Button>
            <Button disabled={pending} onClick={() => start(() => save(true))}>
              <FileText /> Salvar e gerar PDF
            </Button>
            <span className="text-[12.5px] text-muted-foreground">{nChanged ? `${nChanged} campo(s) diferente(s) do padrão` : "Tudo no texto padrão"}</span>
          </>
        ) : (
          <Button asChild>
            <a href={pdfHref} target="_blank" rel="noreferrer">
              <FileText /> Gerar PDF
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
