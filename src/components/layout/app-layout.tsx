import { Bell, ChevronLeft, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, Shield, Sun } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getBreadcrumbs, getNavSectionsForRole, isNavItemActive, utilityNavItems, type NavItem } from "@/app/nav.config";
import { CommandPalette } from "@/components/layout/command-palette";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useDataStore } from "@/store/data-store";
import { useUiStore } from "@/store/ui-store";

const roleOptions = ["Admin", "Dokter Penerbangan", "Analis", "Pimpinan"] as const;

function Breadcrumbs() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const crumbs = getBreadcrumbs(location.pathname, user?.role);

  return (
    <nav aria-label="Breadcrumb" className="hidden items-center text-sm text-muted-foreground md:flex">
      {crumbs.map((crumb, index) => (
        <span key={`${crumb.path}-${index}`} className="flex items-center gap-2">
          {index > 0 ? <ChevronLeft className="size-3 rotate-180" aria-hidden="true" /> : null}
          <span className={cn(index === crumbs.length - 1 && "font-semibold text-foreground")}>{crumb.label}</span>
        </span>
      ))}
    </nav>
  );
}

function SidebarBrand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className={cn("flex h-16 items-center gap-3 px-4", collapsed && "justify-center px-0")}>
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Shield className="size-6" aria-hidden="true" />
      </div>
      {!collapsed ? (
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold">CSAKT</p>
          <p className="truncate text-xs text-muted-foreground">LAKESPRA Analytics</p>
        </div>
      ) : null}
    </div>
  );
}

function NavItemLink({ item, collapsed = false, onNavigate }: { item: NavItem; collapsed?: boolean; onNavigate?: () => void }) {
  const location = useLocation();
  const active = isNavItemActive(item, location.pathname);
  const content = (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground",
        active && "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      <item.icon className="size-4 shrink-0" aria-hidden="true" />
      {!collapsed ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
      {!collapsed && item.badge ? (
        <Badge variant={active ? "secondary" : "outline"} className="px-2 py-0 text-[10px]">
          {item.badge}
        </Badge>
      ) : null}
    </NavLink>
  );

  if (!collapsed) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function SidebarNav({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const user = useAuthStore((state) => state.user);
  const sections = getNavSectionsForRole(user?.role);

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navigasi utama">
      {sections.map((section) => (
        <div key={section.label} className="mb-5 last:mb-2">
          {!collapsed ? (
            <p className="mb-2 px-3 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
              {section.label}
            </p>
          ) : (
            <Separator className="mb-2" />
          )}
          <div className="space-y-1">
            {section.items.map((item) => (
              <NavItemLink key={item.path} item={item} collapsed={collapsed} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      ))}
      <div className="mt-3 border-t pt-3">
        {utilityNavItems.map((item) => (
          <NavItemLink key={item.path} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </div>
    </nav>
  );
}

function SidebarFooter({ collapsed = false }: { collapsed?: boolean }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const setRole = useAuthStore((state) => state.setRole);
  const darkMode = useUiStore((state) => state.darkMode);
  const setDarkMode = useUiStore((state) => state.setDarkMode);
  const initials = user?.name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() ?? "CS";

  function handleLogout() {
    logout();
    toast.success("Sesi ditutup");
    navigate("/login");
  }

  return (
    <div className="border-t p-3">
      <div className={cn("mb-3 flex items-center gap-3 rounded-xl border bg-background p-2", collapsed && "justify-center border-0 bg-transparent p-0")}>
        <Avatar className="size-9">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold">{user?.name ?? "Operator CSAKT"}</p>
            <p className="truncate text-[11px] text-muted-foreground">{user?.role ?? "Viewer"} - {user?.unit ?? "LAKESPRA"}</p>
          </div>
        ) : null}
      </div>
      <div className={cn("grid gap-2", collapsed ? "grid-cols-1" : "grid-cols-2")}>
        <Button variant="outline" size={collapsed ? "icon" : "sm"} onClick={() => setDarkMode(!darkMode)} aria-label="Ganti tema">
          {darkMode ? <Sun /> : <Moon />}
          {!collapsed ? <span>Tema</span> : null}
        </Button>
        <Button variant="outline" size={collapsed ? "icon" : "sm"} onClick={handleLogout} aria-label="Logout">
          <LogOut />
          {!collapsed ? <span>Logout</span> : null}
        </Button>
      </div>
      {!collapsed ? (
        <div className="mt-2">
          <Select value={user?.role ?? "Admin"} onValueChange={(value) => setRole(value as (typeof roleOptions)[number])}>
            <SelectTrigger className="h-9 text-xs" aria-label="Pilih role demo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((role) => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </div>
  );
}

function RiskNotificationCenter() {
  const navigate = useNavigate();
  const pilots = useDataStore((state) => state.penerbang);
  const mcuRows = useDataStore((state) => state.mcu);
  const psikoRows = useDataStore((state) => state.psikotes);
  const jamRows = useDataStore((state) => state.jamTerbang);
  const alerts = buildRiskAlerts(pilots, mcuRows, psikoRows, jamRows).slice(0, 8);
  const high = alerts.filter((alert) => alert.level === "high").length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Notifikasi risiko" className="relative">
          <Bell />
          {alerts.length ? (
            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {alerts.length}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-96">
        <div className="flex items-center justify-between gap-3 px-2 py-2 text-sm font-bold">
          Notifikasi Risiko
          <Badge variant={high ? "danger" : "warning"}>{high} prioritas</Badge>
        </div>
        <div className="-mx-1 my-1 h-px bg-border" />
        {alerts.map((alert) => (
          <DropdownMenuItem
            key={alert.id}
            className="cursor-pointer items-start gap-3 py-3"
            onSelect={() => navigate(alert.path)}
          >
            <span className={cn("mt-1 size-2 shrink-0 rounded-full", alert.level === "high" ? "bg-destructive" : "bg-warning")} />
            <span>
              <span className="block text-sm font-semibold">{alert.title}</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">{alert.detail}</span>
            </span>
          </DropdownMenuItem>
        ))}
        {!alerts.length ? <DropdownMenuItem>Tidak ada alert aktif.</DropdownMenuItem> : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function buildRiskAlerts(
  pilots: ReturnType<typeof useDataStore.getState>["penerbang"],
  mcuRows: ReturnType<typeof useDataStore.getState>["mcu"],
  psikoRows: ReturnType<typeof useDataStore.getState>["psikotes"],
  jamRows: ReturnType<typeof useDataStore.getState>["jamTerbang"],
) {
  const alerts: Array<{ id: string; level: "high" | "medium"; title: string; detail: string; path: string }> = [];
  pilots.forEach((pilot) => {
    const mcu = [...mcuRows].filter((row) => row.penerbangId === pilot.id).sort((a, b) => b.tanggal.localeCompare(a.tanggal))[0];
    const psiko = [...psikoRows].filter((row) => row.penerbangId === pilot.id).sort((a, b) => b.tanggal.localeCompare(a.tanggal))[0];
    const jamMalam = jamRows.find((row) => row.penerbangId === pilot.id && row.malam && row.durasiJam >= 5);
    if (pilot.riskScore >= 55) {
      alerts.push({ id: `${pilot.id}-risk`, level: "high", title: `${pilot.nama} risiko tinggi`, detail: `Skor risiko ${pilot.riskScore}/100; status ${pilot.status}.`, path: `/penerbang/${pilot.id}` });
    }
    if (mcu && (mcu.status !== "Laik" || mcu.bmi >= 30 || mcu.kolesterol >= 240)) {
      alerts.push({ id: `${pilot.id}-mcu`, level: pilot.riskScore >= 55 ? "high" : "medium", title: `MCU perlu review - ${pilot.nrp}`, detail: `BMI ${mcu.bmi}, kolesterol ${mcu.kolesterol}, status ${mcu.status}.`, path: `/penerbang/${pilot.id}` });
    }
    if (psiko && psiko.stressIndex >= 60) {
      alerts.push({ id: `${pilot.id}-psiko`, level: "medium", title: `Psikotes warning - ${pilot.nrp}`, detail: `Stress index ${psiko.stressIndex}; ${psiko.rekomendasi}`, path: `/penerbang/${pilot.id}` });
    }
    if (jamMalam) {
      alerts.push({ id: `${pilot.id}-night`, level: "medium", title: `Jam malam tinggi - ${pilot.nrp}`, detail: `${jamMalam.durasiJam} jam misi malam pada ${jamMalam.tanggal}.`, path: `/penerbang/${pilot.id}` });
    }
  });
  return alerts.sort((a, b) => (a.level === b.level ? 0 : a.level === "high" ? -1 : 1));
}

function DesktopSidebar() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const setCollapsed = useUiStore((state) => state.setSidebarCollapsed);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden border-r bg-card/95 backdrop-blur transition-[width] duration-200 lg:flex lg:flex-col",
        collapsed ? "w-20" : "w-72",
      )}
    >
      <SidebarBrand collapsed={collapsed} />
      <Separator />
      <SidebarNav collapsed={collapsed} />
      <div className="px-3 pb-3">
        <Button
          variant="ghost"
          className={cn("w-full", collapsed ? "justify-center px-0" : "justify-start")}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Perluas sidebar" : "Kolaps sidebar"}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          {!collapsed ? "Kolaps sidebar" : null}
        </Button>
      </div>
      <SidebarFooter collapsed={collapsed} />
    </aside>
  );
}

function MobileSidebar() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Buka menu navigasi">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Menu Navigasi CSAKT</SheetTitle>
        </SheetHeader>
        <SidebarBrand />
        <Separator />
        <SidebarNav onNavigate={() => setOpen(false)} />
        <SidebarFooter />
      </SheetContent>
    </Sheet>
  );
}

export function AppLayout() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#konten-utama"
        className="fixed left-4 top-3 z-50 -translate-y-20 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-lg transition-transform focus:translate-y-0"
      >
        Lewati ke konten utama
      </a>
      <DesktopSidebar />

      <div className={cn("min-h-screen transition-[padding] duration-200 lg:pl-72", collapsed && "lg:pl-20")}>
        <header className="sticky top-0 z-20 border-b bg-background/86 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <MobileSidebar />
              <div className="min-w-0">
                <Breadcrumbs />
                <p className="truncate text-xs font-semibold uppercase tracking-wide text-accent md:hidden">CSAKT</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RiskNotificationCenter />
              <CommandPalette />
            </div>
          </div>
        </header>
        <main id="konten-utama" tabIndex={-1} className="px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1440px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
