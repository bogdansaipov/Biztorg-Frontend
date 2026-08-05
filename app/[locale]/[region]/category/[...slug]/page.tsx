import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  fetchAllCategoriesServer,
  fetchCategoryAttributesServer,
  fetchRegionsServer,
  fetchFilteredProductsServer,
} from "@/lib/server-api";
import { findCategoryBySlug, slugPathFor, getAncestorChain } from "@/lib/categorySlug";
import { getLocationText } from "@/lib/locationText";
import { localized } from "@/lib/localized";
import { DEFAULT_REGION_SLUG, resolveRegionFilterParams } from "@/lib/region";
import { MIN_PRODUCTS_TO_INDEX } from "@/lib/seo";
import SearchResultsClient from "@/customComponents/search/SearchResultsClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://biztorg.uz";

interface PageProps {
  params: Promise<{ locale: string; region: string; slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const getCategories = cache(fetchAllCategoriesServer);
const getRegions = cache(fetchRegionsServer);

function shouldNoIndex(sp: Record<string, string | string[] | undefined>, page: number): boolean {
  if (page > 1) return true;
  return Object.keys(sp).filter((k) => k !== "page").length > 0;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { locale, region: regionSlug, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("categoryPage");
  const sp = await searchParams;
  const categories = await getCategories();
  const category = findCategoryBySlug(slug[slug.length - 1], categories);

  if (!category) return {};

  const categoryName = localized(category, locale);
  const region =
    regionSlug === DEFAULT_REGION_SLUG ? undefined : (await getRegions()).find((r) => r.slug === regionSlug);
  const locationText = getLocationText(region, locale);

  const canonicalPath = `/${locale}/${regionSlug}/category/${slugPathFor(category, categories).join("/")}`;
  const page = typeof sp.page === "string" ? Number(sp.page) : 1;
  let noindex = shouldNoIndex(sp, page);

  if (!noindex && regionSlug !== DEFAULT_REGION_SLUG && region) {
    const { pagination } = await fetchFilteredProductsServer({
      page: 1,
      limit: 1,
      categoryId: category.id,
      ...resolveRegionFilterParams(region, await getRegions()),
    });
    if (pagination.total < MIN_PRODUCTS_TO_INDEX) noindex = true;
  }

  const title =
    page > 1
      ? t("metaTitlePaged", { category: categoryName, location: locationText, page })
      : t("metaTitle", { category: categoryName, location: locationText });
  const description = t("metaDescription", { category: categoryName, location: locationText });

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        ru: `/ru/${regionSlug}/category/${slugPathFor(category, categories).join("/")}`,
        uz: `/uz/${regionSlug}/category/${slugPathFor(category, categories).join("/")}`,
      },
    },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: t("ogTitle", { category: categoryName, location: locationText }),
      description,
      url: `${SITE_URL}${canonicalPath}`,
      siteName: "BizTorg",
      type: "website",
      locale: locale === "ru" ? "ru_RU" : "uz_UZ",
    },
  };
}

export default async function CategorySlugPage({ params, searchParams }: PageProps) {
  const { locale, region: regionSlug, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("search");
  const sp = await searchParams;

  const categories = await getCategories();
  const category = findCategoryBySlug(slug[slug.length - 1], categories);

  if (!category) notFound();

  const canonicalSlugPath = slugPathFor(category, categories);
  if (canonicalSlugPath.join("/") !== slug.join("/")) {
    const qs = new URLSearchParams(sp as Record<string, string>).toString();
    redirect(`/${locale}/${regionSlug}/category/${canonicalSlugPath.join("/")}${qs ? `?${qs}` : ""}`);
  }

  const regions = await getRegions();

  const region = regionSlug === DEFAULT_REGION_SLUG ? undefined : regions.find((r) => r.slug === regionSlug);
  if (regionSlug !== DEFAULT_REGION_SLUG && !region) notFound();

  const getParam = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : undefined);

  const page = getParam("page") ? Number(getParam("page")) : 1;
  const attrsParam = getParam("attrs");
  const sellerTypeParam = getParam("sellerType");
  const regionFilterParams = resolveRegionFilterParams(region, regions);

  const [attributes, productsData] = await Promise.all([
    fetchCategoryAttributesServer(category.id),
    fetchFilteredProductsServer({
      page,
      limit: 20,
      categoryId: category.id,
      ...regionFilterParams,
      priceFrom: getParam("priceFrom") ? Number(getParam("priceFrom")) : undefined,
      priceTo: getParam("priceTo") ? Number(getParam("priceTo")) : undefined,
      currency: getParam("currency") as "USD" | "UZS" | undefined,
      type: getParam("type") as "SALE" | "PURCHASE" | undefined,
      attributeValueIds: attrsParam ? attrsParam.split(",") : undefined,
      sellerType: sellerTypeParam ? sellerTypeParam.split(",") : undefined,
      sorting: getParam("sorting") as "NEW" | "CHEAP" | "EXPENSIVE" | undefined,
      isUrgent: getParam("isUrgent") === "true" || undefined,
      isFree: getParam("isFree") === "true" || undefined,
    }),
  ]);

  const categoryChain = getAncestorChain(category, categories);
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t("home"),
        item: `${SITE_URL}/${locale}/${regionSlug}`,
      },
      ...categoryChain.map((c, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: localized(c, locale),
        item: `${SITE_URL}/${locale}/${regionSlug}/category/${slugPathFor(c, categories).join("/")}`,
      })),
    ],
  };

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: productsData.products.map((p, i) => ({
      "@type": "ListItem",
      position: (page - 1) * 20 + i + 1,
      url: `${SITE_URL}/${locale}/obyavlenie/${p.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />

      <SearchResultsClient
        mode="category"
        category={category}
        categories={categories}
        attributes={attributes}
        regions={regions}
        initialProducts={productsData.products}
        initialPagination={productsData.pagination}
      />
    </>
  );
}