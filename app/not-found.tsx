import Link from "next/link";
import { cookies } from "next/headers";
import { getParentCategories } from "@/services/category.service";
import { REGION_COOKIE_NAME, DEFAULT_REGION_SLUG } from "@/lib/region";
import { localized } from "@/lib/localized";

const MEDIA_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ?? "https://169-58-13-208.nip.io";

const LOCALE_COOKIE_NAME = "locale";

// This page can't use next-intl at all — see the comment on the
// component below for why. Kept as a tiny local dictionary instead,
// covering just the handful of strings this page needs.
const STRINGS = {
  ru: {
    notFoundTitle: "Страница не найдена",
    notFoundBody:
      "Возможно, объявление было удалено, или в ссылке опечатка. Но у нас есть много других объявлений и категорий.",
    home: "На главную",
    popularCategories: "Популярные категории",
  },
  uz: {
    notFoundTitle: "Sahifa topilmadi",
    notFoundBody:
      "Ehtimol, e'lon o'chirilgan yoki havolada xatolik bor. Lekin bizda boshqa ko'plab e'lonlar va kategoriyalar mavjud.",
    home: "Bosh sahifaga",
    popularCategories: "Mashhur kategoriyalar",
  },
} as const;

// This page is what actually renders for any route that falls through to
// notFound() — including notFound() calls thrown from inside
// app/[locale]/layout.tsx itself. Since that layout is the one failing
// to render, its own segment can't serve as the not-found boundary — Next
// bubbles up to the nearest ancestor with a not-found.tsx, which is this
// one, at the true root. Critically, this means this page renders
// OUTSIDE app/[locale]/layout.tsx entirely, and therefore outside
// NextIntlClientProvider too (that provider only wraps {children} inside
// the locale layout) — useTranslations()/getTranslations() have no
// context to read from here, hence the small inline STRINGS dictionary
// above instead of the usual next-intl pattern used everywhere else.
//
// The root app/layout.tsx (Header, providers, etc.) still wraps this
// normally, which is why the header/region/language switcher keep
// showing above the "page not found" content instead of a bare page.
export default async function NotFound() {
  // The URL that got us here might itself be broken (e.g. a typo'd
  // locale segment), so every link on this page is built from known-safe
  // values read from cookies rather than trying to parse the current
  // (possibly invalid) path.
  const cookieStore = await cookies();

  const rawLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  const locale = rawLocale === "uz" ? "uz" : "ru";
  const t = STRINGS[locale];

  const region = cookieStore.get(REGION_COOKIE_NAME)?.value ?? DEFAULT_REGION_SLUG;

  const categories = await getParentCategories();

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-0 py-16 sm:py-24 text-center">
      <p className="text-7xl sm:text-8xl font-bold text-gray-900 mb-4">404</p>
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">{t.notFoundTitle}</h1>
      <p className="text-gray-500 mb-8">
        {t.notFoundBody}
      </p>

      <Link
        href={`/${locale}/${region}`}
        className="inline-block bg-gray-900 hover:opacity-90 transition text-white font-medium px-8 py-3.5 rounded-xl mb-14"
      >
        {t.home}
      </Link>

      {categories.length > 0 && (
        <div className="text-left">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t.popularCategories}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
            {categories.slice(0, 12).map((category) => {
              const name = localized(category, locale);
              return (
                <a
                  key={category.id}
                  href={`/${locale}/${region}/category/${category.slug}`}
                  className="group flex items-center gap-2 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors px-2.5 py-2.5"
                >
                  <img
                    src={`${MEDIA_BASE}/public${category.imageUrl}`}
                    alt={name}
                    className="w-12 h-12 object-contain shrink-0"
                  />
                  <span className="flex-1 min-w-0 text-[15px] leading-tight font-normal text-black/80 line-clamp-2 text-left">
                    {name}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}