import { api } from "@/helpers/api";

export interface AdminUserListItem {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  isSuspended: boolean;
  emailVerified: boolean;
  lastSeenAt: string | null;
  createdAt: string;
}

export interface AdminUsersResponse {
  users: AdminUserListItem[];
  pagination: { limit: number; page: number; total: number; pages: number };
}

export async function suspendUser(id: string): Promise<void> {
  await api.post(`/admin/users/${id}/suspend`);
}

export async function unsuspendUser(id: string): Promise<void> {
  await api.post(`/admin/users/${id}/unsuspend`);
}

export async function updateUserRole(
  id: string,
  role: "USER" | "SHOP_OWNER" | "ADMIN",
): Promise<void> {
  await api.patch(`/admin/users/${id}/role`, { role });
}