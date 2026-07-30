"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Plus, Search, User } from "lucide-react";
import { useAuthModal } from "@/context/AuthModalContext";
import { useAuthStore } from "@/stores/auth.store";

export default function MobileBottomNav() {
  const { open } = useAuthModal();
  const router = useRouter();

  // Same two-source auth check as MainHeader: storeUser reacts instantly
  // to a login/logout happening in this session; storedUser covers a
  // fresh page load, since the store doesn't rehydrate from localStorage
  // on its own.
  const storeUser = useAuthStore((s) => s.user);
  const [storedUser, setStoredUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.id) setStoredUser(parsed);
    } catch (err) {
      console.error("Failed to parse stored user", err);
    }
  }, []);

  const isLoggedIn = Boolean(storeUser ?? storedUser);

  // Поиск doesn't need a login check — it's just the site's home/search
  // entry point, open to anyone.
  const handleSearchClick = () => {
    router.push("/");
  };

  // Same "logged in? navigate : open the auth modal" gate as
  // handleSellClick/handleAccountClick below.
  const handleFavoritesClick = () => {
    if (isLoggedIn) {
      router.push("/profile/favorites");
    } else {
      open();
    }
  };

  const handleSellClick = () => {
    if (isLoggedIn) {
      router.push("/obyavlenie/create");
    } else {
      open();
    }
  };

  const handleAccountClick = () => {
    if (isLoggedIn) {
      // On mobile, just navigate — /profile itself becomes the menu
      // screen here (ProfileLayout shows the sidebar-as-menu at the root
      // route), so there's no need for a separate popover like the
      // desktop header's dropdown.
      router.push("/profile");
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
          <span className="text-[11px] font-medium">Поиск</span>
        </button>

        <button
          onClick={handleFavoritesClick}
          className="flex flex-col items-center gap-0.5 py-2.5 text-black/60 hover:text-black transition"
        >
          <Heart className="w-5.5 h-5.5" />
          <span className="text-[11px] font-medium">Избранное</span>
        </button>

        {/* Elevated center action, matching the floating "sell" button
            pattern popular in marketplace apps (Avito, OLX, Uber-style tab bars). */}
        <div className="flex justify-center">
          <button
            onClick={handleSellClick}
            className="flex items-center justify-center w-13 h-13 -mt-6 bg-gray-900 text-white rounded-full shadow-lg cursor-pointer hover:bg-gray-800 transition"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Сообщения — not wired up yet, no chat/messages page exists to
            navigate to. Left inert on purpose rather than pointed at a
            placeholder route. */}
        <button className="flex flex-col items-center gap-0.5 py-2.5 text-black/60 hover:text-black transition">
          <MessageCircle className="w-5.5 h-5.5" />
          <span className="text-[11px] font-medium">Сообщения</span>
        </button>

        <button
          onClick={handleAccountClick}
          className="flex flex-col items-center gap-0.5 py-2.5 text-black/60 hover:text-black transition"
        >
          <User className="w-5.5 h-5.5" />
          <span className="text-[11px] font-medium">{isLoggedIn ? "Профиль" : "Войти"}</span>
        </button>
      </div>
    </nav>
  );
}