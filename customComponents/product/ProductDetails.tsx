/* eslint-disable react-hooks/static-components */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

// Quick-reply prompts shown under "Спросить продавца" — tap one to prefill
// the message input, matching birbir's pattern.
const QUICK_REPLIES = [
  "Хочу купить",
  "Ещё продаёте?",
  "Торг уместен?",
  "Когда можно посмотреть?",
];

// Max safe 32-bit z-index — used for the lightbox.
const LIGHTBOX_Z_INDEX = 2147483646;

// One higher than the lightbox (the actual 32-bit max), reserved for the
// phone modal and report sheet. All three overlays render into
// document.body via separate portals, and if two shared the exact same
// z-index, which one visually wins would depend on portal insertion order
// between independent components — not something worth relying on. Giving
// these a strictly higher value than the lightbox means they always paint
// above it, deterministically, regardless of DOM order. (Phone modal and
// report sheet are never expected to be open at the same time as each
// other, so sharing this value between the two of them is fine.)
const PHONE_MODAL_Z_INDEX = 2147483647;
const REPORT_SHEET_Z_INDEX = 2147483647;

// The lightbox's own "container width" — the backdrop stays edge-to-edge,
// but everything inside it (top bar, thumbnail rail + main image,
// bottom bar) is centered within this so the composition doesn't stretch
// thin across ultra-wide monitors. Matches the page's own max-w-[1400px].
const LIGHTBOX_MAX_WIDTH = "max-w-[1100px]";

// Russian pluralization for "N объявление/объявления/объявлений" —
// standard 1/2-4/5+ rule with the 11-14 exception.
function pluralizeListings(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  let word: string;

  if (mod10 === 1 && mod100 !== 11) {
    word = "объявление";
  } else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    word = "объявления";
  } else {
    word = "объявлений";
  }

  return `${count} ${word}`;
}

// Russian pluralization for "N просмотр/просмотра/просмотров" — same
// 1/2-4/5+ rule as pluralizeListings, just a different word set.
function pluralizeViews(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  let word: string;

  if (mod10 === 1 && mod100 !== 11) {
    word = "просмотр";
  } else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    word = "просмотра";
  } else {
    word = "просмотров";
  }

  return `${count} ${word}`;
}

// Russian pluralization for "N отзыв/отзыва/отзывов" — same 1/2-4/5+ rule.
function pluralizeReviews(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  let word: string;

  if (mod10 === 1 && mod100 !== 11) {
    word = "отзыв";
  } else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    word = "отзыва";
  } else {
    word = "отзывов";
  }

  return `${count} ${word}`;
}

function StarRating({
  averageRating,
  totalRatings,
}: {
  averageRating: number | null;
  totalRatings: number;
}) {
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
        {totalRatings > 0 ? `${averageRating?.toFixed(1)} · ${pluralizeReviews(totalRatings)}` : "Нет отзывов"}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TOP-LEVEL OVERLAY COMPONENTS

   PhoneModal, ImageLightbox, and ReportSheet all used to be declared
   *inside* ProductDetails' render body. That's a real bug, not just a
   style nit: every time ProductDetails re-renders (e.g. on every
   keystroke in the report textarea, since typing updates state in
   ProductDetails), those nested function declarations get recreated as
   brand-new component identities. React then treats it as swapping in a
   completely different component type, unmounts the old DOM (including
   whatever was focused), and mounts a fresh copy — which is exactly why
   the report textarea lost focus after a single character.

   Declaring them here, at module scope, with props instead of closures
   over ProductDetails' state, means their identity is stable across
   re-renders, so React just updates the existing DOM/focus stays put.
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
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-center mb-6">Номер продавца</h2>

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
            title="Скопировать"
          >
            <Copy />
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// Fullscreen image lightbox — opened by tapping/clicking the main product
// image. Dark, edge-to-edge on mobile; on desktop it switches to a white
// surface with a vertical thumbnail rail on the left, closer to the
// birbir.uz reference. The backdrop (black/white) stays edge-to-edge, but
// EVERY row of content — top bar, thumbnail rail + main image, bottom
// bar — is centered inside LIGHTBOX_MAX_WIDTH so the whole composition
// stays contained and centered instead of stretching thin on wide
// monitors.
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
            {index + 1} из {images.length}
          </span>
          <button
            onClick={onClose}
            className="text-white lg:text-black/60 hover:opacity-70 transition cursor-pointer p-1"
            aria-label="Закрыть"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* MIDDLE — thumbnail rail + main image, centered within the same
          max-width as the top/bottom bars instead of stretching full
          browser width. */}
      <div className="flex-1 min-h-0 flex justify-center px-2 lg:px-8 py-2 lg:py-4">
        <div className={`${LIGHTBOX_MAX_WIDTH} w-full flex items-start min-h-0`}>
          {/* THUMBNAIL RAIL — desktop only. `items-start` on the parent
              keeps this hugging its own content height instead of
              stretching to match the main image (the default flex
              behaviour), which is what was leaving a tall dead gap of
              whitespace below the thumbnails. The bg/border panel gives
              it a visible boundary against the white desktop backdrop. */}
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

          {/* MAIN IMAGE */}
          <div
            className="relative flex-1 min-w-0 self-stretch flex items-center justify-center cursor-zoom-out"
            onClick={onClose}
          >
            {/* Rounded, clipped frame around the image itself — kept as its
                own box (rather than rounding the flex-1 container, which
                is flush to its parent's edges and would show no visible
                corners) so the radius actually reads against the
                backdrop. */}
            <div
              className="relative w-full h-full rounded-2xl overflow-hidden cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Blurred fill so non-square images don't leave hard letterboxing —
                  same technique as the inline carousel, dimmed down since the
                  lightbox background is already dark/white on its own. */}
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
                  aria-label="Предыдущее фото"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer hover:bg-black/70 transition"
                  aria-label="Следующее фото"
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
                На BizTorg с {sellerSinceDate}
              </p>
            </div>
          </Link>

          <div className="flex gap-2 shrink-0 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none bg-white lg:bg-gray-900 text-black lg:text-white px-4 py-2 rounded-lg text-sm lg:text-base cursor-pointer hover:opacity-90 transition">
              Сообщение
            </button>
            <button
              onClick={onPhoneClick}
              className="flex-1 sm:flex-none bg-white/10 lg:bg-primary/10 text-white lg:text-primary px-4 py-2 rounded-lg text-sm lg:text-base cursor-pointer hover:opacity-90 transition"
            >
              Телефон
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

// Report sheet — step 1 shows the reason list as radio rows (selecting one
// just highlights it; "Далее" advances explicitly, no auto-navigation on
// click), step 2 is the comment field + submit. Wider/taller centered
// dialog on desktop per the reference design; still a bottom sheet on
// mobile.
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
  onClose,
  onSubmit,
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
  onClose: () => void;
  onSubmit: () => void;
}) {
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
        {/* HEADER */}
        <div className="relative shrink-0 px-6 py-6">
          {step === "comment" && !submitted && (
            <button
              onClick={onBack}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full hover:bg-black/5 flex items-center justify-center cursor-pointer transition"
              aria-label="Назад"
            >
              <ChevronLeft className="w-5 h-5 text-black/60" />
            </button>
          )}
          <h2 className="text-center text-xl sm:text-2xl font-bold text-black/85">
            {submitted ? "Спасибо" : step === "comment" ? "Опишите ситуацию" : "Жалоба на объявление"}
          </h2>
          <button
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full hover:bg-black/5 flex items-center justify-center cursor-pointer transition"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5 text-black/50" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-6">
          {submitted ? (
            <div className="py-14 text-center text-black/70 text-base">
              Жалоба отправлена. Мы проверим объявление в ближайшее время.
            </div>
          ) : step === "reason" ? (
            // STEP 1 — reason list as radio rows. Selecting only highlights;
            // "Далее" (rendered below) is what actually advances.
            <div>
              <div className="divide-y divide-gray-100">
                {REPORT_REASONS.map((r) => {
                  const isSelected = reason === r.key;
                  return (
                    <button
                      key={r.key}
                      onClick={() => onSelectReason(r.key)}
                      className="w-full flex items-center justify-between gap-4 py-5 text-left cursor-pointer"
                    >
                      <span className="text-base sm:text-lg text-gray-800">{r.label}</span>
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
                className="w-full mt-6 py-4 rounded-full text-white font-medium text-sm sm:text-base cursor-pointer transition disabled:cursor-not-allowed bg-primary disabled:bg-primary/40"
              >
                Далее
              </button>
            </div>
          ) : (
            // STEP 2 — comment + submit
            <div>
              <p className="text-sm text-black/50 mb-3">
                {REPORT_REASONS.find((r) => r.key === reason)?.label}
              </p>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <textarea
                  value={comment}
                  onChange={(e) => {
                    if (e.target.value.length <= 1000) onCommentChange(e.target.value);
                  }}
                  placeholder="Опишите ситуацию подробнее…"
                  rows={6}
                  className="w-full resize-none outline-none bg-transparent text-[15px] text-gray-800 placeholder:text-gray-400"
                />
              </div>
              <p className="text-xs text-black/40 text-right mt-2">{comment.length}/1000</p>

              <button
                onClick={onSubmit}
                disabled={!canSubmit}
                className="w-full mt-6 py-4 rounded-full text-white font-semibold text-base sm:text-lg cursor-pointer transition disabled:cursor-not-allowed bg-primary disabled:bg-primary/40"
              >
                {submitting ? "Отправка…" : "Отправить"}
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
  const [mainApi, setMainApi] = useState<CarouselApi | null>(null);
  const [thumbApi, setThumbApi] = useState<CarouselApi | null>(null);
  const [selected, setSelected] = useState(0);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [message, setMessage] = useState("");

  // Lightbox — fullscreen overlay opened by clicking the main product
  // image. Kept as a simple index + open flag rather than a second embla
  // carousel instance, since the overlay doesn't need to stay in sync with
  // the page carousel while it's closed.
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Report sheet — explicit two-step flow: pick a reason (just highlights
  // it), press "Далее" to advance to the comment step, then submit.
  const [reportOpen, setReportOpen] = useState(false);
  const [reportStep, setReportStep] = useState<"reason" | "comment">("reason");
  const [reportReason, setReportReason] = useState<ReportReasonKey | null>(null);
  const [reportComment, setReportComment] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // Portal target — the lightbox/phone modal/report sheet render into
  // document.body rather than in-place, so any ancestor with a
  // transform/filter (sticky headers, animation wrappers, etc.) can't clip
  // a `position: fixed` descendant to itself. Combined with the z-index
  // constants above, this is what guarantees these overlays always paint
  // above the site header — relying on DOM order alone isn't enough since
  // z-index within stacking contexts decides paint order, not DOM position.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const images =
    product.images.length > 0
      ? product.images.map((i) => `https://169-58-13-208.nip.io/public${i.imageUrl}`)
      : ["/images/default.png"];

  const attributes = groupAttributes(product.attributes);

  // If this listing belongs to a shop, the card should represent the shop
  // (name + store icon), not the personal contact — the personal name is
  // still what's actually reached via "Телефон"/"Сообщение" though, since
  // that's who's on the other end of the line.
  const isShopSeller = Boolean(product.shop);
  const sellerDisplayName = isShopSeller ? product.shop!.shopName : product.contactName;

  // Where the seller name/avatar block should navigate to — the shop's own
  // profile page if this listing belongs to a shop, otherwise the personal
  // user's profile page. Uses the flat productShopId/userId fields directly
  // off Product rather than product.shop.id/product.user.id, since those
  // are the canonical FK fields on the Product type. Used by both the
  // sticky/mobile card below and the lightbox's bottom seller bar, so both
  // stay in sync automatically.
  const sellerProfileHref = isShopSeller ? `/shop/${product.shopId}` : `/user/${product.userId}`;

  // Shop banner — only relevant when the listing belongs to a shop AND that
  // shop actually has a banner set (bannerUrl can be null/undefined).
  const shopBannerUrl =
    isShopSeller && product.shop!.bannerUrl
      ? `https://169-58-13-208.nip.io/public${product.shop!.bannerUrl}`
      : null;

  const sellerSinceDate = new Date(
    product.shop ? product.shop.createdAt : product.user.createdAt,
  ).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

  const openLightbox = (idx: number) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  const closeReportSheet = () => {
    setReportOpen(false);
    // Reset back to the start for next time. No transition-timing concerns
    // here since the sheet itself is already gone once this runs.
    setReportStep("reason");
    setReportReason(null);
    setReportComment("");
    setReportSubmitted(false);
  };

  const handleSubmitReport = async () => {
    if (!reportReason || reportSubmitting) return;
    setReportSubmitting(true);
    try {
      await reportProduct(product.id, { reason: reportReason, comment: reportComment.trim() });
      setReportSubmitted(true);
      // Brief confirmation, then auto-close.
      setTimeout(closeReportSheet, 1400);
    } catch (err) {
      console.error("Failed to submit report", err);
    } finally {
      setReportSubmitting(false);
    }
  };

  // Body scroll lock — shared between the phone modal, the lightbox, and
  // the report sheet, since any one of them can be open (though not more
  // than one at once in normal use).
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

  // Keyboard nav for the lightbox: Esc closes, arrow keys move between images.
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

  // Price card + seller/contact card — extracted into one JSX value so it
  // can be rendered twice: once right under the images on mobile (where
  // people expect price/seller info immediately, not after scrolling past
  // attributes/description/etc.), and once in its normal sticky position
  // on desktop. Same markup either way, just shown/hidden per breakpoint
  // below — this isn't a separate component, just a local JSX value, so
  // there's no risk of the two copies drifting out of sync over time.
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
          {product.currency === Currency.USD ? "у.е" : "сум"}
        </h1>

        <p className="text-base lg:text-lg font-semibold text-gray-700 mt-2">{product.name}</p>

        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1 text-[13px] text-black/50">
            <Eye className="w-4 h-4" />
            {pluralizeViews(product.viewCount)}
          </div>
          <StarRating averageRating={product.averageRating} totalRatings={product.totalRatings} />
        </div>
      </div>

      <div className="border border-gray-200 rounded-2xl p-4 lg:p-5 space-y-4">
        {/*
          SHOP BANNER — only rendered when this listing belongs to a shop
          AND that shop actually has a bannerUrl set. Personal sellers
          never have a shop object, so shopBannerUrl is null for them
          and nothing renders here. The Store/CircleUser icon avatar
          below stays regardless — the banner is additive, not a
          replacement for it.
        */}
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
            {/*
              "Отвечает за час" from the birbir reference isn't something
              our API returns at all — skipped rather than faked.

              The listings count DOES need to switch source depending on
              context: if this product belongs to a shop, the shop's own
              totalNumProducts is the meaningful number (the personal
              user account often shows 0 here, since all their listings
              go through the shop instead) — otherwise fall back to the
              user's own count.
            */}
            <p className="text-[14px] text-black/50 mt-0.5">
              {pluralizeListings(
                product.shop ? product.shop.totalNumProducts : product.user.totalNumProducts,
              )}
            </p>
          </div>
        </Link>

        {product.shop && (
          <Link
            href={`/shop/${product.shopId}`}
            className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 transition text-green-700 text-sm font-medium px-3 py-1.5 rounded-full cursor-pointer w-fit"
          >
            <Store className="w-4 h-4" />
            Магазин
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}

        <div className="flex gap-2">
          <button className="flex-1 bg-gray-900 hover:bg-gray-800 transition cursor-pointer text-white py-2.5 rounded-lg text-sm lg:text-base">
            Сообщение
          </button>
          <button
            onClick={() => setPhoneOpen(true)}
            className="flex-1 bg-primary/10 hover:bg-primary/15 transition cursor-pointer text-primary py-2.5 rounded-lg text-sm lg:text-base"
          >
            Телефон
          </button>
          {/*
            Telegram — only rendered when the seller actually enabled it
            (product.enableTelegram). We don't have a real Telegram
            contact/username field yet, only telegramPostId (which looks
            like a channel repost id, not a DM target), so this link is
            a best-effort guess and should be swapped for whatever
            deep-link format the Android app already uses for contacting
            sellers via Telegram, once that's confirmed.
          */}
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

        <p className="text-[13px] text-black/40 text-center">На BizTorg с {sellerSinceDate}</p>
      </div>
    </>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-0 py-6 lg:py-10">
      {/*
        Breadcrumb — currently just Главная -> текущая категория (если есть)
        -> название товара. Полную цепочку (Недвижимость -> Продажа -> Квартиры)
        можно достроить, как только будет известна форма product.category
        (нужна ли цепочка родителей category.parent... или это плоское поле).
      */}
      <nav className="flex items-center gap-1.5 text-[14px] text-black/50 mb-6 overflow-x-auto whitespace-nowrap hide-scrollbar">
        <a href="/" className="hover:text-black transition shrink-0">
          Главная
        </a>
        {product.category?.name && (
          <>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <span className="shrink-0">{product.category.name}</span>
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
            {/* THUMBNAILS — hidden on mobile, image count usually too tall for a vertical rail on small screens */}
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

            {/* MAIN IMAGE */}
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

          {/* MOBILE ONLY — price/seller cards right after the images, matching
              how the reference layout puts this info immediately below the
              photo instead of after attributes/description/location. Hidden
              from lg: up, where the same content renders in its normal
              sticky right column instead (see below). */}
          <div className="lg:hidden space-y-4">{sellerAndPriceCards}</div>

          {/* ATTRIBUTES */}
          {attributes.length > 0 && (
            <div>
              <h2 className="text-2xl lg:text-3xl text-black/80 font-bold mb-4">Характеристики</h2>
              <div className="divide-y">
                {attributes.map((attr, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-1 sm:gap-8 py-2">
                    <span className="sm:min-w-[160px] text-base lg:text-xl text-gray-600">{attr.name}</span>
                    <span className="text-base lg:text-xl text-gray-800">{attr.values.join(", ")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DESCRIPTION */}
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold mb-4 text-black/80">Описание</h2>
            <p className="text-base lg:text-xl text-gray-700 whitespace-pre-line">{product.description}</p>
          </div>

          {/* ASK THE SELLER */}
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold mb-4 text-black/80">Спросить продавца</h2>

            <div className="flex items-center gap-2 border border-gray-200 rounded-xl p-2 mb-3">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Здравствуйте! Хочу купить"
                className="flex-1 min-w-0 px-2 py-2 outline-none text-base lg:text-lg"
              />
              <button
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-white shrink-0 cursor-pointer hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={!message.trim()}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  onClick={() => setMessage(reply)}
                  className={`px-4 py-2 rounded-full border text-sm lg:text-base transition cursor-pointer ${
                    message === reply
                      ? "bg-gray-900 text-white border-gray-900"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>

          {product.latitude && product.longitude && (
            <div>
              <h3 className="text-2xl lg:text-3xl font-bold text-black/80 mb-4">Локация сделки</h3>

              <ProductMap latitude={product.latitude} longitude={product.longitude} />

              <div className="mt-6 flex items-start gap-4 flex-col rounded-lg">
                <a
                  href={`https://yandex.ru/maps/?ll=${product.longitude},${product.latitude}&pt=${product.longitude},${product.latitude}&z=17`}
                  target="_blank"
                  className="flex items-center justify-between gap-4 w-full p-4 rounded-xl border border-gray-200 hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-gray-200 rounded-xl flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="text-base lg:text-lg font-medium text-gray-700 whitespace-normal wrap-break-word">
                      {product.region.name}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 shrink-0" />
                </a>

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
                      Открыть карту в Yandex maps
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 shrink-0" />
                </a>
              </div>
            </div>
          )}

          {/* REPORT — opens the two-step ReportSheet (reason list -> comment + submit) */}
          <button
            onClick={() => setReportOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 transition cursor-pointer text-gray-700 text-base lg:text-lg font-medium py-3.5 rounded-xl"
          >
      
            Пожаловаться
          </button>
        </div>

        {/* RIGHT — seller / price card. Sticky on desktop. Hidden on mobile,
            since the same content (sellerAndPriceCards) already rendered
            right after the images above — this copy is desktop-only so we
            don't end up showing it twice on a narrow screen. */}
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
        onClose={closeReportSheet}
        onSubmit={handleSubmitReport}
      />
    </div>
  );
}