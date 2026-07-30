import type { Metadata } from "next";
import "./globals.css";
import Header from "@/customComponents/header/Header";
import MobileBottomNav from "@/customComponents/bottomNavBar/Mobilebottomnav";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { CategoriesMenuProvider } from "@/context/CategoriesMenuContext";
import { inter } from './fonts'
import FavoritesHydrator from "@/components/FavoritesHydrator";
import Toast from "@/components/Toast";

export const metadata: Metadata = {
  title: "BizTorg",
  description: "Объявления в Узбекистане",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className={inter.className}>
        <CategoriesMenuProvider>
          <AuthModalProvider>
            {/* Invisible — just hydrates useFavoritesStore on mount so
                every FavoriteButton on the site knows the real favorited
                state, regardless of how any given page's product list
                was fetched. */}
            <FavoritesHydrator />
            <Header />
            <main className="pb-20 lg:pb-0">
              {children}
            </main>
            <MobileBottomNav />
            {/* Global toast — FavoriteButton (and anything else) calls
                useToastStore().show(message) to trigger it; this is the
                one place it actually renders. */}
            <Toast />
          </AuthModalProvider>
        </CategoriesMenuProvider>
      </body>
    </html>
  );
}