import Link from "next/link";
import { BrandLogo, BrandMark } from "@/components/brand";
import { getUser } from "@/lib/auth";

export const metadata = { title: { default: "Index", template: "%s · ArchRay" } };

/** Index: área pública de publicações sobre o ArchRay. */
export default async function IndexLayout({ children }: LayoutProps<"/">) {
  const user = await getUser();
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="flex h-14 items-center gap-6 px-4 sm:px-8">
          <Link href={user ? "/" : "/login"} aria-label="ArchRay — início" className="flex items-center gap-2">
            <BrandMark className="h-[18px]" />
            <BrandLogo className="h-[17px]" />
          </Link>
          <nav className="flex items-center gap-5 text-[14px]">
            <Link href="/index" className="font-medium">
              Index
            </Link>
          </nav>
          <Link
            href={user ? "/" : "/login"}
            className="ml-auto inline-flex h-9 items-center rounded-full bg-foreground px-4 text-[14px] font-medium text-background hover:opacity-85"
          >
            {user ? "Abrir o ArchRay" : "Entrar"}
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t px-4 py-8 text-[13px] text-muted-foreground sm:px-8">ArchRay · mapa de danos com IA</footer>
    </div>
  );
}
