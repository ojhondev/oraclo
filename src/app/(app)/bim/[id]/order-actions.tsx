"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { Check, FileUp, Loader2, Lock, MessageSquare, RotateCcw, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SimpleSelect } from "@/components/form";
import { DELIVERY_EXTENSIONS, fmtMoney } from "@/lib/bim";
import { fmtBytes } from "@/lib/format";
import {
  acceptDelivery,
  addComment,
  approveQuote,
  assignOrder,
  cancelOrder,
  createDelivery,
  releaseDelivery,
  requestRevision,
  sendQuote,
  setOrderStatus,
} from "../actions";

type Result = { error?: string; ok?: string } | null;

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<Result>, after?: () => void) =>
    start(async () => {
      try {
        const r = await fn();
        if (r?.error) toast.error(r.error);
        else {
          if (r?.ok) toast.success(r.ok);
          after?.();
          router.refresh();
        }
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  return { pending, run };
}

/* ───────────── cliente ───────────── */

export function QuoteDecision({ orderId }: { orderId: string }) {
  const { pending, run } = useRun();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  return declining ? (
    <div className="grid gap-2">
      <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Por que está recusando? (opcional — ajuda a equipe a refazer a proposta)" />
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={pending} onClick={() => run(() => cancelOrder(orderId, reason || "Orçamento recusado pelo cliente."))}>
          Recusar e cancelar pedido
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setDeclining(false)}>
          Voltar
        </Button>
      </div>
    </div>
  ) : (
    <div className="flex flex-wrap gap-2">
      <Button disabled={pending} onClick={() => run(() => approveQuote(orderId))}>
        {pending ? <Loader2 className="animate-spin" /> : <Check />} Aprovar orçamento
      </Button>
      <Button variant="outline" disabled={pending} onClick={() => setDeclining(true)}>
        Recusar
      </Button>
    </div>
  );
}

export function CancelRequest({ orderId }: { orderId: string }) {
  const { pending, run } = useRun();
  return (
    <Button variant="ghost" size="sm" disabled={pending} onClick={() => run(() => cancelOrder(orderId, "Pedido cancelado pelo cliente."))}>
      <X /> Cancelar pedido
    </Button>
  );
}

export function DeliveryDecision({ orderId }: { orderId: string }) {
  const { pending, run } = useRun();
  const [revising, setRevising] = useState(false);
  const [text, setText] = useState("");
  return (
    <div className="grid gap-3 rounded-xl border p-4">
      <p className="text-[14px]">O modelo foi entregue. Confira os arquivos e aceite — ou peça uma revisão dizendo o que ajustar.</p>
      {revising ? (
        <div className="grid gap-2">
          <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex.: faltou modelar o mezanino do bloco B; pé-direito do 2º pavimento está 10 cm acima da nuvem." />
          <div className="flex gap-2">
            <Button disabled={pending} onClick={() => run(() => requestRevision(orderId, text), () => setRevising(false))}>
              <RotateCcw /> Enviar pedido de revisão
            </Button>
            <Button variant="ghost" onClick={() => setRevising(false)}>
              Voltar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button disabled={pending} onClick={() => run(() => acceptDelivery(orderId))}>
            {pending ? <Loader2 className="animate-spin" /> : <Check />} Aceitar entrega
          </Button>
          <Button variant="outline" onClick={() => setRevising(true)}>
            <RotateCcw /> Pedir revisão
          </Button>
        </div>
      )}
    </div>
  );
}

/* ───────────── comentários ───────────── */

export function CommentBox({ orderId, canInternal }: { orderId: string; canInternal: boolean }) {
  const { pending, run } = useRun();
  const [text, setText] = useState("");
  const [internal, setInternal] = useState(false);
  return (
    <div className="grid gap-2">
      <Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder={canInternal ? "Mensagem para o cliente (ou nota interna)" : "Escreva uma mensagem para a equipe"} />
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" disabled={pending || !text.trim()} onClick={() => run(() => addComment(orderId, text, internal), () => setText(""))}>
          {pending ? <Loader2 className="animate-spin" /> : <MessageSquare />} {internal ? "Salvar nota interna" : "Enviar"}
        </Button>
        {canInternal && (
          <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} className="accent-current" />
            <Lock className="size-3.5" /> Nota interna (o cliente não vê)
          </label>
        )}
      </div>
    </div>
  );
}

/* ───────────── operação ───────────── */

export function QuoteForm({ orderId, estimateCents, priceCents, days, notes }: { orderId: string; estimateCents: number | null; priceCents: number | null; days: number | null; notes: string | null }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(async (s: Result, fd: FormData) => {
    const r = await sendQuote(orderId, s, fd);
    if (r?.ok) {
      toast.success(r.ok);
      router.refresh();
    }
    return r;
  }, null);
  const initial = priceCents ?? estimateCents;
  return (
    <form action={action} className="grid gap-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1 text-[12.5px] text-muted-foreground">
          Preço (R$)
          <Input name="price" inputMode="decimal" required defaultValue={initial ? String(Math.round(initial / 100)) : ""} />
        </label>
        <label className="grid gap-1 text-[12.5px] text-muted-foreground">
          Prazo (dias úteis)
          <Input name="days" type="number" min={1} required defaultValue={days ?? ""} />
        </label>
      </div>
      <Textarea name="quoteNotes" rows={2} defaultValue={notes ?? ""} placeholder="Condições, escopo incluído/excluído, forma de pagamento…" />
      <p className="text-[12px] text-muted-foreground">Estimativa automática: {fmtMoney(estimateCents)}.</p>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Send />} {priceCents ? "Reenviar orçamento" : "Enviar orçamento ao cliente"}
      </Button>
    </form>
  );
}

export function AssignSelect({ orderId, assigneeId, people }: { orderId: string; assigneeId: string | null; people: { value: string; label: string }[] }) {
  const { pending, run } = useRun();
  return (
    <div className="flex items-center gap-2">
      <SimpleSelect
        options={people}
        value={assigneeId ?? "__none"}
        allowNone
        noneLabel="Sem responsável"
        onValueChange={(v) => run(() => assignOrder(orderId, v === "__none" ? null : v))}
        className="h-9"
      />
      {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
    </div>
  );
}

export function StatusButtons({ orderId, current, partner }: { orderId: string; current: string; partner: boolean }) {
  const { pending, run } = useRun();
  const options = [
    ...(partner ? [] : [["aprovado", "Na fila"] as const]),
    ["em_modelagem", "Em modelagem"] as const,
    ["em_revisao_interna", "Conferência interna"] as const,
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(([s, label]) => (
        <Button key={s} size="sm" variant={current === s ? "default" : "outline"} disabled={pending || current === s} onClick={() => run(() => setOrderStatus(orderId, s))}>
          {label}
        </Button>
      ))}
    </div>
  );
}

export function ReleaseButton({ orderId, deliveryId }: { orderId: string; deliveryId: string }) {
  const { pending, run } = useRun();
  return (
    <Button size="sm" disabled={pending} onClick={() => run(() => releaseDelivery(orderId, deliveryId))}>
      {pending ? <Loader2 className="animate-spin" /> : <Send />} Liberar para o cliente
    </Button>
  );
}

/** Envio de uma nova versão: arquivos vão direto ao storage; depois registra a entrega. */
export function DeliveryUpload({ orderId, orgId, partner }: { orderId: string; orgId: string; partner: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState("");
  const [progress, setProgress] = useState<string | null>(null);

  async function send() {
    if (!files.length) return toast.error("Escolha os arquivos do modelo.");
    try {
      const sent: { name: string; url: string; pathname: string; bytes: number }[] = [];
      for (const [i, f] of files.entries()) {
        const safe = f.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
        const blob = await upload(`orgs/${orgId}/bim/${orderId}/${safe}`, f, {
          access: "public",
          handleUploadUrl: "/api/upload",
          clientPayload: JSON.stringify({ orderId, kind: "entrega" }),
          contentType: f.type || "application/octet-stream",
          multipart: f.size > 20 * 1024 * 1024,
          onUploadProgress: (p) => setProgress(`Enviando ${i + 1}/${files.length} · ${f.name} · ${Math.round(p.percentage)}%`),
        });
        sent.push({ name: f.name, url: blob.url, pathname: blob.pathname, bytes: f.size });
      }
      setProgress("Registrando a versão…");
      const r = await createDelivery(orderId, { notes: notes.trim() || null, files: sent });
      if (r?.error) toast.error(r.error);
      else {
        toast.success(r?.ok ?? "Versão enviada.");
        setFiles([]);
        setNotes("");
        router.refresh();
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="grid gap-2">
      <button type="button" onClick={() => inputRef.current?.click()} className="grid place-items-center gap-1 rounded-xl border border-dashed px-4 py-6 text-center hover:border-foreground/40">
        <FileUp className="size-5 text-muted-foreground" />
        <span className="text-[14px] font-medium">{files.length ? `${files.length} arquivo(s) escolhido(s)` : "Escolher arquivos da entrega"}</span>
        <span className="text-[12px] text-muted-foreground">RVT, PLN, IFC, ZIP, PDF, DWG… até 5 GB cada</span>
      </button>
      {files.length > 0 && (
        <ul className="grid gap-1 text-[13px]">
          {files.map((f) => (
            <li key={f.name} className="flex justify-between gap-2">
              <span className="truncate">{f.name}</span>
              <span className="text-muted-foreground">{fmtBytes(f.size)}</span>
            </li>
          ))}
        </ul>
      )}
      <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="O que mudou nesta versão / observações para o cliente" />
      <Button size="sm" disabled={!!progress || !files.length} onClick={send}>
        {progress ? <Loader2 className="animate-spin" /> : <Send />} {progress ?? (partner ? "Enviar para conferência" : "Entregar ao cliente")}
      </Button>
      <input ref={inputRef} type="file" multiple accept={DELIVERY_EXTENSIONS} className="sr-only" onChange={(e) => { setFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
    </div>
  );
}
