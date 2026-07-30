"use client";

import { useState } from "react";
import Image from "next/image";
import { api } from "@/helpers/api";
import { ProductImage } from "@/types/images/image";
import { Product } from "@/types/Product";
import {Currency} from "@/enums/CurrencyEnum"
import { ProductsResponse, ProductsResponseInterface } from "@/types/responses/product.response";
import Link from "next/link";
import FavoriteButton from "@/components/ui/FavoriteButton";
import CircularLoader from "@/components/ui/CircularLoader";


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
      params: { page: page + 1, limit: 20},
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
    <section className="max-w-[1400px] mx-auto px-4 lg:px-0 py-6">
      <div
        className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 lg:gap-3 transition-opacity duration-300 ${
          loading ? "opacity-40 pointer-events-none" : "opacity-100"
        }`}
      >
        {products.map((product) => {
          const mainImage =
            product.images.find((i: ProductImage) => i.isMain)?.imageUrl ??
            "/images/default.png";

          return (
            <Link key={product.id} href={`/obyavlenie/${product.slug}`} className="group">
            <div
              className="rounded-xl hover:bg-gray-100 transition p-2"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden">
                <Image
                  src={`https://169-58-13-208.nip.io/public${mainImage}`}
                  alt={product.name}
                  fill
                  className="object-cover"
                  unoptimized
                />

                {/* Favorite — seeded from this product's own isFavorited
                    flag, which every /products response already includes
                    per item. */}
                <FavoriteButton
                  productId={product.id}
                  initialFavorited={product.isFavorited}
                  className="absolute bottom-2 right-2"
                />
              </div>

              {/* Price — matches birbir's computed styles exactly:
                  18px / 700 / line-height 22px / color #292929 / margin-bottom 6px,
                  single line (no wrap). */}
              <p className="mt-3 text-[18px] font-bold leading-[22px] text-[#292929] line-clamp-1 mb-1.5">
                {Number(product.price).toLocaleString("ru-RU")}{" "}
                {product.currency == Currency.USD ? "у.e" : "сум"}
              </p>

              {/* Title — matches birbir's computed styles exactly:
                  16px / 400 / line-height 19px / color #292929 / margin-bottom 5px,
                  clamped to 2 lines. Height still reserved for 2 lines so
                  region/date stay aligned across cards regardless of title length. */}
              <p className="text-[16px] leading-[19px] font-normal text-[#292929] line-clamp-2 min-h-[38px] mb-[5px]">
                {product.name}
              </p>

              {/* Region + date — both match birbir's shared "footerText" style
                  exactly: 14px / 500 / line-height 17px / color #858585 / margin-bottom 4px */}
              <p className="text-[14px] font-medium leading-[17px] text-[#858585] mb-1">
                {product.region?.name}
              </p>
              <p className="text-[14px] font-medium leading-[17px] text-[#858585]">
                {new Date(product.createdAt).toLocaleDateString("ru-RU")}
              </p>
            </div>
            </Link>
          );
        })}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="mt-6">
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
              cursor-pointer
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {loading ? (
              <>
                <span>Загрузка</span>
                <CircularLoader size={18} />
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