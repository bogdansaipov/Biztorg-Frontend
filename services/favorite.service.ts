import { api } from "@/helpers/api";
import { Product } from "@/types/Product";

interface FavoritesMeResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Product[];
  timestamp: string;
}

interface FavoriteActionResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: { message: string };
  timestamp: string;
}

export async function getMyFavorites(): Promise<Product[]> {
  const res = await api.get<FavoritesMeResponse>("/favorites/me");
  return res.data.data;
}

export async function addFavorite(productId: string): Promise<void> {
  await api.post<FavoriteActionResponse>(`/favorites/${productId}`);
}

export async function removeFavorite(productId: string): Promise<void> {
  await api.delete<FavoriteActionResponse>(`/favorites/${productId}`);
}