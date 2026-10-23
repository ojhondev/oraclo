import { cn } from "@/lib/utils";

/** Etiqueta de recurso em teste (módulo 3D). */
export function BetaBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-[18px] items-center rounded-full border border-current/30 px-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase",
        className,
      )}
    >
      Beta
    </span>
  );
}
