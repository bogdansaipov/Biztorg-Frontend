import { api } from "@/helpers/api";
import { FollowsMeData, FollowsMeResponse } from "@/types/responses/follow.response";

export async function getMyFollows(): Promise<FollowsMeData> {
  const res = await api.get<FollowsMeResponse>("/follows/me");
  return res.data.data;
}

// POST/DELETE /follows/users/{userId} — confirmed against swagger.
export async function followUser(userId: string): Promise<void> {
  await api.post(`/follows/users/${userId}`);
}

export async function unfollowUser(userId: string): Promise<void> {
  await api.delete(`/follows/users/${userId}`);
}

// POST/DELETE /follows/shops/{shopId} — same pattern as the user
// endpoints above, confirmed against swagger.
export async function followShop(shopId: string): Promise<void> {
  await api.post(`/follows/shops/${shopId}`);
}

export async function unfollowShop(shopId: string): Promise<void> {
  await api.delete(`/follows/shops/${shopId}`);
}