"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Flag, Store, Users, ChartBar } from "lucide-react";
import { cn } from "@/lib/utils";

// hrefs are the paths as the BROWSER sees them on admin.biztorg.uz — the
// /admin prefix only exists internally (middleware rewrite target) and is
// invisible to usePathname()/Link here.
const NAV_ITEMS = [
  { href: "/", label: "Дашборд", icon: LayoutDashboard },
  { href: "/products", label: "Объявления", icon: Package },
  { href: "/reports", label: "Жалобы", icon: Flag },
  { href: "/shops", label: "Магазины", icon: Store },
  { href: "/analytics", label: "Аналитика", icon: ChartBar },
  { href: "/users", label: "Пользователи", icon: Users },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r bg-card min-h-screen p-4 hidden lg:flex lg:flex-col gap-1">
      <div className="px-2 py-3 mb-2">
        <span className="text-lg font-semibold">Biztorg Admin</span>
      </div>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </aside>
  );
}