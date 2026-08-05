"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { NavigationArrowIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { Region } from "@/types/region/region";
import { useLocaleRegion } from "@/hooks/useLocaleRegion";
import { DEFAULT_REGION_SLUG, NON_REGION_ROOTS, setRegionCookie } from "@/lib/region";
import { useNavigationPendingStore } from "@/stores/navigationPending.store";
import { localized } from "@/lib/localized";
import RegionSelectMenu from "@/customComponents/createProduct/RegionSelectMenu";
import LanguageModal from "@/customComponents/profile/LanguageModal";

function RussianFlagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <clipPath id="ru-flag-circle">
        <circle cx="10" cy="10" r="10" />
      </clipPath>
      <g clipPath="url(#ru-flag-circle)">
        <rect width="20" height="20" fill="#fff" />
        <rect y="6.67" width="20" height="6.67" fill="#0039A6" />
        <rect y="13.33" width="20" height="6.67" fill="#D52B1E" />
      </g>
    </svg>
  );
}

function UzbekFlagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <clipPath id="uz-flag-circle">
        <circle cx="10" cy="10" r="10" />
      </clipPath>
      <g clipPath="url(#uz-flag-circle)">
        <rect width="20" height="20" fill="#fff" />
        <rect width="20" height="6.2" fill="#1EB53A" />
        <rect y="13.8" width="20" height="6.2" fill="#0099B5" />
        <rect y="5.6" width="20" height="0.6" fill="#CE1126" />
        <rect y="13.2" width="20" height="0.6" fill="#CE1126" />
        <circle cx="5" cy="5" r="1.6" fill="#fff" />
        <circle cx="5.6" cy="4.7" r="1.4" fill="#0099B5" />
      </g>
    </svg>
  );
}

export default function TopBar({ regions }: { regions: Region[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale, region } = useLocaleRegion();
  const setPending = useNavigationPendingStore((s) => s.setPending);
  const t = useTranslations("header");

  const [pickerOpen, setPickerOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const selectedRegion = region === DEFAULT_REGION_SLUG ? null : regions.find((r) => r.slug === region) ?? null;

  const handleRegionSelect = (newRegion: Region | null) => {
    const targetSlug = newRegion ? newRegion.slug : DEFAULT_REGION_SLUG;
    setRegionCookie(targetSlug);
    setPending(true);

    const segments = pathname.split("/").filter(Boolean);
    const secondSegment = segments[1];
    const isRegionScoped = !!secondSegment && !NON_REGION_ROOTS.includes(secondSegment);

    if (isRegionScoped) {
      const restSegments = segments.slice(2);
      const qs = searchParams.toString();
      router.push(
        `/${locale}/${targetSlug}${restSegments.length ? `/${restSegments.join("/")}` : ""}${
          qs ? `?${qs}` : ""
        }`,
      );
    } else {
      router.push(`/${locale}/${targetSlug}`);
    }

    setPickerOpen(false);
  };

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-0 py-2 flex items-center justify-between">
        <a
          href={`/${locale}/${region}`}
          className="font-semibold text-xl sm:text-2xl lg:text-3xl text-black/80 hover:opacity-80 transition"
        >
          BizTorgUz
        </a>

        <div className="flex items-center gap-3 sm:gap-6 text-black/80">
          <button
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-1 hover:text-black transition cursor-pointer"
          >
            <NavigationArrowIcon size={16} weight="fill" className="-scale-x-100 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline text-sm sm:text-base">
              {selectedRegion ? localized(selectedRegion, locale) : t("allRegions")}
            </span>
          </button>

          <button
            onClick={() => setLanguageOpen(true)}
            className="flex items-center gap-1.5 hover:text-black transition cursor-pointer"
          >
            {locale === "uz" ? (
              <UzbekFlagIcon className="w-5 h-5 shrink-0" />
            ) : (
              <RussianFlagIcon className="w-5 h-5 shrink-0" />
            )}
            <span className="text-sm sm:text-base">{locale.toUpperCase()}</span>
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {pickerOpen && (
        <RegionSelectMenu
          regions={regions}
          selectedRegionId={selectedRegion?.id ?? null}
          onSelect={handleRegionSelect}
          onClose={() => setPickerOpen(false)}
        />
      )}

      <LanguageModal open={languageOpen} onClose={() => setLanguageOpen(false)} />
    </div>
  );
}