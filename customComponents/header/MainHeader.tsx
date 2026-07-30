"use client"

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageCircle,
  User,
  Plus,
  Search,
  Megaphone,
  X,
  Clock,
} from "lucide-react";
import { useAuthModal } from "@/context/AuthModalContext";
import { useCategoriesMenu } from "@/context/CategoriesMenuContext";
import { useAuthStore } from "@/stores/auth.store";
import ProfileHeaderDropdown from "./ProfileHeaderDropdown";
import LanguageModal from "@/customComponents/profile/LanguageModal";
import { filterProducts } from "@/services/product.service";
import { Product } from "@/types/Product";
import { Currency } from "@/enums/CurrencyEnum";

const MEDIA_BASE = "https://169-58-13-208.nip.io/public";

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
  // Dedup case-insensitively, most recent first, capped at the limit.
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

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  // ═══════════════════ Search ═══════════════════
  // Plain text field that navigates to /search?query=... on Enter, on
  // clicking the search icon, or on picking a suggestion/recent term.
  // A dropdown below it shows recent searches (when the field is empty)
  // or live product matches (once something is typed, debounced).
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

  // Debounced live suggestions — only fires once there's actual text;
  // clearing the field drops straight back to the recent-searches view
  // instead of showing a stale/empty result list.
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

  // Close on outside click — same pattern used by the filter dropdowns
  // elsewhere in the app.
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
    router.push(`/search?query=${encodeURIComponent(trimmed)}`);
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

  const handleProductSuggestionClick = (product: Product) => {
    setDropdownOpen(false);
    router.push(`/obyavlenie/${product.slug}`);
  };

  const showRecent = !searchValue.trim() && recentSearches.length > 0;
  const showSuggestions = !!searchValue.trim();
  const dropdownHasContent = showRecent || showSuggestions;

  const handleSellClick = () => {
    if (isLoggedIn) {
      router.push("/obyavlenie/create");
    } else {
      open();
    }
  };

  const handleFavoritesClick = () => {
    if (isLoggedIn) {
      router.push("/profile/favorites");
    } else {
      open();
    }
  };

  const handleListingsClick = () => {
    if (isLoggedIn) {
      router.push("/profile/listings");
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

  return (
    <div
      className="
        sticky top-0 z-9999
        bg-white/70 backdrop-blur-md
        supports-backdrop-filter:bg-white/60
      "
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-0 py-3 flex items-center gap-2">
        <button
          onClick={openCategories}
          className="flex items-center justify-center lg:justify-start gap-2 bg-gray-100 hover:bg-gray-200 text-black/80 p-3.5 lg:px-6 lg:py-4 rounded-xl text-base font-medium cursor-pointer transition shrink-0"
        >
          <CatalogIcon className="w-5.5 h-5.5" />
          <span className="hidden lg:inline">Каталог</span>
        </button>

        <div ref={searchWrapperRef} className="flex-1 relative">
          <button
            onClick={() => handleSearchSubmit()}
            aria-label="Искать"
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
            placeholder="Найти iPhone 15 Pro"
            className="w-full bg-gray-100/80 rounded-xl pl-12 pr-11 py-3.5 lg:py-4 text-base outline-none placeholder-gray-500"
          />

          {searchValue && (
            <button
              onClick={handleClear}
              aria-label="Очистить"
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition cursor-pointer z-10"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          )}

          {/* Dropdown — recent searches when the field is empty, live
              product matches once something's typed. */}
          {dropdownOpen && dropdownHasContent && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50">
              {showRecent && (
                <div className="py-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleRecentSearchClick(term)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition cursor-pointer group"
                    >
                      <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="flex-1 text-sm text-gray-800 truncate">{term}</span>
                      <span
                        onClick={(e) => handleRemoveRecentSearch(e, term)}
                        role="button"
                        aria-label="Удалить из истории"
                        className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-6 h-6 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition shrink-0"
                      >
                        <X className="w-3 h-3" strokeWidth={2.5} />
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {showSuggestions && (
                <div className="py-2">
                  {suggestLoading ? (
                    <p className="px-4 py-3 text-sm text-gray-400">Ищем...</p>
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
                              src={`${MEDIA_BASE}${mainImage}`}
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
                        Показать все результаты по «{searchValue.trim()}»
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleSearchSubmit()}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-primary hover:bg-gray-50 transition cursor-pointer"
                    >
                      <Search className="w-4 h-4 shrink-0" />
                      Показать все результаты по «{searchValue.trim()}»
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Full nav row — desktop only. On mobile/tablet these move to the
            fixed bottom tab bar, mirroring the native app's navigation. */}
        <div className="hidden lg:flex items-center gap-10 text-black/80 ml-4">
          <button
            onClick={handleFavoritesClick}
            className="flex flex-col items-center font-medium cursor-pointer hover:text-black transition"
          >
            <Heart className="w-5.5 h-5.5 mb-0.5" />
            Избранное
          </button>

          <button
            onClick={handleListingsClick}
            className="flex flex-col items-center font-medium cursor-pointer hover:text-black transition"
          >
            <Megaphone className="w-5.5 h-5.5 mb-0.5" />
            Объявления
          </button>

          <button className="flex flex-col items-center font-medium cursor-pointer hover:text-black transition">
            <MessageCircle className="w-5.5 h-5.5 mb-0.5" />
            Сообщения
          </button>

          <div className="relative">
            <button
              onClick={handleAccountClick}
              className="flex flex-col items-center font-medium cursor-pointer hover:text-black transition"
            >
              <User className="w-5.5 h-5.5 mb-0.5" />
              {isLoggedIn ? "Профиль" : "Войти"}
            </button>

            {profileMenuOpen && (
              <ProfileHeaderDropdown
                onClose={() => setProfileMenuOpen(false)}
                onOpenLanguage={() => setLanguageOpen(true)}
              />
            )}
          </div>

          <button
            onClick={handleSellClick}
            className="flex items-center gap-3 bg-gray-900 text-white px-6 py-3 rounded-3xl text-base font-medium cursor-pointer hover:bg-gray-800 transition"
          >
            Подать
            <span className="flex items-center justify-center w-6 h-6 bg-white rounded-full">
              <Plus className="w-4.5 h-4.5 text-gray-900" />
            </span>
          </button>
        </div>
      </div>

      <LanguageModal open={languageOpen} onClose={() => setLanguageOpen(false)} />
    </div>
  );
}