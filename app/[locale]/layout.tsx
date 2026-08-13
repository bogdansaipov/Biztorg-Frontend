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
import SessionExpiredToast from "@/components/SessionExpiredToast";
import FooterWrapper from "@/components/FooterWrapper";

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

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <CategoriesMenuProvider>
        <AuthModalProvider>
          <AuthHydrator />
          <FavoritesHydrator />
          <SessionExpiredToast />
          <Header />
          <main className="pb-20 lg:pb-0">
            {children}
          </main>
          <FooterWrapper />
          <MobileBottomNav />
          <Toast />
        </AuthModalProvider>
      </CategoriesMenuProvider>
    </NextIntlClientProvider>
  );
}