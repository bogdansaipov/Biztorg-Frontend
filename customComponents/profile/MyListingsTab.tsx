"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { FileText } from "lucide-react";
import { getUserProducts } from "@/services/user.service";
import { Product } from "@/types/Product";
import { useAuthStore } from "@/stores/auth.store";
import FavoriteProductCard from "./FavoriteProductCard";
import FavoriteCardSkeleton from "./FavoriteCardSkeleton";

const PAGE_LIMIT = 20;

export default function MyListingsTab() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "ru";
  const t = useTranslations("myListings");

  const userId = useAuthStore((s) => s.user?.id);

  const [products, setProducts] = useState<Product[] | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFirstPage = useCallback(() => {
    if (!userId) return;

    setError(null);
    setProducts(null);

    getUserProducts(userId, 1, PAGE_LIMIT)
      .then((results) => {
        setProducts(results);
        setPage(1);
        setHasMore(results.length === PAGE_LIMIT);
      })
      .catch((err) => {
        console.error("Failed to load user's products", err);
        setError(t("loadError"));
      });
  }, [userId, t]);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = async () => {
    if (!userId) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const more = await getUserProducts(userId, nextPage, PAGE_LIMIT);
      setProducts((prev) => [...(prev ?? []), ...more]);
      setPage(nextPage);
      setHasMore(more.length === PAGE_LIMIT);
    } catch (err) {
      console.error("Failed to load more products", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDeleted = (productId: string) => {
    setProducts((prev) => (prev ? prev.filter((p) => p.id !== productId) : prev));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t("title")}</h1>

      {error ? (
        <p className="text-red-400 text-sm py-10 text-center">{error}</p>
      ) : products === null ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <FavoriteCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4">
          <FileText className="w-16 h-16 text-gray-200 mb-4" strokeWidth={1} />
          <p className="text-gray-400 mb-6">
            {t("emptyState")}
          </p>
          <button
            onClick={() => router.push(`/${locale}/obyavlenie/create`)}
            className="cursor-pointer bg-gray-900 hover:opacity-90 transition text-white font-medium px-6 py-3 rounded-xl"
          >
            {t("postAd")}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-0 sm:gap-0.5">
            {products.map((p) => (
              <FavoriteProductCard
                key={p.id}
                product={p}
                locale={locale}
                manageable
                onDeleted={() => handleDeleted(p.id)}
                onBumped={loadFirstPage}
              />
            ))}
          </div>

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="mt-6 w-full cursor-pointer bg-gray-100 hover:bg-gray-200 transition text-gray-800 font-medium py-3.5 rounded-2xl disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingMore ? t("loading") : t("showMore")}
            </button>
          )}
        </>
      )}
    </div>
  );
}