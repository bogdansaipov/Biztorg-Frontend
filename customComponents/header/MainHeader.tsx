"use client"

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  HeartIcon,
  MegaphoneIcon,
  ChatCircleIcon,
  UserIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { Search, X, Clock } from "lucide-react";
import { useAuthModal } from "@/context/AuthModalContext";
import { useCategoriesMenu } from "@/context/CategoriesMenuContext";
import { useAuthStore } from "@/stores/auth.store";
import { useLocaleRegion } from "@/hooks/useLocaleRegion";
import ProfileHeaderDropdown from "./ProfileHeaderDropdown";
import LanguageModal from "@/customComponents/profile/LanguageModal";
import LogoutConfirmModal from "../Modals/LogoutConfirmModal";
import InDevelopmentModal from "../Modals/InDevelopmentModal";
import { logoutUser } from "@/services/auth.service";
import { filterProducts } from "@/services/product.service";
import { Product } from "@/types/Product";
import { Currency } from "@/enums/CurrencyEnum";
import { TOPBAR_HEIGHT_PX, useHeaderScroll } from "@/hooks/useHeaderScroll";

const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_URL ?? "https://169-58-13-208.nip.io";

const RECENT_SEARCHES_KEY = "recentSearches";
const RECENT_SEARCHES_LIMIT = 5;
const SUGGESTIONS_LIMIT = 5;
const SUGGEST_DEBOUNCE_MS = 300;

function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(term: string) {
  const trimmed = term.trim();
  if (!trimmed) return;
  const existing = loadRecentSearches().filter(
    (t) => t.toLowerCase() !== trimmed.toLowerCase(),
  );
  const next = [trimmed, ...existing].slice(0, RECENT_SEARCHES_LIMIT);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
}

function removeRecentSearch(term: string) {
  const next = loadRecentSearches().filter(
    (t) => t.toLowerCase() !== term.toLowerCase(),
  );
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  return next;
}

function CatalogIcon({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="3" y="5" width="18" height="2" rx="1" fill="currentColor" />
      <rect x="3" y="11" width="13" height="2" rx="1" fill="currentColor" />
      <rect x="3" y="17" width="7" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

export default function MainHeader() {
  const { open } = useAuthModal();
  const { open: openCategories } = useCategoriesMenu();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("header");
  const tLogout = useTranslations("logoutConfirmModal");

  const { locale, region } = useLocaleRegion();

  const storeUser = useAuthStore((s) => s.user);
  const isLoggedIn = Boolean(storeUser);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [messagesInfoOpen, setMessagesInfoOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) setProfileMenuOpen(false);
  }, [isLoggedIn]);

  const handleConfirmLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logoutUser(tLogout("toastMessage"));
      router.push(`/${locale}`);
    } finally {
      setLoggingOut(false);
      setLogoutOpen(false);
    }
  };

  const [searchValue, setSearchValue] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    const trimmed = searchValue.trim();
    if (!trimmed) {
      setSuggestions([]);
      setSuggestLoading(false);
      return;
    }

    setSuggestLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const data = await filterProducts({
          query: trimmed,
          page: 1,
          limit: SUGGESTIONS_LIMIT,
        });
        setSuggestions(data.products);
      } catch (err) {
        console.error("Failed to load search suggestions", err);
        setSuggestions([]);
      } finally {
        setSuggestLoading(false);
      }
    }, SUGGEST_DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchValue]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const handleSearchSubmit = (term?: string) => {
    const trimmed = (term ?? searchValue).trim();
    if (!trimmed) return;
    saveRecentSearch(trimmed);
    setRecentSearches(loadRecentSearches());
    setDropdownOpen(false);
    inputRef.current?.blur();
    router.push(`/${locale}/${region}/search?query=${encodeURIComponent(trimmed)}`);
  };

  const handleClear = () => {
    setSearchValue("");
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const handleRecentSearchClick = (term: string) => {
    setSearchValue(term);
    handleSearchSubmit(term);
  };

  const handleRemoveRecentSearch = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    setRecentSearches(removeRecentSearch(term));
  };

  const handleClearAllRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    setRecentSearches([]);
  };

  const handleProductSuggestionClick = (product: Product) => {
    setDropdownOpen(false);
    router.push(`/${locale}/obyavlenie/${product.slug}`);
  };

  const showRecent = !searchValue.trim() && recentSearches.length > 0;
  const showSuggestions = !!searchValue.trim();
  const dropdownHasContent = showRecent || showSuggestions;

  const handleSellClick = () => {
    if (isLoggedIn) {
      router.push(`/${locale}/obyavlenie/create`);
    } else {
      open();
    }
  };

  const handleFavoritesClick = () => {
    if (isLoggedIn) {
      router.push(`/${locale}/profile/favorites`);
    } else {
      open();
    }
  };

  const handleListingsClick = () => {
    if (isLoggedIn) {
      router.push(`/${locale}/profile/listings`);
    } else {
      open();
    }
  };

  const handleAccountClick = () => {
    if (isLoggedIn) {
      setProfileMenuOpen((prev) => !prev);
    } else {
      open();
    }
  };

  const { scrolled, topBarVisible } = useHeaderScroll();

  // Active-route detection for the nav icons — exact-match only, so
  // /profile/favorites and /profile/listings don't also light up the
  // plain /profile (Account) icon. "Messages" has no dedicated route
  // (opens InDevelopmentModal instead), so it has no active state.
  const favoritesActive = pathname === `/${locale}/profile/favorites`;
  const listingsActive = pathname === `/${locale}/profile/listings`;
  const profileActive = pathname === `/${locale}/profile`;

  // Inactive nav icons sit at a lighter gray; active ones switch to a
  // filled Phosphor weight plus this same 80%-dark tone used elsewhere
  // in the app for "dark but not pure black" text (text-black/80).
  const navItemClass = (active: boolean) =>
    `flex flex-col items-center font-medium cursor-pointer transition ${
      active ? "text-black/80" : "text-gray-800 hover:text-black/80"
    }`;

  return (
     <div
      className={`sticky z-9999 bg-white transition-[top,border-color] duration-300 ease-in-out border-b ${
        scrolled ? "border-gray-200" : "border-transparent"
      }`}
      style={{ top: topBarVisible ? TOPBAR_HEIGHT_PX : 0 }}
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-0 py-3 flex items-center gap-2">
        <button
          onClick={openCategories}
          className="flex items-center justify-center lg:justify-start gap-2 bg-gray-100 hover:bg-gray-200 text-black/80 p-3.5 lg:px-6 lg:py-4 rounded-xl text-base font-medium cursor-pointer transition shrink-0"
        >
          <CatalogIcon className="w-5.5 h-5.5" />
          <span className="hidden lg:inline">{t("catalog")}</span>
        </button>

        <div ref={searchWrapperRef} className="flex-1 relative">
          <button
            onClick={() => handleSearchSubmit()}
            aria-label={t("searchAria")}
            className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer z-10"
          >
            <Search className="w-5 h-5 text-gray-400" />
          </button>

          <input
            ref={inputRef}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setDropdownOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearchSubmit();
              if (e.key === "Escape") setDropdownOpen(false);
            }}
            placeholder={t("searchPlaceholder")}
            className="w-full bg-gray-100/80 rounded-xl pl-12 pr-11 py-3.5 lg:py-4 text-base outline-none placeholder-gray-500"
          />

          {searchValue && (
            <button
              onClick={handleClear}
              aria-label={t("clearAria")}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition cursor-pointer z-10"
            >
              <X className="w-4.5 h-4.5" strokeWidth={2.5} />
            </button>
          )}

          {dropdownOpen && dropdownHasContent && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50">
              {showRecent && (
                <div className="px-4 pt-4 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-bold text-gray-900">{t("recentSearchesTitle")}</h3>
                    <button
                      onClick={handleClearAllRecentSearches}
                      className="text-sm font-medium text-primary hover:underline transition cursor-pointer"
                    >
                      {t("clearAll")}
                    </button>
                  </div>

                  <div>
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleRecentSearchClick(term)}
                        className="w-full flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg text-left hover:bg-gray-50 transition cursor-pointer"
                      >
                        <Clock className="w-5 h-5 text-gray-400 shrink-0" />
                        <span className="flex-1 text-sm text-gray-800 truncate">{term}</span>
                        <span
                          onClick={(e) => handleRemoveRecentSearch(e, term)}
                          role="button"
                          aria-label={t("removeFromHistory")}
                          className="flex items-center justify-center w-7 h-7 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition shrink-0"
                        >
                          <X className="w-4 h-4" strokeWidth={2.5} />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showSuggestions && (
                <div className="py-2">
                  {suggestLoading ? (
                    <p className="px-4 py-3 text-sm text-gray-400">{t("searching")}</p>
                  ) : suggestions.length > 0 ? (
                    <>
                      {suggestions.map((product) => {
                        const mainImage =
                          product.images?.find((i) => i.isMain)?.imageUrl ?? "/images/default.png";
                        return (
                          <button
                            key={product.id}
                            onClick={() => handleProductSuggestionClick(product)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition cursor-pointer"
                          >
                            <img
                              src={`${MEDIA_BASE}/public${mainImage}`}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover shrink-0 bg-gray-100"
                            />
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm text-gray-800 truncate">{product.name}</span>
                              {product.price != null && (
                                <span className="block text-xs text-gray-400">
                                  {Number(product.price).toLocaleString("ru-RU")}{" "}
                                  {product.currency === Currency.USD ? "у.e" : "сум"}
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                      <button
                        onClick={() => handleSearchSubmit()}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-primary hover:bg-gray-50 transition cursor-pointer border-t border-gray-100 mt-1"
                      >
                        <Search className="w-4 h-4 shrink-0" />
                        {t("showAllResults", { query: searchValue.trim() })}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleSearchSubmit()}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-primary hover:bg-gray-50 transition cursor-pointer"
                    >
                      <Search className="w-4 h-4 shrink-0" />
                      {t("showAllResults", { query: searchValue.trim() })}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="hidden lg:flex items-center gap-10 ml-4">
     <button onClick={handleFavoritesClick} className={navItemClass(favoritesActive)}>
  <HeartIcon
    weight={favoritesActive ? "fill" : "regular"}
    color={favoritesActive ? "#ef4444" : undefined}
    className="w-5.5 h-5.5 mb-0.5"
  />
  {t("favorites")}
</button>

          <button onClick={handleListingsClick} className={navItemClass(listingsActive)}>
            <MegaphoneIcon
              weight={listingsActive ? "fill" : "regular"}
              className="w-5.5 h-5.5 mb-0.5"
            />
            {t("listings")}
          </button>

          <button onClick={() => setMessagesInfoOpen(true)} className={navItemClass(false)}>
            <ChatCircleIcon weight="regular" className="w-5.5 h-5.5 mb-0.5" />
            {t("messages")}
          </button>

          <div className="relative">
            <button onClick={handleAccountClick} className={navItemClass(profileActive)}>
              <UserIcon
                weight={profileActive ? "fill" : "regular"}
                className="w-5.5 h-5.5 mb-0.5"
              />
              {isLoggedIn ? t("profile") : t("login")}
            </button>

            {profileMenuOpen && (
              <ProfileHeaderDropdown
                onClose={() => setProfileMenuOpen(false)}
                onOpenLanguage={() => setLanguageOpen(true)}
                onRequestLogout={() => setLogoutOpen(true)}
              />
            )}
          </div>

          <button
            onClick={handleSellClick}
            className="flex items-center gap-3 bg-gray-900 text-white px-6 py-3 rounded-xl text-base font-medium cursor-pointer hover:bg-gray-800 transition"
          >
            {t("postAd")}
            <span className="flex items-center justify-center w-5 h-5 bg-white rounded-full">
              <PlusIcon weight="bold" className="w-3.5 h-3.5 text-gray-900" />
            </span>
          </button>
        </div>
      </div>

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