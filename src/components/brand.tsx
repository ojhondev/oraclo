import { cn } from "@/lib/utils";

/**
 * Símbolo do ArchRay: o "x" terracota com as letras a·r·a·y (public/brand/icone.png).
 * É o mesmo nos temas claro e escuro; a versão preta (icone-preta) fica para impressão.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/icone.png" alt="" aria-hidden width={374} height={458} className={cn("h-7 w-auto shrink-0", className)} />
  );
}

/** Logotipo "ARCHRAY" (preto; invertido no tema escuro). */
export function BrandLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/logo.png" alt="ArchRay" width={295} height={45} className={cn("h-4 w-auto dark:invert", className)} />
  );
}
