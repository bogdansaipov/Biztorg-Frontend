import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { inter } from './fonts'

export const metadata: Metadata = {
  title: "BizTorg",
  description: "Объявления в Узбекистане",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const locale = headersList.get("x-locale") === "uz" ? "uz" : "ru";

  return (
    <html lang={locale} className={inter.variable}>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}