"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Heart, MessageCircle, Plus, Search, User } from "lucide-react";
import { useAuthModal } from "@/context/AuthModalContext";
import { useAuthStore } from "@/stores/auth.store";
import { useLocaleRegion } from "@/hooks/useLocaleRegion";
import InDevelopmentModal from "@/customComponents/Modals/InDevelopmentModal";

export default function MobileBottomNav() {
  const { open } = useAuthModal();
  const router = useRouter();
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

  return (
    <nav
      className="
        lg:hidden fixed bottom-0 left-0 right-0 z-9999
        bg-white/90 backdrop-blur-md border-t border-gray-100
        supports-backdrop-filter:bg-white/80
      "
    >
      <div className="max-w-[1400px] mx-auto grid grid-cols-5 items-center px-2">
        <button
          onClick={handleSearchClick}
          className="flex flex-col items-center gap-0.5 py-2.5 text-black/60 hover:text-black transition"
        >
          <Search className="w-5.5 h-5.5" />
          <span className="text-[11px] font-medium">{t("search")}</span>
        </button>

        <button
          onClick={handleFavoritesClick}
          className="flex flex-col items-center gap-0.5 py-2.5 text-black/60 hover:text-black transition"
        >
          <Heart className="w-5.5 h-5.5" />
          <span className="text-[11px] font-medium">{t("favorites")}</span>
        </button>

        <div className="flex justify-center">
          <button
            onClick={handleSellClick}
            className="flex items-center justify-center w-13 h-13 -mt-6 bg-gray-900 text-white rounded-full shadow-lg cursor-pointer hover:bg-gray-800 transition"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        <button
          onClick={() => setMessagesInfoOpen(true)}
          className="flex flex-col items-center gap-0.5 py-2.5 text-black/60 hover:text-black transition"
        >
          <MessageCircle className="w-5.5 h-5.5" />
          <span className="text-[11px] font-medium">{t("messages")}</span>
        </button>

        <button
          onClick={handleAccountClick}
          className="flex flex-col items-center gap-0.5 py-2.5 text-black/60 hover:text-black transition"
        >
          <User className="w-5.5 h-5.5" />
          <span className="text-[11px] font-medium">{isLoggedIn ? t("profile") : t("login")}</span>
        </button>
      </div>

      <InDevelopmentModal open={messagesInfoOpen} onClose={() => setMessagesInfoOpen(false)} />
    </nav>
  );
}