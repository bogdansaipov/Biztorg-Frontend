"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Heart,
  Megaphone,
  MessageSquare,
  Building2,
  Languages,
  FileText,
  LogOut,
  ChevronRight,
  Pencil,
  ShieldCheck,
  Plus,
  Store,
} from "lucide-react";
import { getMyShops } from "@/services/shop.service";
import { MyShopItem } from "@/types/responses/shop.response";
import { logoutUser } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import LanguageModal from "./LanguageModal";
import LogoutConfirmModal from "../Modals/LogoutConfirmModal";
import InDevelopmentModal from "../Modals/InDevelopmentModal";

const MEDIA_BASE = "https://169-58-13-208.nip.io/public";

export default function ProfileSidebarCard() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("profileSidebar");

  const locale = pathname.split("/")[1] || "ru";

  const NAV_ITEMS = [
    { href: "/profile/edit", label: t("editProfile"), icon: Pencil },
    { href: "/profile/favorites", label: t("favorites"), icon: Heart },
    { href: "/profile/listings", label: t("myListings"), icon: Megaphone },
    { href: "/profile/messages", label: t("messages"), icon: MessageSquare },
    { href: "/profile/business", label: t("forBusiness"), icon: Building2 },
    { href: "/profile/language", label: t("changeLanguage"), icon: Languages },
    { href: "/legal", label: t("rules"), icon: FileText },
  ];

  const [shops, setShops] = useState<MyShopItem[] | null>(null);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [messagesInfoOpen, setMessagesInfoOpen] = useState(false);

  const user = useAuthStore((s) => s.user)!;

  useEffect(() => {
    getMyShops()
      .then(setShops)
      .catch((err) => {
        console.error("Failed to load shops for sidebar", err);
        setShops([]);
      });
  }, []);

  const handleConfirmLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logoutUser();
      router.push(`/${locale}`);
    } finally {
      setLoggingOut(false);
      setLogoutOpen(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-12 h-12 text-gray-300" fill="currentColor">
              <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.4c-3.3 0-9.8 1.6-9.8 4.9v2.4h19.6v-2.4c0-3.3-6.5-4.9-9.8-4.9z" />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <h2 className="text-lg font-bold text-gray-800">{user.name ?? ""}</h2>
          <button
            onClick={() => router.push(`/${locale}/profile/edit`)}
            className="cursor-pointer text-gray-400 hover:text-gray-600 transition"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
        <p className="text-gray-500 text-sm mt-0.5">{user.phone ?? ""}</p>

        <Link
          href={`/${locale}/user/${user.id}`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mt-2 transition"
        >
          {t("viewMyProfile")}
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {shops !== null && shops.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 mb-2">
            {t("myShops")}
          </h3>
          <div className="space-y-1">
            {shops.map((shop) => (
              <div key={shop.id} className="flex items-center gap-1">
                <Link
                  href={`/${locale}/shop/${shop.id}`}
                  className="flex-1 min-w-0 flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition"
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {shop.bannerUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`${MEDIA_BASE}${shop.bannerUrl}`}
                        alt={shop.shopName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <span className="flex-1 text-[14px] text-gray-800 truncate">{shop.shopName}</span>
                </Link>
                <Link
                  href={`/${locale}/profile/business/${shop.id}/edit`}
                  className="shrink-0 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition"
                  aria-label={t("editShopAria", { shopName: shop.shopName })}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}

            <Link
              href={`/${locale}/profile/business/create`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-[14px] font-medium text-emerald-700">{t("createShop")}</span>
            </Link>
          </div>
        </div>
      )}

      <nav className="space-y-1">
        {NAV_ITEMS
          .filter((item) => !(item.href === "/profile/business" && shops && shops.length > 0))
          .map(({ href, label, icon: Icon }) => {
            const localizedHref = `/${locale}${href}`;
            const active = pathname === localizedHref;

            if (href === "/profile/language") {
              return (
                <button
                  key={href}
                  onClick={() => setLanguageOpen(true)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition cursor-pointer text-left"
                >
                  <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-50 shrink-0">
                    <Icon className="w-4.5 h-4.5 text-gray-600" />
                  </span>
                  <span className="flex-1 text-[15px] text-gray-800">{label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </button>
              );
            }

            if (href === "/profile/messages") {
              return (
                <button
                  key={href}
                  onClick={() => setMessagesInfoOpen(true)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition cursor-pointer text-left"
                >
                  <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-50 shrink-0">
                    <Icon className="w-4.5 h-4.5 text-gray-600" />
                  </span>
                  <span className="flex-1 text-[15px] text-gray-800">{label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </button>
              );
            }

            return (
              <Link
                key={href}
                href={localizedHref}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl transition
                  ${active ? "bg-gray-100" : "hover:bg-gray-50"}
                `}
              >
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-50 shrink-0">
                  <Icon className="w-4.5 h-4.5 text-gray-600" />
                </span>
                <span className="flex-1 text-[15px] text-gray-800">{label}</span>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              </Link>
            );
          })}

        <button
          onClick={() => setLogoutOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition cursor-pointer text-left"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-50 shrink-0">
            <LogOut className="w-4.5 h-4.5 text-gray-600" />
          </span>
          <span className="flex-1 text-[15px] text-gray-800">{t("logout")}</span>
          <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
        </button>
      </nav>

      <LanguageModal open={languageOpen} onClose={() => setLanguageOpen(false)} />

      <LogoutConfirmModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleConfirmLogout}
        loading={loggingOut}
      />

      <InDevelopmentModal open={messagesInfoOpen} onClose={() => setMessagesInfoOpen(false)} />
    </div>
  );
}