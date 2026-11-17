import { cn } from "@/lib/utils";

/**
 * Símbolo do ArchRay: cubos com "arch" (public/brand/icone.png, preto com as letras vazadas).
 * No tema escuro é invertido e vira exatamente a versão branca (icone-branco.png).
 * No site público a inversão é feita por .site-mark em site.css.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/icone.png" alt="" aria-hidden width={277} height={351} className={cn("h-7 w-auto shrink-0 dark:invert", className)} />
  );
}

/** Logotipo "ARCHRAY" (preto; invertido no tema escuro). */
export function BrandLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/logo.png" alt="ArchRay" width={587} height={89} className={cn("h-4 w-auto dark:invert", className)} />
  );
}
