"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChevronDown,
  ChevronsUpDown,
  Building2,
  Layers,
  LogOut,
  Menu,
  PanelLeft,
  Plus,
  Search,
  Sparkles,
  ImageIcon,
  UserRound,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo, BrandMark } from "@/components/brand";
import { ThemeSwitcher } from "@/components/theme";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { initials } from "@/lib/format";
import { roles } from "@/lib/labels";
import { logout } from "@/app/login/actions";
import type { SessionUser } from "@/lib/auth";
import type { Recent } from "@/lib/recent";

const ITEMS = [
  { href: "/", label: "Projetos", icon: Building2, match: (p: string) => p === "/" || (p.startsWith("/bens") && !p.includes("/ortofotos/")) },
  { href: "/mapas", label: "Mapas de danos", icon: ImageIcon, match: (p: string) => p.startsWith("/mapas") || p.includes("/ortofotos/") },
  { href: "/biblioteca", label: "Danos e preços", icon: Layers, match: (p: string) => p.startsWith("/biblioteca") },
  { href: "/equipe", label: "Equipe", icon: Users, match: (p: string) => p.startsWith("/equipe") },
  { href: "/index", label: "Novidades", icon: Sparkles, match: (p: string) => p.startsWith("/index") },
];

import { COLLAPSE_COOKIE } from "@/lib/ui-prefs";

function IconButton({ label, children, ...props }: { label: string } & React.ComponentProps<"button">) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="grid size-8 place-items-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          {...props}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

function Group({ title, empty, children, collapsed }: { title: string; empty: string; children: React.ReactNode[]; collapsed: boolean }) {
  const [open, setOpen] = useState(true);
  if (collapsed) return null;
  return (
    <div className="mt-6 px-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-md px-2 py-1 text-[14px] text-sidebar-foreground/60 hover:text-sidebar-foreground"
      >
        {title}
        <ChevronDown className={cn("size-4 transition-transform", !open && "-rotate-90")} />
      </button>
      {open && (
        <div className="mt-1 grid gap-0.5">
          {children.length ? children : <p className="px-2 py-1 text-[13.5px] text-sidebar-foreground/45">{empty}</p>}
        </div>
      )}
    </div>
  );
}

function AccountMenu({ user, collapsed, onNavigate }: { user: SessionUser; collapsed: boolean; onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const go = () => {
    setOpen(false);
    onNavigate?.();
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-sidebar-accent",
            open && "bg-sidebar-accent",
            collapsed && "justify-center",
          )}
        >
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary text-[10.5px] font-medium text-primary-foreground">{initials(user.name)}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <span className="grid min-w-0 flex-1 leading-tight">
                <span className="truncate text-[14px]">{user.name}</span>
                <span className="truncate text-[12px] text-sidebar-foreground/55">{user.orgName}</span>
              </span>
              <ChevronsUpDown className="size-4 text-sidebar-foreground/50" />
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" sideOffset={8} className="w-[268px] rounded-xl p-1.5 shadow-lg">
        <div className="flex items-center gap-2.5 px-2.5 py-2">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary text-[11px] font-medium text-primary-foreground">{initials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="grid min-w-0 leading-tight">
            <span className="truncate text-[14px] font-medium">{user.name}</span>
            <span className="truncate text-[12.5px] text-muted-foreground">{user.email}</span>
          </span>
        </div>
        <div className="mx-1 my-1 border-t" />
        <div className="px-2.5 py-1.5 text-[12.5px] text-muted-foreground">
          {user.orgName} · {roles[user.role]}
        </div>
        <div className="mx-1 my-1 border-t" />
        <div className="px-2.5 pt-1.5 pb-2">
          <p className="mb-1.5 text-[12.5px] text-muted-foreground">Aparência</p>
          <ThemeSwitcher />
        </div>
        <div className="mx-1 my-1 border-t" />
        <MenuLink href="/perfil" icon={UserRound} onClick={go}>Meu perfil</MenuLink>
        <MenuLink href="/equipe" icon={Users} onClick={go}>Equipe</MenuLink>
        <MenuLink href="/biblioteca" icon={Layers} onClick={go}>Biblioteca de danos</MenuLink>
        <div className="mx-1 my-1 border-t" />
        <form action={logout}>
          <button className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14px] hover:bg-muted">
            <LogOut className="size-4 text-muted-foreground" /> Sair
          </button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function MenuLink({ href, icon: Icon, children, onClick }: { href: string; icon: React.ElementType; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14px] hover:bg-muted">
      <Icon className="size-4 text-muted-foreground" /> {children}
    </Link>
  );
}

function NavContent({
  user,
  recent,
  collapsed,
  onToggle,
  onNavigate,
}: {
  user: SessionUser;
  recent: Recent;
  collapsed: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex items-center px-3 pt-3.5 pb-4", collapsed ? "flex-col gap-2" : "justify-between")}>
        <Link
          href="/"
          onClick={onNavigate}
          aria-label="ArchRay — início"
          className={cn("flex h-9 items-center rounded-lg hover:bg-sidebar-accent", collapsed ? "w-9 justify-center" : "gap-2 px-2")}
        >
          <BrandMark className="h-[18px]" />
          {!collapsed && <BrandLogo className="h-[17px]" />}
        </Link>
        <div className={cn("flex items-center gap-0.5", collapsed && "flex-col")}>
          <Link href="/?buscar=1" onClick={onNavigate} aria-label="Buscar" className="grid size-8 place-items-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground">
            <Search className="size-[18px]" />
          </Link>
          {onToggle && (
            <IconButton label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"} onClick={onToggle}>
              <PanelLeft className="size-[18px]" />
            </IconButton>
          )}
        </div>
      </div>

      <nav className="grid gap-0.5 px-3">
        <Link
          href="/bens/novo"
          onClick={onNavigate}
          data-tour="novo"
          className={cn(
            "flex h-10 items-center gap-3 rounded-lg px-2.5 text-[15px] hover:bg-sidebar-accent",
            collapsed && "justify-center px-0",
          )}
          title="Novo projeto"
        >
          <Plus className="size-[18px]" />
          {!collapsed && "Novo"}
        </Link>
        {ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              title={label}
              data-tour={href === "/" ? "nav-bens" : `nav-${href.slice(1)}`}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-2.5 text-[15px] transition-colors hover:bg-sidebar-accent",
                active && "bg-sidebar-accent",
                collapsed && "justify-center px-0",
              )}
            >
              <Icon className={cn("size-[18px]", active ? "text-brand" : "text-sidebar-foreground/80")} />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto pb-4">
        <Group title="Projetos recentes" empty="Nenhum projeto" collapsed={collapsed}>
          {recent.sites.map((s) => (
            <Link
              key={s.id}
              href={`/bens/${s.id}`}
              onClick={onNavigate}
              className={cn(
                "truncate rounded-md px-2 py-1.5 text-[14px] text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                pathname === `/bens/${s.id}` && "bg-sidebar-accent text-sidebar-foreground",
              )}
            >
              {s.name}
            </Link>
          ))}
        </Group>
      </div>

      <div className="p-2">
        <AccountMenu user={user} collapsed={collapsed} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

export function AppSidebar({ user, recent, initialCollapsed }: { user: SessionUser; recent: Recent; initialCollapsed: boolean }) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const toggle = () =>
    setCollapsed((c) => {
      // cookie lido no servidor para a barra já renderizar no estado certo
      document.cookie = `${COLLAPSE_COOKIE}=${c ? "0" : "1"}; path=/; max-age=31536000; samesite=lax`;
      return !c;
    });
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:block",
        collapsed ? "w-[60px]" : "w-60",
      )}
    >
      <NavContent user={user} recent={recent} collapsed={collapsed} onToggle={toggle} />
    </aside>
  );
}

export function MobileBar({ user, recent }: { user: SessionUser; recent: Recent }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur lg:hidden">
      <button aria-label="Menu" onClick={() => setOpen(true)} className="-ml-1 grid size-9 place-items-center rounded-lg hover:bg-muted">
        <Menu className="size-5" />
      </button>
      <BrandMark className="h-4" />
      <BrandLogo className="h-[17px]" />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <NavContent user={user} recent={recent} collapsed={false} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
