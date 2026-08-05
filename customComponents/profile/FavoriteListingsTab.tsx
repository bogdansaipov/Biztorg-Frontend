"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { getMyFavorites } from "@/services/favorite.service";
import { Product } from "@/types/Product";
import FavoriteProductCard from "./FavoriteProductCard";
import FavoriteCardSkeleton from "./FavoriteCardSkeleton";

export default function FavoriteListingsTab() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "ru";
  const t = useTranslations("favorites");

  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    getMyFavorites()
      .then(setProducts)
      .catch((err) => {
        console.error("Failed to load favorite products", err);
        setProducts([]);
      });
  }, []);

  const handleUnfavorite = (productId: string) => {
    setProducts((prev) => (prev ? prev.filter((p) => p.id !== productId) : prev));
  };

  if (products === null) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0.5 pt-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <FavoriteCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <p className="text-gray-400 text-sm py-6">
        {t("noFavoritedListings")}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-0 sm:gap-0.5 pt-4">
      {products.map((p) => (
        <FavoriteProductCard
          key={p.id}
          product={p}
          locale={locale}
          mobileRow
          onUnfavorite={() => handleUnfavorite(p.id)}
        />
      ))}
    </div>
  );
}