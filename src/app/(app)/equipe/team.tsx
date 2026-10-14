"use client";

import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Copy, KeyRound, Loader2, MailPlus, RotateCw, UserCheck, UserX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SimpleSelect } from "@/components/form";
import { initials } from "@/lib/format";
import { roles } from "@/lib/labels";
import { inviteMember, issueResetLink, resendInvite, revokeInvite, setMemberActive, updateMemberRole } from "./actions";

const roleOptions = Object.entries(roles).map(([value, label]) => ({ value, label }));
type Result = { error?: string; ok?: string; link?: string } | null;

/** Link para copiar (quando o e-mail ainda não está configurado). */
function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-muted/50 p-1.5 pl-3">
      <code className="min-w-0 flex-1 truncate text-[12.5px]">{link}</code>
      <Button
        size="sm"
        variant="secondary"
        onClick={async () => {
          await navigator.clipboard.writeText(link);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? <Check /> : <Copy />} {copied ? "Copiado" : "Copiar"}
      </Button>
    </div>
  );
}

function Feedback({ r }: { r: Result }) {
  if (!r) return null;
  if (r.error) return <p className="text-sm text-destructive">{r.error}</p>;
  return (
    <div className="grid gap-2">
      {r.ok && <p className="text-sm">{r.ok}</p>}
      {r.link && <CopyLink link={r.link} />}
    </div>
  );
}

export function InviteForm() {
  const [state, action, pending] = useActionState(inviteMember, null);
  return (
    <div className="grid gap-3">
      <form action={action} className="flex flex-wrap gap-2">
        <Input name="email" type="email" required placeholder="email@escritorio.com.br" className="min-w-56 flex-1" />
        <SimpleSelect name="role" options={roleOptions} defaultValue="tecnico" className="w-48" />
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <MailPlus />} Convidar
        </Button>
      </form>
      <Feedback r={state} />
    </div>
  );
}

type Member = { id: string; name: string; email: string; role: keyof typeof roles; active: boolean; professionalId: string | null };

export function MemberRow({ member, isMe, canManage }: { member: Member; isMe: boolean; canManage: boolean }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<Result>(null);
  const run = (fn: () => Promise<Result>) =>
    start(async () => {
      const r = await fn();
      if (r?.error) toast.error(r.error);
      else if (r?.link) setResult(r);
      else if (r?.ok) toast.success(r.ok);
    });
  return (
    <li className="grid gap-2 px-5 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary text-[11px] text-primary-foreground">{initials(member.name)}</AvatarFallback>
        </Avatar>
        <div className="grid min-w-0 flex-1 leading-tight">
          <span className="flex items-center gap-2 truncate text-[14.5px]">
            {member.name}
            {isMe && <span className="text-[12px] text-muted-foreground">(você)</span>}
            {!member.active && <Badge variant="outline">desativado</Badge>}
          </span>
          <span className="truncate text-[12.5px] text-muted-foreground">
            {member.email}
            {member.professionalId && ` · ${member.professionalId}`}
          </span>
        </div>
        {canManage && !isMe ? (
          <div className="flex flex-wrap items-center gap-1">
            <SimpleSelect
              options={roleOptions}
              value={member.role}
              onValueChange={(v) => run(() => updateMemberRole(member.id, v))}
              className="h-8 w-44"
            />
            <Button size="icon-sm" variant="ghost" title="Gerar link de nova senha" aria-label="Gerar link de nova senha" onClick={() => run(() => issueResetLink(member.id))}>
              <KeyRound />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              title={member.active ? "Desativar acesso" : "Reativar acesso"}
              aria-label={member.active ? "Desativar acesso" : "Reativar acesso"}
              onClick={() => run(() => setMemberActive(member.id, !member.active))}
            >
              {member.active ? <UserX /> : <UserCheck />}
            </Button>
            {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          </div>
        ) : (
          <Badge variant="secondary">{roles[member.role]}</Badge>
        )}
      </div>
      {result?.link && (
        <div className="grid gap-1.5 sm:pl-12">
          <p className="text-[13px]">{result.ok}</p>
          <CopyLink link={result.link} />
        </div>
      )}
    </li>
  );
}

export function InviteRow({ invite }: { invite: { id: string; email: string; role: keyof typeof roles; daysLeft: number } }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<Result>(null);
  const days = invite.daysLeft;
  return (
    <li className="grid gap-2 px-5 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid min-w-0 flex-1 leading-tight">
          <span className="truncate text-[14.5px]">{invite.email}</span>
          <span className="text-[12.5px] text-muted-foreground">
            {roles[invite.role]} · expira em {days} dia{days === 1 ? "" : "s"}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await resendInvite(invite.id);
              if (r?.error) toast.error(r.error);
              else if (r?.link) setResult(r);
              else toast.success(r?.ok ?? "Reenviado.");
            })
          }
        >
          <RotateCw /> Reenviar
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="Cancelar convite" disabled={pending} onClick={() => start(() => revokeInvite(invite.id))}>
          <X />
        </Button>
      </div>
      {result?.link && <CopyLink link={result.link} />}
    </li>
  );
}
