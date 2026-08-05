import { cache } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getShopPublicProfile } from "@/services/shop.service";
import ShopProfileClient from "@/customComponents/shop/ShopProfileClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://biztorg.uz";
const MEDIA_BASE = "https://169-58-13-208.nip.io/public";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

const getShop = cache(getShopPublicProfile);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("shopProfile");

  try {
    const shop = await getShop(id);
    const canonicalPath = `/${locale}/shop/${id}`;
    const description = shop.description
      ? shop.description.replace(/\s+/g, " ").trim().slice(0, 160)
      : t("metaDescriptionFallback", { shopName: shop.shopName, count: shop.totalProducts });

    return {
      title: t("metaTitle", { shopName: shop.shopName }),
      description,
      alternates: {
        canonical: canonicalPath,
        languages: {
          ru: `/ru/shop/${id}`,
          uz: `/uz/shop/${id}`,
        },
      },
      openGraph: {
        title: shop.shopName,
        description,
        url: `${SITE_URL}${canonicalPath}`,
        siteName: "BizTorg",
        type: "website",
        locale: locale === "ru" ? "ru_RU" : "uz_UZ",
        images: shop.bannerUrl ? [{ url: `${MEDIA_BASE}${shop.bannerUrl}` }] : undefined,
      },
    };
  } catch (err) {
    console.error("Failed to load shop for metadata", err);
    return {
      title: t("fallbackTitle"),
    };
  }
}

export default async function ShopProfilePage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  let jsonLd: Record<string, unknown> | null = null;
  try {
    const shop = await getShop(id);
    const canonicalUrl = `${SITE_URL}/${locale}/shop/${id}`;

    jsonLd = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: shop.shopName,
      description: shop.description || undefined,
      url: canonicalUrl,
      image: shop.bannerUrl ? `${MEDIA_BASE}${shop.bannerUrl}` : undefined,
      telephone: shop.phone || undefined,
      address: shop.address ? { "@type": "PostalAddress", streetAddress: shop.address } : undefined,
      ...(shop.totalRatings > 0 && shop.averageRating != null
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: shop.averageRating,
              reviewCount: shop.totalRatings,
            },
          }
        : {}),
    };
  } catch (err) {
    console.error("Failed to load shop for JSON-LD", err);
  }

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <ShopProfileClient />
    </>
  );
}