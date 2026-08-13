"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { useLocaleRegion } from "@/hooks/useLocaleRegion";
import { DEFAULT_REGION_SLUG } from "@/lib/region";
import { localized } from "@/lib/localized";
import { Region } from "@/types/region/region";

const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/biztorg/",
  telegram: "https://t.me/biztorguz",
  facebook: "https://www.facebook.com/profile.php?id=61570125598203",
};

// TODO: no App Store listing/link yet — placeholder until it exists.
const APP_STORE_LINK = "#";
const GOOGLE_PLAY_LINK = "https://play.google.com/store/apps/details?id=com.shortway.biztorg&pcampaignid=web_share";

const HIDE_ON_SEGMENTS = ["search", "create"];

function shouldHideFooter(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  return segments.some((s) => HIDE_ON_SEGMENTS.includes(s)) || pathname.includes("/category/");
}

function RussianFlagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <clipPath id="footer-ru-flag-circle">
        <circle cx="10" cy="10" r="10" />
      </clipPath>
      <g clipPath="url(#footer-ru-flag-circle)">
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
      <clipPath id="footer-uz-flag-circle">
        <circle cx="10" cy="10" r="10" />
      </clipPath>
      <g clipPath="url(#footer-uz-flag-circle)">
        <rect width="20" height="20" fill="#fff" />
        <rect width="20" height="6.2" fill="#0099B5" />
        <rect y="6.2" width="20" height="0.6" fill="#CE1126" />
        <rect y="13.2" width="20" height="0.6" fill="#CE1126" />
        <rect y="13.8" width="20" height="6.2" fill="#1EB53A" />
        <circle cx="5.2" cy="3.4" r="1.7" fill="#fff" />
        <circle cx="5.9" cy="3.0" r="1.4" fill="#0099B5" />
        <circle cx="8.1" cy="1.7" r="0.22" fill="#fff" />
        <circle cx="9.1" cy="1.7" r="0.22" fill="#fff" />
        <circle cx="10.1" cy="1.7" r="0.22" fill="#fff" />
        <circle cx="7.6" cy="2.6" r="0.22" fill="#fff" />
        <circle cx="8.6" cy="2.6" r="0.22" fill="#fff" />
        <circle cx="9.6" cy="2.6" r="0.22" fill="#fff" />
        <circle cx="10.6" cy="2.6" r="0.22" fill="#fff" />
        <circle cx="8.1" cy="3.5" r="0.22" fill="#fff" />
        <circle cx="9.1" cy="3.5" r="0.22" fill="#fff" />
        <circle cx="10.1" cy="3.5" r="0.22" fill="#fff" />
        <circle cx="8.6" cy="4.4" r="0.22" fill="#fff" />
        <circle cx="9.6" cy="4.4" r="0.22" fill="#fff" />
      </g>
    </svg>
  );
}

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.1475 0.75C16.2469 2.01122 15.8492 3.27244 15.0438 4.24338C14.2583 5.22433 13.0751 5.78488 11.8223 5.77487C11.7427 4.54367 12.1504 3.3325 12.9558 2.41161C13.7711 1.4707 14.9146 0.880126 16.1475 0.75ZM20.1292 8.17598C18.6806 9.06488 17.7915 10.623 17.7715 12.3208C17.7715 14.2385 18.9204 15.9663 20.6986 16.7154C20.3589 17.814 19.8495 18.8627 19.1801 19.8016C18.291 21.1399 17.352 22.4483 15.8635 22.4683C15.1551 22.4829 14.6784 22.2802 14.1823 22.0692C13.664 21.8488 13.1244 21.6193 12.277 21.6193C11.382 21.6193 10.8176 21.8551 10.2723 22.0828C9.80114 22.2796 9.34424 22.4705 8.70063 22.4982C7.28205 22.5582 6.20313 21.08 5.27406 19.7516C3.42592 17.045 1.98736 12.1311 3.91543 8.78523C4.82452 7.15725 6.51282 6.11854 8.38095 6.05861C9.18561 6.04161 9.95812 6.35239 10.6347 6.62457C11.1509 6.83223 11.6112 7.01742 11.9873 7.01742C12.3159 7.01742 12.7611 6.84099 13.2807 6.63506C14.1041 6.30877 15.1142 5.90844 16.1432 6.01866C17.7316 6.0686 19.2101 6.86761 20.1292 8.17598Z"
        fill="currentColor"
      />
    </svg>
  );
}

function GooglePlayLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 25 25" fill="none" className={className} aria-hidden>
      <path d="M21.7756 11.5149L17.4561 9.05957L14.0156 12.5L17.4561 15.9405L21.7756 13.4852C22.541 13.0532 22.541 11.9468 21.7756 11.5149Z" fill="url(#footer-gplay-0)" />
      <path d="M14.0156 12.5001L3.73969 2.22412C3.53508 2.42873 3.40625 2.70154 3.40625 3.0274V21.9727C3.40625 22.2986 3.53508 22.579 3.73969 22.776L14.0156 12.5001Z" fill="url(#footer-gplay-1)" />
      <path d="M17.456 9.05959L5.10369 2.04225C4.62626 1.76943 4.08064 1.89068 3.73962 2.22412L14.0156 12.5001L17.456 9.05959Z" fill="url(#footer-gplay-2)" />
      <path d="M14.0156 12.5001L3.73962 22.776C4.08064 23.117 4.62626 23.2307 5.10369 22.9579L17.456 15.9405L14.0156 12.5001Z" fill="url(#footer-gplay-3)" />
      <defs>
        <linearGradient id="footer-gplay-0" x1="14.0156" y1="12.5" x2="22.3516" y2="12.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFBD00" />
          <stop offset="1" stopColor="#FFE000" />
        </linearGradient>
        <linearGradient id="footer-gplay-1" x1="14.0156" y1="12.5001" x2="3.40625" y2="23.1094" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00BEFF" />
          <stop offset="1" stopColor="#00E3FF" />
        </linearGradient>
        <linearGradient id="footer-gplay-2" x1="3.40623" y1="1.89067" x2="14.0156" y2="12.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#15CF74" />
          <stop offset="1" stopColor="#00F076" />
        </linearGradient>
        <linearGradient id="footer-gplay-3" x1="14.0156" y1="12.5001" x2="3.40623" y2="23.1094" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF3A44" />
          <stop offset="1" stopColor="#E12653" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function InstagramColorLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <g clipPath="url(#footer-insta-clip)">
        <path d="M24 0c20 0 24 4 24 24s-4 24-24 24S0 44 0 24 4 0 24 0Z" fill="url(#footer-insta-grad)" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M24 12.522c3.738 0 4.18.015 5.657.082 1.365.062 2.106.29 2.6.482.653.254 1.12.557 1.61 1.047.49.49.793.956 1.047 1.61.191.493.42 1.235.481 2.6.068 1.476.082 1.918.082 5.657 0 3.738-.014 4.18-.082 5.657-.062 1.365-.29 2.106-.482 2.6a4.341 4.341 0 0 1-1.046 1.61c-.49.49-.957.793-1.61 1.047-.494.191-1.235.42-2.6.481-1.476.068-1.919.082-5.657.082-3.739 0-4.181-.014-5.657-.082-1.365-.062-2.107-.29-2.6-.482a4.342 4.342 0 0 1-1.61-1.046 4.329 4.329 0 0 1-1.047-1.61c-.192-.494-.42-1.235-.482-2.6-.067-1.476-.082-1.919-.082-5.657 0-3.739.015-4.181.082-5.657.062-1.365.29-2.107.482-2.6a4.343 4.343 0 0 1 1.047-1.61 4.33 4.33 0 0 1 1.61-1.047c.493-.192 1.235-.42 2.6-.482 1.476-.067 1.918-.082 5.657-.082ZM24 10c-3.802 0-4.28.016-5.773.085-1.49.067-2.507.304-3.398.65a6.857 6.857 0 0 0-2.48 1.615 6.858 6.858 0 0 0-1.614 2.48c-.346.89-.583 1.908-.65 3.397C10.015 19.721 10 20.197 10 24c0 3.802.016 4.279.085 5.772.067 1.49.304 2.507.65 3.398.358.921.837 1.702 1.615 2.48a6.862 6.862 0 0 0 2.48 1.615c.89.346 1.908.583 3.398.65 1.493.069 1.97.085 5.772.085 3.802 0 4.28-.016 5.773-.084 1.49-.068 2.508-.305 3.398-.651a6.857 6.857 0 0 0 2.48-1.615 6.86 6.86 0 0 0 1.614-2.48c.346-.89.583-1.908.651-3.398.068-1.493.085-1.97.085-5.772 0-3.802-.017-4.28-.085-5.773-.068-1.49-.304-2.508-.65-3.398a6.855 6.855 0 0 0-1.616-2.48 6.86 6.86 0 0 0-2.48-1.614c-.89-.346-1.908-.583-3.398-.65C28.279 10.015 27.802 10 24 10Zm0 6.81a7.189 7.189 0 1 0 0 14.378 7.189 7.189 0 0 0 0-14.377Zm0 11.856a4.666 4.666 0 1 1 0-9.333 4.666 4.666 0 0 1 0 9.333Zm9.153-12.14a1.68 1.68 0 1 1-3.36 0 1.68 1.68 0 0 1 3.36 0Z"
          fill="#fff"
        />
      </g>
      <defs>
        <linearGradient id="footer-insta-grad" x1="42.81" y1="5.656" x2="5.044" y2="42.485" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BA00B2" />
          <stop offset=".5" stopColor="#F40000" />
          <stop offset="1" stopColor="#FFA800" />
        </linearGradient>
        <clipPath id="footer-insta-clip">
          <path fill="#fff" d="M0 0h48v48H0z" />
        </clipPath>
      </defs>
    </svg>
  );
}

function TelegramColorLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <g clipPath="url(#footer-tg-clip)">
        <path d="M24 0c20 0 24 4 24 24s-4 24-24 24S0 44 0 24 4 0 24 0Z" fill="url(#footer-tg-grad)" />
        <path
          d="M11.792 23.799c6.996-3.048 11.662-5.058 13.996-6.029 6.665-2.772 8.05-3.254 8.953-3.27.198-.003.642.046.93.28.242.196.31.463.341.65.032.186.072.612.04.944-.36 3.795-1.924 13.005-2.719 17.255-.336 1.798-.998 2.401-1.64 2.46-1.394.129-2.452-.92-3.802-1.806-2.112-1.384-3.305-2.246-5.356-3.597-2.37-1.562-.833-2.42.517-3.823.354-.367 6.494-5.952 6.613-6.459.015-.063.029-.3-.111-.424-.14-.125-.348-.082-.497-.048-.212.048-3.587 2.278-10.124 6.69-.958.659-1.825.979-2.602.962-.857-.018-2.506-.484-3.731-.883-1.503-.488-2.698-.747-2.594-1.576.054-.432.65-.874 1.786-1.326Z"
          fill="#fff"
        />
      </g>
      <defs>
        <linearGradient id="footer-tg-grad" x1="24" y1="0" x2="24" y2="47.644" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2AABEE" />
          <stop offset="1" stopColor="#229ED9" />
        </linearGradient>
        <clipPath id="footer-tg-clip">
          <path fill="#fff" d="M0 0h48v48H0z" />
        </clipPath>
      </defs>
    </svg>
  );
}

function FacebookColorLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <g clipPath="url(#footer-fb-clip)">
        <path d="M24 0c20 0 24 4 24 24s-4 24-24 24S0 44 0 24 4 0 24 0Z" fill="#1877F2" />
        <path
          d="M33.186 30.938 34.25 24h-6.656v-4.502c0-1.898.93-3.748 3.911-3.748h3.026V9.844s-2.746-.469-5.372-.469c-5.482 0-9.065 3.322-9.065 9.337V24H14v6.938h6.094v17.009C21.5 48 21.5 48 23.844 48c1.276 0 2.656 0 3.75-.053v-17.01h5.592Z"
          fill="#fff"
        />
      </g>
      <defs>
        <clipPath id="footer-fb-clip">
          <path fill="#fff" d="M0 0h48v48H0z" />
        </clipPath>
      </defs>
    </svg>
  );
}

export default function Footer({ regions }: { regions: Region[] }) {
  const pathname = usePathname();
  const { locale } = useLocaleRegion();
  const t = useTranslations("footer");

  const [regionsExpanded, setRegionsExpanded] = useState(false);

  if (shouldHideFooter(pathname)) return null;

  const topLevelRegions = regions.filter((r) => !(r as unknown as { parentId?: string }).parentId);
  const COLLAPSED_REGION_COUNT = 8;
  const visibleRegions = regionsExpanded ? topLevelRegions : topLevelRegions.slice(0, COLLAPSED_REGION_COUNT);
  const hiddenCount = topLevelRegions.length - visibleRegions.length;

  const switchLocaleHref = (targetLocale: "ru" | "uz") => {
    const segments = pathname.split("/").filter(Boolean);
    segments[0] = targetLocale;
    return `/${segments.join("/")}`;
  };

  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-100 mt-10">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-0 py-10">
        {topLevelRegions.length > 0 && (
          <div className="mb-10 text-center sm:text-left">
            <h2 className="text-base font-semibold text-gray-800 mb-4">{t("regionsHeading")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-6 gap-y-3 justify-items-center sm:justify-items-start">
              {visibleRegions.map((region) => (
                <Link
                  key={region.id}
                  href={`/${locale}/${region.slug}`}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:underline transition"
                >
                  {localized(region, locale)}
                </Link>
              ))}

              {hiddenCount > 0 && !regionsExpanded && (
                <button
                  onClick={() => setRegionsExpanded(true)}
                  className="flex items-center gap-1 text-sm font-medium text-primary cursor-pointer"
                >
                  {t("showMoreRegions", { count: hiddenCount })}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {regionsExpanded && (
              <button
                onClick={() => setRegionsExpanded(false)}
                className="mt-3 text-sm font-medium text-gray-600 hover:text-gray-800 transition cursor-pointer"
              >
                {t("showLess")}
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col sm:grid sm:grid-cols-4 gap-8 mb-10 text-center sm:text-left items-center sm:items-start">
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">{t("companyHeading")}</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>{t("aboutUs")}</li>
              <li>{t("support")}</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-3">{t("linksHeading")}</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <Link href={`/${locale}/${DEFAULT_REGION_SLUG}`} className="hover:text-gray-800 transition">
                  {t("allRegions")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/legal`} className="hover:text-gray-800 transition">
                  {t("rules")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-3">{t("rules")}</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <Link href={`/${locale}/legal/privacy-policy`} className="hover:text-gray-800 transition">
                  {t("privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/legal/terms-of-service`} className="hover:text-gray-800 transition">
                  {t("termsOfService")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-3">{t("downloadApp")}</h3>
            <div className="flex flex-col items-center sm:items-start gap-2.5">
              <a
                href={APP_STORE_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-800 hover:text-gray-500 transition"
              >
                <AppleLogo className="w-6 h-6" />
                <span className="text-sm font-medium">App Store</span>
              </a>
              <a
                href={GOOGLE_PLAY_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-800 hover:opacity-70 transition"
              >
                <GooglePlayLogo className="w-6 h-6" />
                <span className="text-sm font-medium">Google Play</span>
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-gray-200">
          <div className="text-center sm:text-left">
            <p className="text-sm font-semibold text-gray-800 mb-3">{t("socialLabel")}</p>
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <InstagramColorLogo className="w-9 h-9" />
              </a>
              <a href={SOCIAL_LINKS.telegram} target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                <TelegramColorLogo className="w-9 h-9" />
              </a>
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <FacebookColorLogo className="w-9 h-9" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={switchLocaleHref("ru")}
              className={`flex items-center gap-1.5 text-sm transition ${
                locale === "ru" ? "text-gray-800 font-medium" : "text-gray-400 hover:text-gray-700"
              }`}
            >
              <RussianFlagIcon className="w-4.5 h-4.5" />
              RU
            </Link>
            <Link
              href={switchLocaleHref("uz")}
              className={`flex items-center gap-1.5 text-sm transition ${
                locale === "uz" ? "text-gray-800 font-medium" : "text-gray-400 hover:text-gray-700"
              }`}
            >
              <UzbekFlagIcon className="w-4.5 h-4.5" />
              UZ
            </Link>
          </div>

          <p className="text-xs text-gray-400 text-center sm:text-right">
            {t("copyright", { year })}
          </p>
        </div>
      </div>
    </footer>
  );
}