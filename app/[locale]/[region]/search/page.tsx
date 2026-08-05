import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { fetchAllCategoriesServer, fetchRegionsServer, fetchFilteredProductsServer } from "@/lib/server-api";
import { DEFAULT_REGION_SLUG, resolveRegionFilterParams } from "@/lib/region";
import SearchResultsClient from "@/customComponents/search/SearchResultsClient";

interface PageProps {
  params: Promise<{ locale: string; region: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("searchPage");

  return {
    title: t("metaTitle"),
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ params, searchParams }: PageProps) {
  const { locale, region: regionSlug } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const getParam = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : undefined);

  const page = getParam("page") ? Number(getParam("page")) : 1;
  const attrsParam = getParam("attrs");
  const sellerTypeParam = getParam("sellerType");

  const regions = await fetchRegionsServer();
  const region = regionSlug === DEFAULT_REGION_SLUG ? undefined : regions.find((r) => r.slug === regionSlug);
  if (regionSlug !== DEFAULT_REGION_SLUG && !region) notFound();

  const [categories, productsData] = await Promise.all([
    fetchAllCategoriesServer(),
    fetchFilteredProductsServer({
      page,
      limit: 20,
      query: getParam("query"),
      ...resolveRegionFilterParams(region, regions),
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

  return (
    <SearchResultsClient
      mode="search"
      category={null}
      categories={categories}
      attributes={[]}
      regions={regions}
      initialProducts={productsData.products}
      initialPagination={productsData.pagination}
    />
  );
};