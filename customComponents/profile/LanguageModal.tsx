"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocaleRegion } from "@/hooks/useLocaleRegion";

const MODAL_Z_INDEX = 2147483647;
const LOCALE_COOKIE_NAME = "locale";
const SUPPORTED_LOCALES = ["ru", "uz"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

function setLocaleCookie(locale: Locale) {
  // 1 year, same shape as the region cookie set elsewhere — this is what
  // the middleware can read from once we wire that up, so a user's
  // language choice survives even if they later land on a URL with no
  // locale segment at all.
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
}

export default function LanguageModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale } = useLocaleRegion();
  const t = useTranslations("language");

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const handleSelectLocale = (targetLocale: Locale) => {
    if (targetLocale === locale) {
      onClose();
      return;
    }

    setLocaleCookie(targetLocale);

    // Swap only the first path segment (the locale) — everything after
    // it (region, category slug, product slug, etc.) stays exactly as
    // it was, same as how TopBar swaps only the region segment when
    // switching regions.
    const segments = pathname.split("/").filter(Boolean);
    segments[0] = targetLocale;

    const qs = searchParams.toString();
    router.push(`/${segments.join("/")}${qs ? `?${qs}` : ""}`);

    onClose();
  };

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{ zIndex: MODAL_Z_INDEX }}
    >
      <div className="absolute inset-0 bg-black/40 cursor-pointer" onClick={onClose} />

      <div className="relative bg-white rounded-2xl w-full max-w-[560px] p-8 z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">{t("title")}</h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-gray-600 transition"
            aria-label={t("close")}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-3 mb-8">
          <button
            onClick={() => handleSelectLocale("ru")}
            className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 transition rounded-xl px-4.5 py-4.5 cursor-pointer"
          >
            <span className="text-lg text-gray-800">{t("russian")}</span>
            {locale === "ru" && (
              <span className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </span>
            )}
          </button>

          <button
            onClick={() => handleSelectLocale("uz")}
            className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 transition rounded-xl px-4.5 py-4.5 cursor-pointer"
          >
            <span className="text-lg text-gray-800">{t("uzbek")}</span>
            {locale === "uz" && (
              <span className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </span>
            )}
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full cursor-pointer bg-primary hover:opacity-90 transition text-white font-normal text-lg py-3 rounded-xl"
        >
          {t("select")}
        </button>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}