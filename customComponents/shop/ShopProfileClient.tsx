"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import {
  Star,
  Megaphone,
  Users,
  ShareNetwork,
  SealCheck,
  ChatCircleText,
  Phone,
  Storefront,
  CaretRight,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { getShopPublicProfile, getShopProducts } from "@/services/shop.service";
import { followShop, unfollowShop } from "@/services/follow.service";
import { PublicShopProfile } from "@/types/responses/shop.response";
import { Product } from "@/types/Product";
import { ProductImage } from "@/types/images/image";
import { Currency } from "@/enums/CurrencyEnum";
import Link from "next/link";
import FavoriteButton from "@/components/ui/FavoriteButton";
import CircularLoader from "@/components/ui/CircularLoader";
import ShopRatingsSection from "@/customComponents/profile/ShopRatingsSection";
import { useAuthStore } from "@/stores/auth.store";
import { localized } from "@/lib/localized";
import { formatJoinDate } from "@/lib/formatJoinDate";
import { formatProductDate } from "@/lib/formatDate";

const MEDIA_BASE = "https://169-58-13-208.nip.io/public";

function ShopStarRow({ rating }: { rating: number }) {
  const filledCount = Math.round(rating);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) =>
        i < filledCount ? (
          <Star key={i} weight="fill" className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
        ) : (
          <Star key={i} weight="regular" className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
        ),
      )}
    </div>
  );
}

export default function ShopProfileClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const shopId = params.id;
  const ratingsRef = useRef<HTMLDivElement>(null);

  const locale = pathname.split("/")[1] || "ru";
  const t = useTranslations("shopProfileClient");

  const [shop, setShop] = useState<PublicShopProfile | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [productsPage, setProductsPage] = useState(1);
  const [productsHasMore, setProductsHasMore] = useState(false);
  const [productsLoadingMore, setProductsLoadingMore] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PRODUCTS_PAGE_LIMIT = 20;

  const currentUserId = useAuthStore((s) => s.user?.id);
  const isOwner = !!shop && !!currentUserId && shop.userId === currentUserId;

  useEffect(() => {
    if (!shopId) return;

    getShopPublicProfile(shopId)
      .then(setShop)
      .catch((err) => {
        console.error("Failed to load public shop profile", err);
        setError(t("loadError"));
      });

    getShopProducts(shopId, 1, PRODUCTS_PAGE_LIMIT)
      .then((results) => {
        setProducts(results);
        setProductsPage(1);
        setProductsHasMore(results.length === PRODUCTS_PAGE_LIMIT);
      })
      .catch((err) => {
        console.error("Failed to load shop's products", err);
        setProducts([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  const loadMoreProducts = async () => {
    setProductsLoadingMore(true);
    try {
      const nextPage = productsPage + 1;
      const more = await getShopProducts(shopId, nextPage, PRODUCTS_PAGE_LIMIT);
      setProducts((prev) => [...(prev ?? []), ...more]);
      setProductsPage(nextPage);
      setProductsHasMore(more.length === PRODUCTS_PAGE_LIMIT);
    } catch (err) {
      console.error("Failed to load more shop products", err);
    } finally {
      setProductsLoadingMore(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!shop || followLoading) return;

    setFollowLoading(true);
    const wasFollowing = shop.isFollowedByCurrentUser;

    setShop({
      ...shop,
      isFollowedByCurrentUser: !wasFollowing,
      totalFollowers: shop.totalFollowers + (wasFollowing ? -1 : 1),
    });

    try {
      if (wasFollowing) {
        await unfollowShop(shopId);
      } else {
        await followShop(shopId);
      }
    } catch (err) {
      const message = (err as { response?: { data?: unknown } })?.response?.data;
      console.error("Failed to toggle shop follow:", message ?? err);
      setShop((prev) =>
        prev
          ? {
              ...prev,
              isFollowedByCurrentUser: wasFollowing,
              totalFollowers: prev.totalFollowers + (wasFollowing ? 1 : -1),
            }
          : prev,
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/${locale}/shop/${shopId}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: shop?.shopName ?? t("shopFallbackTitle"), url: shareUrl });
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          console.error("Failed to share shop", err);
        }
      }
      return;
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy shop link", err);
      }
      return;
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy shop link (fallback)", err);
    }
  };

  const handleRateClick = () => {
    router.push(`/${locale}/shop/${shopId}/rate`);
  };

  const handleScrollToRatings = () => {
    ratingsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">{error}</p>
      </div>
    );
  }

  const bannerSrc = shop?.bannerUrl ? `${MEDIA_BASE}${shop.bannerUrl}` : null;
  const isVerified = shop?.verificationStatus === "VERIFIED";
  const joinDate = shop ? formatJoinDate(shop.createdAt, locale) : "";

  const productGrid =
    products === null ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 lg:gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-xl p-2 animate-pulse">
            <div className="aspect-square rounded-2xl bg-gray-200" />
            <div className="mt-3 h-[22px] w-3/4 rounded bg-gray-200 mb-1.5" />
            <div className="h-[19px] w-full rounded bg-gray-200 mb-1" />
            <div className="h-[19px] w-2/3 rounded bg-gray-200 mb-[5px]" />
            <div className="h-[17px] w-1/2 rounded bg-gray-200 mb-1" />
            <div className="h-[17px] w-1/3 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    ) : products.length === 0 ? (
      <p className="text-gray-400 text-sm py-10 text-center">{t("noProducts")}</p>
    ) : (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 lg:gap-3">
          {products.map((product) => {
            const mainImage =
              product.images.find((i: ProductImage) => i.isMain)?.imageUrl ?? "/images/default.png";
            const regionLabel = product.region ? localized(product.region, locale) : "";

            return (
              <Link key={product.id} href={`/${locale}/obyavlenie/${product.slug}`} className="group">
                <div className="rounded-xl hover:bg-gray-100 transition p-2">
                  <div className="relative aspect-square rounded-2xl overflow-hidden">
                    <Image
                      src={`${MEDIA_BASE}${mainImage}`}
                      alt={product.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <FavoriteButton
                      productId={product.id}
                      initialFavorited={product.isFavorited}
                      className="absolute bottom-2 right-2"
                    />
                  </div>

                  <p className="mt-3 text-[18px] font-bold leading-[22px] text-[#292929] line-clamp-1 mb-1.5">
                    {Number(product.price).toLocaleString("ru-RU")}{" "}
                    {product.currency === Currency.USD ? t("priceUsd") : t("priceUzs")}
                  </p>

                  <p className="text-[16px] leading-[19px] font-normal text-[#292929] line-clamp-2 min-h-[38px] mb-[5px]">
                    {product.name}
                  </p>

                  <p className="text-[14px] font-medium leading-[17px] text-[#858585] mb-1">
                    {regionLabel}
                  </p>
                  <p className="text-[14px] font-medium leading-[17px] text-[#858585]">
                    {formatProductDate(product.createdAt, locale)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {productsHasMore && (
          <div className="mt-6">
            <button
              onClick={loadMoreProducts}
              disabled={productsLoadingMore}
              className="w-full bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-800 px-8 py-4 rounded-2xl flex items-center justify-center gap-3 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              {productsLoadingMore ? (
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
      </>
    );

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="max-w-[1400px] mx-auto py-4 sm:py-8 lg:py-10 px-4 sm:px-6">
        <div className="border border-gray-100 rounded-2xl overflow-hidden mb-6">
          <div className="relative w-full aspect-[3/1] sm:aspect-[16/5] lg:aspect-[28/5] bg-gray-100">
            {bannerSrc ? (
              <Image src={bannerSrc} alt={shop?.shopName ?? ""} fill className="object-cover" unoptimized />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Storefront weight="fill" className="w-12 h-12 text-gray-300" />
              </div>
            )}
          </div>

          <div className="p-5 sm:p-6">
          {!shop ? (
            <div className="animate-pulse flex gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-6 w-56 bg-gray-200 rounded" />
                <div className="h-4 w-72 bg-gray-100 rounded" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0 text-gray-500">
                  <Storefront weight="fill" className="w-8 h-8" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{shop.shopName}</h1>
                    {isVerified && (
                      <span className="flex items-center gap-1 bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                        <SealCheck weight="fill" className="w-3.5 h-3.5" />
                        {t("verified")}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 text-sm sm:text-base font-medium text-gray-700">
                    <span className="flex items-center gap-1.5">
                      <Megaphone weight="fill" className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                      {t("listingsCount", { count: shop.totalProducts })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ShopStarRow rating={shop.averageRating ?? 0} />
                      {shop.averageRating !== null ? shop.averageRating.toFixed(1) : "0.0"}
                      {shop.totalRatings > 0 ? ` (${shop.totalRatings})` : ""}
                      {!isOwner && (
                        <button
                          onClick={handleRateClick}
                          className="flex items-center gap-0.5 text-primary cursor-pointer ml-1"
                        >
                          {t("rate")}
                          <CaretRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users weight="fill" className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                      {t("followersCount", { count: shop.totalFollowers })}
                    </span>
                  </div>

                  <p className="text-sm sm:text-base text-gray-600 mt-2">
                    {t("sellerSince", { date: joinDate })}
                    {shop.address ? ` · ${shop.address}` : ""}
                  </p>

                  {shop.description && (
                    <p className="text-sm sm:text-base text-gray-800 mt-3 whitespace-pre-line">{shop.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-2.5 mt-4">
                    {!isOwner && (
                      <button
                        onClick={handleFollowToggle}
                        disabled={followLoading}
                        className={`px-6 py-3 rounded-xl font-semibold transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                          shop.isFollowedByCurrentUser
                            ? "bg-gray-100 hover:bg-gray-200 text-gray-800"
                            : "bg-primary hover:opacity-90 text-white"
                        }`}
                      >
                        {shop.isFollowedByCurrentUser ? t("unfollow") : t("follow")}
                      </button>
                    )}

                    {!isOwner && (
                      <button className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium bg-gray-100 hover:bg-gray-200 transition text-gray-800 cursor-pointer whitespace-nowrap">
                        <ChatCircleText weight="fill" className="w-5 h-5" />
                        {t("writeMessage")}
                      </button>
                    )}

                    <a
                      href={`tel:${shop.phone}`}
                      className="w-12 h-12 shrink-0 rounded-xl bg-green-50 hover:bg-green-100 transition flex items-center justify-center cursor-pointer"
                      aria-label={t("call")}
                    >
                      <Phone weight="fill" className="w-5 h-5 text-green-600" />
                    </a>

                    <button
                      onClick={handleShare}
                      className="w-12 h-12 shrink-0 rounded-xl bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center cursor-pointer"
                      aria-label={t("share")}
                    >
                      <ShareNetwork weight="fill" className="w-5 h-5 text-gray-700" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
          </div>
        </div>

        {productGrid}

        {shop && (
          <div ref={ratingsRef} className="mt-8 scroll-mt-6">
            <ShopRatingsSection shopId={shopId} />
          </div>
        )}
      </div>

      {!isOwner && shop && (
        <div className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-40 flex flex-col items-end gap-3">
          <button
            onClick={handleScrollToRatings}
            className="w-14 h-14 lg:w-52 lg:h-auto flex items-center justify-center gap-2 bg-white hover:bg-gray-50 transition text-gray-800 border border-gray-200 lg:px-5 lg:py-3.5 rounded-full shadow-lg cursor-pointer"
            aria-label={t("shopReviews")}
          >
            <ChatCircleText weight="fill" className="w-5 h-5 shrink-0" />
            <span className="hidden lg:inline">{t("shopReviews")}</span>
          </button>
          <button
            onClick={handleRateClick}
            className="w-14 h-14 lg:w-52 lg:h-auto flex items-center justify-center gap-2 bg-primary hover:opacity-90 transition text-white lg:px-5 lg:py-3.5 rounded-full shadow-lg cursor-pointer"
            aria-label={t("rate")}
          >
            <Star weight="fill" className="w-5 h-5 shrink-0" />
            <span className="hidden lg:inline">{t("rate")}</span>
          </button>
        </div>
      )}

      {shareCopied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg z-50">
          {t("linkCopied")}
        </div>
      )}
    </div>
  );
}