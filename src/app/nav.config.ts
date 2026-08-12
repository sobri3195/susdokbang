import {
  Brain,
  BarChart3,
  FileText,
  FileWarning,
  FlaskConical,
  GitBranch,
  HeartPulse,
  History,
  LayoutDashboard,
  LineChart,
  Network,
  Plane,
  Settings,
  Presentation,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavRole = "Admin" | "Analis" | "Dokter Penerbangan" | "Pimpinan" | "Viewer";

export type NavItem = {
  label: string;
  path: string;
  icon: LucideIcon;
  roles?: NavRole[];
  badge?: string;
  matchChildren?: boolean;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    label: "Utama",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "Dashboard Pimpinan", path: "/eksekutif", icon: BarChart3, badge: "Exec", roles: ["Admin", "Pimpinan"] },
      { label: "Mode Demo Sidang", path: "/demo-sidang", icon: Presentation, badge: "Demo", roles: ["Admin", "Analis", "Dokter Penerbangan"] },
    ],
  },
  {
    label: "Data Penerbang",
    items: [
      { label: "Penerbang", path: "/penerbang", icon: Users, matchChildren: true, roles: ["Admin", "Dokter Penerbangan", "Analis"] },
      { label: "Medical Check-Up", path: "/data/mcu", icon: HeartPulse, roles: ["Admin", "Dokter Penerbangan"] },
      { label: "Psikotes", path: "/data/psikotes", icon: Brain, roles: ["Admin", "Dokter Penerbangan"] },
      { label: "Jam Terbang", path: "/data/jam-terbang", icon: Plane, roles: ["Admin", "Dokter Penerbangan", "Analis"] },
    ],
  },
  {
    label: "Analitik",
    items: [
      { label: "Survival (Cox)", path: "/analitik/survival", icon: LineChart, badge: "Cox", roles: ["Admin", "Analis", "Dokter Penerbangan"] },
      { label: "Quality Gate", path: "/analitik/quality-gate", icon: FileWarning, badge: "Pre", roles: ["Admin", "Analis"] },
      { label: "Validasi Cox", path: "/analitik/validasi", icon: FlaskConical, badge: "QA", matchChildren: true, roles: ["Admin", "Analis"] },
      { label: "Riwayat Validasi", path: "/analitik/validasi/history", icon: History, roles: ["Admin", "Analis"] },
      { label: "Faktor Kausal", path: "/analitik/kausal", icon: GitBranch, roles: ["Admin", "Analis", "Dokter Penerbangan"] },
    ],
  },
  {
    label: "Manajemen",
    items: [
      { label: "Import Cerdas", path: "/import", icon: Upload, roles: ["Admin", "Analis"] },
      { label: "Riwayat Import", path: "/import/history", icon: History, roles: ["Admin", "Analis"] },
      { label: "Cluster & Jobs", path: "/sistem/terdistribusi", icon: Network, badge: "Live", roles: ["Admin", "Analis"] },
      { label: "Laporan", path: "/laporan", icon: FileText },
      { label: "Pengaturan", path: "/pengaturan", icon: Settings, roles: ["Admin"] },
    ],
  },
];

export const utilityNavItems: NavItem[] = [
  { label: "Style Guide", path: "/style-guide", icon: LayoutDashboard },
];

export function getNavSectionsForRole(role?: string | null): NavSection[] {
  const normalizedRole = (role ?? "Viewer") as NavRole;
  const filtered = navSections.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || item.roles.includes(normalizedRole)),
  }));

  const visible = filtered.filter((section) => section.items.length > 0);
  return visible.length ? visible : navSections;
}

export function getAllNavItems(role?: string | null): NavItem[] {
  return [...getNavSectionsForRole(role).flatMap((section) => section.items), ...utilityNavItems];
}

export function isNavItemActive(item: NavItem, pathname: string) {
  if (pathname === item.path) return true;
  return Boolean(item.matchChildren && pathname.startsWith(`${item.path}/`));
}

export function findActiveNavItem(pathname: string, role?: string | null) {
  return getAllNavItems(role)
    .slice()
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) => isNavItemActive(item, pathname) || pathname === item.path);
}

export function getBreadcrumbs(pathname: string, role?: string | null) {
  const active = findActiveNavItem(pathname, role);
  const section = getNavSectionsForRole(role).find((candidate) =>
    candidate.items.some((item) => item.path === active?.path),
  );
  const crumbs = [{ label: "CSAKT", path: "/dashboard" }];
  if (section && active) {
    crumbs.push({ label: section.label, path: active.path });
    crumbs.push({ label: active.label, path: active.path });
  }

  if (active?.matchChildren && pathname !== active.path) {
    const tail = pathname.split("/").filter(Boolean).at(-1);
    if (tail) crumbs.push({ label: tail, path: pathname });
  }
  return crumbs;
}
