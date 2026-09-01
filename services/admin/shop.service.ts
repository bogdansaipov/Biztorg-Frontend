import { api } from "@/helpers/api";

export interface AdminShopListItem {
  id: string;
  shopName: string;
  phone: string;
  businessType: string | null;
  verificationStatus: string;
  rejectionReason: string | null;
  verifiedAt: string | null;
  createdAt: string;
  owner: { id: string; name: string | null; phone: string | null };
}

export interface AdminShopsResponse {
  shops: AdminShopListItem[];
  pagination: { limit: number; page: number; total: number; pages: number };
}

export interface AdminShopDocument {
  id: string;
  documentType: string;
  fileUrl: string;
  createdAt: string;
}

export async function verifyShop(id: string): Promise<void> {
  await api.post(`/admin/shops/${id}/verify`);
}

export async function rejectShop(id: string, reason: string): Promise<void> {
  await api.post(`/admin/shops/${id}/reject`, { reason });
}

export async function getShopDocuments(id: string): Promise<AdminShopDocument[]> {
  const res = await api.get<{ data: { documents: AdminShopDocument[] } }>(
    `/admin/shops/${id}/documents`,
  );
  return res.data.data.documents;
}