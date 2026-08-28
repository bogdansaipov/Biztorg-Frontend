import { api } from "@/helpers/api";

export interface AdminProductListItem {
  id: string;
  name: string;
  slug: string;
  price: string | null;
  currency: string | null;
  moderationStatus: string;
  rejectionReason: string | null;
  moderatedAt: string | null;
  createdAt: string;
  region: { id: string; name: string; nameUz: string | null; slug: string };
  images: { imageUrl: string; isMain: boolean }[];
  owner: { id: string; name: string | null; phone: string | null };
  shop: { id: string; shopName: string } | null;
}

export interface AdminProductsResponse {
  products: AdminProductListItem[];
  pagination: { limit: number; page: number; total: number; pages: number };
}

export async function approveProduct(id: string): Promise<void> {
  await api.post(`/admin/products/${id}/approve`);
}

export async function rejectProduct(id: string, reason: string): Promise<void> {
  await api.post(`/admin/products/${id}/reject`, { reason });
}

export async function unpublishProduct(id: string): Promise<void> {
  await api.post(`/admin/products/${id}/unpublish`);
}