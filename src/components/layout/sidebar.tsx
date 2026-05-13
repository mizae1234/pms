"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { logout } from "@/app/actions/auth";
import {
  LayoutDashboard,
  LayoutGrid,
  BedDouble,
  CalendarDays,
  Users,
  Building2,
  Sparkles,
  Wrench,
  Package,
  FileText,
  Wallet,
  Zap,
  Receipt,
  CreditCard,
  TrendingUp,
  BarChart3,
  PieChart,
  FileBarChart,
  Hotel,
  LogOut,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  apartmentOnly?: boolean;
  hotelOnly?: boolean;
  roles?: string[]; // restrict to these roles
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    title: "MAIN",
    items: [
      { label: "แดชบอร์ด", href: "/dashboard", icon: LayoutDashboard },
      { label: "Front Office", href: "/front-office", icon: LayoutGrid },
    ],
  },
  {
    title: "CORE",
    items: [
      { label: "จัดการห้อง", href: "/rooms", icon: BedDouble },
      { label: "การจอง", href: "/bookings", icon: CalendarDays },
      { label: "ลูกค้า", href: "/customers", icon: Users },
      {
        label: "โครงการ & สาขา",
        href: "/branches",
        icon: Building2,
        roles: ["OWNER"],
      },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { label: "แม่บ้าน", href: "/housekeeping", icon: Sparkles },
      { label: "แจ้งซ่อม", href: "/maintenance", icon: Wrench },
      { label: "สต็อก", href: "/inventory", icon: Package },
      {
        label: "สัญญาเช่า",
        href: "/contracts",
        icon: FileText,
        apartmentOnly: true,
        roles: ["OWNER", "BRANCH_MANAGER", "STAFF"],
      },
      {
        label: "เงินมัดจำ",
        href: "/deposits",
        icon: Wallet,
        apartmentOnly: true,
        roles: ["OWNER", "BRANCH_MANAGER", "STAFF"],
      },
      {
        label: "มิเตอร์น้ำ-ไฟ",
        href: "/utilities",
        icon: Zap,
        apartmentOnly: true,
        roles: ["OWNER", "BRANCH_MANAGER", "STAFF"],
      },
      {
        label: "OTA Integration",
        href: "/ota",
        icon: Hotel,
        hotelOnly: true,
        roles: ["OWNER", "BRANCH_MANAGER"],
      },
    ],
  },
  {
    title: "FINANCE",
    items: [
      { label: "ใบแจ้งหนี้", href: "/invoices", icon: Receipt },
      { label: "การชำระเงิน", href: "/payments", icon: CreditCard },
      {
        label: "ราคาห้อง",
        href: "/pricing",
        icon: TrendingUp,
        roles: ["OWNER", "BRANCH_MANAGER"],
      },
    ],
  },
  {
    title: "REPORTS",
    items: [
      {
        label: "รายงานและสถิติ",
        href: "/reports",
        icon: BarChart3,
        roles: ["OWNER", "BRANCH_MANAGER"],
      },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      {
        label: "ตั้งค่า",
        href: "/settings",
        icon: Wrench,
        roles: ["OWNER", "BRANCH_MANAGER"],
      },
    ],
  },
];

const roleLabels: Record<string, string> = {
  OWNER: "เจ้าของระบบ",
  BRANCH_MANAGER: "ผู้จัดการสาขา",
  STAFF: "พนักงาน",
  HOUSEKEEPER: "แม่บ้าน",
};

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-[260px] flex-col border-r border-sidebar-border bg-sidebar-bg">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-text-primary tracking-tight">PMS</span>
          <span className="text-[11px] text-text-muted leading-tight">Property Management</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navigation.map((group) => {
          // Filter items by user role
          const visibleItems = group.items.filter(
            (item) => !item.roles || item.roles.includes(user.role)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="mb-5">
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-group-text">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
                          isActive
                            ? "bg-sidebar-active-bg text-sidebar-active-text shadow-sm"
                            : "text-sidebar-text hover:bg-sidebar-hover-bg hover:text-text-primary"
                        )}
                      >
                        <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-white" : "text-text-muted")} />
                        <span>{item.label}</span>
                        {item.apartmentOnly && (
                          <span className="ml-auto rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600">
                            APT
                          </span>
                        )}
                        {item.hotelOnly && (
                          <span className="ml-auto rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600">
                            HTL
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Footer — User Info + Logout */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
            {getInitials(user.name)}
          </div>
          <div className="flex flex-1 flex-col min-w-0">
            <span className="text-[12px] font-semibold text-text-primary truncate">
              {user.name}
            </span>
            <span className="text-[11px] text-text-muted">
              {roleLabels[user.role] || user.role}
            </span>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md p-1.5 text-text-muted hover:bg-red-100 hover:text-red-600 transition-colors"
              title="ออกจากระบบ"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
