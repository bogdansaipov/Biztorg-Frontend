import { Product } from "@/types/Product";

export type ProductSorting = "NEW" | "CHEAP" | "EXPENSIVE";

// Client-side shape of the query params this endpoint accepts. All
// optional — an empty object is a valid "no filters" call.
export interface ProductFilterParams {
  page?: number;
  limit?: number;
  query?: string;
  categoryId?: string;
  parentCategoryId?: string;
  regionId?: string;
  parentRegionId?: string;
  priceFrom?: number;
  priceTo?: number;
  currency?: "USD" | "UZS";
  // Sent to the backend as a single comma-separated string (matching the
  // zod schema's `.split(',')` fallback path) rather than repeated query
  // params, since axios' default array serialization format doesn't line
  // up with what the backend actually parses.
  attributeValueIds?: string[];
  // Same comma-separated-string convention as attributeValueIds.
  sellerType?: string[];
  sorting?: ProductSorting;
  isUrgent?: boolean;
  isFree?: boolean;
}

export interface ProductsFilterPagination {
  limit: number;
  page: number;
  total: number;
  pages: number;
}

export interface ProductsFilterData {
  products: Product[];
  pagination: ProductsFilterPagination;
}

export interface ProductsFilterResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ProductsFilterData;
  timestamp: string;
}