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
import ShopVerificationActions from "@/components/admin/ShopVerificationActions";
import TableSkeleton from "@/components/admin/TableSkeleton";
import type { AdminShopsResponse } from "@/services/admin/shop.service";

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  SELF_EMPLOYED: "Самозанятый",
  INDIVIDUAL: "ИП",
  LLC: "ООО",
};

export default function AdminShopsPage() {
  const [data, setData] = useState<AdminShopsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: AdminShopsResponse }>("/admin/shops", {
        params: { limit: 50 },
      });
      setData(res.data.data);
    } catch (err) {
      console.error("Failed to load shops", err);
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
        <h1 className="text-2xl font-semibold">Магазины</h1>
        <p className="text-sm text-muted-foreground">
          {data ? `Всего магазинов: ${data.pagination.total}` : "\u00A0"}
        </p>
      </div>

      <div className="px-4 lg:px-6">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Владелец</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              {loading || !data ? (
                <TableSkeleton rows={6} columns={7} />
              ) : (
                <TableBody>
                  {data.shops.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                        Магазинов нет
                      </TableCell>
                    </TableRow>
                  )}
                  {data.shops.map((shop) => (
                    <TableRow key={shop.id}>
                      <TableCell className="font-medium">{shop.shopName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {shop.owner.name ?? shop.owner.phone ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{shop.phone}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {shop.businessType ? BUSINESS_TYPE_LABELS[shop.businessType] ?? shop.businessType : "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={shop.verificationStatus} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(shop.createdAt).toLocaleDateString("ru-RU")}
                      </TableCell>
                      <TableCell className="text-right">
                        <ShopVerificationActions shopId={shop.id} onDone={load} />
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