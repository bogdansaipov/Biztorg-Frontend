"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import MyListingsTab from "@/customComponents/profile/MyListingsTab";

export default function MyListingsPage() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "ru";
  const t = useTranslations("favorites");

  return (
    <div>
      <Link
        href={`/${locale}/profile`}
        className="lg:hidden flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 -ml-1"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="text-sm">{t("backToProfile")}</span>
      </Link>

      <MyListingsTab />
    </div>
  );
}