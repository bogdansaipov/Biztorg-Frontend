"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "@/types/Product";
import { ProductHorizontalCard } from "./ProductHorizontalCard";
import { useHorizontalScroll } from "@/hooks/useHorizontalScroll";

interface Props {
  title: string;
  products: Product[];
}

export function HorizontalProductSection({ title, products }: Props) {
  const { ref, canLeft, canRight, scrollLeft, scrollRight } =
    useHorizontalScroll();

  if (!products.length) return null;

  return (
    <section className="px-12.5 py-5 -mt-8">
      <div className="relative max-w-full sm:max-w-[600px] md:max-w-[880px] lg:max-w-[1300px] mx-auto">
        {/* Title */}
        <h2 className="text-3xl font-bold mb-2 text-black/80">
          {title}
        </h2>

        <div
          ref={ref}
          className="overflow-x-auto whitespace-nowrap scroll-smooth hide-scrollbar"
        >
          <div className="inline-flex gap-4">
            {products.map((p) => (
              <ProductHorizontalCard key={p.id} product={p} />
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