import { api } from "@/helpers/api";
import { Product } from "@/types/Product";
import { UserProductsResponse } from "@/types/responses/user-products.response";
import { PublicUserProfile, PublicUserProfileResponse } from "@/types/responses/user-profile.response";

export async function getUserProducts(
  userId: string,
  page = 1,
  limit = 20,
  regionId?: string,
): Promise<Product[]> {
  const res = await api.get<UserProductsResponse>(`/users/${userId}/products`, {
    params: { page, limit, regionId },
  });
  return res.data.data;
}

export async function getUserPublicProfile(userId: string): Promise<PublicUserProfile> {
  const res = await api.get<PublicUserProfileResponse>(`/users/${userId}/profile`);
  return res.data.data;
}

// PATCH /users/me — confirmed against swagger: only updates the current
// user's name (there's no phone field in the request body), and the
// response envelope here has no `errors`/`path` fields, unlike the other
// endpoints in this file.
interface UpdateProfileResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: PublicUserProfile;
  timestamp: string;
}

export interface UpdateProfilePayload {
  name: string;
}

export async function updateMyProfile(payload: UpdateProfilePayload): Promise<PublicUserProfile> {
  const res = await api.patch<UpdateProfileResponse>("/users/me", payload);
  return res.data.data;
}