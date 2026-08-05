import type { Metadata } from "next";
import "./globals.css";
import { inter } from './fonts'

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
        {children}
      </body>
    </html>
  );
}