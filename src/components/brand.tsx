import { cn } from "@/lib/utils";

/**
 * Símbolo do ArchRay: o polvo lilás (public/brand/icone.png; versão clara em icone-branco.png).
 * É o mesmo nos temas claro e escuro.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/icone.png" alt="" aria-hidden width={386} height={364} className={cn("h-7 w-auto shrink-0", className)} />
  );
}

/** Logotipo "ARCHRAY" (preto; invertido no tema escuro). */
export function BrandLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/logo.png" alt="ArchRay" width={295} height={45} className={cn("h-4 w-auto dark:invert", className)} />
  );
}
