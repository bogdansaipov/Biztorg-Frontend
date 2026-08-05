import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import Header from "@/customComponents/header/Header";
import MobileBottomNav from "@/customComponents/bottomNavBar/Mobilebottomnav";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { CategoriesMenuProvider } from "@/context/CategoriesMenuContext";
import FavoritesHydrator from "@/components/FavoritesHydrator";
import AuthHydrator from "@/components/AuthHydrator";
import Toast from "@/components/Toast";

const SUPPORTED_LOCALES = ["ru", "uz"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as Locale)) {
    notFound();
  }

  // Required because we're using custom middleware instead of next-intl's
  // own — without this, requestLocale in i18n/request.ts has no way to
  // know which locale was actually requested and falls through to its
  // own notFound(), which is what was producing the 404 on every /ru/...
  // and /uz/... route regardless of whether the page itself existed.
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <CategoriesMenuProvider>
        <AuthModalProvider>
          <AuthHydrator />
          <FavoritesHydrator />
          <Header />
          <main className="pb-20 lg:pb-0">
            {children}
          </main>
          <MobileBottomNav />
          <Toast />
        </AuthModalProvider>
      </CategoriesMenuProvider>
    </NextIntlClientProvider>
  );
}