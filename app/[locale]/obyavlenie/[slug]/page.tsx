import { cache } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HorizontalProductSection } from "@/customComponents/product/HorizontalProductSection";
import ProductDetails from "@/customComponents/product/ProductDetails";
import { getRecommendationProducts, getSingleProduct } from "@/services/product.service";
import { Currency } from "@/enums/CurrencyEnum";
import { localized } from "@/lib/localized";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://biztorg.uz";
const MEDIA_BASE = "https://169-58-13-208.nip.io/public";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

const getProduct = cache(getSingleProduct);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("productPage");
  const product = await getProduct(slug);

  const priceText = product.price
    ? `${Number(product.price).toLocaleString("ru-RU")} ${product.currency === Currency.USD ? (locale === "uz" ? "u.e" : "у.е") : (locale === "uz" ? "so'm" : "сум")}`
    : t("freePrice");

  const description = product.description
    ? product.description.replace(/\s+/g, " ").trim().slice(0, 160)
    : t("descriptionFallback", { name: product.name, price: priceText });

  const mainImage = product.images.find((i) => i.isMain)?.imageUrl ?? product.images[0]?.imageUrl;
  const canonicalPath = `/${locale}/obyavlenie/${product.slug}`;

  return {
    title: `${product.name} — ${priceText} | Biztorg`,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        ru: `/ru/obyavlenie/${product.slug}`,
        uz: `/uz/obyavlenie/${product.slug}`,
      },
    },
    openGraph: {
      title: product.name,
      description,
      url: `${SITE_URL}${canonicalPath}`,
      siteName: "Biztorg",
      type: "website",
      locale: locale === "ru" ? "ru_RU" : "uz_UZ",
      images: mainImage ? [{ url: `${MEDIA_BASE}${mainImage}` }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("productPage");
  const product = await getProduct(slug);
  const { userProducts, similarProducts } = await getRecommendationProducts(product.id);

  const mainImage = product.images.find((i) => i.isMain)?.imageUrl ?? product.images[0]?.imageUrl;
  const canonicalUrl = `${SITE_URL}/${locale}/obyavlenie/${product.slug}`;

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.name,
    image: product.images.map((i) => `${MEDIA_BASE}${i.imageUrl}`),
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: product.currency === Currency.USD ? "USD" : "UZS",
      price: product.price ? Number(product.price) : 0,
      availability: "https://schema.org/InStock",
    },
    ...(product.totalRatings > 0 && product.averageRating != null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.averageRating,
            reviewCount: product.totalRatings,
          },
        }
      : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t("home"),
        item: `${SITE_URL}/${locale}`,
      },
      ...(product.category?.name
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: localized(product.category, locale),
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: product.category?.name ? 3 : 2,
        name: product.name,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <ProductDetails product={product} />

      <HorizontalProductSection title={t("sellerListings")} products={userProducts} />

      <HorizontalProductSection title={t("similarListings")} products={similarProducts} />
    </>
  );
}