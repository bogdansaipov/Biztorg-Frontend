"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, X, ImageSquare, ImageSquareIcon } from "@phosphor-icons/react";
import { StarIcon } from "@phosphor-icons/react";
import { getSingleProduct } from "@/services/product.service";
import { createProductRating } from "@/services/rating.service";
import { Product } from "@/types/Product";
import { ArrowLeftIcon, XIcon } from "lucide-react";
import CircularLoader from "@/components/ui/CircularLoader";

const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_URL ?? "https://api.biztorg.uz"
const MAX_IMAGES = 3;

// Label shown under the stars once a rating is picked — matches the
// mobile app's "Отлично" text appearing under a 5-star selection.
const RATING_LABELS: Record<number, string> = {
  1: "Плохо",
  2: "Ниже среднего",
  3: "Нормально",
  4: "Хорошо",
  5: "Отлично",
};

export default function RateProductPage() {
  const params = useParams<{ id: string; productId: string }>();
  const router = useRouter();
  const { productId } = params;

  const [product, setProduct] = useState<Product | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;
    getSingleProduct(productId)
      .then(setProduct)
      .catch((err) => console.error("Failed to load product for rating", err));
  }, [productId]);

  const mainImage = product?.images.find((i) => i.isMain)?.imageUrl ?? product?.images[0]?.imageUrl;
  const displayValue = hoverRating || rating;

  const handleAddImages = (files: FileList | null) => {
    if (!files) return;
    const picked = Array.from(files).slice(0, MAX_IMAGES - images.length);
    setImages((prev) => [...prev, ...picked].slice(0, MAX_IMAGES));
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!rating || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      await createProductRating({
        productId,
        rating,
        comment: comment.trim() || undefined,
        images: images.length > 0 ? images : undefined,
      });
      // Back to the profile whose product this was — matches how the
      // person got here in the first place (from that profile's "Оценить").
      router.push(product ? `/user/${product.userId}` : "/");
    } catch (err) {
      console.error("Failed to submit rating", err);
      setError("Не удалось опубликовать отзыв.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Top bar content sits in the same 1400px container as the rest of
          the site, instead of the arrow+title+close row stretching edge
          to edge with nothing else to balance it. */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4 lg:px-6 py-3">
          <button onClick={() => router.back()} className="cursor-pointer p-1 -ml-1" aria-label="Назад">
            <ArrowLeftIcon className="w-6 h-6 text-gray-800" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Отзыв</h1>
          <button onClick={() => router.back()} className="cursor-pointer p-1 -mr-1" aria-label="Закрыть">
            <X className="w-6 h-6 text-gray-800" />
          </button>
        </div>
      </div>

      {/* Outer container matches the site's standard 1400px width; the
          form itself is centered a bit wider than the original mobile
          layout on desktop (640px instead of 560px), but dialed back from
          the previous pass's 720px/oversized components. */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
        <div className="max-w-[560px] lg:max-w-[640px] mx-auto space-y-4 lg:space-y-5">
          {/* PRODUCT PREVIEW + STAR PICKER */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 lg:p-8 flex flex-col items-center text-center">
            {!product ? (
              <div className="animate-pulse space-y-3 w-full flex flex-col items-center">
                <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-xl bg-gray-200" />
                <div className="h-4 w-40 bg-gray-200 rounded" />
              </div>
            ) : (
              <>
                <div className="relative w-20 h-20 lg:w-24 lg:h-24 rounded-xl overflow-hidden bg-gray-100 mb-3">
                  {mainImage && (
                    <Image
                      src={`${MEDIA_BASE}/public${mainImage}`}
                      alt={product.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </div>
                <p className="font-semibold text-gray-900 text-base lg:text-lg mb-4 lg:mb-5">{product.name}</p>
              </>
            )}

            {/* Tap-to-fill stars — hover previews the fill, click commits it. */}
            <div className="flex items-center gap-1.5 lg:gap-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const starValue = i + 1;
                return (
                  <button
                    key={i}
                    type="button"
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(starValue)}
                    className="cursor-pointer p-0.5"
                    aria-label={`${starValue} из 5`}
                  >
                    <StarIcon
                      weight="fill"
                      className={`w-9 h-9 lg:w-10 lg:h-10 transition-colors ${
                        starValue <= displayValue ? "text-yellow-400" : "text-gray-200"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <p className="text-sm text-gray-500 mt-3">{RATING_LABELS[displayValue] ?? "Поставьте оценку"}</p>
          </div>

          {/* COMMENT */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 lg:p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Поделитесь впечатлениями</h2>
            <p className="text-sm text-gray-500 mb-3">Что понравилось, а что можно улучшить?</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full resize-none bg-gray-50 rounded-xl p-3 text-base text-gray-800 outline-none placeholder:text-gray-400"
            />
          </div>

          {/* IMAGES */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 lg:p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Прикрепите фото</h2>
            <p className="text-sm text-gray-500 mb-3">
              Не более {MAX_IMAGES}х фото — другим будет проще принять решение
            </p>

            <div className="flex gap-3">
              {images.map((file, i) => (
                <div key={i} className="relative w-20 h-20 lg:w-24 lg:h-24 rounded-xl overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center cursor-pointer"
                    aria-label="Удалить фото"
                  >
                    <XIcon className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}

              {images.length < MAX_IMAGES && (
                <label className="w-20 h-20 lg:w-24 lg:h-24 rounded-xl bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center cursor-pointer shrink-0 hover:bg-gray-100 transition">
                  <ImageSquareIcon className="w-6 h-6 text-gray-400" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleAddImages(e.target.files)}
                  />
                </label>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={!rating || submitting}
            className="w-full py-3.5 rounded-xl mt-4 font-medium text-white text-base bg-primary hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
          >
            {submitting ? (
              <>
                <span>Публикация</span>
                <CircularLoader size={18} />
              </>
            ) : (
              "Опубликовать"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}