import { cn } from "@/lib/utils";

/** Símbolo do ArchRay: o "a" do logotipo (preto; invertido no tema escuro). Usado onde o logotipo não cabe. */
export function BrandMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/mark.png" alt="" aria-hidden width={121} height={120} className={cn("h-6 w-auto dark:invert", className)} />
  );
}

/** Logotipo "archray" (preto; invertido no tema escuro). */
export function BrandLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/logo.png" alt="ArchRay" width={470} height={120} className={cn("h-6 w-auto dark:invert", className)} />
  );
}
