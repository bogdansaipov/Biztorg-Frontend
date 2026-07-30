import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/Product";
import { Currency } from "@/enums/CurrencyEnum";
import FavoriteButton from "@/components/ui/FavoriteButton";

export function ProductHorizontalCard({ product }: { product: Product }) {
  const image = `https://169-58-13-208.nip.io/public/${product.images[0].imageUrl}`;

  // Card width on mobile: a PERCENTAGE of the row's own rendered width, not
  // a 100vw calc. 100vw is unreliable for this — it can disagree with the
  // actual visible container width for all sorts of reasons (browser
  // scrollbar reservation, DevTools mobile-emulation quirks, extra
  // ancestor padding/margins elsewhere in the layout), and any of those
  // was leaving a dead strip of space next to the second card instead of
  // it filling the row exactly.
  //
  // Percentages resolve against the row's real rendered width instead, so
  // they self-correct no matter what's going on upstream. `50% - 0.25rem`
  // (half of the row's `gap-2`, i.e. 0.5rem) means two cards + the one gap
  // between them sum to exactly 100% of the row: 50%-0.25rem + 50%-0.25rem
  // + 0.5rem gap = 100%, with nothing left over.
  // From sm: up this reverts to the original fixed 270px.
  const CARD_WIDTH = "w-[calc(50%-0.25rem)] sm:w-[270px]";

  return (
    <Link
      href={`/obyavlenie/${product.slug}`}
      className={`block ${CARD_WIDTH} shrink-0 hover:bg-gray-100 rounded-xl p-2 transition`}
    >
      {/*
        whitespace-normal below is important: HorizontalProductSection's
        scroll wrapper sets white-space: nowrap on itself (so the cards stay
        in a single row), and that inherits down into every descendant by
        default — including this card's title. With nowrap inherited,
        there's nothing for line-clamp-2 to wrap across, so the text just
        ran on as one line and got clipped at the box edge instead of
        breaking onto a second line. Resetting it here restores real
        wrapping inside the card while the outer row still stays
        non-wrapping for the scroll behavior.

        This inner div is `w-full`, NOT a repeat of CARD_WIDTH. The parent
        Link already has `p-2` padding, and since padding is included in a
        border-box element's declared width, the Link's real content area
        is CARD_WIDTH minus that padding. Repeating CARD_WIDTH here would
        make this div wider than that content area, spilling the image out
        past the padded/hover-highlighted box.
      */}
      <div className="flex flex-col w-full rounded-lg whitespace-normal">
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden">
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            unoptimized
          />

          {/* Favorite — same component/positioning as ProductGrid, now
              actually wired to this product's id/isFavorited instead of
              being purely decorative. */}
          <FavoriteButton
            productId={product.id}
            initialFavorited={product.isFavorited}
            className="absolute bottom-2 right-2"
          />

          {/* {product.isFromShop && (
            <span className="absolute top-2 left-2 flex items-center text-white bg-green-600/80 px-3 py-1 rounded-full text-sm font-semibold">
              <Store className="w-4 h-4 mr-1" /> Магазин
            </span>
          )} */}
        </div>

        {/* Price — matches birbir's computed styles exactly, same as ProductGrid:
            18px / 700 / line-height 22px / color #292929 / margin-bottom 6px,
            single line (no wrap). */}
        <p className="mt-3 text-[18px] font-bold leading-[22px] text-[#292929] line-clamp-1 mb-1.5">
          {new Intl.NumberFormat("ru-RU").format(Number(product.price))}{" "}
          {product.currency === Currency.USD ? "у.е" : "сум"}
        </p>

        {/* Title — matches birbir's computed styles exactly, same as ProductGrid:
            16px / 400 / line-height 19px / color #292929 / margin-bottom 5px,
            clamped to 2 lines with fixed-height reservation so region/date
            always start at the same y-position across cards. */}
        <p className="w-full text-[16px] leading-[19px] font-normal text-[#292929] line-clamp-2 min-h-[38px] mb-[5px]">
          {product.name}
        </p>

        {/* Region + date — both match birbir's shared "footerText" style
            exactly: 14px / 500 / line-height 17px / color #858585 / margin-bottom 4px */}
        <p className="text-[14px] font-medium leading-[17px] text-[#858585] mb-1">
          {product.region?.name ?? "Ташкент"}
        </p>
        <p className="text-[14px] font-medium leading-[17px] text-[#858585]">
          {new Date(product.createdAt).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>
    </Link>
  );
}