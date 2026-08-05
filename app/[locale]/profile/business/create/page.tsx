"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import CreateShopForm from "@/customComponents/profile/CreateShopForm";

export default function CreateAnotherShopPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "ru";
  const t = useTranslations("business");

  return (
    <div>
      <Link
        href={`/${locale}/profile/business`}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 -ml-1"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="text-sm">{t("myShops")}</span>
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t("createShop")}</h1>

      <CreateShopForm onSuccess={() => router.push(`/${locale}/profile/business`)} />
    </div>
  );
}