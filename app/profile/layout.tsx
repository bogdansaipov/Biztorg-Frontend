"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ProfileSidebarCard from "@/customComponents/profile/ProfileSidebarCard";

const CARD = "bg-white border border-gray-100 rounded-2xl";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      router.replace("/");
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (!parsed?.id) {
        router.replace("/");
        return;
      }
    } catch {
      router.replace("/");
      return;
    }

    setAuthChecked(true);
    // Re-check whenever the route changes within /profile/* too, in case
    // logout happened in another tab/via the global 401 interceptor while
    // already sitting on a profile page.
  }, [pathname, router]);

  if (!authChecked) {
    return null;
  }

  // Exactly "/profile" (or "/profile/") = the root/menu level. Anything
  // deeper ("/profile/favorites", "/profile/listings", etc.) is a
  // "detail" screen. This one distinction drives all the responsive
  // show/hide behavior below — no route duplication needed.
  const isRoot = pathname === "/profile" || pathname === "/profile/";

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="max-w-[1400px] mx-auto py-6 lg:py-10 px-0 lg:px-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* SIDEBAR — always visible on desktop. On mobile: only visible
              at the root "/profile" menu level; hidden once you've drilled
              into a specific section, since that section now owns the
              whole screen (with its own back button) instead.

              lg:items-start on the row above stops the default flex
              "stretch" behavior that was forcing this column to match the
              taller content column's height. lg:sticky here means it now
              scrolls normally until it reaches lg:top-10, then stays
              pinned in view (rather than being stuck at a fixed height
              matching whatever the content column happens to be). */}
          <div
            className={`
              w-full lg:w-[360px] lg:shrink-0
              lg:sticky lg:top-10
              ${isRoot ? "block" : "hidden lg:block"}
              ${CARD} lg:rounded-2xl rounded-none
            `}
          >
            <ProfileSidebarCard />
          </div>

          {/* CONTENT — always visible on desktop. On mobile: only visible
              once you're on a sub-route; hidden at the root level, where
              the sidebar/menu itself fills the screen instead. */}
          <div
            className={`
              flex-1 min-w-0
              ${isRoot ? "hidden lg:block" : "block"}
              ${CARD} lg:rounded-2xl rounded-none
              p-6 lg:p-8
            `}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}