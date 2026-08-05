import { cache } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getUserPublicProfile } from "@/services/user.service";
import PublicUserProfileClient from "@/customComponents/user/PublicUserProfileClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://biztorg.uz";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

const getProfile = cache(getUserPublicProfile);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("publicProfile");

  try {
    const profile = await getProfile(id);
    const canonicalPath = `/${locale}/user/${id}`;

    return {
      title: `${profile.name} — ${t("profileFallbackTitle")}`,
      description: t("listingsCount", { count: profile.totalProducts }),
      alternates: {
        canonical: canonicalPath,
        languages: {
          ru: `/ru/user/${id}`,
          uz: `/uz/user/${id}`,
        },
      },
      openGraph: {
        title: profile.name,
        description: t("listingsCount", { count: profile.totalProducts }),
        url: `${SITE_URL}${canonicalPath}`,
        siteName: "BizTorg",
        type: "profile",
        locale: locale === "ru" ? "ru_RU" : "uz_UZ",
      },
    };
  } catch (err) {
    console.error("Failed to load user profile for metadata", err);
    return {
      title: t("profileFallbackTitle"),
    };
  }
}

export default async function PublicUserProfilePage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  let jsonLd: Record<string, unknown> | null = null;
  try {
    const profile = await getProfile(id);
    const canonicalUrl = `${SITE_URL}/${locale}/user/${id}`;

    jsonLd = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: profile.name,
      url: canonicalUrl,
      ...(profile.totalRatings > 0 && profile.averageRating != null
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: profile.averageRating,
              reviewCount: profile.totalRatings,
            },
          }
        : {}),
    };
  } catch (err) {
    console.error("Failed to load user profile for JSON-LD", err);
  }

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <PublicUserProfileClient />
    </>
  );
}