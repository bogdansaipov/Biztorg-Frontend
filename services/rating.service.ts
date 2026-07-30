import { api } from "@/helpers/api";
import { ReceivedRatingsData, ReceivedRatingsResponse } from "@/types/responses/rating.response";

// GET /product-ratings/users/{userId}/ratings — all ratings a user has
// received across their products (used on the public user profile page).
export async function getUserRatings(userId: string): Promise<ReceivedRatingsData> {
  const res = await api.get<ReceivedRatingsResponse>(`/product-ratings/users/${userId}/ratings`);
  return res.data.data;
}

// GET /product-ratings/shops/{shopId}/ratings — same shape, scoped to a
// shop instead of a user.
export async function getShopRatings(shopId: string): Promise<ReceivedRatingsData> {
  const res = await api.get<ReceivedRatingsResponse>(`/product-ratings/shops/${shopId}/ratings`);
  return res.data.data;
}

export interface CreateProductRatingPayload {
  productId: string;
  rating: number;
  comment?: string;
  images?: File[];
}

// Generic envelope — the exact shape of `data` on a successful create
// isn't specified in the swagger response schema beyond the standard
// wrapper, so it's left untyped here; callers don't need it back, they
// just need to know the call succeeded.
interface CreateProductRatingResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: unknown;
  errors: unknown | null;
  timestamp: string;
  path: string;
}

// POST /product-ratings — multipart/form-data, since it optionally
// carries image files. A product can only be rated once per user; the
// backend is assumed to enforce that (the frontend's own guard is simply
// not showing/allowing already-rated products in the selection list, via
// each product's isRatedByCurrentUser flag).
export async function createProductRating(payload: CreateProductRatingPayload): Promise<void> {
  const formData = new FormData();
  formData.append("productId", payload.productId);
  formData.append("rating", String(payload.rating));
  if (payload.comment) formData.append("comment", payload.comment);
  payload.images?.forEach((file) => formData.append("images", file));

  await api.post<CreateProductRatingResponse>("/product-ratings", formData);
}