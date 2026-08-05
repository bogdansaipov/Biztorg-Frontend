"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "@/types/Product";
import { ProductHorizontalCard } from "./ProductHorizontalCard";
import { useHorizontalScroll } from "@/hooks/useHorizontalScroll";

interface Props {
  title: string;
  products: Product[];
}

export function HorizontalProductSection({ title, products }: Props) {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "ru";
  const t = useTranslations("productDetails");

  const { ref, canLeft, canRight, scrollLeft, scrollRight } =
    useHorizontalScroll();

  if (!products.length) return null;

  return (
    <section className="max-w-[1400px] mx-auto px-4 lg:px-0 py-5 -mt-8">
      <div className="relative">
        <h2 className="text-2xl lg:text-3xl font-bold mb-2 text-black/80">
          {title}
        </h2>

        <div
          ref={ref}
          className="overflow-x-auto whitespace-nowrap scroll-smooth hide-scrollbar"
        >
          <div className="inline-flex gap-2 sm:gap-4 min-w-full">
            {products.map((p) => (
              <ProductHorizontalCard
                key={p.id}
                product={p}
                locale={locale}
                priceUsdLabel={t("priceUsd")}
                priceUzsLabel={t("priceUzs")}
                defaultRegionLabel={t("defaultRegion")}
              />
            ))}
          </div>
        </div>

        {canLeft && (
          <button
            onClick={scrollLeft}
            className="
              cursor-pointer
              absolute left-0 top-1/2 -translate-y-1/2
              -translate-x-1/2
              z-20
              w-14 h-14
              bg-white border shadow
              rounded-full
              flex items-center justify-center
              hover:bg-gray-100
            "
          >
            <ChevronLeft className="w-8 h-8 text-gray-600" />
          </button>
        )}

        {canRight && (
          <button
            onClick={scrollRight}
            className="
              absolute right-0 top-1/2 -translate-y-1/2
              translate-x-1/2
              cursor-pointer
              z-20
              w-14 h-14
              bg-white border shadow
              rounded-full
              flex items-center justify-center
              hover:bg-gray-100
            "
          >
            <ChevronRight className="w-8 h-8 text-gray-600" />
          </button>
        )}
      </div>
    </section>
  );
}