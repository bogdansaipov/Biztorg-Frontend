"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { getShopProducts } from "@/services/shop.service";
import { Product } from "@/types/Product";
import { localized } from "@/lib/localized";

const MEDIA_BASE = "https://169-58-13-208.nip.io/public";

export default function SelectShopProductToRatePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const shopId = params.id;

  // /shop/... is a non-region route, same as ShopRatingsPage /
  // RateShopProductPage. Previously missing entirely here — the product
  // links below were going to a bare "/shop/{id}/rate/{productId}" with
  // no locale segment at all.
  const locale = pathname.split("/")[1] || "ru";
  const t = useTranslations("selectShopProduct");

  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    if (!shopId) return;
    getShopProducts(shopId)
      .then(setProducts)
      .catch((err) => {
        console.error("Failed to load shop products to rate", err);
        setProducts([]);
      });
  }, [shopId]);

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto flex items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="cursor-pointer p-1 -ml-1" aria-label={t("back")}>
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{t("title")}</h1>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="flex flex-col gap-2 lg:gap-3 lg:max-w-[933px]">
          {products === null ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-20 lg:h-24 rounded-2xl bg-gray-100 animate-pulse" />
            ))
          ) : products.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">{t("noProducts")}</p>
          ) : (
            products.map((product) => {
              const mainImage = product.images.find((i) => i.isMain)?.imageUrl ?? product.images[0]?.imageUrl;
              const alreadyRated = product.isRatedByCurrentUser;
              const regionLabel = product.region ? localized(product.region, locale) : "";

              const content = (
                <div
                  className={`flex items-center gap-3 lg:gap-4 bg-white border border-gray-100 rounded-2xl p-3 lg:p-4 transition ${
                    alreadyRated ? "opacity-50" : "hover:bg-gray-50 cursor-pointer"
                  }`}
                >
                  <div className="relative w-16 h-16 lg:w-20 lg:h-20 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                    {mainImage && (
                      <Image
                        src={`${MEDIA_BASE}${mainImage}`}
                        alt={product.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-base lg:text-lg truncate">{product.name}</p>
                    <p className="text-sm lg:text-base text-gray-500 truncate">{regionLabel}</p>
                  </div>

                  {alreadyRated && (
                    <span className="flex items-center gap-1 text-xs lg:text-sm text-emerald-600 shrink-0">
                      <CheckCircle className="w-4 h-4" />
                      {t("alreadyRated")}
                    </span>
                  )}
                </div>
              );

              return alreadyRated ? (
                <div key={product.id}>{content}</div>
              ) : (
                <Link key={product.id} href={`/${locale}/shop/${shopId}/rate/${product.id}`}>
                  {content}
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}