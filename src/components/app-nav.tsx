"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChevronDown,
  ChevronsUpDown,
  Box,
  Building2,
  Layers,
  LogOut,
  Menu,
  PanelLeft,
  Plus,
  Video,
  Search,
  Sparkles,
  GraduationCap,
  ChevronLeft,
  CircleHelp,
  Inbox,
  ImageIcon,
  UserRound,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo, BrandMark } from "@/components/brand";
import { ThemeSwitcher } from "@/components/theme";
import { BetaBadge } from "@/components/beta-badge";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HELP_EVENT } from "@/components/help";
import { initials } from "@/lib/format";
import { roles } from "@/lib/labels";
import { logout } from "@/app/login/actions";
import type { SessionUser } from "@/lib/auth";
import type { Recent } from "@/lib/recent";

const ITEMS: { href: string; label: string; icon: React.ElementType; match: (p: string) => boolean; beta?: boolean }[] = [
  { href: "/", label: "Projetos", icon: Building2, match: (p: string) => p === "/" || (p.startsWith("/bens") && !p.includes("/ortofotos/") && !p.includes("/modelos/")) },
  { href: "/capturar", label: "Capturar", icon: Video, match: (p: string) => p.startsWith("/capturar") },
  { href: "/mapas", label: "Mapas de danos", icon: ImageIcon, match: (p: string) => p.startsWith("/mapas") || p.includes("/ortofotos/") },
  { href: "/modelos", label: "Modelo 3D", icon: Box, beta: true, match: (p: string) => p.startsWith("/modelos") || p.includes("/modelos/") },
  { href: "/biblioteca", label: "Danos e preços", icon: Layers, match: (p: string) => p.startsWith("/biblioteca") },
  { href: "/equipe", label: "Equipe", icon: Users, match: (p: string) => p.startsWith("/equipe") },
  { href: "/academy", label: "Academy", icon: GraduationCap, match: (p: string) => p.startsWith("/academy") },
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
          <BrandMark className="h-[21px]" />
          {!collapsed && <BrandLogo className="h-[13px]" />}
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
        {[
          ...ITEMS,
          // pedidos de diagnóstico do site: só para a equipe do ArchRay
          ...(user.platformRole === "operador"
            ? [{ href: "/solicitacoes", label: "Solicitações", icon: Inbox, match: (p: string) => p.startsWith("/solicitacoes"), beta: false }]
            : []),
        ].map(({ href, label, icon: Icon, match, beta }) => {
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
              {!collapsed && (
                <>
                  <span className="flex-1">{label}</span>
                  {beta && <BetaBadge />}
                </>
              )}
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
      data-app-sidebar
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:block",
        collapsed ? "w-[60px]" : "w-60",
      )}
    >
      <NavContent user={user} recent={recent} collapsed={collapsed} onToggle={toggle} />
    </aside>
  );
}

/** Telas de tela cheia: têm barra própria e no celular não usam as barras do app. */
const isImmersive = (p: string) => /\/ortofotos\/(?!nova)[^/]+$|\/comparar$|^\/bens\/[^/]+\/modelos\/[^/]+$|^\/app-captura/.test(p);

/** Título e destino do "voltar" da barra superior, nas telas internas. */
function screenOf(p: string): { title: string; back: string } | null {
  if (p === "/bens/novo") return { title: "Novo projeto", back: "/" };
  if (p === "/academy/glossario") return { title: "Glossário", back: "/academy" };
  if (p.startsWith("/academy/")) return { title: "Aula", back: "/academy" };
  const m = p.match(/^\/bens\/([^/]+)(\/.*)?$/);
  if (!m) return null;
  if (!m[2]) return { title: "Projeto", back: "/" };
  const back = `/bens/${m[1]}`;
  if (m[2].startsWith("/ortofotos/nova")) return { title: "Nova vista", back };
  if (m[2] === "/editar") return { title: "Editar projeto", back };
  if (m[2].startsWith("/capturas")) return { title: "Fotos de campo", back };
  return { title: "Projeto", back };
}

/** Barra superior do celular: marca nas telas principais, voltar e título nas internas. */
export function MobileBar() {
  const pathname = usePathname();
  if (isImmersive(pathname)) return null;
  const screen = screenOf(pathname);
  const iconBtn = "grid size-10 place-items-center rounded-full text-foreground/80 hover:bg-muted";
  return (
    <div className="sticky top-0 z-30 border-b bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden print:hidden">
      <div className="flex h-14 items-center gap-1 px-2">
        {screen ? (
          <>
            <Link href={screen.back} aria-label="Voltar" className={iconBtn}>
              <ChevronLeft className="size-6" />
            </Link>
            <span className="min-w-0 flex-1 truncate text-[17px] font-medium">{screen.title}</span>
          </>
        ) : (
          <Link href="/" aria-label="ArchRay — início" className="flex min-w-0 flex-1 items-center gap-2 px-2">
            <BrandMark className="h-[20px]" />
            <BrandLogo className="h-[12px]" />
          </Link>
        )}
        <Link href="/?buscar=1" aria-label="Buscar" className={iconBtn}>
          <Search className="size-5" />
        </Link>
        <button aria-label="Ajuda" onClick={() => window.dispatchEvent(new Event(HELP_EVENT))} className={iconBtn}>
          <CircleHelp className="size-5" />
        </button>
      </div>
    </div>
  );
}

/** Barra de abas do celular, como nos apps nativos; o resto do menu fica em "Mais". */
export function MobileTabBar({ user, recent }: { user: SessionUser; recent: Recent }) {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  if (isImmersive(pathname)) return null;
  const close = () => setMore(false);
  const tabs = [
    { href: "/", label: "Projetos", icon: Building2, on: pathname === "/" || (pathname.startsWith("/bens") && pathname !== "/bens/novo") },
    { href: "/mapas", label: "Mapas", icon: ImageIcon, on: pathname.startsWith("/mapas") },
    { href: "/academy", label: "Academy", icon: GraduationCap, on: pathname.startsWith("/academy") },
  ];
  const tabClass = "flex min-w-0 flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium";
  const tab = (t: (typeof tabs)[number]) => (
    <Link key={t.href} href={t.href} aria-current={t.on ? "page" : undefined} className={cn(tabClass, t.on ? "text-foreground" : "text-muted-foreground")}>
      <t.icon className={cn("size-[22px]", t.on && "text-brand")} />
      {t.label}
    </Link>
  );
  const extra = [
    { href: "/bens/novo", label: "Novo projeto", icon: Plus },
    { href: "/biblioteca", label: "Danos e preços", icon: Layers },
    { href: "/modelos", label: "Modelo 3D", icon: Box },
    { href: "/equipe", label: "Equipe", icon: Users },
    { href: "/perfil", label: "Meu perfil", icon: UserRound },
    { href: "/index", label: "Novidades", icon: Sparkles },
    ...(user.platformRole === "operador" ? [{ href: "/solicitacoes", label: "Solicitações", icon: Inbox }] : []),
  ];
  return (
    <>
      {/* reserva o espaço da barra no fim da página */}
      <div className="h-[calc(3.75rem+env(safe-area-inset-bottom))] shrink-0 lg:hidden print:hidden" />
      <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden print:hidden">
        <div className="grid h-[3.75rem] grid-cols-5">
          {tabs.slice(0, 2).map(tab)}
          <Link href="/capturar" aria-label="Capturar" className={tabClass}>
            <span className={cn("grid size-11 place-items-center rounded-full bg-foreground text-background shadow-sm", pathname === "/capturar" && "bg-brand")}>
              <Video className="size-6" />
            </span>
          </Link>
          {tab(tabs[2]!)}
          <button onClick={() => setMore(true)} className={cn(tabClass, more ? "text-foreground" : "text-muted-foreground")}>
            <Menu className="size-[22px]" />
            Mais
          </button>
        </div>
      </nav>
      <Sheet open={more} onOpenChange={setMore}>
        <SheetContent side="bottom" className="max-h-[85svh] gap-0 rounded-t-3xl p-0">
          <SheetTitle className="sr-only">Mais opções</SheetTitle>
          <div className="thin-scroll grid gap-5 overflow-y-auto px-4 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-3 pr-8">
              <Avatar className="size-10">
                <AvatarFallback className="bg-primary text-[12px] font-medium text-primary-foreground">{initials(user.name)}</AvatarFallback>
              </Avatar>
              <span className="grid min-w-0 leading-tight">
                <span className="truncate text-[15px] font-medium">{user.name}</span>
                <span className="truncate text-[13px] text-muted-foreground">
                  {user.orgName} · {roles[user.role]}
                </span>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {extra.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={close} className="grid justify-items-center gap-1.5 rounded-2xl bg-muted/70 px-1 py-3 text-center text-[12.5px] leading-tight">
                  <Icon className="size-5 text-foreground/80" />
                  {label}
                </Link>
              ))}
            </div>
            {recent.sites.length > 0 && (
              <div className="grid gap-1">
                <p className="label px-1">Projetos recentes</p>
                {recent.sites.slice(0, 4).map((s) => (
                  <Link key={s.id} href={`/bens/${s.id}`} onClick={close} className="truncate rounded-lg px-1 py-2.5 text-[15px]">
                    {s.name}
                  </Link>
                ))}
              </div>
            )}
            <div className="grid gap-2">
              <p className="label px-1">Aparência</p>
              <ThemeSwitcher />
            </div>
            <form action={logout}>
              <button className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-[15px]">
                <LogOut className="size-4 text-muted-foreground" /> Sair
              </button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
