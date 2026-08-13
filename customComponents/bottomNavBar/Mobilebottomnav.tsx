"use client"

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { HeartIcon, ChatCircleIcon, UserIcon, PlusIcon } from "@phosphor-icons/react";
import { Search } from "lucide-react";
import { useAuthModal } from "@/context/AuthModalContext";
import { useAuthStore } from "@/stores/auth.store";
import { useLocaleRegion } from "@/hooks/useLocaleRegion";
import InDevelopmentModal from "@/customComponents/Modals/InDevelopmentModal";

export default function MobileBottomNav() {
  const { open } = useAuthModal();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("header");

  const { locale, region } = useLocaleRegion();

  const storeUser = useAuthStore((s) => s.user);
  const isLoggedIn = Boolean(storeUser);

  const [messagesInfoOpen, setMessagesInfoOpen] = useState(false);

  const handleSearchClick = () => {
    router.push(`/${locale}/${region}`);
  };

  const handleFavoritesClick = () => {
    if (isLoggedIn) {
      router.push(`/${locale}/profile/favorites`);
    } else {
      open();
    }
  };

  const handleSellClick = () => {
    if (isLoggedIn) {
      router.push(`/${locale}/obyavlenie/create`);
    } else {
      open();
    }
  };

  const handleAccountClick = () => {
    if (isLoggedIn) {
      router.push(`/${locale}/profile`);
    } else {
      open();
    }
  };

  const homeActive = pathname === `/${locale}/${region}`;
  const favoritesActive = pathname === `/${locale}/profile/favorites`;
  const accountActive = pathname === `/${locale}/profile`;

  const navItemClass = (active: boolean) =>
    `flex flex-col items-center gap-0.5 py-3.25 transition ${
      active ? "text-black/80" : "text-gray-500 hover:text-black/80"
    }`;

  return (
    <nav
      className="
        lg:hidden fixed bottom-0 left-0 right-0 z-9999
        bg-white border-t border-gray-100
      "
    >
      <div className="max-w-[1400px] mx-auto grid grid-cols-5 items-center px-2">
        <button onClick={handleSearchClick} className={navItemClass(homeActive)}>
          <Search className="w-6.5 h-6.5" />
          <span className="text-[12.5px] font-medium">{t("search")}</span>
        </button>

        <button onClick={handleFavoritesClick} className={navItemClass(favoritesActive)}>
          <HeartIcon
            weight={favoritesActive ? "fill" : "regular"}
            color={favoritesActive ? "#ef4444" : undefined}
            className="w-6.5 h-6.5"
          />
          <span className="text-[12.5px] font-medium">{t("favorites")}</span>
        </button>

        <button onClick={handleSellClick} className={navItemClass(false)}>
          <span className="flex items-center justify-center w-6.5 h-6.5 bg-gray-900 rounded-full">
            <PlusIcon weight="bold" className="w-4.25 h-4.25 text-white" />
          </span>
          <span className="text-[12.5px] font-medium">{t("postAd")}</span>
        </button>

        <button onClick={() => setMessagesInfoOpen(true)} className={navItemClass(false)}>
          <ChatCircleIcon weight="regular" className="w-6.5 h-6.5" />
          <span className="text-[12.5px] font-medium">{t("messages")}</span>
        </button>

        <button onClick={handleAccountClick} className={navItemClass(accountActive)}>
          <UserIcon
            weight={accountActive ? "fill" : "regular"}
            className="w-6.5 h-6.5"
          />
          <span className="text-[12.5px] font-medium">{isLoggedIn ? t("profile") : t("login")}</span>
        </button>
      </div>

      <InDevelopmentModal open={messagesInfoOpen} onClose={() => setMessagesInfoOpen(false)} />
    </nav>
  );
}