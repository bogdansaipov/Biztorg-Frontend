"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import StatusBadge from "@/components/admin/StatusBadge";
import ProductModerationActions from "@/components/admin/ProductModerationActions";
import { Skeleton } from "@/components/ui/skeleton";
import { getProductDetail, type AdminProductDetail } from "@/services/admin/product.service";

const MEDIA = process.env.NEXT_PUBLIC_MEDIA_URL ?? "";

interface Props {
  productId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}

export default function ProductDetailSheet({ productId, open, onOpenChange, onDone }: Props) {
  const [detail, setDetail] = useState<AdminProductDetail | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!productId || !open) return;
    setDetail(null);
    setActiveImage(0);
    getProductDetail(productId)
      .then(setDetail)
      .catch((err) => console.error("Failed to load product detail", err));
  }, [productId, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        {!detail ? (
          <div className="flex flex-col gap-6 p-1">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="w-full aspect-square rounded-lg" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="w-16 h-16 rounded-md" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <div className="flex flex-col gap-6 p-1">
            <SheetHeader>
              <SheetTitle>{detail.name}</SheetTitle>
              <SheetDescription asChild>
                <span>
                  <StatusBadge status={detail.moderationStatus} />
                </span>
              </SheetDescription>
            </SheetHeader>

            {detail.images.length > 0 && (
              <div className="flex flex-col gap-2">
                {/* Opens the raw image URL directly in a new tab — the
                    browser's own zoom/pan handles "see it larger" without
                    building a custom lightbox for a first version. */}
                <a
                  href={`${MEDIA}/public${detail.images[activeImage].imageUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block w-full aspect-square rounded-lg overflow-hidden bg-muted"
                >
                  <Image
                    src={`${MEDIA}/public${detail.images[activeImage].imageUrl}`}
                    alt={detail.name}
                    fill
                    className="object-cover"
                  />
                </a>
                {detail.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {detail.images.map((img, i) => (
                      <button
                        key={img.imageUrl}
                        onClick={() => setActiveImage(i)}
                        className={`relative w-16 h-16 shrink-0 rounded-md overflow-hidden border-2 ${
                          i === activeImage ? "border-foreground" : "border-transparent"
                        }`}
                      >
                        <Image
                          src={`${MEDIA}/public${img.imageUrl}`}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Нажмите на фото, чтобы открыть в полном размере
                </p>
              </div>
            )}

            {detail.rejectionReason && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                Причина отклонения: {detail.rejectionReason}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Цена</div>
                <div className="font-medium">
                  {detail.price
                    ? `${Number(detail.price).toLocaleString("ru-RU")} ${detail.currency ?? ""}`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Категория</div>
                <div className="font-medium">{detail.category.name}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Регион</div>
                <div className="font-medium">{detail.region.name}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Просмотры</div>
                <div className="font-medium">{detail.viewCount}</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Описание</div>
              <p className="text-sm whitespace-pre-wrap">{detail.description}</p>
            </div>

            {detail.attributes.length > 0 && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Характеристики</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {detail.attributes.map((attr, i) => (
                    <div key={i}>
                      <span className="text-muted-foreground">{attr.attributeName}: </span>
                      <span>{attr.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-sm text-muted-foreground mb-1">Контакты в объявлении</div>
              <p className="text-sm">
                {detail.contactName ?? "—"} · {detail.contactPhone ?? "—"}
              </p>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Продавец</div>
              <p className="text-sm">
                {detail.owner.name ?? "—"} · {detail.owner.phone ?? detail.owner.email ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                Регистрация: {new Date(detail.owner.createdAt).toLocaleDateString("ru-RU")}
              </p>
            </div>

            {detail.shop && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Магазин</div>
                <p className="text-sm">
                  {detail.shop.shopName} · {detail.shop.phone}
                </p>
              </div>
            )}

            <ProductModerationActions
              productId={detail.id}
              onDone={() => {
                onDone();
                onOpenChange(false);
              }}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}