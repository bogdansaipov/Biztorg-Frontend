"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { getMyShops } from "@/services/shop.service";
import { MyShopItem } from "@/types/responses/shop.response";
import CreateShopForm from "@/customComponents/profile/CreateShopForm";

const MEDIA_BASE = "https://169-58-13-208.nip.io/public";

function VerificationLabel({ status }: { status: string | null }) {
  const t = useTranslations("business");

  const map: Record<string, { text: string; className: string }> = {
    VERIFIED: { text: t("verified"), className: "text-emerald-600" },
    PENDING: { text: t("pending"), className: "text-amber-600" },
    REJECTED: { text: t("rejected"), className: "text-red-500" },
  };
  const { text, className } = map[status ?? ""] ?? { text: t("notVerified"), className: "text-gray-400" };

  return <span className={`text-[13px] ${className}`}>{text}</span>;
}

function ShopRow({ shop, locale }: { shop: MyShopItem; locale: string }) {
  return (
    <Link
      href={`/${locale}/shop/${shop.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition rounded-xl"
    >
      <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
        {shop.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`${MEDIA_BASE}${shop.bannerUrl}`} alt={shop.shopName} className="w-full h-full object-cover" />
        ) : (
          <Store className="w-5 h-5 text-gray-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium text-gray-800 truncate">{shop.shopName}</div>
        <VerificationLabel status={shop.verificationStatus} />
      </div>

      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
    </Link>
  );
}

export default function BusinessPage() {
  const pathname = usePathname();
  // Locale segment lives at the front of pathname (/ru/...) — derive it
  // here instead of hardcoding "ru" so every link below (including
  // ShopRow's) keeps working once uz ships, with no further changes
  // needed in this file.
  const locale = pathname.split("/")[1] || "ru";
  const t = useTranslations("business");

  const [shops, setShops] = useState<MyShopItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    getMyShops()
      .then(setShops)
      .catch((err) => {
        console.error("Failed to load shops", err);
        setError(t("loadError"));
        setShops([]);
      });
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <Link
        href={`/${locale}/profile`}
        className="lg:hidden flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 -ml-1"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="text-sm">{t("backToProfile")}</span>
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t("title")}</h1>

      {shops === null ? (
        <p className="text-gray-400 text-sm py-6">{t("loading")}</p>
      ) : error ? (
        <p className="text-red-400 text-sm py-6">{error}</p>
      ) : shops.length === 0 ? (
        // No shop yet — show the create form directly, same as the mobile
        // app navigating straight to CreateShop when myShops is empty.
        <CreateShopForm onSuccess={refresh} />
      ) : (
        // Has at least one shop — show the list (banner, name,
        // verification label, link to the shop's public profile), plus a
        // way to add another one. The mobile app's own MyShopsSection
        // supports multiple shops per user, so this isn't capped at one.
        <div className="max-w-xl bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <h2 className="text-base font-semibold text-gray-700 px-4 pt-4 pb-1">
            {t("myShops")}
          </h2>

          <div className="px-2 pb-2">
            {shops.map((shop) => (
              <ShopRow key={shop.id} shop={shop} locale={locale} />
            ))}

            <Link
              href={`/${locale}/profile/business/create`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition rounded-xl"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-[15px] font-medium text-emerald-700">{t("createShop")}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}