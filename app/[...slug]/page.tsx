import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  fetchAllCategoriesServer,
  fetchCategoryAttributesServer,
  fetchRegionsServer,
  fetchFilteredProductsServer,
} from "@/lib/server-api";
import { findCategoryBySlug, slugPathFor } from "@/lib/categorySlug";
import SearchResultsClient from "@/customComponents/search/SearchResultsClient";

interface PageProps {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const categories = await fetchAllCategoriesServer();
  const category = findCategoryBySlug(slug[slug.length - 1], categories);

  if (!category) return {};

  return {
    title: `${category.name} — купить и продать в Узбекистане | BizTorg`,
    description: `Объявления в категории «${category.name}» на BizTorg — покупайте и продавайте быстро, без комиссии.`,
    alternates: {
      canonical: `/${slugPathFor(category, categories).join("/")}`,
    },
  };
}

export default async function CategorySlugPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const categories = await fetchAllCategoriesServer();
  const category = findCategoryBySlug(slug[slug.length - 1], categories);

  if (!category) notFound();

  // Canonical redirect — /avtomobili (missing the "transport" ancestor
  // segment) 301s to /transport/avtomobili. Keeps exactly one indexable
  // URL per category instead of the crawler seeing duplicates.
  const canonicalSlugPath = slugPathFor(category, categories);
  if (canonicalSlugPath.join("/") !== slug.join("/")) {
    const qs = new URLSearchParams(sp as Record<string, string>).toString();
    redirect(`/${canonicalSlugPath.join("/")}${qs ? `?${qs}` : ""}`);
  }

  const getParam = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : undefined);

  const page = getParam("page") ? Number(getParam("page")) : 1;
  const attrsParam = getParam("attrs");
  const sellerTypeParam = getParam("sellerType");

  const [attributes, regions, productsData] = await Promise.all([
    fetchCategoryAttributesServer(category.id),
    fetchRegionsServer(),
    fetchFilteredProductsServer({
      page,
      limit: 20,
      categoryId: category.id,
      regionId: getParam("regionId"),
      priceFrom: getParam("priceFrom") ? Number(getParam("priceFrom")) : undefined,
      priceTo: getParam("priceTo") ? Number(getParam("priceTo")) : undefined,
      currency: getParam("currency") as "USD" | "UZS" | undefined,
      attributeValueIds: attrsParam ? attrsParam.split(",") : undefined,
      sellerType: sellerTypeParam ? sellerTypeParam.split(",") : undefined,
      sorting: getParam("sorting") as "NEW" | "CHEAP" | "EXPENSIVE" | undefined,
      isUrgent: getParam("isUrgent") === "true" || undefined,
      isFree: getParam("isFree") === "true" || undefined,
    }),
  ]);

  return (
    <SearchResultsClient
      mode="category"
      category={category}
      categories={categories}
      attributes={attributes}
      regions={regions}
      initialProducts={productsData.products}
      initialPagination={productsData.pagination}
    />
  );
}