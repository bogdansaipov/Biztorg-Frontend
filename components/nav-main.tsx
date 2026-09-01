"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            // item.url was previously never actually used anywhere in this
            // component — SidebarMenuButton rendered as a plain <button>
            // with no href/onClick, so nothing navigated on click. Now
            // wrapped in next/link via asChild, matching how AppSidebar's
            // own brand link already does it.
            const isActive =
              pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url))

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                  // The base sidebarMenuButtonVariants styles the active
                  // state via data-[active=true]:bg-sidebar-accent — that
                  // same token also drives hover on every item (active or
                  // not), so changing --sidebar-accent itself would turn
                  // hover states black too. Overriding here instead, with
                  // the same data-[active=true]: prefix so it correctly
                  // replaces just that rule (via tailwind-merge matching
                  // the same variant) without touching hover for
                  // non-active items. h-10 (from the default h-8) is the
                  // "a bit bigger, not too much" height bump — applied to
                  // every item, not just the active one.
                  className={
                    isActive
                      ? "h-10 data-[active=true]:bg-foreground data-[active=true]:text-background data-[active=true]:hover:bg-foreground data-[active=true]:hover:text-background"
                      : "h-10"
                  }
                >
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}