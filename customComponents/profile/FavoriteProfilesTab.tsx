"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleUser, Store, BadgeCheck } from "lucide-react";
import { getMyFollows } from "@/services/follow.service";
import { FollowedShopEntry, FollowedUserEntry, FollowsMeData } from "@/types/responses/follow.response";
import { Product } from "@/types/Product";
import FavoriteProductCard from "./FavoriteProductCard";
import FavoriteCardSkeleton from "./FavoriteCardSkeleton";

// First row shown immediately; "Показать ещё" reveals up to this many more
// (filling a second row of 5) — matches the birbir reference exactly:
// row 1 = 5 products, row 2 = 4 products + 1 "see all" tile.
const FIRST_ROW = 5;
const SECOND_ROW = 4;
const MAX_SHOWN = FIRST_ROW + SECOND_ROW; // 9 real product slots, max

function pluralizeListings(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${count} объявлений`;
  if (mod10 === 1) return `${count} объявление`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} объявления`;
  return `${count} объявлений`;
}

// One followed target (user or shop) — header row + its product grid.
function FollowedEntrySection({
  name,
  isShop,
  isVerified,
  href,
  products,
}: {
  name: string;
  isShop: boolean;
  isVerified: boolean;
  href: string;
  products: Product[];
}) {
  const [expanded, setExpanded] = useState(false);

  const visibleCount = expanded ? Math.min(products.length, MAX_SHOWN) : FIRST_ROW;
  const visibleProducts = products.slice(0, visibleCount);

  const showExpandButton = !expanded && products.length > FIRST_ROW;

  return (
    <div className="py-6 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center justify-between gap-3 mb-4">
        <Link href={href} className="flex items-center gap-3 min-w-0 group">
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
            {isShop ? (
              <Store className="w-6 h-6 text-gray-400" />
            ) : (
              <CircleUser className="w-7 h-7 text-gray-400" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 font-semibold text-gray-800 truncate group-hover:text-primary transition">
              <span className="truncate">{name}</span>
              {isVerified && <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />}
            </div>
            <div className="text-sm text-gray-500">{pluralizeListings(products.length)}</div>
          </div>
        </Link>

        {/* TODO: no unfollow endpoint given yet — wire this up once you
            have one (e.g. DELETE /follows/:targetId). */}
        <button className="shrink-0 cursor-pointer bg-gray-100 hover:bg-gray-200 transition text-gray-700 text-sm font-medium px-4 py-2 rounded-full">
          Вы подписаны
        </button>
      </div>

      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0.5">
            {visibleProducts.map((p) => (
              <FavoriteProductCard key={p.id} product={p} />
            ))}

            {/* Always the last cell in the grid, regardless of expand
                state — a static "Смотреть все" tile linking to the full
                profile. Structured to exactly mirror FavoriteProductCard's
                wrapper (outer p-2, inner aspect-square) so this square
                ends up the same actual size as a product image, not
                bigger — aspect-square directly on a padded element makes
                its footprint the full column width plus that padding. */}
            <Link href={href} className="block rounded-xl p-2">
              <div className="relative aspect-square rounded-2xl bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center text-center font-medium text-gray-700 p-2">
                Смотреть все
              </div>
            </Link>
          </div>

          {showExpandButton && (
            <button
              onClick={() => setExpanded(true)}
              className="mt-3 w-full cursor-pointer bg-gray-100 hover:bg-gray-200 transition text-gray-700 font-medium py-3 rounded-xl"
            >
              Показать ещё
            </button>
          )}
        </>
      ) : (
        <p className="text-gray-400 text-sm">Пока нет объявлений</p>
      )}
    </div>
  );
}

export default function FavoriteProfilesTab() {
  const [data, setData] = useState<FollowsMeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyFollows()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="py-6 border-b border-gray-100 last:border-b-0 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="h-3 w-20 rounded bg-gray-200" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0.5">
              {Array.from({ length: 5 }).map((_, j) => (
                <FavoriteCardSkeleton key={j} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const users: FollowedUserEntry[] = data?.users ?? [];
  const shops: FollowedShopEntry[] = data?.shops ?? [];

  if (users.length === 0 && shops.length === 0) {
    return (
      <p className="text-gray-400 text-sm py-6">
        Вы пока ни на кого не подписаны.
      </p>
    );
  }

  return (
    <div>
      {users.map((entry) => (
        <FollowedEntrySection
          key={entry.user.id}
          name={entry.user.name}
          isShop={false}
          isVerified={false}
          href={`/user/${entry.user.id}`}
          products={entry.products}
        />
      ))}

      {shops.map((entry) => (
        <FollowedEntrySection
          key={entry.shop.id}
          name={entry.shop.shopName}
          isShop
          isVerified={entry.shop.verificationStatus === "VERIFIED"}
          href={`/shop/${entry.shop.id}`}
          products={entry.products}
        />
      ))}
    </div>
  );
}