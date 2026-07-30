"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

const MEDIA_BASE = "https://169-58-13-208.nip.io/public";

interface ProfileUser {
  id: string | null;
  name: string;
  phone: string;
  avatarUrl: string | null;
  isVerified: boolean;
}

const NAV_ITEMS = [
  { href: "/profile/edit", label: "Отредактировать профиль", icon: Pencil },
  { href: "/profile/favorites", label: "Избранное", icon: Heart },
  { href: "/profile/listings", label: "Мои объявления", icon: Megaphone },
  { href: "/profile/messages", label: "Сообщения", icon: MessageSquare },
  { href: "/profile/business", label: "BizTorg для бизнеса", icon: Building2 },
  { href: "/profile/language", label: "Смена языка", icon: Languages },
  { href: "/legal", label: "Правила площадки", icon: FileText },
];

export default function ProfileSidebarCard() {
  const pathname = usePathname();
  const router = useRouter();

  const [shops, setShops] = useState<MyShopItem[] | null>(null);
  const [languageOpen, setLanguageOpen] = useState(false);

  // Real user data, read the same two-source way as MainHeader:
  // - storeUser reacts instantly to anything that updates the zustand
  //   store during this session (login, or EditProfilePage's
  //   useAuthStore.setState(...) after a successful name change).
  // - storedUser covers a fresh page load / a case where the store
  //   hasn't rehydrated — read once from localStorage on mount.
  // Previously this component defaulted to a hardcoded PLACEHOLDER_USER
  // ("Богдан") and never looked at either source, which is why editing
  // the name never showed up here — it was always rendering the
  // placeholder regardless of what was actually saved.
  const storeUser = useAuthStore((s) => s.user) as
    | { id?: string; name?: string; phone?: string }
    | null
    | undefined;
  const [storedUser, setStoredUser] = useState<{ id?: string; name?: string; phone?: string } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        setStoredUser(JSON.parse(raw));
      } catch (err) {
        console.error("Failed to parse stored user", err);
      }
    }
  }, []);

  const source = storeUser ?? storedUser;
  const user: ProfileUser = {
    id: source?.id ?? null,
    name: source?.name ?? "",
    phone: source?.phone ?? "",
    avatarUrl: null,
    isVerified: false,
  };

  useEffect(() => {
    getMyShops()
      .then(setShops)
      .catch((err) => {
        console.error("Failed to load shops for sidebar", err);
        setShops([]);
      });
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    router.push("/");
  };

  return (
    <div className="p-6">
      {/* HEADER — avatar, name, phone, edit pencil, verified badge */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-12 h-12 text-gray-300" fill="currentColor">
                <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.4c-3.3 0-9.8 1.6-9.8 4.9v2.4h19.6v-2.4c0-3.3-6.5-4.9-9.8-4.9z" />
              </svg>
            )}
          </div>
          {user.isVerified && (
            <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
              <ShieldCheck className="w-3 h-3 text-white" />
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <h2 className="text-lg font-bold text-gray-800">{user.name}</h2>
          {/* Opens the name edit screen we built at /profile/edit. */}
          <button
            onClick={() => router.push("/profile/edit")}
            className="cursor-pointer text-gray-400 hover:text-gray-600 transition"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
        <p className="text-gray-500 text-sm mt-0.5">{user.phone}</p>

        {/* Points at this user's own real public profile page
            (/user/{id}) instead of a separate /profile/preview route.
            Only rendered once we actually know the id. */}
        {user.id && (
          <Link
            href={`/user/${user.id}`}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mt-2 transition"
          >
            Как выглядит мой профиль
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* MY SHOPS — shown right in the sidebar so any shop is one click
          away no matter which /profile/* page is currently open, rather
          than only being reachable via the business page's own content. */}
      {shops !== null && shops.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 mb-2">
            Мои магазины
          </h3>
          <div className="space-y-1">
            {shops.map((shop) => (
              <div key={shop.id} className="flex items-center gap-1">
                <Link
                  href={`/shop/${shop.id}`}
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
                  href={`/profile/business/${shop.id}/edit`}
                  className="shrink-0 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition"
                  aria-label={`Редактировать ${shop.shopName}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}

            <Link
              href="/profile/business/create"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-[14px] font-medium text-emerald-700">Создать магазин</span>
            </Link>
          </div>
        </div>
      )}

      {/* NAV LIST */}
      <nav className="space-y-1">
        {NAV_ITEMS
          // Once the user has at least one shop, the shops section above
          // already covers navigation there — matching the mobile app,
          // which drops this same menu item once myShops is non-empty
          // rather than showing both.
          .filter((item) => !(item.href === "/profile/business" && shops && shops.length > 0))
          .map(({ href, label, icon: Icon }) => {
            const active = pathname === href;

            // "Смена языка" opens a modal instead of navigating to a
            // page — there's no dedicated /profile/language screen, just
            // the language picker itself.
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

            return (
              <Link
                key={href}
                href={href}
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
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition cursor-pointer text-left"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-50 shrink-0">
            <LogOut className="w-4.5 h-4.5 text-gray-600" />
          </span>
          <span className="flex-1 text-[15px] text-gray-800">Выйти</span>
          <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
        </button>
      </nav>

      <LanguageModal open={languageOpen} onClose={() => setLanguageOpen(false)} />
    </div>
  );
}