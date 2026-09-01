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

export interface AdminProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string | null;
  currency: string | null;
  type: string;
  isUrgent: boolean;
  contactName: string | null;
  contactPhone: string | null;
  latitude: number | null;
  longitude: number | null;
  viewCount: number;
  moderationStatus: string;
  rejectionReason: string | null;
  moderatedAt: string | null;
  createdAt: string;
  region: { id: string; name: string; nameUz: string | null; slug: string };
  category: { id: string; name: string; nameUz: string | null; slug: string };
  images: { imageUrl: string; isMain: boolean }[];
  owner: { id: string; name: string | null; phone: string | null; email: string | null; createdAt: string };
  shop: { id: string; shopName: string; phone: string; bannerUrl: string | null } | null;
  attributes: { attributeName: string; attributeNameUz: string | null; value: string; valueUz: string | null }[];
}

export async function getProductDetail(id: string): Promise<AdminProductDetail> {
  const res = await api.get<{ data: AdminProductDetail }>(`/admin/products/${id}`);
  return res.data.data;
}