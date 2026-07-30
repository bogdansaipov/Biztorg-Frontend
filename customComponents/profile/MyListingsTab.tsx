"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { getUserProducts } from "@/services/user.service";
import { Product } from "@/types/Product";
import FavoriteProductCard from "./FavoriteProductCard";
import FavoriteCardSkeleton from "./FavoriteCardSkeleton";

// The endpoint returns a flat array with no pagination metadata at all —
// no total count, no totalPages, nothing. So "is there another page?" has
// to be inferred: if a page comes back with fewer than PAGE_LIMIT items,
// we've hit the end; if it comes back completely full, there might be
// more (we can't know for certain without a real total, but this is the
// standard heuristic for this situation).
const PAGE_LIMIT = 20;

export default function MyListingsTab() {
  const router = useRouter();

  // useAuthStore never rehydrates from localStorage on a fresh page load —
  // it's only populated in-memory during setAuth() at login — so reading
  // s.user?.id here would be null right after navigation even though the
  // real user data is sitting in localStorage. Reading it directly instead.
  const [userId, setUserId] = useState<string | null>(null);
  const [userChecked, setUserChecked] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { id?: string };
        if (parsed.id) setUserId(parsed.id);
      } catch (err) {
        console.error("Failed to parse stored user", err);
      }
    }
    setUserChecked(true);
  }, []);

  const [products, setProducts] = useState<Product[] | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userChecked) return; // still reading localStorage, don't decide yet

    if (!userId) {
      console.error("MyListingsTab: no userId found in localStorage");
      setError("Не удалось определить пользователя.");
      return;
    }

    setError(null);
    setProducts(null);

    getUserProducts(userId, 1, PAGE_LIMIT)
      .then((results) => {
        setProducts(results);
        setPage(1);
        // A full page (exactly PAGE_LIMIT items) means there might be
        // more; a partial page means we've definitely hit the end. The
        // endpoint gives us nothing else to go on.
        setHasMore(results.length === PAGE_LIMIT);
      })
      .catch((err) => {
        console.error("Failed to load user's products", err);
        setError("Не удалось загрузить объявления.");
      });
  }, [userId, userChecked]);

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Мои объявления</h1>

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
            Здесь будут ваши опубликованные объявления
          </p>
          <button
            onClick={() => router.push("/create")}
            className="cursor-pointer bg-gray-900 hover:opacity-90 transition text-white font-medium px-6 py-3 rounded-xl"
          >
            Подать
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0.5">
            {products.map((p) => (
              <FavoriteProductCard key={p.id} product={p} />
            ))}
          </div>

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="mt-6 w-full cursor-pointer bg-gray-100 hover:bg-gray-200 transition text-gray-800 font-medium py-3.5 rounded-2xl disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingMore ? "Загрузка…" : "Показать ещё"}
            </button>
          )}
        </>
      )}
    </div>
  );
}