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
    <section className="max-w-[1400px] mx-auto px-4 lg:px-0 py-5 -mt-8">
      <div className="relative">
        {/* Title */}
        <h2 className="text-2xl lg:text-3xl font-bold mb-2 text-black/80">
          {title}
        </h2>

        <div
          ref={ref}
          className="overflow-x-auto whitespace-nowrap scroll-smooth hide-scrollbar"
        >
          {/*
            min-w-full is what makes single-card sections render correctly.
            Each ProductHorizontalCard is sized as a PERCENTAGE of this row
            (calc(50% - 0.25rem)), which only resolves sensibly when this
            row itself has a definite width to measure against. With 2+
            cards + shrink-0, the row naturally grows to fit its content
            and everything works. But with exactly 1 card, there's nothing
            forcing this inline-flex row to be any particular width — it's
            free to shrink-wrap — so the single child's 50% ends up being
            50% of whatever tiny width the row collapsed to, not 50% of the
            visible area. min-w-full guarantees the row is at least as wide
            as its scrollable container regardless of card count, so the
            percentage always resolves against the real visible width. It
            still grows past that (for horizontal scrolling) once there are
            enough cards to need it, since shrink-0 on each card prevents
            them from being squeezed back down to fit.
          */}
          <div className="inline-flex gap-2 sm:gap-4 min-w-full">
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