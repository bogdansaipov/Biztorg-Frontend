"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Lightning, Storefront, ArrowsLeftRight } from "@phosphor-icons/react";
import { api } from "@/helpers/api";
import { ProductImage } from "@/types/images/image";
import { Product } from "@/types/Product";
import {Currency} from "@/enums/CurrencyEnum"
import { ProductsResponse, ProductsResponseInterface } from "@/types/responses/product.response";
import Link from "next/link";
import FavoriteButton from "@/components/ui/FavoriteButton";
import CircularLoader from "@/components/ui/CircularLoader";
import { useNavigationPendingStore } from "@/stores/navigationPending.store";
import { localized } from "@/lib/localized";
import { formatProductDate } from "@/lib/formatDate";


interface Props {
  initialProducts: Product[];
  initialPage: number;
  totalPages: number;
  regionId?: string;
}

interface ProductBadge {
  key: string;
  icon: typeof Lightning;
  label: string;
}

interface BadgeLabels {
  urgent: string;
  shop: string;
  purchase: string;
}

function getProductBadges(product: Product, labels: BadgeLabels): ProductBadge[] {
  const badges: ProductBadge[] = [];
  if (product.isUrgent) badges.push({ key: "urgent", icon: Lightning, label: labels.urgent });
  if (product.shopId) badges.push({ key: "shop", icon: Storefront, label: labels.shop });
  if (product.type === "PURCHASE") badges.push({ key: "purchase", icon: ArrowsLeftRight, label: labels.purchase });
  return badges;
}

  const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_URL ?? "https://169-58-13-208.nip.io";

function ProductCardBadges({ product, labels }: { product: Product; labels: BadgeLabels }) {
  const badges = getProductBadges(product, labels);
  if (badges.length === 0) return null;

  const [primary, ...rest] = badges;



  return (
    <div className="absolute top-2 left-2 flex items-center gap-1">
      <span className="flex items-center gap-1 bg-gray-900/85 text-white text-xs font-medium px-2.5 py-1 rounded-full">
        <primary.icon className="w-3.5 h-3.5" weight="fill" />
        {primary.label}
      </span>
      {rest.map((badge) => (
        <span
          key={badge.key}
          title={badge.label}
          className="flex items-center justify-center w-6 h-6 bg-gray-900/85 text-white rounded-full shrink-0"
        >
          <badge.icon className="w-3.5 h-3.5" weight="fill" />
        </span>
      ))}
    </div>
  );
}

export default function ProductGrid ({initialProducts, initialPage, totalPages, regionId}: Props) {
    const pathname = usePathname();
    const locale = pathname.split("/")[1] || "ru";
    const t = useTranslations("productGrid");

    const badgeLabels: BadgeLabels = {
      urgent: t("urgent"),
      shop: t("shop"),
      purchase: t("purchase"),
    };

    const [products, setProducts] = useState(initialProducts);
    const [page, setPage] = useState(initialPage);
    const [loading, setLoading] = useState(false);

    const pending = useNavigationPendingStore((s) => s.pending);
    const setPending = useNavigationPendingStore((s) => s.setPending);
    useEffect(() => {
      setProducts(initialProducts);
      setPage(initialPage);
      setPending(false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialProducts]);

    const hasMore = page < totalPages;

   const loadMore = async () => {
  try {
    setLoading(true);

    const res = await api.get<ProductsResponse>("/products", {
      params: { page: page + 1, limit: 20, regionId },
    });

    const { products, pagination } = res.data.data;

    setProducts((prev) => [...prev, ...products]);
    setPage(pagination.page);
  } catch (error) {
    console.error("Failed to load more products", error);
  } finally {
    setLoading(false);
  }
};

  return (
    <section className="max-w-[1400px] mx-auto px-4 lg:px-0 py-6">
      <div
        className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 lg:gap-3 transition-opacity duration-300 ${
          loading || pending ? "opacity-40 pointer-events-none" : "opacity-100"
        }`}
      >
        {products.map((product, index) => {
          const mainImage =
            product.images.find((i: ProductImage) => i.isMain)?.imageUrl ??
            "/images/default.png";

          return (
            <Link key={product.id} href={`/${locale}/obyavlenie/${product.slug}`} className="group">
            <div
              className="rounded-xl hover:bg-gray-100 transition p-2"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden">
                <Image
                  src={`${MEDIA_BASE}/public${mainImage}`}
                  alt={product.name}
                  fill
                  className="object-cover"
                  unoptimized
                  priority={index < 4}
                />

                <FavoriteButton
                  productId={product.id}
                  initialFavorited={product.isFavorited}
                  className="absolute bottom-2 right-2"
                />

                <ProductCardBadges product={product} labels={badgeLabels} />
              </div>

              <p className="mt-3 text-[18px] font-bold leading-[22px] text-[#292929] line-clamp-1 mb-1.5">
                {Number(product.price).toLocaleString("ru-RU")}{" "}
                {product.currency == Currency.USD ? t("usd") : t("uzs")}
              </p>

              <p className="text-[16px] leading-[19px] font-normal text-[#292929] line-clamp-2 min-h-[38px] mb-[5px]">
                {product.name}
              </p>

              <p className="text-[14px] font-medium leading-[17px] text-[#858585] mb-1">
                {product.region ? localized(product.region, locale) : ""}
              </p>
              <p className="text-[14px] font-medium leading-[17px] text-[#858585]">
  {formatProductDate(product.createdAt, locale)}
</p>
            </div>
            </Link>
          );
        })}
      </div>

      {hasMore && (
        <div className="mt-6">
          <button
            onClick={loadMore}
            disabled={loading}
            className="
              w-full
              bg-gray-100
              hover:bg-gray-200
              border
              border-gray-200
              text-gray-800
              px-8
              py-4
              rounded-2xl
              flex
              items-center
              justify-center
              gap-3
              transition
              cursor-pointer
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {loading ? (
              <>
                <span>{t("loading")}</span>
                <CircularLoader size={18} />
              </>
            ) : (
              t("showMore")
            )}
          </button>
        </div>
      )}

    </section>
  );
}