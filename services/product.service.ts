import { api } from "@/helpers/api";
import { Product } from "@/types/Product";
import { ProductsResponse, ProductsResponseInterface, RecommendationProductsInterface, RecommendationProductsResponse, SingleProductResponse } from "@/types/responses/product.response";
import { ProductFilterParams, ProductsFilterData, ProductsFilterResponse } from "@/types/responses/product-filter.response";

export async function getProducts(page = 1, limit: 20): Promise<ProductsResponseInterface> {
 const response = await api.get<ProductsResponse>(`/products`, {params: {page, limit}});

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

export const REPORT_REASONS: ReportReasonOption[] = [
  { key: "WRONG_DESCRIPTION", label: "Ошибка в описании" },
  { key: "FRAUD", label: "Мошенник" },
  { key: "RULES_VIOLATION", label: "Объявление нарушает правила" },
  { key: "SOLD", label: "Товар продан" },
  { key: "OTHER", label: "Другое" },
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
 
 