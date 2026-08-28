import Image from "next/image";
import { adminServerGet } from "@/lib/admin-server-api";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import StatusBadge from "@/components/admin/StatusBadge";
import ProductModerationActions from "@/components/admin/ProductModerationActions";
import type { AdminProductsResponse } from "@/services/admin/product.service";

// Admin data changes on every approve/reject action — never statically
// cached, matches adminServerGet's cache: 'no-store'.
export const dynamic = "force-dynamic";

export default async function AdminProductsPendingPage() {
  const data = await adminServerGet<AdminProductsResponse>("/admin/products/pending", {
    limit: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Объявления на модерации</h1>
        <p className="text-sm text-muted-foreground">
          {data.pagination.total}{" "}
          {data.pagination.total === 1 ? "объявление ожидает" : "объявлений ожидают"} проверки —
          от старых к новым
        </p>
      </div>

      <Card>
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
                  <TableRow key={product.id}>
                    <TableCell>
                      {mainImage ? (
                        <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted">
                          <Image
                            src={`${process.env.NEXT_PUBLIC_MEDIA_URL ?? ""}${mainImage.imageUrl}`}
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
                    <TableCell className="text-right">
                      <ProductModerationActions productId={product.id} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}