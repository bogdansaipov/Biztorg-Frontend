"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StarIcon, UserIcon } from "@phosphor-icons/react";
import { getUserRatings } from "@/services/rating.service";
import { ProductRating } from "@/types/responses/rating.response";

const MEDIA_BASE = "https://169-58-13-208.nip.io/public";

// A single "N★ ██████░░░░ 12" row — count of 5-star ratings down to
// 1-star, each with its own proportional bar out of the total. Bar is
// black, not yellow — only the star icons themselves stay gold.
function RatingBarRow({ starLevel, count, total }: { starLevel: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-0.5 shrink-0 w-[104px]">
        {Array.from({ length: 5 }).map((_, i) =>
          i < starLevel ? (
            <StarIcon key={i} weight="fill" className="w-4 h-4 text-yellow-400" />
          ) : (
            <StarIcon key={i} weight="fill" className="w-4 h-4 text-gray-200" />
          ),
        )}
      </div>
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full bg-gray-900 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-base text-gray-600 w-7 text-right shrink-0">{count}</span>
    </div>
  );
}

// Each review is its own card — flat white box with just a border, no
// shadow — sitting on the page background below the summary card.
function ReviewCard({ review }: { review: ProductRating }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <Link href={`/user/${review.rater.id}`} className="flex items-start gap-3 mb-3 group">
        <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
          <UserIcon weight="regular" className="w-7 h-7 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold text-gray-900 text-base group-hover:underline">{review.rater.name}</span>
            <span className="text-sm text-gray-400 shrink-0">
              {new Date(review.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
            </span>
          </div>
          <div className="flex items-center gap-0.5 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon
                key={i}
                weight="fill"
                className={`w-4 h-4 ${i < review.rating ? "text-yellow-400" : "text-gray-200"}`}
              />
            ))}
          </div>
        </div>
      </Link>

      {review.comment && <p className="text-base text-gray-800 mb-3">{review.comment}</p>}

      {/* Product mini-card — clickable straight through to the listing. */}
      <Link
        href={`/obyavlenie/${review.product.id}`}
        className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 transition rounded-xl p-3"
      >
        {review.product.mainImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${MEDIA_BASE}${review.product.mainImageUrl}`}
            alt={review.product.name}
            className="w-16 h-16 rounded-lg object-cover shrink-0"
          />
        )}
        <span className="text-base text-gray-700 truncate">{review.product.name}</span>
      </Link>
    </div>
  );
}

export default function UserRatingsSection({ userId }: { userId: string }) {
  const [data, setData] = useState<{ averageRating: number | null; totalRatings: number; ratings: ProductRating[] } | null>(
    null,
  );

  useEffect(() => {
    if (!userId) return;
    getUserRatings(userId)
      .then(setData)
      .catch((err) => {
        console.error("Failed to load user ratings", err);
        setData({ averageRating: 0, totalRatings: 0, ratings: [] });
      });
  }, [userId]);

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
          <div className="h-12 w-20 bg-gray-200 rounded mb-2" />
          <div className="h-5 w-24 bg-gray-100 rounded mb-5" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-3 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Ratings received per star level (5 down to 1) — the API only gives us
  // the flat list, so the histogram counts are derived from it here
  // rather than coming precomputed from the backend.
  const counts = [0, 0, 0, 0, 0]; // index 0 = 5★, index 4 = 1★
  data.ratings.forEach((r) => {
    const idx = 5 - Math.round(r.rating);
    if (idx >= 0 && idx < 5) counts[idx]++;
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl sm:text-xl lg:text-2xl font-bold text-gray-800">Отзывы о товарах пользователя</h2>

      {/* SUMMARY — its own card: big average, total count, 5-to-1 bar
          histogram. */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6">
        <p className="text-4xl font-bold text-gray-900">{(data.averageRating ?? 0).toFixed(1)}</p>
        <p className="text-base text-gray-500 mb-6">
          {data.totalRatings} {data.totalRatings === 1 ? "отзыв" : "отзывов"}
        </p>

        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((level, i) => (
            <RatingBarRow key={level} starLevel={level} count={counts[i]} total={data.totalRatings} />
          ))}
        </div>
      </div>

      {/* REVIEWS — every rating the user has received, each its own card
          stacked below the summary, not folded into the same box. */}
      {data.ratings.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}