"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Megaphone, MessageSquare, Building2, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/auth.store";

export default function ProfilePage() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "ru";
  const t = useTranslations("profileHome");
  const tFav = useTranslations("favorites");
  const tSidebar = useTranslations("profileSidebar");

  const name = useAuthStore((s) => s.user?.name);

  const QUICK_LINKS = [
    { href: "/profile/favorites", label: tFav("title"), desc: t("favoritesDesc"), icon: Heart },
    { href: "/profile/listings", label: tSidebar("myListings"), desc: t("listingsDesc"), icon: Megaphone },
    { href: "/profile/messages", label: tSidebar("messages"), desc: t("messagesDesc"), icon: MessageSquare },
    { href: "/profile/business", label: tSidebar("forBusiness"), desc: t("businessDesc"), icon: Building2 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        {name ? t("welcomeBack", { name }) : t("welcomeBackNoName")}
      </h1>
      <p className="text-gray-500 mb-8">{t("chooseSection")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {QUICK_LINKS.map(({ href, label, desc, icon: Icon }) => (
          <Link
            key={href}
            href={`/${locale}${href}`}
            className="flex items-start gap-4 p-5 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition group"
          >
            <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-gray-100 shrink-0">
              <Icon className="w-5 h-5 text-gray-600" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 font-semibold text-gray-800">
                {label}
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition" />
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}