import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Covers ProductModerationStatusEnum, ShopVerificationStatusEnum, and
// ReportStatusEnum in one map since their value sets don't collide
// (PENDING/APPROVED/REJECTED are shared, everything else is unique).
const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
  UNPUBLISHED: "bg-gray-100 text-gray-600 border-gray-200",
  UNVERIFIED: "bg-gray-100 text-gray-600 border-gray-200",
  REVIEWED: "bg-blue-100 text-blue-700 border-blue-200",
  DISMISSED: "bg-gray-100 text-gray-600 border-gray-200",
  ACTIONED: "bg-purple-100 text-purple-700 border-purple-200",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "На проверке",
  APPROVED: "Одобрено",
  REJECTED: "Отклонено",
  UNPUBLISHED: "Снято с публикации",
  UNVERIFIED: "Не верифицирован",
  REVIEWED: "Рассмотрено",
  DISMISSED: "Отклонена",
  ACTIONED: "Принято решение",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600 border-gray-200")}
    >
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}