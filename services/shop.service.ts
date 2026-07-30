import { api } from "@/helpers/api";
import {
  CreateShopResponse,
  MyShopItem,
  MyShopsResponse,
  PublicShopProfile,
  PublicShopProfileResponse,
  ShopEditData,
  ShopEditResponse,
  ShopProfile,
} from "@/types/responses/shop.response";
import { Product } from "@/types/Product";

export async function getMyShops(): Promise<MyShopItem[]> {
  const res = await api.get<MyShopsResponse>("/shop-profiles/me");
  return res.data.data;
}

export async function getShopForEdit(id: string): Promise<ShopEditData> {
  const res = await api.get<ShopEditResponse>(`/shop-profiles/${id}/edit`);
  return res.data.data;
}

export type BusinessType = "SELF_EMPLOYED" | "INDIVIDUAL" | "LLC";

export interface CreateShopPayload {
  shopName: string;
  phone: string;
  description?: string;
  businessType?: BusinessType;
  taxIdNumber?: string;
  contactName?: string;
  address?: string;
  facebookLink?: string;
  telegramLink?: string;
  instagramLink?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  banner?: File | null;
}

function buildShopFormData(payload: CreateShopPayload): FormData {
  const formData = new FormData();

  formData.append("shopName", payload.shopName);
  formData.append("phone", payload.phone);

  if (payload.description) formData.append("description", payload.description);
  if (payload.businessType) formData.append("businessType", payload.businessType);
  if (payload.taxIdNumber) formData.append("taxIdNumber", payload.taxIdNumber);
  if (payload.contactName) formData.append("contactName", payload.contactName);
  if (payload.address) formData.append("address", payload.address);
  if (payload.facebookLink) formData.append("facebookLink", payload.facebookLink);
  if (payload.telegramLink) formData.append("telegramLink", payload.telegramLink);
  if (payload.instagramLink) formData.append("instagramLink", payload.instagramLink);
  if (payload.website) formData.append("website", payload.website);
  if (payload.latitude !== undefined) formData.append("latitude", String(payload.latitude));
  if (payload.longitude !== undefined) formData.append("longitude", String(payload.longitude));
  // Banner is only appended if a new file was actually picked — on update,
  // omitting it entirely (rather than sending empty) is what lets the
  // existing banner stay unchanged when the user doesn't touch it.
  if (payload.banner) formData.append("banner", payload.banner);

  return formData;
}

export async function createShop(payload: CreateShopPayload): Promise<ShopProfile> {
  const res = await api.post<CreateShopResponse>("/shop-profiles", buildShopFormData(payload));
  return res.data.data;
}

export async function updateShop(id: string, payload: CreateShopPayload): Promise<ShopProfile> {
  const res = await api.put<CreateShopResponse>(`/shop-profiles/${id}`, buildShopFormData(payload));
  return res.data.data;
}

// GET /shop-profiles/{id}/profile — public shop profile (banner, stats,
// follow state) shown on the shop's own public page.
export async function getShopPublicProfile(id: string): Promise<PublicShopProfile> {
  const res = await api.get<PublicShopProfileResponse>(`/shop-profiles/${id}/profile`);
  return res.data.data;
}

// Generic { success, statusCode, message, data, errors, timestamp, path }
// envelope, same shape as every other list/detail endpoint in this API —
// kept local since it's only used by getShopProducts below.
interface ShopProductsApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Product[];
  errors: unknown | null;
  timestamp: string;
  path: string;
}

// GET /shop-profiles/{id}/products — paginated list of a shop's active
// listings. page/limit mirror getUserProducts' signature so both call
// sites (user profile, shop profile) stay symmetrical; regionId is
// optional since most callers (the public shop page) don't filter by it.
export async function getShopProducts(
  shopId: string,
  page = 1,
  limit = 20,
  regionId?: string,
): Promise<Product[]> {
  const res = await api.get<ShopProductsApiResponse>(`/shop-profiles/${shopId}/products`, {
    params: {
      page,
      limit,
      ...(regionId ? { regionId } : {}),
    },
  });
  return res.data.data;
}