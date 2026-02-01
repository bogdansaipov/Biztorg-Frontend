"use client"

import { useRef, useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Category } from "@/types/category";

interface Props {
    categories: Category[];
}

export default function CategorySlider({ categories }: Props) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const scrollAmount = 300;

  const [showPrev, setShowPrev] = useState(false);
  const [showNext, setShowNext] = useState(true);

  const updateArrows = () => {
    const el = sliderRef.current;
    if (!el) return;

    setShowPrev(el.scrollLeft > 0);
    setShowNext(el.scrollLeft + el.clientWidth < el.scrollWidth);
  };

  useEffect(() => {
    updateArrows();
  }, []);

  const scrollLeft = () => {
    sliderRef.current?.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  };

  const scrollRight = () => {
    sliderRef.current?.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  return (
    <section className="relative py-4 max-w-7xl mx-auto">
      {/* Slider */}
      <div
        ref={sliderRef}
        onScroll={updateArrows}
        className="overflow-x-auto whitespace-nowrap scroll-smooth hide-scrollbar"
      >
        <div className="inline-flex gap-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="hover:bg-gray-100 rounded-xl p-2 cursor-pointer transition"
            >
              <div className="flex flex-col items-center space-y-2 min-w-[140px]">
                <img
                  src={`http://localhost:3001/public/${category.imageUrl}`}
                  alt={category.name}
                  className="bg-white rounded-3xl w-32 h-32 object-contain"
                />
                <p className="text-center font-medium text-black/80">
                  {category.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Left arrow */}
      {showPrev && (
        <button
          onClick={scrollLeft}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>
      )}

      {showNext && (
        <button
          onClick={scrollRight}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
        >
          <ChevronRight className="w-7 h-7" />
        </button>
      )}
    </section>
  );
}