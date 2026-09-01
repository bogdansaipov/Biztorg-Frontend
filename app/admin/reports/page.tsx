"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/helpers/api";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatusBadge from "@/components/admin/StatusBadge";
import ReportStatusActions from "@/components/admin/ReportStatusActions";
import TableSkeleton from "@/components/admin/TableSkeleton";
import type { AdminReportsResponse } from "@/services/admin/report.service";

const REASON_LABELS: Record<string, string> = {
  WRONG_DESCRIPTION: "Неверное описание",
  FRAUD: "Мошенничество",
  RULES_VIOLATION: "Нарушение правил",
  SOLD: "Уже продано",
  OTHER: "Другое",
};

export default function AdminReportsPage() {
  const [data, setData] = useState<AdminReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: AdminReportsResponse }>("/admin/reports", {
        params: { limit: 50 },
      });
      setData(res.data.data);
    } catch (err) {
      console.error("Failed to load reports", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-semibold">Жалобы</h1>
        <p className="text-sm text-muted-foreground">
          {data ? `Всего жалоб: ${data.pagination.total}` : "\u00A0"}
        </p>
      </div>

      <div className="px-4 lg:px-6">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Причина</TableHead>
                  <TableHead>Товар</TableHead>
                  <TableHead>Продавец</TableHead>
                  <TableHead>Заявитель</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              {loading || !data ? (
                <TableSkeleton rows={6} columns={7} />
              ) : (
                <TableBody>
                  {data.reports.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                        Жалоб нет
                      </TableCell>
                    </TableRow>
                  )}
                  {data.reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="max-w-[200px]">
                        <div className="font-medium text-sm">
                          {REASON_LABELS[report.reason] ?? report.reason}
                        </div>
                        {report.comment && (
                          <div className="text-xs text-muted-foreground truncate">
                            {report.comment}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{report.product.name}</div>
                        <StatusBadge status={report.product.moderationStatus} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {report.product.owner.name ?? report.product.owner.phone ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {report.reporter.name ?? report.reporter.phone ?? "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={report.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString("ru-RU")}
                      </TableCell>
                      <TableCell className="text-right">
                        <ReportStatusActions reportId={report.id} onDone={load} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}