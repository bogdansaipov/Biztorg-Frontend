import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LEGAL_DOCS } from "../../content/legal";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://biztorg.uz";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const doc = LEGAL_DOCS[slug];
  if (!doc) return {};

  const isUz = locale === "uz";
  const title = isUz ? doc.titleUz : doc.title;
  const content = isUz ? doc.contentUz : doc.content;

  const canonicalPath = `/${locale}/legal/${slug}`;
  const description = content.replace(/\s+/g, " ").trim().slice(0, 160);

  return {
    title: `${title} | BizTorg`,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        ru: `/ru/legal/${slug}`,
        uz: `/uz/legal/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${canonicalPath}`,
      siteName: "BizTorg",
      type: "website",
      locale: isUz ? "uz_UZ" : "ru_RU",
    },
  };
}

export default async function LegalDocPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("legal");
  const doc = LEGAL_DOCS[slug];

  if (!doc) notFound();

  const isUz = locale === "uz";
  const title = isUz ? doc.titleUz : doc.title;
  const content = isUz ? doc.contentUz : doc.content;
  const date = isUz ? doc.dateUz : doc.date;

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="max-w-[1400px] mx-auto py-8 sm:py-10 px-4 sm:px-6">
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6 overflow-x-auto whitespace-nowrap hide-scrollbar">
          <Link href={`/${locale}`} className="hover:text-gray-700 transition shrink-0">
            {t("home")}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <Link href={`/${locale}/legal`} className="hover:text-gray-700 transition shrink-0">
            {t("title")}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-gray-700 truncate">{title}</span>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">{title}</h1>
        <p className="text-gray-400 text-sm mb-8">{t("locationPrefix", { date })}</p>

        <div className="prose prose-sm sm:prose-base max-w-none whitespace-pre-line text-gray-700 leading-relaxed">
          {content}
        </div>
      </div>
    </div>
  );
}