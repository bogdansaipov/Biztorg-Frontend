"use client";

import { useEffect, useState } from "react";
import { Info, CircleUser, Store, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import { formatUzPhone } from "@/helpers/phone";
import { cn } from "@/lib/utils";
import { getMyShops } from "@/services/shop.service";
import { MyShopItem } from "@/types/responses/shop.response";
import { useAuthStore } from "@/stores/auth.store";

const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_URL ?? "https://169-58-13-208.nip.io";

interface User {
  name?: string | null;
  phone?: string | null;
}

export default function ProfileContactsSection({
  contactName,
  setContactName,
  contactPhone,
  setContactPhone,
  enableTelegram,
  setEnableTelegram,
  postAsShopId,
  setPostAsShopId,
}: {
  contactName: string;
  setContactName: (v: string) => void;
  contactPhone: string;
  setContactPhone: (v: string) => void;
  enableTelegram: boolean;
  setEnableTelegram: (v: boolean) => void;
  postAsShopId: string | null;
  setPostAsShopId: (v: string | null) => void;
}) {
  const t = useTranslations("createProduct");

  const [shops, setShops] = useState<MyShopItem[]>([]);

  const user = useAuthStore((s) => s.user);
  const userName = user?.name ?? null;

  useEffect(() => {
    if (!user) return;

    if (user.name && !contactName) {
      setContactName(user.name);
    }

    if (user.phone && contactPhone.length <= 5) {
      setContactPhone(formatUzPhone(user.phone));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    getMyShops()
      .then(setShops)
      .catch((err) => {
        console.error("Failed to load shops for contacts section", err);
        setShops([]);
      });
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");

    if (!digits.startsWith("998")) return;

    setContactPhone(formatUzPhone(digits));
  };

  return (
    <section className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-9 mb-6">
     <h2 className="text-lg sm:text-2xl font-bold mb-6 text-gray-700">
  {t("contactsHeading")}
</h2>

      {shops.length > 0 && (
        <div className="w-full sm:w-2/3 mb-6">
          <div className="flex gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3">
            <Info className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600">
              {t("shopPickerInfo")}
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setPostAsShopId(null)}
              className="w-full flex items-center gap-3 rounded-xl p-4 text-left transition cursor-pointer bg-gray-100 hover:bg-gray-200"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-200 shrink-0">
                <CircleUser className="w-5 h-5 text-gray-500" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800">{t("personalProfile")}</div>
                {userName && <div className="text-sm text-gray-500">{userName}</div>}
              </div>
              {postAsShopId === null && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary shrink-0">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </span>
              )}
            </button>

            {shops.map((shop) => {
              const active = postAsShopId === shop.id;
              return (
                <button
                  key={shop.id}
                  onClick={() => setPostAsShopId(shop.id)}
                  className="w-full flex items-center gap-3 rounded-xl p-4 text-left transition cursor-pointer bg-gray-100 hover:bg-gray-200"
                >
                  <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-200 shrink-0 overflow-hidden">
                    {shop.bannerUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`${MEDIA_BASE}/public${shop.bannerUrl}`}
                        alt={shop.shopName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="w-5 h-5 text-gray-500" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0 font-medium text-gray-800 truncate">
                    {t("shopPrefix", { shopName: shop.shopName })}
                  </div>
                  {active && (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary shrink-0">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <input
        value={contactName}
        onChange={(e) => setContactName(e.target.value)}
        placeholder={t("namePlaceholder")}
        className="
          w-full sm:w-2/3 mb-4
          bg-gray-100 rounded-xl
          px-4 py-3 text-lg
          outline-none
        "
      />

      <input
        value={contactPhone}
        onChange={handlePhoneChange}
        className="
          w-full sm:w-2/3 mb-6
          bg-gray-100 rounded-xl
          px-4 py-3 text-lg
          outline-none
        "
      />

      <div className="bg-gray-100 rounded-xl p-4 mb-4">
        <div className="font-medium text-gray-800">
          {t("chatInBiztorg")}
        </div>
        <div className="text-sm text-gray-500">
          {t("enabledByDefault")}
        </div>
      </div>

      <div
        onClick={() => setEnableTelegram(!enableTelegram)}
        className={cn(
          "flex items-center justify-between",
          "bg-gray-100 rounded-xl p-4 cursor-pointer",
          "hover:bg-gray-200 transition",
        )}
      >
        <div>
          <div className="font-medium text-gray-800">
            {t("chatInTelegram")}
          </div>
          <div className="text-sm text-gray-500">
            {t("byNumber", { phone: contactPhone.replace(/\s/g, "") })}
          </div>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={enableTelegram}
            onCheckedChange={setEnableTelegram}
            className="scale-140 cursor-pointer"
          />
        </div>
      </div>
    </section>
  );
}