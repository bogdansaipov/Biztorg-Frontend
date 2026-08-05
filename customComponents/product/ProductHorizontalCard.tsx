import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/Product";
import { Currency } from "@/enums/CurrencyEnum";
import FavoriteButton from "@/components/ui/FavoriteButton";
import { localized } from "@/lib/localized";
import { formatJoinDate } from "@/lib/formatJoinDate";

export function ProductHorizontalCard({
  product,
  locale,
  priceUsdLabel,
  priceUzsLabel,
  defaultRegionLabel,
}: {
  product: Product;
  locale: string;
  priceUsdLabel: string;
  priceUzsLabel: string;
  defaultRegionLabel: string;
}) {
  const image = `https://169-58-13-208.nip.io/public/${product.images[0].imageUrl}`;

  const CARD_WIDTH = "w-[calc(50%-0.25rem)] sm:w-[270px]";

  return (
    <Link
      href={`/${locale}/obyavlenie/${product.slug}`}
      className={`block ${CARD_WIDTH} shrink-0 hover:bg-gray-100 rounded-xl p-2 transition`}
    >
      <div className="flex flex-col w-full rounded-lg whitespace-normal">
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden">
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            unoptimized
          />

          <FavoriteButton
            productId={product.id}
            initialFavorited={product.isFavorited}
            className="absolute bottom-2 right-2"
          />
        </div>

        <p className="mt-3 text-[18px] font-bold leading-[22px] text-[#292929] line-clamp-1 mb-1.5">
          {new Intl.NumberFormat("ru-RU").format(Number(product.price))}{" "}
          {product.currency === Currency.USD ? priceUsdLabel : priceUzsLabel}
        </p>

        <p className="w-full text-[16px] leading-[19px] font-normal text-[#292929] line-clamp-2 min-h-[38px] mb-[5px]">
          {product.name}
        </p>

        <p className="text-[14px] font-medium leading-[17px] text-[#858585] mb-1">
          {product.region ? localized(product.region, locale) : defaultRegionLabel}
        </p>
        <p className="text-[14px] font-medium leading-[17px] text-[#858585]">
          {formatJoinDate(product.createdAt, locale)}
        </p>
      </div>
    </Link>
  );
}