"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink, Loader2, MoreHorizontal, Pencil, SquarePen, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteSite, duplicateSite, renameSite } from "@/app/(app)/bens/actions";
import type { Role } from "@/lib/db/schema";

const LONG_PRESS_MS = 450;

/**
 * Projeto na barra lateral. Segurar o clique (ou o dedo), clicar com o botão direito ou tocar nos
 * três pontos abre as ações: abrir, renomear, duplicar, editar a ficha e excluir.
 */
export function ProjectItem({
  site,
  role,
  active,
  onNavigate,
  className,
}: {
  site: { id: string; name: string };
  role: Role;
  active: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState(site.name);
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressed = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const canEdit = role === "admin" || role === "tecnico";
  const canDelete = role === "admin";

  useEffect(() => {
    if (renaming) input.current?.select();
  }, [renaming]);

  const cancelPress = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const startPress = () => {
    pressed.current = false;
    cancelPress();
    timer.current = setTimeout(() => {
      pressed.current = true;
      setOpen(true);
      navigator.vibrate?.(10);
    }, LONG_PRESS_MS);
  };

  const saveName = () => {
    const clean = name.trim();
    setRenaming(false);
    if (!clean || clean === site.name) return setName(site.name);
    start(async () => {
      const r = await renameSite(site.id, clean);
      if (r.error) {
        toast.error(r.error);
        setName(site.name);
      } else router.refresh();
    });
  };

  const duplicate = () =>
    start(async () => {
      const r = await duplicateSite(site.id);
      if (r.error) return void toast.error(r.error);
      toast.success("Projeto duplicado (ficha e áreas).");
      onNavigate?.();
      router.push(`/bens/${r.id}`);
    });

  const remove = () =>
    start(async () => {
      try {
        const r = await deleteSite(site.id);
        if (r?.error) toast.error(r.error);
      } catch (e) {
        // a ação redireciona para a lista de projetos ao terminar
        if ((e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e;
        toast.error("Não foi possível excluir o projeto.");
      }
      setConfirmDelete(false);
    });

  const item = "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[14px] hover:bg-muted disabled:opacity-40";

  if (renaming) {
    return (
      <input
        ref={input}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={saveName}
        onKeyDown={(e) => {
          if (e.key === "Enter") saveName();
          if (e.key === "Escape") {
            setName(site.name);
            setRenaming(false);
          }
        }}
        aria-label="Novo nome do projeto"
        className="h-8 w-full rounded-md border border-ring bg-background px-2 text-[14px] outline-none"
      />
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className={cn("group/item relative flex min-w-0 items-center rounded-md", (active || open) && "bg-sidebar-accent", className)}>
          <Link
            href={`/bens/${site.id}`}
            onClick={(e) => {
              // depois de segurar, soltar não navega
              if (pressed.current) {
                e.preventDefault();
                pressed.current = false;
                return;
              }
              onNavigate?.();
            }}
            onPointerDown={startPress}
            onPointerUp={cancelPress}
            onPointerLeave={cancelPress}
            onPointerCancel={cancelPress}
            onContextMenu={(e) => {
              e.preventDefault();
              cancelPress();
              setOpen(true);
            }}
            draggable={false}
            className={cn(
              "min-w-0 flex-1 touch-manipulation truncate rounded-md py-1.5 pr-8 pl-2 text-[14px] text-sidebar-foreground/80 select-none hover:bg-sidebar-accent hover:text-sidebar-foreground [-webkit-touch-callout:none]",
              active && "text-sidebar-foreground",
            )}
          >
            {pending ? <Loader2 className="mr-1.5 inline size-3.5 animate-spin" /> : null}
            {pending ? name : site.name}
          </Link>
          <button
            type="button"
            aria-label={`Ações de ${site.name}`}
            onClick={() => setOpen((o) => !o)}
            className={cn(
              "absolute right-1 grid size-6 place-items-center rounded text-sidebar-foreground/60 hover:bg-background/70 hover:text-sidebar-foreground",
              open ? "opacity-100" : "opacity-0 group-hover/item:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-60",
            )}
          >
            <MoreHorizontal className="size-4" />
          </button>
        </div>
      </PopoverAnchor>
      <PopoverContent side="right" align="start" sideOffset={6} className="w-56 rounded-xl p-1.5">
        <p className="truncate px-2 pt-1 pb-1.5 text-[12px] text-muted-foreground">{site.name}</p>
        <Link href={`/bens/${site.id}`} onClick={() => (setOpen(false), onNavigate?.())} className={item}>
          <ExternalLink className="size-4 text-muted-foreground" /> Abrir
        </Link>
        <button className={item} disabled={!canEdit} onClick={() => (setOpen(false), setName(site.name), setRenaming(true))}>
          <Pencil className="size-4 text-muted-foreground" /> Renomear
        </button>
        <button className={item} disabled={!canEdit || pending} onClick={() => (setOpen(false), duplicate())}>
          <Copy className="size-4 text-muted-foreground" /> Duplicar
        </button>
        <Link href={`/bens/${site.id}/editar`} onClick={() => (setOpen(false), onNavigate?.())} className={cn(item, !canEdit && "pointer-events-none opacity-40")}>
          <SquarePen className="size-4 text-muted-foreground" /> Editar ficha
        </Link>
        <div className="mx-1 my-1 border-t" />
        <button className={cn(item, "text-destructive")} disabled={!canDelete} onClick={() => (setOpen(false), setConfirmDelete(true))}>
          <Trash2 className="size-4" /> Excluir
        </button>
        {!canDelete && <p className="px-2 pb-1 text-[11.5px] text-muted-foreground">Só administradores excluem projetos.</p>}
      </PopoverContent>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir “{site.name}”?</DialogTitle>
            <DialogDescription>
              Apaga o projeto com todas as vistorias, fotos, modelos 3D, mapas de danos e laudos. Não dá para desfazer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={remove} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Trash2 />} Excluir projeto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Popover>
  );
}
