"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowUp, ChevronLeft, MoreVertical, Trash2, TriangleAlert, X } from "lucide-react";
import { Product } from "@/types/Product";
import { Currency } from "@/enums/CurrencyEnum";
import FavoriteButton from "@/components/ui/FavoriteButton";
import { bumpProduct, deleteProduct } from "@/services/product.service";
import { useToastStore } from "@/stores/toast.store";
import { localized } from "@/lib/localized";
import { formatProductDate } from "@/lib/formatDate";

const MEDIA_BASE = "https://169-58-13-208.nip.io/public";

const MANAGE_SHEET_Z_INDEX = 10000;

function ManageProductSheet({
  open,
  mounted,
  step,
  onClose,
  onBack,
  onBump,
  bumping,
  onRequestDelete,
  onConfirmDelete,
  deleting,
  t,
}: {
  open: boolean;
  mounted: boolean;
  step: "actions" | "delete-confirm";
  onClose: () => void;
  onBack: () => void;
  onBump: () => void;
  bumping: boolean;
  onRequestDelete: () => void;
  onConfirmDelete: () => void;
  deleting: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  if (!open || !mounted) return null;

  const sheet = (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center"
      style={{ zIndex: MANAGE_SHEET_Z_INDEX }}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-[420px] sm:mx-4 flex flex-col overflow-hidden shadow-2xl">
        <div className="relative shrink-0 px-6 py-6">
          {step === "delete-confirm" && (
            <button
              onClick={onBack}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-[10px] hover:bg-black/5 flex items-center justify-center cursor-pointer transition"
              aria-label={t("back")}
            >
              <ChevronLeft className="w-5 h-5 text-black/60" />
            </button>
          )}
          <h2 className="text-center text-xl font-bold text-black/85">
            {step === "delete-confirm" ? t("deleteTitle") : t("title")}
          </h2>
          <button
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-[10px] hover:bg-black/5 flex items-center justify-center cursor-pointer transition"
            aria-label={t("close")}
          >
            <X className="w-5 h-5 text-black/50" />
          </button>
        </div>

        <div className="px-6 pb-8">
          {step === "actions" ? (
            <div className="space-y-2">
              <button
                onClick={onBump}
                disabled={bumping}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition cursor-pointer text-left disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-white shrink-0">
                  <ArrowUp className="w-5 h-5 text-gray-600" />
                </span>
                <span className="text-[15px] font-medium text-gray-800">
                  {bumping ? t("bumping") : t("bump")}
                </span>
              </button>

              <button
                onClick={onRequestDelete}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-gray-50 hover:bg-red-50 transition cursor-pointer text-left"
              >
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-white shrink-0">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </span>
                <span className="text-[15px] font-medium text-red-600">{t("delete")}</span>
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                  <TriangleAlert className="w-8 h-8 text-red-500" />
                </div>
              </div>

              <p className="text-gray-500 text-sm mb-8 whitespace-pre-line">
                {t("deleteWarning")}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={onBack}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl font-medium bg-gray-100 hover:bg-gray-200 transition cursor-pointer text-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={onConfirmDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl font-medium bg-red-500 hover:bg-red-600 transition cursor-pointer text-white disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {deleting ? t("deleting") : t("deleteConfirm")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}

export default function FavoriteProductCard({
  product,
  locale,
  onUnfavorite,
  manageable = false,
  mobileRow = false,
  onDeleted,
  onBumped,
}: {
  product: Product;
  locale: string;
  onUnfavorite?: () => void;
  manageable?: boolean;
  mobileRow?: boolean;
  onDeleted?: () => void;
  onBumped?: () => void;
}) {
  const t = useTranslations("manageProduct");

  const mainImage = product.images.find((i) => i.isMain)?.imageUrl ?? product.images[0]?.imageUrl;
  const priceLabel = `${Number(product.price).toLocaleString("ru-RU")} ${
    product.currency === Currency.USD ? "у.е" : "сум"
  }`;
  const dateLabel = formatProductDate(product.createdAt, locale);
  const regionLabel = product.region ? localized(product.region, locale) : "";
  const productHref = `/${locale}/obyavlenie/${product.slug}`;

  const showToast = useToastStore((s) => s.show);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetStep, setSheetStep] = useState<"actions" | "delete-confirm">("actions");
  const [bumping, setBumping] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    document.documentElement.style.overflow = sheetOpen ? "hidden" : "";
    document.body.style.overflow = sheetOpen ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  const openSheet = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSheetStep("actions");
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setSheetStep("actions");
  };

  const handleBump = async () => {
    if (bumping) return;
    setBumping(true);
    try {
      await bumpProduct(product.id);
      showToast({ title: t("bumpSuccess"), type: "success" });
      closeSheet();
      onBumped?.();
    } catch (err) {
      console.error("Failed to bump product", err);
      showToast({ title: t("bumpError"), type: "error" });
    } finally {
      setBumping(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteProduct(product.id);
      showToast({ title: t("deleteSuccess"), type: "success" });
      closeSheet();
      onDeleted?.();
    } catch (err) {
      console.error("Failed to delete product", err);
      showToast({ title: t("deleteError"), type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const gridCard = (
    <Link href={productHref} className="group">
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

          <FavoriteButton
            productId={product.id}
            initialFavorited={product.isFavorited}
            className="absolute bottom-2 right-2"
            onToggle={(isFavorited) => {
              if (!isFavorited) onUnfavorite?.();
            }}
          />

          {manageable && (
            <button
              onClick={openSheet}
              className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm hover:bg-white transition rounded-full pl-2.5 pr-3 py-1.5 cursor-pointer"
            >
              <MoreVertical className="w-3.5 h-3.5 text-gray-700" />
              <span className="text-[12px] font-medium text-gray-700">{t("manage")}</span>
            </button>
          )}
        </div>

        <p className="mt-3 text-[17px] font-bold leading-[21px] text-[#292929] line-clamp-1 mb-1.5">
          {priceLabel}
        </p>

        <p className="text-[15px] leading-[18px] font-normal text-[#292929] line-clamp-2 min-h-[36px] mb-[5px]">
          {product.name}
        </p>

        <p className="text-[13px] font-medium leading-[16px] text-[#858585] mb-1">
          {regionLabel}
        </p>
        <p className="text-[13px] font-medium leading-[16px] text-[#858585]">{dateLabel}</p>
      </div>
    </Link>
  );

  const showRowOnMobile = manageable || mobileRow;

  return (
    <>
      {showRowOnMobile ? (
        <>
          <div className="flex sm:hidden items-center gap-3 py-3 border-b border-gray-100">
            <Link href={productHref} className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
              {mainImage && (
                <Image
                  src={`${MEDIA_BASE}${mainImage}`}
                  alt={product.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}
            </Link>

            <Link href={productHref} className="flex-1 min-w-0">
              <p className="text-[16px] font-bold leading-[20px] text-[#292929] line-clamp-1 mb-1">
                {priceLabel}
              </p>
              <p className="text-[14px] leading-[17px] font-normal text-[#292929] line-clamp-2 mb-1">
                {product.name}
              </p>
              <p className="text-[12px] font-medium leading-[15px] text-[#858585]">
                {regionLabel} · {dateLabel}
              </p>
            </Link>

            {manageable ? (
              <button
                onClick={openSheet}
                aria-label={t("manage")}
                className="shrink-0 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center cursor-pointer transition"
              >
                <MoreVertical className="w-5 h-5 text-gray-500" />
              </button>
            ) : (
              <FavoriteButton
                productId={product.id}
                initialFavorited={product.isFavorited}
                className="shrink-0"
                onToggle={(isFavorited) => {
                  if (!isFavorited) onUnfavorite?.();
                }}
              />
            )}
          </div>

          <div className="hidden sm:block">{gridCard}</div>
        </>
      ) : (
        gridCard
      )}

      {manageable && (
        <ManageProductSheet
          open={sheetOpen}
          mounted={mounted}
          step={sheetStep}
          onClose={closeSheet}
          onBack={() => setSheetStep("actions")}
          onBump={handleBump}
          bumping={bumping}
          onRequestDelete={() => setSheetStep("delete-confirm")}
          onConfirmDelete={handleConfirmDelete}
          deleting={deleting}
          t={t}
        />
      )}
    </>
  );
}