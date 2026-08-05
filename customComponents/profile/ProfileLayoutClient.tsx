"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import ProfileSidebarCard from "@/customComponents/profile/ProfileSidebarCard";
import { useAuthStore } from "@/stores/auth.store";

const CARD = "bg-white border border-gray-100 rounded-2xl";

export default function ProfileLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Locale segment lives at the front of pathname (/ru/...) — derive it
  // here instead of hardcoding "ru" so both the redirect below and the
  // isRoot check keep working once uz ships, with no further changes
  // needed in this file.
  const locale = pathname.split("/")[1] || "ru";

  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    // Don't decide anything until AuthHydrator has actually run — on a
    // fresh page load the store's user is null for one tick regardless
    // of login state, and redirecting on that tick would kick out
    // logged-in users on every refresh.
    if (!hydrated) return;

    if (!user?.id) {
      router.replace(`/${locale}`);
    }
    // Re-check whenever the route changes within /profile/* too, in case
    // logout happened in another tab/via the global 401 interceptor while
    // already sitting on a profile page.
  }, [pathname, router, locale, hydrated, user]);

  if (!hydrated || !user?.id) {
    return null;
  }

  // Exactly "/{locale}/profile" (or with a trailing slash) = the
  // root/menu level. Anything deeper ("/{locale}/profile/favorites",
  // "/{locale}/profile/listings", etc.) is a "detail" screen. This one
  // distinction drives all the responsive show/hide behavior below — no
  // route duplication needed.
  const isRoot = pathname === `/${locale}/profile` || pathname === `/${locale}/profile/`;

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="max-w-[1400px] mx-auto py-6 lg:py-10 px-0 lg:px-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
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