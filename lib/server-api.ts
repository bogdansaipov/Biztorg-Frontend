import { Category } from "@/types/category";
import { AttributeGroupedValues } from "@/types/attribute/attribute";
import { Region } from "@/types/region/region";
import { ProductFilterParams, ProductsFilterData } from "@/types/responses/product-filter.response";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://api.biztorg.uz/api/v1";

async function serverGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  revalidateSeconds = 60,
): Promise<T> {
  const usp = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") usp.set(key, String(value));
    });
  }
  const qs = usp.toString();

  const res = await fetch(`${API_BASE}${path}${qs ? `?${qs}` : ""}`, {
    // Categories/regions barely change — cache for an hour. Product
    // listings go through fetchFilteredProductsServer below with its own
    // (much shorter) revalidate window instead.
    next: { revalidate: revalidateSeconds },
  });

  if (!res.ok) {
    throw new Error(`Server fetch failed: ${path} (${res.status})`);
  }

  const json = await res.json();
  return json.data as T;
}

export async function fetchAllCategoriesServer(): Promise<Category[]> {
  return serverGet<Category[]>("/categories", undefined, 3600);
}

export async function fetchCategoryAttributesServer(categoryId: string): Promise<AttributeGroupedValues[]> {
  return serverGet<AttributeGroupedValues[]>(`/categories/${categoryId}/attributes`, undefined, 3600);
}

export async function fetchRegionsServer(): Promise<Region[]> {
  return serverGet<Region[]>("/regions", undefined, 3600);
}

// Short revalidate window (60s) — listings actually change (new posts,
// bumps), unlike categories/regions, so this needs to stay reasonably
// fresh for both real visitors and crawlers re-indexing the page.
export async function fetchFilteredProductsServer(params: ProductFilterParams): Promise<ProductsFilterData> {
  return serverGet<ProductsFilterData>(
    "/products/filter",
    {
      ...params,
      attributeValueIds: params.attributeValueIds?.length ? params.attributeValueIds.join(",") : undefined,
    },
    60,
  );
}