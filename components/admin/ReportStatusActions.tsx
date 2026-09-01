"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToastStore } from "@/stores/toast.store";
import { updateReportStatus } from "@/services/admin/report.service";

export default function ReportStatusActions({
  reportId,
  onDone,
}: {
  reportId: string;
  onDone: () => void;
}) {
  const showToast = useToastStore((s) => s.show);
  const [loading, setLoading] = useState(false);

  const run = async (
    status: "REVIEWED" | "DISMISSED" | "ACTIONED",
    unpublishProduct: boolean,
    successMessage: string,
  ) => {
    setLoading(true);
    try {
      await updateReportStatus(reportId, status, unpublishProduct);
      showToast({ title: successMessage, type: "success" });
      onDone();
    } catch (err) {
      console.error("Failed to update report status", err);
      showToast({ title: "Не удалось обновить статус жалобы", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" disabled={loading}>
          Действие
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => run("REVIEWED", false, "Жалоба отмечена рассмотренной")}>
          Отметить рассмотренной
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => run("DISMISSED", false, "Жалоба отклонена")}>
          Отклонить жалобу
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => run("ACTIONED", true, "Меры приняты, объявление снято с публикации")}
        >
          Принять меры (снять объявление)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}