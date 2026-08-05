import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://biztorg.uz";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("legal");
  const canonicalPath = `/${locale}/legal`;

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: canonicalPath,
      languages: {
        ru: "/ru/legal",
        uz: "/uz/legal",
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: `${SITE_URL}${canonicalPath}`,
      siteName: "BizTorg",
      type: "website",
      locale: locale === "ru" ? "ru_RU" : "uz_UZ",
    },
  };
}

export default async function LegalHubPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("legal");

  const DOCS = [
    { slug: "privacy-policy", label: t("docPrivacyPolicy") },
    { slug: "terms-of-service", label: t("docTermsOfService") },
    { slug: "cookie-policy", label: t("docCookiePolicy") },
    { slug: "listing-rules", label: t("docListingRules") },
  ];

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="max-w-[1400px] mx-auto py-8 sm:py-10 px-4 sm:px-6">
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6 overflow-x-auto whitespace-nowrap hide-scrollbar">
          <Link href={`/${locale}`} className="hover:text-gray-700 transition shrink-0">
            {t("home")}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-gray-700 shrink-0">{t("title")}</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">{t("title")}</h1>
        <p className="text-gray-500 mb-8">
          {t("subtitle")}
        </p>

        <div className="w-full lg:w-2/3 bg-white border border-gray-100 rounded-2xl divide-y divide-gray-100 overflow-hidden">
          {DOCS.map((doc) => (
            <Link
              key={doc.slug}
              href={`/${locale}/legal/${doc.slug}`}
              className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 shrink-0">
                <FileText className="w-4.5 h-4.5 text-gray-500" />
              </span>
              <span className="flex-1 text-[15px] text-gray-800">{doc.label}</span>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}