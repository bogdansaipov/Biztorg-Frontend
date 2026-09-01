"use client"

import * as React from "react"
import {
  ArrowUpCircleIcon,
  BarChartIcon,
  FlagIcon,
  LayoutDashboardIcon,
  PackageIcon,
  StoreIcon,
  UsersIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { useAuthStore } from "@/stores/auth.store"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"

// Real Biztorg admin sections, matching the backend build order
// (products/reports/shops/analytics/users) instead of the block's
// placeholder demo content. navClouds/navSecondary/documents from the
// original block are dropped entirely — none of them had anything real
// behind them (Settings/Get Help/Search/Data Library/Word Assistant were
// all "#" links to nowhere).
const data = {
  navMain: [
    {
      title: "Дашборд",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Объявления",
      url: "/products",
      icon: PackageIcon,
    },
    {
      title: "Жалобы",
      url: "/reports",
      icon: FlagIcon,
    },
    {
      title: "Магазины",
      url: "/shops",
      icon: StoreIcon,
    },
    {
      title: "Аналитика",
      url: "/analytics",
      icon: BarChartIcon,
    },
    {
      title: "Пользователи",
      url: "/users",
      icon: UsersIcon,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Real logged-in admin instead of the block's hardcoded "shadcn /
  // m@example.com". No avatar field exists on our user model at all, so
  // that's passed empty — NavUser's Avatar should fall back to initials
  // (standard shadcn Avatar/AvatarFallback pattern), though I haven't
  // seen nav-user.tsx itself to confirm that's how it's implemented here.
  const authUser = useAuthStore((s) => s.user);
  const user = {
    name: authUser?.name ?? "Админ",
    email: authUser?.email ?? authUser?.phone ?? "",
    avatar: "",
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Biztorg Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}