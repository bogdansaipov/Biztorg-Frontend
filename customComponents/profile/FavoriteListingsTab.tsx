"use client";

import { useEffect, useState } from "react";
import { getMyFavorites } from "@/services/favorite.service";
import { Product } from "@/types/Product";
import FavoriteProductCard from "./FavoriteProductCard";
import FavoriteCardSkeleton from "./FavoriteCardSkeleton";

export default function FavoriteListingsTab() {
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
    // This list IS "my favorites" — once a product is unfavorited here,
    // it no longer belongs on this page at all, so it's dropped from the
    // local list immediately rather than waiting for a refetch/refresh.
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
        Вы пока не добавили ни одного объявления в избранное.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0.5 pt-4">
      {products.map((p) => (
        <FavoriteProductCard key={p.id} product={p} onUnfavorite={() => handleUnfavorite(p.id)} />
      ))}
    </div>
  );
}