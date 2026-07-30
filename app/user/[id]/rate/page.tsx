"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { getUserProducts } from "@/services/user.service";
import { Product } from "@/types/Product";

const MEDIA_BASE = "https://169-58-13-208.nip.io/public";

export default function SelectProductToRatePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = params.id;

  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    if (!userId) return;
    getUserProducts(userId)
      .then(setProducts)
      .catch((err) => {
        console.error("Failed to load products to rate", err);
        setProducts([]);
      });
  }, [userId]);

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Top bar content sits inside the same 1400px container as the
          rest of the page. */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto flex items-center gap-3 px-4 py-3">
          <button onClick={() => router.back()} className="cursor-pointer p-1 -ml-1" aria-label="Назад">
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Выберите объявление</h1>
        </div>
      </div>

      {/* Same 1400px width as the rest of the site. Items stay the same
          horizontal row (small image + text) at every breakpoint now —
          desktop just arranges them into a 2/3-column grid of rows
          instead of the taller vertical cards from before, and gaps are
          tighter across the board. */}
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="flex flex-col gap-2 lg:gap-3 lg:max-w-[933px]">
          {products === null ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-20 lg:h-24 rounded-2xl bg-gray-100 animate-pulse" />
            ))
          ) : products.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">
              У этого пользователя пока нет объявлений.
            </p>
          ) : (
            products.map((product) => {
              const mainImage = product.images.find((i) => i.isMain)?.imageUrl ?? product.images[0]?.imageUrl;
              // isRatedByCurrentUser comes straight from GET /users/{id}/products —
              // once true, a rating already exists for this product from the
              // current viewer, so it can't be rated again.
              const alreadyRated = product.isRatedByCurrentUser;

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
                    <p className="font-medium text-gray-900 text-base lg:text-lg truncate">{product.name}</p>
                    <p className="text-sm lg:text-base text-gray-500 truncate">{product.region?.name}</p>
                  </div>

                  {alreadyRated && (
                    <span className="flex items-center gap-1 text-xs lg:text-sm text-emerald-600 shrink-0">
                      <CheckCircle className="w-4 h-4" />
                      Оценено
                    </span>
                  )}
                </div>
              );

              return alreadyRated ? (
                <div key={product.id}>{content}</div>
              ) : (
                <Link key={product.id} href={`/user/${userId}/rate/${product.id}`}>
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