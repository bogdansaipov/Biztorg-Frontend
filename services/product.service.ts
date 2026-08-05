import { api } from "@/helpers/api";
import { Product } from "@/types/Product";
import { ProductsResponse, ProductsResponseInterface, RecommendationProductsInterface, RecommendationProductsResponse, SingleProductResponse } from "@/types/responses/product.response";
import { ProductFilterParams, ProductsFilterData, ProductsFilterResponse } from "@/types/responses/product-filter.response";

export async function getProducts(page = 1, limit = 20, regionId?: string): Promise<ProductsResponseInterface> {
 const response = await api.get<ProductsResponse>(`/products`, { params: { page, limit, regionId } });
 return response.data.data
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 
export async function getSingleProduct(idOrSlug: string): Promise<Product> {
  const params = UUID_RE.test(idOrSlug) ? { productId: idOrSlug } : { productSlug: idOrSlug };
 
  const res = await api.get<SingleProductResponse>("/products/single", { params });
  return res.data.data;
}
 

export async function getRecommendationProducts(
  productId: string
): Promise<RecommendationProductsInterface> {

  const res = await api.get<RecommendationProductsResponse>(
    `/products/recommendations/${productId}`
  );

  return res.data.data;
}

// Mirrors the Android app's `ReportReason` enum 1:1 — same keys, same
// Russian labels — so the web report flow stays in sync with whatever the
// backend actually accepts.
export type ReportReasonKey =
  | "WRONG_DESCRIPTION"
  | "FRAUD"
  | "RULES_VIOLATION"
  | "SOLD"
  | "OTHER";

export interface ReportReasonOption {
  key: ReportReasonKey;
  label: string;
}

export interface ReportReasonOption {
  key: ReportReasonKey;
  label: string;
  labelUz: string;
}

export const REPORT_REASONS: ReportReasonOption[] = [
  { key: "WRONG_DESCRIPTION", label: "Ошибка в описании", labelUz: "Tavsifda xatolik" },
  { key: "FRAUD", label: "Мошенник", labelUz: "Firibgar" },
  { key: "RULES_VIOLATION", label: "Объявление нарушает правила", labelUz: "E'lon qoidalarni buzadi" },
  { key: "SOLD", label: "Товар продан", labelUz: "Mahsulot sotilgan" },
  { key: "OTHER", label: "Другое", labelUz: "Boshqa" },
];

export interface ReportProductPayload {
  reason: ReportReasonKey;
  comment: string;
}

export async function reportProduct(
  productId: string,
  payload: ReportProductPayload,
): Promise<void> {
  await api.post(`/products/${productId}/report`, payload);
}
export async function filterProducts(params: ProductFilterParams): Promise<ProductsFilterData> {
  const res = await api.get<ProductsFilterResponse>("/products/filter", {
    params: {
      ...params,
      attributeValueIds: params.attributeValueIds?.length ? params.attributeValueIds.join(",") : undefined,
      sellerType: params.sellerType?.length ? params.sellerType.join(",") : undefined,
    },
  });
  return res.data.data;
}

// ═══════════════════ SEO / sitemap helpers ═══════════════════
// Both of these are only ever called from app/sitemap.ts (a Server
// Component context) — not from any regular page/UI code — but live
// here rather than in lib/server-api.ts because `api` is the same
// isomorphic axios instance already proven to work called directly from
// Server Components elsewhere (HomePage.tsx, ProductPage.tsx, etc).

export interface SitemapProductItem {
  slug: string;
  updatedAt: string;
}

export interface SitemapProductsData {
  items: SitemapProductItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export async function getProductsForSitemap(page = 1, limit = 40000): Promise<SitemapProductsData> {
  const response = await api.get<{ success: boolean; data: SitemapProductsData }>("/products/sitemap", {
    params: { page, limit },
  });
  return response.data.data;
}

export interface RegionCategoryCombination {
  categoryId: string;
  regionId: string;
  count: number;
}
 
export async function getRegionCategoryCombinations(minCount = 3): Promise<RegionCategoryCombination[]> {
  const response = await api.get<{
    success: boolean;
    data: { combinations: RegionCategoryCombination[] };
  }>("/products/region-category-combinations", { params: { minCount } });
  return response.data.data.combinations;
}

export async function bumpProduct(productId: string): Promise<void> {
  await api.post(`/products/${productId}/bump`);
}

export async function deleteProduct(productId: string): Promise<void> {
  await api.delete(`/products/${productId}`);
}