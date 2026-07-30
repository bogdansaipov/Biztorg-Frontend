import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/Product";
import { Currency } from "@/enums/CurrencyEnum";
import FavoriteButton from "@/components/ui/FavoriteButton";

const MEDIA_BASE = "https://169-58-13-208.nip.io/public";

// Same card as ProductGrid's, with fonts ~1px smaller than ProductGrid's
// equivalents (18->17, 16->15, 14->13) and matching line-height nudges.
// Card size overall is controlled by the grid's column count in
// FavoriteListingsTab, not by anything in here.
export default function FavoriteProductCard({
  product,
  onUnfavorite,
}: {
  product: Product;
  // Fires once the product has actually been removed from favorites on
  // the backend (not on the optimistic flip). Optional — most call sites
  // (FavoriteProfilesTab, etc.) just want a working heart and don't care;
  // only a "these ARE my favorites" list (FavoriteListingsTab) needs to
  // drop the card immediately when this fires.
  onUnfavorite?: () => void;
}) {
  const mainImage = product.images.find((i) => i.isMain)?.imageUrl ?? product.images[0]?.imageUrl;

  return (
    <Link href={`/obyavlenie/${product.slug}`} className="group">
      <div className="rounded-xl p-2">
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
          {mainImage && (
            <Image
              src={`${MEDIA_BASE}${mainImage}`}
              alt={product.name}
              fill
              className="object-cover"
              unoptimized
            />
          )}

          {/* Favorite — seeded from this product's own isFavorited flag. */}
          <FavoriteButton
            productId={product.id}
            initialFavorited={product.isFavorited}
            className="absolute bottom-2 right-2"
            onToggle={(isFavorited) => {
              if (!isFavorited) onUnfavorite?.();
            }}
          />
        </div>

        {/* Price — same pattern as ProductGrid, 1px smaller: 17px / 700 /
            line-height 21px, single line. */}
        <p className="mt-3 text-[17px] font-bold leading-[21px] text-[#292929] line-clamp-1 mb-1.5">
          {Number(product.price).toLocaleString("ru-RU")}{" "}
          {product.currency === Currency.USD ? "у.е" : "сум"}
        </p>

        {/* Title — 1px smaller: 15px / 400 / line-height 18px, clamped to
            2 lines, height reserved so region/date stay aligned across
            cards regardless of title length. */}
        <p className="text-[15px] leading-[18px] font-normal text-[#292929] line-clamp-2 min-h-[36px] mb-[5px]">
          {product.name}
        </p>

        {/* Region + date — 1px smaller: 13px / 500 / line-height 16px. */}
        <p className="text-[13px] font-medium leading-[16px] text-[#858585] mb-1">
          {product.region?.name}
        </p>
        <p className="text-[13px] font-medium leading-[16px] text-[#858585]">
          {new Date(product.createdAt).toLocaleDateString("ru-RU")}
        </p>
      </div>
    </Link>
  );
}