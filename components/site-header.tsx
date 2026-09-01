"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

// Titles keyed by the browser-visible path (no /admin prefix — that only
// exists as the middleware rewrite target, invisible to usePathname()).
const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Дашборд",
  "/products": "Объявления",
  "/reports": "Жалобы",
  "/shops": "Магазины",
  "/analytics": "Аналитика",
  "/users": "Пользователи",
};

function resolveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const matchedPrefix = Object.keys(PAGE_TITLES).find(
    (path) => path !== "/" && pathname.startsWith(path),
  );
  return matchedPrefix ? PAGE_TITLES[matchedPrefix] : "Biztorg Admin";
}

export function SiteHeader() {
  const pathname = usePathname();
  const title = resolveTitle(pathname);

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
      </div>
    </header>
  )
}