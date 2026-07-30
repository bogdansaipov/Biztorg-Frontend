import { fetchAllCategoriesServer, fetchRegionsServer, fetchFilteredProductsServer } from "@/lib/server-api";
import SearchResultsClient from "@/customComponents/search/SearchResultsClient";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const getParam = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : undefined);

  const page = getParam("page") ? Number(getParam("page")) : 1;
  const attrsParam = getParam("attrs");
  const sellerTypeParam = getParam("sellerType");

  const [categories, regions, productsData] = await Promise.all([
    fetchAllCategoriesServer(),
    fetchRegionsServer(),
    fetchFilteredProductsServer({
      page,
      limit: 20,
      query: getParam("query"),
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
      mode="search"
      category={null}
      categories={categories}
      attributes={[]}
      regions={regions}
      initialProducts={productsData.products}
      initialPagination={productsData.pagination}
    />
  );
}