"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Landmark, Layers, Smartphone, LogOut, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { roles } from "@/lib/labels";
import { logout } from "@/app/login/actions";
import type { SessionUser } from "@/lib/auth";

const ITEMS = [
  { href: "/", label: "Bens", icon: Landmark, match: (p: string) => p === "/" || p.startsWith("/bens") },
  { href: "/biblioteca", label: "Biblioteca de danos", icon: Layers, match: (p: string) => p.startsWith("/biblioteca") },
  { href: "/app-captura", label: "App de captura", icon: Smartphone, match: (p: string) => p.startsWith("/app-captura") },
];

function NavList({ user, onNavigate }: { user: SessionUser; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5 px-5 pt-6 pb-2">
        <BrandMark className="h-6" />
        <span className="font-serif text-[22px] leading-none tracking-tight">Oraclo</span>
      </Link>
      <p className="truncate px-5 pb-6 text-[12px] text-muted-foreground">{user.orgName}</p>

      <nav className="grid gap-0.5 px-3">
        {ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex h-9 items-center gap-3 rounded-md px-3 text-[13.5px] text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                active && "bg-sidebar-accent font-medium text-sidebar-foreground",
              )}
            >
              <Icon className={cn("size-4 opacity-70", active && "text-brand opacity-100")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 p-3 px-5">
        <Avatar className="size-8">
          <AvatarFallback className="bg-secondary text-[11px] font-medium">{initials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="grid min-w-0 flex-1 leading-tight">
          <span className="truncate text-[13px] font-medium">{user.name}</span>
          <span className="truncate text-[11.5px] text-muted-foreground">{roles[user.role]}</span>
        </div>
        <form action={logout}>
          <button
            aria-label="Sair"
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          >
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

export function AppSidebar({ user }: { user: SessionUser }) {
  return (
    <aside className="sticky top-0 hidden h-svh w-60 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
      <NavList user={user} />
    </aside>
  );
}

export function MobileBar({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur lg:hidden">
      <button aria-label="Menu" onClick={() => setOpen(true)} className="-ml-1 grid size-9 place-items-center rounded-md hover:bg-muted">
        <Menu className="size-5" />
      </button>
      <BrandMark className="h-5" />
      <span className="font-serif text-lg leading-none">Oraclo</span>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <NavList user={user} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
