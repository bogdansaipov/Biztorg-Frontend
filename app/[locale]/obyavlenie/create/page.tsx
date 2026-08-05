import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CreateProductPage from "@/customComponents/createProduct/CreateProductPage";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("createProduct");

  return {
    title: `${t("pageTitle")} | BizTorg`,
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CreateProductPage />;
}