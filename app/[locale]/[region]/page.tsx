import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import CategoryGrid from "@/customComponents/category/CategoryGrid";
import ProductGrid from "@/customComponents/product/ProductGrid";
import { getParentCategories } from "@/services/category.service";
import { getProducts } from "@/services/product.service";
import { fetchRegionsServer } from "@/lib/server-api";
import { getLocationText } from "@/lib/locationText";
import { DEFAULT_REGION_SLUG } from "@/lib/region";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://biztorg.uz";

interface PageProps {
  params: Promise<{ locale: string; region: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, region: regionSlug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const region =
    regionSlug === DEFAULT_REGION_SLUG ? undefined : (await fetchRegionsServer()).find((r) => r.slug === regionSlug);
  const locationText = getLocationText(region, locale);
  const canonicalPath = `/${locale}/${regionSlug}`;

  return {
    title: t("metaTitle", { location: locationText }),
    description: t("metaDescription", { location: locationText }),
    alternates: {
      canonical: canonicalPath,
      languages: {
        ru: `/ru/${regionSlug}`,
        uz: `/uz/${regionSlug}`,
      },
    },
    openGraph: {
      title: t("ogTitle", { location: locationText }),
      description: t("ogDescription"),
      url: `${SITE_URL}${canonicalPath}`,
      siteName: "BizTorg",
      locale: locale === "ru" ? "ru_RU" : "uz_UZ",
      type: "website",
    },
  };
}

export default async function Home({ params }: PageProps) {
  const { locale, region: regionSlug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");

  const regions = await fetchRegionsServer();
  const region = regionSlug === DEFAULT_REGION_SLUG ? undefined : regions.find((r) => r.slug === regionSlug);
  if (regionSlug !== DEFAULT_REGION_SLUG && !region) notFound();

  const categories = await getParentCategories();

  const { products, pagination } = await getProducts(1, 20, region?.id);

  const locationText = getLocationText(region, locale);

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BizTorg",
    url: `${SITE_URL}/${locale}/${regionSlug}`,
    logo: `${SITE_URL}/favicon.ico`,
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BizTorg",
    url: `${SITE_URL}/${locale}/${regionSlug}`,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/${locale}/search?query={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />
      <main>
        <h1 className="text-2xl sm:text-3xl lg:text-[35px] font-bold max-w-[1400px] mx-auto px-4 lg:px-0 mt-4 text-black/80">
          {t("listingsIn", { location: locationText })}
        </h1>
        <CategoryGrid categories={categories} />
        <ProductGrid
          initialProducts={products}
          totalPages={pagination.pages}
          initialPage={pagination.page}
          regionId={region?.id}
        />
      </main>
    </>
  );
}