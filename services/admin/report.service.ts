import { api } from "@/helpers/api";

export interface AdminReportListItem {
  id: string;
  reason: string;
  comment: string | null;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    moderationStatus: string;
    owner: { id: string; name: string | null; phone: string | null };
  };
  reporter: { id: string; name: string | null; phone: string | null };
}

export interface AdminReportsResponse {
  reports: AdminReportListItem[];
  pagination: { limit: number; page: number; total: number; pages: number };
}

export async function updateReportStatus(
  id: string,
  status: "REVIEWED" | "DISMISSED" | "ACTIONED",
  unpublishProduct = false,
): Promise<void> {
  await api.patch(`/admin/reports/${id}`, { status, unpublishProduct });
}