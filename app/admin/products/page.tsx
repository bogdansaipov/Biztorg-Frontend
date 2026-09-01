"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
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
import ProductModerationActions from "@/components/admin/ProductModerationActions";
import ProductDetailSheet from "@/components/admin/ProductDetailSheet";
import TableSkeleton from "@/components/admin/TableSkeleton";
import type { AdminProductsResponse } from "@/services/admin/product.service";

export default function AdminProductsPendingPage() {
  const [data, setData] = useState<AdminProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: AdminProductsResponse }>(
        "/admin/products/pending",
        { params: { limit: 50 } },
      );
      setData(res.data.data);
    } catch (err) {
      console.error("Failed to load pending products", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = (id: string) => {
    setSelectedId(id);
    setSheetOpen(true);
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-semibold">Объявления на модерации</h1>
        <p className="text-sm text-muted-foreground">
          {data
            ? `${data.pagination.total} ${
                data.pagination.total === 1 ? "объявление ожидает" : "объявлений ожидают"
              } проверки — от старых к новым`
            : "\u00A0"}
        </p>
      </div>

      <div className="px-4 lg:px-6">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Фото</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Продавец</TableHead>
                  <TableHead>Регион</TableHead>
                  <TableHead>Цена</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              {loading || !data ? (
                <TableSkeleton rows={6} columns={7} />
              ) : (
                <TableBody>
                  {data.products.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                        Нет объявлений на проверке
                      </TableCell>
                    </TableRow>
                  )}
                  {data.products.map((product) => {
                    const mainImage = product.images.find((img) => img.isMain) ?? product.images[0];
                    return (
                      <TableRow
                        key={product.id}
                        className="cursor-pointer"
                        onClick={() => openDetail(product.id)}
                      >
                        <TableCell>
                          {mainImage ? (
                            <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted">
                              <Image
                                src={`${process.env.NEXT_PUBLIC_MEDIA_URL ?? ""}/public${mainImage.imageUrl}`}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-md bg-muted" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium max-w-[240px] truncate">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {product.owner.name ?? product.owner.phone ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {product.region.name}
                        </TableCell>
                        <TableCell className="text-sm">
                          {product.price
                            ? `${Number(product.price).toLocaleString("ru-RU")} ${product.currency ?? ""}`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={product.moderationStatus} />
                        </TableCell>
                        {/* stopPropagation so clicking Approve/Reject doesn't
                            also trigger the row's onClick and pop the sheet
                            open on top of the action just taken. */}
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <ProductModerationActions productId={product.id} onDone={load} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              )}
            </Table>
          </CardContent>
        </Card>
      </div>

      <ProductDetailSheet
        productId={selectedId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onDone={load}
      />
    </div>
  );
}