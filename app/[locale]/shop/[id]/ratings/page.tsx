"use client";

import { useParams, useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Star } from "@phosphor-icons/react";
import ShopRatingsSection from "@/customComponents/profile/ShopRatingsSection";

export default function ShopRatingsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const shopId = params.id;

  const locale = pathname.split("/")[1] || "ru";
  const t = useTranslations("shopRatingsPage");

  const handleRateClick = () => {
    router.push(`/${locale}/shop/${shopId}/rate`);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto flex items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="cursor-pointer p-1 -ml-1" aria-label={t("back")}>
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{t("title")}</h1>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
        <div className="max-w-[560px] lg:max-w-[720px] mx-auto pb-24">
          <ShopRatingsSection shopId={shopId} />
        </div>
      </div>

      <button
        onClick={handleRateClick}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-primary hover:opacity-90 transition text-white px-5 py-3.5 rounded-full shadow-lg cursor-pointer"
      >
        <Star weight="fill" className="w-5 h-5" />
        {t("rate")}
      </button>
    </div>
  );
}