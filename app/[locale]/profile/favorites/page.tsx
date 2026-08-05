"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import FavoriteListingsTab from "@/customComponents/profile/FavoriteListingsTab";
import FavoriteProfilesTab from "@/customComponents/profile/FavoriteProfilesTab";

type FavoritesTab = "listings" | "profiles";

export default function FavoritesPage() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "ru";
  const t = useTranslations("favorites");

  const [tab, setTab] = useState<FavoritesTab>("listings");

  return (
    <div>
      <Link
        href={`/${locale}/profile`}
        className="lg:hidden flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 -ml-1"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="text-sm">{t("backToProfile")}</span>
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 mb-4">{t("title")}</h1>

      <div className="flex gap-8 border-b border-gray-100">
        <button
          onClick={() => setTab("listings")}
          className={`cursor-pointer pb-3 text-[15px] font-medium transition border-b-2 -mb-px ${
            tab === "listings"
              ? "text-gray-900 border-gray-900"
              : "text-gray-400 border-transparent hover:text-gray-600"
          }`}
        >
          {t("tabListings")}
        </button>
        <button
          onClick={() => setTab("profiles")}
          className={`cursor-pointer pb-3 text-[15px] font-medium transition border-b-2 -mb-px ${
            tab === "profiles"
              ? "text-gray-900 border-gray-900"
              : "text-gray-400 border-transparent hover:text-gray-600"
          }`}
        >
          {t("tabProfiles")}
        </button>
      </div>

      {tab === "listings" ? <FavoriteListingsTab /> : <FavoriteProfilesTab />}
    </div>
  );
}