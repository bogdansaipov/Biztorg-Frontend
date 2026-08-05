/* eslint-disable react-hooks/static-components */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocaleRegion } from "@/hooks/useLocaleRegion";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleUser,
  Copy,
  Eye,
  Flag,
  Loader2,
  MapPin,
  Navigation,
  Send,
  Share2,
  Star,
  Store,
  X,
} from "lucide-react";

import { Product } from "@/types/Product";
import { groupAttributes } from "@/helpers/groupAttributes";
import { Currency } from "@/enums/CurrencyEnum";
import ProductMap from "../map/productMap";
import FavoriteButton from "@/components/ui/FavoriteButton";
import { REPORT_REASONS, reportProduct, type ReportReasonKey } from "@/services/product.service";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { localized } from "@/lib/localized";
import { formatJoinDate } from "@/lib/formatJoinDate";

// Max safe 32-bit z-index — used for the lightbox.
const LIGHTBOX_Z_INDEX = 2147483646;
const PHONE_MODAL_Z_INDEX = 2147483647;
const REPORT_SHEET_Z_INDEX = 2147483647;
const LIGHTBOX_MAX_WIDTH = "max-w-[1100px]";

function StarRating({
  averageRating,
  totalRatings,
}: {
  averageRating: number | null;
  totalRatings: number;
}) {
  const t = useTranslations("productDetails");
  const filledCount = averageRating ? Math.round(averageRating) : 0;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className="w-[18px] h-[18px]"
            fill={i < filledCount ? "#facc15" : "none"}
            stroke={i < filledCount ? "#facc15" : "#d1d5db"}
          />
        ))}
      </div>
      <span className="text-[14px] text-black/50">
        {totalRatings > 0
          ? t("ratingSummary", { rating: averageRating?.toFixed(1), count: totalRatings })
          : t("reviewsNone")}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TOP-LEVEL OVERLAY COMPONENTS — declared at module scope with props
   instead of closures, so their identity is stable across re-renders.
   ═══════════════════════════════════════════════════════════════════════ */

function PhoneModal({
  open,
  mounted,
  onClose,
  name,
  phone,
}: {
  open: boolean;
  mounted: boolean;
  onClose: () => void;
  name: string;
  phone: string;
}) {
  const t = useTranslations("productDetails");
  if (!open || !mounted) return null;

  const copyPhone = async () => {
    await navigator.clipboard.writeText(phone);
  };

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{ zIndex: PHONE_MODAL_Z_INDEX }}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-2xl w-full max-w-[420px] p-8 z-10">
        <button
          onClick={onClose}
          className="absolute cursor-pointer top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label={t("close")}
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-center mb-6">{t("sellerNumber")}</h2>

        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-3xl">
            <CircleUser className="w-12 h-12 text-black/70" />
          </div>
        </div>

        <div className="text-center font-medium text-lg mb-1">{name}</div>

        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="text-xl font-semibold">{phone}</span>
          <button
            onClick={copyPhone}
            className="text-gray-500 hover:text-gray-700 cursor-pointer"
            title={t("copy")}
          >
            <Copy />
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

function ImageLightbox({
  open,
  mounted,
  images,
  index,
  onIndexChange,
  onClose,
  isShopSeller,
  sellerDisplayName,
  sellerSinceDate,
  sellerProfileHref,
  onPhoneClick,
  productName,
}: {
  open: boolean;
  mounted: boolean;
  images: string[];
  index: number;
  onIndexChange: (updater: (i: number) => number) => void;
  onClose: () => void;
  isShopSeller: boolean;
  sellerDisplayName: string;
  sellerSinceDate: string;
  sellerProfileHref: string;
  onPhoneClick: () => void;
  productName: string;
}) {
  const t = useTranslations("productDetails");
  if (!open || !mounted) return null;

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    onIndexChange((i) => (i - 1 + images.length) % images.length);
  };

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    onIndexChange((i) => (i + 1) % images.length);
  };

  const overlay = (
    <div
      className="fixed inset-0 bg-[#333333] lg:bg-white flex flex-col"
      style={{ zIndex: LIGHTBOX_Z_INDEX }}
    >
      {/* TOP BAR */}
      <div className="shrink-0 px-4 lg:px-8">
        <div className={`${LIGHTBOX_MAX_WIDTH} mx-auto flex items-center justify-between py-3 lg:py-4`}>
          <span className="text-white/80 lg:text-black/60 text-sm lg:text-base font-medium">
            {t("photoOf", { index: index + 1, total: images.length })}
          </span>
          <button
            onClick={onClose}
            className="text-white lg:text-black/60 hover:bg-black/5 rounded-[10px] transition cursor-pointer p-1"
            aria-label={t("close")}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* MIDDLE — thumbnail rail + main image */}
      <div className="flex-1 min-h-0 flex justify-center px-2 lg:px-8 py-2 lg:py-4">
        <div className={`${LIGHTBOX_MAX_WIDTH} w-full flex items-start min-h-0`}>
          {images.length > 1 && (
            <div className="hidden lg:flex flex-col gap-2 p-2 mr-4 w-[120px] shrink-0 max-h-full overflow-y-auto hide-scrollbar bg-gray-50 rounded-xl border border-gray-100">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => onIndexChange(() => idx)}
                  className="cursor-pointer shrink-0"
                >
                  <div
                    className={`relative w-full aspect-square rounded-md overflow-hidden transition ${
                      idx === index
                        ? "ring-2 ring-primary"
                        : "ring-1 ring-gray-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" unoptimized />
                  </div>
                </button>
              ))}
            </div>
          )}

          <div
            className="relative flex-1 min-w-0 self-stretch flex items-center justify-center cursor-zoom-out"
            onClick={onClose}
          >
            <div
              className="relative w-full h-full rounded-2xl overflow-hidden cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 overflow-hidden hidden lg:block">
                <Image
                  src={images[index]}
                  alt=""
                  fill
                  className="object-cover scale-110 blur-2xl opacity-30"
                  unoptimized
                  aria-hidden
                />
              </div>

              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={images[index]}
                  alt={productName}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>

            {images.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer hover:bg-black/70 transition"
                  aria-label={t("prevPhoto")}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer hover:bg-black/70 transition"
                  aria-label={t("nextPhoto")}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM SELLER BAR */}
      <div className="shrink-0 bg-[#333333] lg:bg-white border-t border-white/10 lg:border-gray-200 px-4 lg:px-8 py-3 lg:py-4">
        <div className={`${LIGHTBOX_MAX_WIDTH} mx-auto flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap`}>
          <Link href={sellerProfileHref} className="flex items-center gap-3 min-w-0 group">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              {isShopSeller ? (
                <Store className="w-5 h-5 text-black/60" />
              ) : (
                <CircleUser className="w-6 h-6 text-black/60" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-white lg:text-black/80 font-semibold text-sm lg:text-base truncate group-hover:underline">
                <span className="truncate">{sellerDisplayName}</span>
                <ChevronRight className="w-4 h-4 opacity-60 shrink-0" />
              </div>
              <p className="text-white/60 lg:text-black/50 text-xs lg:text-sm">
                {t("sellerSince", { date: sellerSinceDate })}
              </p>
            </div>
          </Link>

          <div className="flex gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={onPhoneClick}
              className="flex-1 sm:flex-none bg-white/10 lg:bg-primary/10 text-white lg:text-primary px-4 py-2 rounded-lg text-sm lg:text-base cursor-pointer hover:opacity-90 transition"
            >
              {t("phone")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

function ReportSheet({
  open,
  mounted,
  step,
  onBack,
  reason,
  onSelectReason,
  onNext,
  comment,
  onCommentChange,
  submitting,
  submitted,
  error,
  onClose,
  onSubmit,
  locale,
}: {
  open: boolean;
  mounted: boolean;
  step: "reason" | "comment";
  onBack: () => void;
  reason: ReportReasonKey | null;
  onSelectReason: (key: ReportReasonKey) => void;
  onNext: () => void;
  comment: string;
  onCommentChange: (value: string) => void;
  submitting: boolean;
  submitted: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: () => void;
  locale: string;
}) {
  const t = useTranslations("productDetails");
  if (!open || !mounted) return null;

  const canGoNext = reason !== null;
  const canSubmit = !submitting && comment.trim().length > 0;

  const sheet = (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center"
      style={{ zIndex: REPORT_SHEET_Z_INDEX }}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-[600px] sm:mx-4 max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="relative shrink-0 px-6 py-6">
          {step === "comment" && !submitted && (
            <button
              onClick={onBack}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-[10px] hover:bg-black/5 flex items-center justify-center cursor-pointer transition"
              aria-label={t("back")}
            >
              <ChevronLeft className="w-5 h-5 text-black/60" />
            </button>
          )}
          <h2 className="text-center text-xl sm:text-2xl font-bold text-black/85">
            {submitted ? t("reportThankYou") : step === "comment" ? t("reportDescribeSituation") : t("reportTitle")}
          </h2>
          <button
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-[10px] hover:bg-black/5 flex items-center justify-center cursor-pointer transition"
            aria-label={t("close")}
          >
            <X className="w-5 h-5 text-black/50" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-6">
          {submitted ? (
            <div className="py-14 text-center text-black/70 text-base">
              {t("reportSubmittedText")}
            </div>
          ) : step === "reason" ? (
            <div>
              <div className="divide-y divide-gray-100">
                {/* REPORT_REASONS.label comes from services/product.service.ts,
                    which wasn't available when this pass was done — these
                    labels are still Russian-only. Needs that file's REASONS
                    array extended with a labelUz field (or similar) and this
                    render swapped to pick the right one based on locale. */}
                {REPORT_REASONS.map((r) => {
                  const isSelected = reason === r.key;
                  return (
                    <button
                      key={r.key}
                      onClick={() => onSelectReason(r.key)}
                      className="w-full flex items-center justify-between gap-4 py-5 text-left cursor-pointer"
                    >
                      <span className="text-base sm:text-lg text-gray-800">
  {locale === "uz" ? r.labelUz : r.label}
</span>
                      <span
                        className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                          isSelected ? "bg-gray-900 border-gray-900" : "border-gray-300"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={onNext}
                disabled={!canGoNext}
                className="w-full mt-6 py-3.5 rounded-2xl text-white font-medium text-sm sm:text-base cursor-pointer transition disabled:cursor-not-allowed bg-primary disabled:bg-primary/40"
              >
                {t("next")}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-black/50 mb-3">
  {locale === "uz"
    ? REPORT_REASONS.find((r) => r.key === reason)?.labelUz
    : REPORT_REASONS.find((r) => r.key === reason)?.label}
</p>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <textarea
                  value={comment}
                  onChange={(e) => {
                    if (e.target.value.length <= 1000) onCommentChange(e.target.value);
                  }}
                  placeholder={t("commentPlaceholder")}
                  rows={6}
                  className="w-full resize-none outline-none bg-transparent text-[15px] text-gray-800 placeholder:text-gray-400"
                />
              </div>
              <p className="text-xs text-black/40 text-right mt-2">{comment.length}/1000</p>

              {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

              <button
                onClick={onSubmit}
                disabled={!canSubmit}
                className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-medium text-sm sm:text-base cursor-pointer transition disabled:cursor-not-allowed bg-primary disabled:bg-primary/40"
              >
                {submitting && <Loader2 className="w-4.5 h-4.5 animate-spin" />}
                {submitting ? t("submitting") : t("submit")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}

export default function ProductDetails({ product }: { product: Product }) {
  const { locale, region } = useLocaleRegion();
  const t = useTranslations("productDetails");

  const QUICK_REPLIES = [
    t("quickReplyWantToBuy"),
    t("quickReplyStillAvailable"),
    t("quickReplyNegotiable"),
    t("quickReplyWhenToSee"),
  ];

  const [mainApi, setMainApi] = useState<CarouselApi | null>(null);
  const [thumbApi, setThumbApi] = useState<CarouselApi | null>(null);
  const [selected, setSelected] = useState(0);
  const [phoneOpen, setPhoneOpen] = useState(false);

  const currentUserId = useAuthStore((s) => s.user?.id);
  const isOwnProduct = !!currentUserId && currentUserId === product.userId;

  const [message, setMessage] = useState("");

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportStep, setReportStep] = useState<"reason" | "comment">("reason");
  const [reportReason, setReportReason] = useState<ReportReasonKey | null>(null);
  const [reportComment, setReportComment] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const images =
    product.images.length > 0
      ? product.images.map((i) => `https://169-58-13-208.nip.io/public${i.imageUrl}`)
      : ["/images/default.png"];

  // TODO: groupAttributes' return shape wasn't available in this pass — it
  // currently only carries the Russian name/values through. Once its
  // source is shared, this should group attributeNameUz/valueUz through
  // alongside name/values too, and the render below should pick the right
  // one via locale, same pattern as everywhere else in this file.
  const attributes = groupAttributes(product.attributes);

  const isShopSeller = Boolean(product.shop);
  const sellerDisplayName = isShopSeller ? product.shop!.shopName : product.contactName;
  const sellerProfileHref = isShopSeller ? `/${locale}/shop/${product.shopId}` : `/${locale}/user/${product.userId}`;

  const shopBannerUrl =
    isShopSeller && product.shop!.bannerUrl
      ? `https://169-58-13-208.nip.io/public${product.shop!.bannerUrl}`
      : null;

  const sellerSinceDate = formatJoinDate(
    product.shop ? product.shop.createdAt : product.user.createdAt,
    locale,
  );

  const openLightbox = (idx: number) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  const closeReportSheet = () => {
    setReportOpen(false);
    setReportStep("reason");
    setReportReason(null);
    setReportComment("");
    setReportSubmitted(false);
    setReportError(null);
  };

  const handleSubmitReport = async () => {
    if (!reportReason || reportSubmitting) return;
    setReportSubmitting(true);
    setReportError(null);
    try {
      await reportProduct(product.id, { reason: reportReason, comment: reportComment.trim() });
      setReportSubmitted(true);
      setTimeout(closeReportSheet, 1400);
    } catch (err) {
      console.error("Failed to submit report", err);

      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setReportError(t("reportDuplicateError"));
      } else {
        setReportError(t("reportGenericError"));
      }
    } finally {
      setReportSubmitting(false);
    }
  };

  useEffect(() => {
    if (phoneOpen || lightboxOpen || reportOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [phoneOpen, lightboxOpen, reportOpen]);

  useEffect(() => {
    if (!lightboxOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxOpen(false);
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((i) => (i - 1 + images.length) % images.length);
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((i) => (i + 1) % images.length);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxOpen, images.length]);

  useEffect(() => {
    if (!mainApi || !thumbApi) return;

    const sync = () => {
      const index = mainApi.selectedScrollSnap();
      setSelected(index);
      thumbApi.scrollTo(index);
    };

    mainApi.on("select", sync);
    mainApi.on("reInit", sync);

    return () => {
      mainApi.off("select", sync);
    };
  }, [mainApi, thumbApi]);

  const sellerAndPriceCards = (
    <>
      <div className="border border-gray-200 rounded-2xl p-5 lg:p-6 relative">
        <div className="absolute top-5 right-5 flex items-center gap-1">
          <button className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition cursor-pointer">
            <Share2 className="w-5 h-5 text-black/60" />
          </button>
          <FavoriteButton productId={product.id} initialFavorited={product.isFavorited} className="w-10 h-10" />
        </div>

        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 pr-20">
          {Number(product.price).toLocaleString("ru-RU")}{" "}
          {product.currency === Currency.USD ? t("priceUsd") : t("priceUzs")}
        </h1>

        <p className="text-base lg:text-lg font-semibold text-gray-700 mt-2">{product.name}</p>

        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1 text-[13px] text-black/50">
            <Eye className="w-4 h-4" />
            {t("viewsCount", { count: product.viewCount })}
          </div>
          <StarRating averageRating={product.averageRating} totalRatings={product.totalRatings} />
        </div>
      </div>

      <div className="border border-gray-200 rounded-2xl p-4 lg:p-5 space-y-4">
        {shopBannerUrl && (
          <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden bg-gray-100">
            <Image
              src={shopBannerUrl}
              alt={product.shop!.shopName}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        <Link href={sellerProfileHref} className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            {isShopSeller ? (
              <Store className="w-6 h-6 text-black/60" />
            ) : (
              <CircleUser className="w-7 h-7 text-black/60" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 w-fit">
              <h2 className="font-bold text-black/80 text-lg lg:text-xl leading-none truncate group-hover:underline">
                {sellerDisplayName}
              </h2>
              <ChevronRight className="w-4.5 h-4.5 text-black/50 shrink-0" />
            </div>
            <p className="text-[14px] text-black/50 mt-0.5">
              {t("listingsCount", {
                count: product.shop ? product.shop.totalNumProducts : product.user.totalNumProducts,
              })}
            </p>
          </div>
        </Link>

        {product.shop && (
          <Link
            href={`/${locale}/shop/${product.shopId}`}
            className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 transition text-green-700 text-sm font-medium px-3 py-1.5 rounded-full cursor-pointer w-fit"
          >
            <Store className="w-4 h-4" />
            {t("shop")}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setPhoneOpen(true)}
            className="flex-1 bg-primary/10 hover:bg-primary/15 transition cursor-pointer text-primary py-2.5 rounded-lg text-sm lg:text-base"
          >
            {t("phone")}
          </button>
          {product.enableTelegram && (
            <a
              href={`https://t.me/${product.contactPhone}`}
              target="_blank"
              className="flex-1 flex items-center justify-center border border-primary text-primary py-2.5 rounded-lg text-sm lg:text-base hover:bg-primary/5 transition"
            >
              Telegram
            </a>
          )}
        </div>

        <p className="text-[13px] text-black/40 text-center">{t("sellerSince", { date: sellerSinceDate })}</p>
      </div>
    </>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-0 py-6 lg:py-10">
      <nav className="flex items-center gap-1.5 text-[14px] text-black/50 mb-6 overflow-x-auto whitespace-nowrap hide-scrollbar">
        <a href={`/${locale}/${region}`} className="hover:text-black transition shrink-0">
          {t("home")}
        </a>
        {product.category?.name && (
          <>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <a
              href={`/${locale}/${region}/category/${product.category.slug}`}
              className="shrink-0 hover:text-black transition"
            >
              {localized(product.category, locale)}
            </a>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="text-black/70 truncate">{product.name}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-14">
        {/* LEFT */}
        <div className="w-full lg:w-[630px] space-y-10 lg:space-y-12">
          {/* IMAGES */}
          <div className="flex gap-1">
            <Carousel orientation="vertical" className="hidden md:block w-[100px] lg:w-[120px]" setApi={setThumbApi}>
              <CarouselContent className="flex flex-col py-2 overflow-visible">
                {images.map((img, idx) => (
                  <CarouselItem
                    key={idx}
                    className="basis-auto flex justify-center overflow-visible mb-2 last:mb-0"
                  >
                    <button onClick={() => mainApi?.scrollTo(idx)} className="cursor-pointer">
                      <div
                        className={`rounded-md transition ${
                          idx === selected ? "ring-2 ring-primary" : "opacity-60 hover:opacity-100"
                        }`}
                      >
                        <div className="relative w-[72px] lg:w-[88px] aspect-square rounded-md overflow-hidden">
                          <Image src={img} alt="" fill className="object-cover" unoptimized />
                        </div>
                      </div>
                    </button>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            <Carousel className="flex-1 min-w-0" setApi={setMainApi}>
              <CarouselContent>
                {images.map((img, idx) => (
                  <CarouselItem key={idx}>
                    <Card className="p-0">
                      <CardContent className="relative h-[320px] sm:h-[420px] lg:h-[520px] rounded-xl overflow-hidden">
                        <Image
                          src={img}
                          alt=""
                          fill
                          className="object-cover scale-110 blur-2xl"
                          unoptimized
                          aria-hidden
                        />
                        <div className="absolute inset-0 bg-black/10" />
                        <div
                          className="absolute inset-0 flex items-center justify-center cursor-zoom-in"
                          onClick={() => openLightbox(idx)}
                        >
                          <Image src={img} alt={product.name} fill className="object-contain" unoptimized />
                        </div>

                        <div
                          className="absolute left-0 top-0 h-full w-[18%] z-20 cursor-pointer group"
                          onClick={() => mainApi?.scrollPrev()}
                        >
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition pointer-events-none" />
                          <CarouselPrevious
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-1/2 -translate-y-1/2 left-2 lg:left-4 z-30 bg-black/50 !border-0 !shadow-none text-white cursor-pointer opacity-80 hover:opacity-100"
                          />
                        </div>

                        <div
                          className="absolute right-0 top-0 h-full w-[18%] z-20 cursor-pointer group"
                          onClick={() => mainApi?.scrollNext()}
                        >
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition pointer-events-none" />
                          <CarouselNext
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-1/2 -translate-y-1/2 right-2 lg:right-4 z-30 cursor-pointer bg-black/50 !border-0 !shadow-none text-white opacity-80 hover:opacity-100"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          <div className="lg:hidden space-y-4">{sellerAndPriceCards}</div>

          {/* ATTRIBUTES */}
          {attributes.length > 0 && (
            <div>
              <h2 className="text-2xl lg:text-3xl text-black/80 font-bold mb-4">{t("characteristics")}</h2>
              <div className="divide-y">
              {attributes.map((attr, idx) => (
  <div key={idx} className="flex flex-col sm:flex-row gap-1 sm:gap-8 py-2">
    <span className="sm:min-w-[160px] text-base lg:text-xl text-gray-600">
      {locale === "uz" ? attr.nameUz : attr.name}
    </span>
    <span className="text-base lg:text-xl text-gray-800">
      {(locale === "uz" ? attr.valuesUz : attr.values).join(", ")}
    </span>
  </div>
))}
              </div>
            </div>
          )}

          {/* DESCRIPTION */}
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold mb-4 text-black/80">{t("description")}</h2>
            <p className="text-base lg:text-xl text-gray-700 whitespace-pre-line">{product.description}</p>
          </div>

          {product.latitude && product.longitude && (
            <div>
              <h3 className="text-2xl lg:text-3xl font-bold text-black/80 mb-4">{t("dealLocation")}</h3>

              <ProductMap latitude={product.latitude} longitude={product.longitude} />

              <div className="mt-6 flex items-start gap-4 flex-col rounded-lg">
                <animateMotion
                  href={`https://yandex.ru/maps/?ll=${product.longitude},${product.latitude}&pt=${product.longitude},${product.latitude}&z=17`}
                  target="_blank"
                  className="flex items-center justify-between gap-4 w-full p-4 rounded-xl border border-gray-200 hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-gray-200 rounded-xl flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="text-base lg:text-lg font-medium text-gray-700 whitespace-normal wrap-break-word">
                      {localized(product.region, locale)}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 shrink-0" />
                </animateMotion>

                <a
                  href={`https://yandex.ru/maps/?ll=${product.longitude},${product.latitude}&pt=${product.longitude},${product.latitude}&z=17`}
                  target="_blank"
                  className="flex items-center justify-between gap-4 w-full p-4 rounded-xl border border-gray-200 hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-gray-200 rounded-xl flex items-center justify-center shrink-0">
                      <Navigation className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="text-base lg:text-lg font-medium text-gray-700 whitespace-normal wrap-break-word">
                      {t("openInYandexMaps")}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 shrink-0" />
                </a>
              </div>
            </div>
          )}

          {!isOwnProduct && (
            <button
              onClick={() => setReportOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 transition cursor-pointer text-gray-700 text-base lg:text-lg font-medium py-3.5 rounded-xl"
            >
              {t("reportProduct")}
            </button>
          )}
        </div>

        <div className="hidden lg:block lg:w-[500px] lg:shrink-0 lg:top-24 lg:self-start space-y-4 lg:sticky">
          {sellerAndPriceCards}
        </div>
      </div>

      <PhoneModal
        open={phoneOpen}
        mounted={mounted}
        onClose={() => setPhoneOpen(false)}
        name={sellerDisplayName}
        phone={product.contactPhone}
      />

      <ImageLightbox
        open={lightboxOpen}
        mounted={mounted}
        images={images}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        onClose={() => setLightboxOpen(false)}
        isShopSeller={isShopSeller}
        sellerDisplayName={sellerDisplayName}
        sellerSinceDate={sellerSinceDate}
        sellerProfileHref={sellerProfileHref}
        onPhoneClick={() => setPhoneOpen(true)}
        productName={product.name}
      />

      <ReportSheet
        open={reportOpen}
        mounted={mounted}
        step={reportStep}
        onBack={() => setReportStep("reason")}
        reason={reportReason}
        onSelectReason={setReportReason}
        onNext={() => setReportStep("comment")}
        comment={reportComment}
        onCommentChange={setReportComment}
        submitting={reportSubmitting}
        submitted={reportSubmitted}
        error={reportError}
        onClose={closeReportSheet}
        onSubmit={handleSubmitReport}
        locale={locale}
      />
    </div>
  );
}