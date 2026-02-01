"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart } from "lucide-react";
import { api } from "@/helpers/api";
import { ProductImage } from "@/types/images/image";
import { Product } from "@/types/Product";
import {Currency} from "@/enums/CurrencyEnum"
import { ProductsResponse, ProductsResponseInterface } from "@/types/responses/product.response";
import Link from "next/link";


interface Props {
  initialProducts: Product[];
  initialPage: number;
  totalPages: number;
}

export default function ProductGrid ({initialProducts, initialPage, totalPages}: Props) {
    const [products, setProducts] = useState(initialProducts);
    const [page, setPage] = useState(initialPage);
    const [loading, setLoading] = useState(false);

    const hasMore = page < totalPages;

   const loadMore = async () => {
  try {
    setLoading(true);

    const res = await api.get<ProductsResponse>("/products", {
      params: { page: page + 1, limit: 4},
    });

    const { products, pagination } = res.data.data;

    setProducts((prev) => [...prev, ...products]);
    setPage(pagination.page);
  } catch (error) {
    console.error("Failed to load more products", error);
  } finally {
    setLoading(false);
  }
};

  return (
    <section className="max-w-7xl mx-auto px-6 py-6">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => {
          const mainImage =
            product.images.find((i: ProductImage) => i.isMain)?.imageUrl ??
            "/images/default.png";

          return (
            <Link key={product.id} href={`/obyavlenie/${product.slug}`} className="group">
            <div
              className="rounded-xl hover:bg-gray-100 transition p-2"
            >
              <div className="relative h-[310px] rounded-2xl overflow-hidden">
                <Image
                  src={`http://localhost:3001/public${mainImage}`}
                  alt={product.name}
                  fill
                  className="object-cover"
                  unoptimized
                />

                {/* Favorite */}
                <button className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-white flex items-center justify-center">
                  <Heart className="w-5 h-5 text-primary" />
                </button>
              </div>

              {/* Price */}
              <p className="mt-4 text-xl font-bold text-black/80">
                {Number(product.price).toLocaleString("ru-RU")}{" "}
                {product.currency == Currency.USD ? "у.e" : "сум"}
              </p>

              {/* Title */}
              <p className="mt-1 text-gray-700 font-semibold line-clamp-2 text-black/80">
                {product.name}
              </p>

              {/* Region + date */}
              <p className="mt-2 text-black/70">
                {product.region?.name}
              </p>
              <p className="text-black/70 text-sm">
                {new Date(product.createdAt).toLocaleDateString("ru-RU")}
              </p>
            </div>
            </Link>
          );
        })}
      </div>

      {/* Load more */}
{/* Load more */}
{hasMore && (
  <div className="mt-6 max-w-7xl mx-auto px-6">
    <button
      onClick={loadMore}
      disabled={loading}
      className="
        w-full
        bg-gray-100
        hover:bg-gray-200
        border
        border-gray-200
        text-gray-800
        px-8
        py-4
        rounded-2xl
        flex
        items-center
        justify-center
        gap-3
        transition
        disabled:cursor-not-allowed,
        cursor-pointer
        disabled:opacity-60
      "
    >
      {loading ? (
        <>
          <span>Загрузка</span>
          <span className="w-4 h-4 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
        </>
      ) : (
        "Показать ещё"
      )}
    </button>
  </div>
)}

    </section>
  );
}