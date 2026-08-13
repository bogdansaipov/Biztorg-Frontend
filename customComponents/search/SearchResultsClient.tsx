"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { NavigationArrowIcon, Lightning, Storefront, ArrowsLeftRight } from "@phosphor-icons/react";
import { filterProducts } from "@/services/product.service";
import { getParentCategories } from "@/services/category.service";
import { Category } from "@/types/category";
import { AttributeGroupedValues } from "@/types/attribute/attribute";
import { Product } from "@/types/Product";
import { ProductImage } from "@/types/images/image";
import { Currency } from "@/enums/CurrencyEnum";
import { ProductSorting, ProductsFilterPagination } from "@/types/responses/product-filter.response";
import { Region } from "@/types/region/region";
import { getAncestorChain, slugPathFor } from "@/lib/categorySlug";
import { getLocationText } from "@/lib/locationText";
import { localized, localizedValue } from "@/lib/localized";
import { announcementWord } from "@/lib/pluralize";
import { formatProductDate } from "@/lib/formatDate";
import { useLocaleRegion } from "@/hooks/useLocaleRegion";
import { DEFAULT_REGION_SLUG, resolveRegionFilterParams, setRegionCookie } from "@/lib/region";
import FavoriteButton from "@/components/ui/FavoriteButton";
import CircularLoader from "@/components/ui/CircularLoader";
import CategorySelectMenu from "@/customComponents/createProduct/CategorySelectMenu";
import RegionSelectMenu from "@/customComponents/createProduct/RegionSelectMenu";

  const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_URL ?? "https://169-58-13-208.nip.io";
const HOVER_CLOSE_DELAY = 200;

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

const PILL_BASE =
  "flex items-center gap-1.5 px-3 py-2 text-xs lg:px-4 lg:py-2.5 lg:text-sm rounded-xl font-medium border transition cursor-pointer whitespace-nowrap select-none";
const pillTone = (active: boolean) =>
  active
    ? "bg-gray-800 text-white border-gray-800"
    : "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200";

function RadioCheck({ active }: { active: boolean }) {
  return (
    <span
      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition ${
        active ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
    </span>
  );
}

function PillResetButton({ onReset, ariaLabel }: { onReset: () => void; ariaLabel: string }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onReset();
      }}
      aria-label={ariaLabel}
      className="flex items-center justify-center w-4 h-4 rounded-full bg-white hover:bg-gray-200 transition shrink-0 cursor-pointer"
    >
      <X className="w-2.5 h-2.5 text-gray-700" strokeWidth={3} />
    </button>
  );
}

function FilterPill({
  label,
  active,
  open,
  onOpen,
  onClose,
  onReset,
  resetAriaLabel,
  children,
}: {
  label: string;
  active: boolean;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onReset?: () => void;
  resetAriaLabel: string;
  children: React.ReactNode;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [coords, setCoords] = useState<{ top: number; left?: number; right?: number } | null>(null);

  const recomputePosition = () => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const panelWidth = 280;
    const overflowsRight = rect.left + panelWidth > window.innerWidth - 16;
    setCoords({
      top: rect.bottom + 8,
      left: overflowsRight ? undefined : rect.left,
      right: overflowsRight ? window.innerWidth - rect.right : undefined,
    });
  };

  useEffect(() => {
    if (!open) return;
    recomputePosition();

    const handleScrollOrResize = (e: Event) => {
      if (panelRef.current && e.target instanceof Node && panelRef.current.contains(e.target)) {
        return;
      }
      onClose();
    };
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedTrigger = wrapperRef.current?.contains(target);
      const clickedPanel = panelRef.current?.contains(target);
      if (!clickedTrigger && !clickedPanel) onClose();
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open, onClose]);

  const handleMouseEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    onOpen();
  };
  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(onClose, HOVER_CLOSE_DELAY);
  };

  return (
    <div
      ref={wrapperRef}
      className="relative shrink-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => (open ? onClose() : onOpen())}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open ? onClose() : onOpen();
          }
        }}
        className={`${PILL_BASE} ${pillTone(active)}`}
      >
        {label}
        {active && onReset ? (
          <PillResetButton onReset={onReset} ariaLabel={resetAriaLabel} />
        ) : (
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        )}
      </div>

      {open &&
        mounted &&
        coords &&
        createPortal(
          <div
            ref={panelRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ position: "fixed", top: coords.top, left: coords.left, right: coords.right }}
            className="z-[9999] bg-white border border-gray-200 rounded-2xl p-4 w-[280px]"
          >
            {children}
          </div>,
          document.body,
        )}
    </div>
  );
}

interface SearchResultsClientProps {
  mode: "category" | "search";
  category: Category | null;
  categories: Category[];
  attributes: AttributeGroupedValues[];
  regions: Region[];
  initialProducts: Product[];
  initialPagination: ProductsFilterPagination;
}

export default function SearchResultsClient({
  category,
  categories = [],
  attributes = [],
  regions = [],
  initialProducts,
  initialPagination,
}: SearchResultsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("search");

  const { locale, region } = useLocaleRegion();

  const SORT_LABELS: Record<string, string> = {
    "": t("sortRecommended"),
    NEW: t("sortNew"),
    CHEAP: t("sortCheap"),
    EXPENSIVE: t("sortExpensive"),
  };

  const TYPE_LABELS: Record<string, string> = {
    "": t("typeFilterLabel"),
    SALE: t("typeSale"),
    PURCHASE: t("typePurchase"),
  };

  const query = searchParams.get("query") ?? undefined;
  const priceFromParam = searchParams.get("priceFrom");
  const priceToParam = searchParams.get("priceTo");
  const currencyParam = (searchParams.get("currency") as "USD" | "UZS" | null) ?? undefined;
  const typeParam = (searchParams.get("type") as "SALE" | "PURCHASE" | null) ?? undefined;
  const sortingParam = (searchParams.get("sorting") as ProductSorting | null) ?? undefined;
  const isUrgentParam = searchParams.get("isUrgent") === "true";
  const isFreeParam = searchParams.get("isFree") === "true";
  const attrsParam = searchParams.get("attrs");
  const selectedAttributeValueIds = attrsParam ? attrsParam.split(",").filter(Boolean) : [];
  const sellerTypeParam = searchParams.get("sellerType");
  const selectedSellerTypes = sellerTypeParam ? sellerTypeParam.split(",").filter(Boolean) : [];

  const selectedRegion = region === DEFAULT_REGION_SLUG ? null : (regions ?? []).find((r) => r.slug === region) ?? null;

  const updateParams = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, value);
    });
    const qs = next.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  };

  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);

  const categoryPickerFromDrawer = useRef(false);

  useEffect(() => {
    if (searchParams.get("openFilters") === "1") {
      setFiltersDrawerOpen(true);
      const next = new URLSearchParams(searchParams.toString());
      next.delete("openFilters");
      const qs = next.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateCategory = (newCategory: Category) => {
    const path = slugPathFor(newCategory, categories).join("/");
    const next = new URLSearchParams(searchParams.toString());
    next.delete("attrs");
    if (categoryPickerFromDrawer.current) {
      next.set("openFilters", "1");
      categoryPickerFromDrawer.current = false;
    }
    const qs = next.toString();
    router.push(`/${locale}/${region}/category/${path}${qs ? `?${qs}` : ""}`);
  };

  const updateRegion = (newRegion: Region | null) => {
    const targetSlug = newRegion ? newRegion.slug : DEFAULT_REGION_SLUG;
    setRegionCookie(targetSlug);
    const afterRegionSegments = pathname.split("/").slice(3);
    const qs = searchParams.toString();
    router.push(`/${locale}/${targetSlug}/${afterRegionSegments.join("/")}${qs ? `?${qs}` : ""}`);
  };

  const categoryPath = category ? getAncestorChain(category, categories) : [];
  const parentCategory = categoryPath.length > 1 ? categoryPath[categoryPath.length - 2] : null;
  const siblingCategories = category
    ? categories.filter((c) => c.parentId === (parentCategory?.id ?? null) && c.id !== category.id)
    : [];

  const [products, setProducts] = useState(initialProducts);
  const [pagination, setPagination] = useState(initialPagination);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setProducts(initialProducts);
    setPagination(initialPagination);
  }, [initialProducts, initialPagination]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await filterProducts({
        page: pagination.page + 1,
        limit: pagination.limit,
        query,
        categoryId: category?.id,
        ...resolveRegionFilterParams(selectedRegion, regions),
        priceFrom: priceFromParam ? Number(priceFromParam) : undefined,
        priceTo: priceToParam ? Number(priceToParam) : undefined,
        currency: currencyParam,
        type: typeParam,
        attributeValueIds: selectedAttributeValueIds,
        sellerType: selectedSellerTypes,
        sorting: sortingParam,
        isUrgent: isUrgentParam || undefined,
        isFree: isFreeParam || undefined,
      });
      setProducts((prev) => [...prev, ...data.products]);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Failed to load more filtered products", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const [openPill, setOpenPill] = useState<string | null>(null);
  const openPillFn = (key: string) => setOpenPill(key);
  const closePillFn = (key: string) => setOpenPill((prev) => (prev === key ? null : prev));

  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [regionPickerOpen, setRegionPickerOpen] = useState(false);
  const [rootCategories, setRootCategories] = useState<Category[]>([]);
  useEffect(() => {
    getParentCategories()
      .then(setRootCategories)
      .catch((err) => console.error("Failed to load root categories", err));
  }, []);

  const [priceFromInput, setPriceFromInput] = useState(priceFromParam ?? "");
  const [priceToInput, setPriceToInput] = useState(priceToParam ?? "");
  useEffect(() => {
    setPriceFromInput(priceFromParam ?? "");
    setPriceToInput(priceToParam ?? "");
  }, [priceFromParam, priceToParam]);

  const anyAdvancedFilterActive =
    selectedAttributeValueIds.length > 0 ||
    selectedSellerTypes.length > 0 ||
    !!priceFromParam ||
    !!priceToParam ||
    !!currencyParam ||
    !!typeParam ||
    isUrgentParam ||
    isFreeParam ||
    !!sortingParam;

  const categoryName = category ? localized(category, locale) : "";
  const locationText = getLocationText(selectedRegion ?? undefined, locale);

 const pageTitle = category
  ? categoryName
  : query
    ? t("searchResultsFor", { query })
    : t("allListings");

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-4 overflow-x-auto whitespace-nowrap hide-scrollbar">
          <Link href={`/${locale}/${region}`} className="hover:text-black transition shrink-0">
            {t("home")}
          </Link>
          {categoryPath.map((c) => (
            <span key={c.id} className="flex items-center gap-1.5 shrink-0">
              <ChevronRight className="w-3.5 h-3.5" />
              <button onClick={() => updateCategory(c)} className="hover:text-black transition cursor-pointer">
                {localized(c, locale)}
              </button>
            </span>
          ))}
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          {category ? `${categoryName} — ${locationText}` : pageTitle}
        </h1>

        {pagination.total > 0 && (
          <p className="text-sm text-gray-500 mb-4">
            {pagination.total} {announcementWord(pagination.total, locale)}
          </p>
        )}

        {siblingCategories.length > 0 && (
          <div className="flex items-center gap-x-5 gap-y-2 mb-4 overflow-x-auto hide-scrollbar flex-nowrap lg:flex-wrap lg:overflow-visible">
            {siblingCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => updateCategory(c)}
                className="shrink-0 text-sm font-medium text-gray-700 hover:text-gray-900 hover:underline transition cursor-pointer whitespace-nowrap"
              >
                {localized(c, locale)}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mb-6 overflow-x-auto hide-scrollbar flex-nowrap pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
          <button
            onClick={() => setFiltersDrawerOpen(true)}
            className={`${PILL_BASE} shrink-0 ${pillTone(anyAdvancedFilterActive)}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {t("filters")}
          </button>

          <button onClick={() => setCategoryPickerOpen(true)} className={`${PILL_BASE} shrink-0 ${pillTone(!!category)}`}>
            {category ? categoryName : t("category")}
            <ChevronDown className="w-4 h-4" />
          </button>

          <FilterPill
            label={TYPE_LABELS[typeParam ?? ""]}
            active={!!typeParam}
            open={openPill === "type"}
            onOpen={() => openPillFn("type")}
            onClose={() => closePillFn("type")}
            resetAriaLabel={t("resetFilterAria")}
            onReset={() => {
              updateParams({ type: undefined });
              closePillFn("type");
            }}
          >
            <div className="w-full space-y-1">
              {(["", "SALE", "PURCHASE"] as const).map((tp) => (
                <button
                  key={tp}
                  onClick={() => {
                    updateParams({ type: tp || undefined });
                    closePillFn("type");
                  }}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-50 cursor-pointer text-left"
                >
                  <span className="text-base text-gray-800">{TYPE_LABELS[tp]}</span>
                  <RadioCheck active={(typeParam ?? "") === tp} />
                </button>
              ))}
            </div>
          </FilterPill>

          {attributes.map((attr) => (
            <AttributeFilterPill
              key={attr.id}
              attr={attr}
              locale={locale}
              selectedAttributeValueIds={selectedAttributeValueIds}
              resetAriaLabel={t("resetFilterAria")}
              open={openPill === attr.id}
              onOpen={() => openPillFn(attr.id)}
              onClose={() => closePillFn(attr.id)}
              onCommit={(newSelectedForThisAttr) => {
                const otherAttrsSelected = selectedAttributeValueIds.filter(
                  (id) => !attr.values.some((v) => v.id === id),
                );
                const merged = [...otherAttrsSelected, ...newSelectedForThisAttr];
                updateParams({ attrs: merged.length ? merged.join(",") : undefined });
                closePillFn(attr.id);
              }}
            />
          ))}

          <SellerTypeFilterPill
            selected={selectedSellerTypes}
            open={openPill === "sellerType"}
            onOpen={() => openPillFn("sellerType")}
            onClose={() => closePillFn("sellerType")}
            resetAriaLabel={t("resetFilterAria")}
            labels={{
              seller: t("seller"),
              private: t("sellerPrivate"),
              shop: t("sellerShop"),
              reset: t("reset"),
              done: t("done"),
            }}
            onCommit={(next) => {
              updateParams({ sellerType: next.length ? next.join(",") : undefined });
              closePillFn("sellerType");
            }}
          />

          <FilterPill
            label={t("price")}
            active={!!(priceFromParam || priceToParam)}
            open={openPill === "price"}
            onOpen={() => openPillFn("price")}
            onClose={() => closePillFn("price")}
            resetAriaLabel={t("resetFilterAria")}
            onReset={() => {
              updateParams({ priceFrom: undefined, priceTo: undefined });
              setPriceFromInput("");
              setPriceToInput("");
              closePillFn("price");
            }}
          >
            <div className="w-full">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="number"
                  placeholder={t("priceFrom")}
                  value={priceFromInput}
                  onChange={(e) => setPriceFromInput(e.target.value)}
                  className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-base outline-none"
                />
                <input
                  type="number"
                  placeholder={t("priceTo")}
                  value={priceToInput}
                  onChange={(e) => setPriceToInput(e.target.value)}
                  className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-base outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPriceFromInput("");
                    setPriceToInput("");
                  }}
                  className="flex-1 text-gray-600 hover:text-gray-900 text-sm font-medium py-2.5 cursor-pointer transition"
                >
                  {t("reset")}
                </button>
                <button
                  onClick={() => {
                    updateParams({ priceFrom: priceFromInput || undefined, priceTo: priceToInput || undefined });
                    closePillFn("price");
                  }}
                  className="flex-1 bg-primary text-white text-sm font-medium py-2.5 rounded-xl cursor-pointer hover:opacity-90 transition"
                >
                  {t("done")}
                </button>
              </div>
            </div>
          </FilterPill>

          <FilterPill
            label={currencyParam ? (currencyParam === "USD" ? t("currencyUSD") : t("currencyUZS")) : t("currency")}
            active={!!currencyParam}
            open={openPill === "currency"}
            onOpen={() => openPillFn("currency")}
            onClose={() => closePillFn("currency")}
            resetAriaLabel={t("resetFilterAria")}
            onReset={() => {
              updateParams({ currency: undefined });
              closePillFn("currency");
            }}
          >
            <div className="w-full space-y-1">
              {[
                { value: undefined, label: t("currencyAny") },
                { value: "UZS" as const, label: t("currencyUZS") },
                { value: "USD" as const, label: t("currencyUSD") },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    updateParams({ currency: opt.value });
                    closePillFn("currency");
                  }}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-50 cursor-pointer text-left"
                >
                  <span className="text-base text-gray-800">{opt.label}</span>
                  <RadioCheck active={currencyParam === opt.value} />
                </button>
              ))}
            </div>
          </FilterPill>

          <button
            onClick={() => updateParams({ isUrgent: isUrgentParam ? undefined : "true" })}
            className={`${PILL_BASE} shrink-0 ${pillTone(isUrgentParam)}`}
          >
            {t("urgent")}
          </button>
          <button
            onClick={() => updateParams({ isFree: isFreeParam ? undefined : "true" })}
            className={`${PILL_BASE} shrink-0 ${pillTone(isFreeParam)}`}
          >
            {t("freeListingFilter")}
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <button
            onClick={() => setRegionPickerOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base font-medium text-gray-700 hover:text-gray-900 cursor-pointer transition"
          >
            <NavigationArrowIcon size={16} weight="fill" className="-scale-x-100 sm:w-5 sm:h-5" />
            {selectedRegion ? localized(selectedRegion, locale) : t("allRegions")}
          </button>
          <FilterPill
            label={SORT_LABELS[sortingParam ?? ""]}
            active={!!sortingParam}
            open={openPill === "sorting"}
            onOpen={() => openPillFn("sorting")}
            onClose={() => closePillFn("sorting")}
            resetAriaLabel={t("resetFilterAria")}
            onReset={() => updateParams({ sorting: undefined })}
          >
            <div className="w-full space-y-1">
              {(["", "NEW", "CHEAP", "EXPENSIVE"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    updateParams({ sorting: s || undefined });
                    closePillFn("sorting");
                  }}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-50 cursor-pointer text-left"
                >
                  <span className="text-base text-gray-800">{SORT_LABELS[s]}</span>
                  <RadioCheck active={(sortingParam ?? "") === s} />
                </button>
              ))}
            </div>
          </FilterPill>
        </div>

        {products.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-16">{t("noResults")}</p>
        ) : (
          <>
            <div
              className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 lg:gap-3 transition-opacity duration-300 ${
                loadingMore ? "opacity-40 pointer-events-none" : "opacity-100"
              }`}
            >
              {products.map((product, index) => {
                const mainImage =
                  product.images.find((i: ProductImage) => i.isMain)?.imageUrl ?? "/images/default.png";

                return (
                  <Link key={product.id} href={`/${locale}/obyavlenie/${product.slug}`} className="group">
                    <div className="rounded-xl hover:bg-gray-100 transition p-2">
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

                        <ProductCardBadges
                          product={product}
                          labels={{ urgent: t("urgent"), shop: t("sellerShop"), purchase: t("typePurchase") }}
                        />
                      </div>

                      <p className="mt-3 text-[18px] font-bold leading-[22px] text-[#292929] line-clamp-1 mb-1.5">
                        {product.price
                          ? `${Number(product.price).toLocaleString("ru-RU")} ${
                              product.currency === Currency.USD ? t("priceUsd") : t("priceUzs")
                            }`
                          : t("freePrice")}
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

            {pagination.page < pagination.pages && (
              <div className="mt-6">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-800 px-8 py-4 rounded-2xl flex items-center justify-center gap-3 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingMore ? (
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
        )}
      </div>

      {categoryPickerOpen && (
        <CategorySelectMenu
          rootCategories={rootCategories}
          onSelect={(cat) => updateCategory(cat)}
          onClose={() => {
            setCategoryPickerOpen(false);
            categoryPickerFromDrawer.current = false;
          }}
        />
      )}

      {regionPickerOpen && (
        <RegionSelectMenu
          regions={regions}
          selectedRegionId={selectedRegion?.id ?? null}
          onSelect={(newRegion) => {
            updateRegion(newRegion);
            setRegionPickerOpen(false);
          }}
          onClose={() => setRegionPickerOpen(false)}
        />
      )}

      <FiltersDrawer
        open={filtersDrawerOpen && !categoryPickerOpen && !regionPickerOpen}
        onClose={() => setFiltersDrawerOpen(false)}
        category={category}
        locale={locale}
        onOpenCategoryPicker={() => {
          categoryPickerFromDrawer.current = true;
          setCategoryPickerOpen(true);
        }}
        selectedRegion={selectedRegion}
        onOpenRegionPicker={() => setRegionPickerOpen(true)}
        attributes={attributes}
        selectedAttributeValueIds={selectedAttributeValueIds}
        selectedSellerTypes={selectedSellerTypes}
        priceFromParam={priceFromParam}
        priceToParam={priceToParam}
        currencyParam={currencyParam}
        typeParam={typeParam}
        isUrgentParam={isUrgentParam}
        isFreeParam={isFreeParam}
        sortingParam={sortingParam}
        totalCount={pagination.total}
        updateParams={updateParams}
      />
    </div>
  );
}

function SellerTypeFilterPill({
  selected,
  open,
  onOpen,
  onClose,
  onCommit,
  resetAriaLabel,
  labels,
}: {
  selected: string[];
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onCommit: (next: string[]) => void;
  resetAriaLabel: string;
  labels: { seller: string; private: string; shop: string; reset: string; done: string };
}) {
  const SELLER_TYPE_OPTIONS = [
    { value: "PRIVATE", label: labels.private },
    { value: "SHOP", label: labels.shop },
  ];

  const [pending, setPending] = useState<string[]>(selected);

  useEffect(() => {
    if (open) setPending(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const togglePending = (value: string) => {
    setPending((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  return (
    <FilterPill
      label={labels.seller}
      active={selected.length > 0 && selected.length < SELLER_TYPE_OPTIONS.length}
      open={open}
      onOpen={onOpen}
      onClose={onClose}
      resetAriaLabel={resetAriaLabel}
      onReset={selected.length > 0 ? () => onCommit([]) : undefined}
    >
      <div className="w-full">
        <div className="space-y-1.5 mb-3">
          {SELLER_TYPE_OPTIONS.map((opt) => {
            const checked = pending.includes(opt.value);
            return (
              <label
                key={opt.value}
                className="flex items-center gap-3 px-2.5 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <span
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                    checked ? "bg-gray-900 border-gray-900" : "border-gray-300"
                  }`}
                >
                  {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </span>
                <span className="text-base text-gray-800">{opt.label}</span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => togglePending(opt.value)}
                  className="hidden"
                />
              </label>
            );
          })}
        </div>

        <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
          {pending.length > 0 && (
            <button
              onClick={() => setPending([])}
              className="flex-1 text-gray-600 hover:text-gray-900 text-sm font-medium py-2.5 cursor-pointer transition"
            >
              {labels.reset}
            </button>
          )}
          <button
            onClick={() => onCommit(pending)}
            disabled={pending.length === 0}
            className={`flex-1 text-sm font-medium py-2.5 rounded-xl transition ${
              pending.length === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-primary text-white cursor-pointer hover:opacity-90"
            }`}
          >
            {labels.done}
          </button>
        </div>
      </div>
    </FilterPill>
  );
}

function AttributeFilterPill({
  attr,
  locale,
  selectedAttributeValueIds,
  open,
  onOpen,
  onClose,
  onCommit,
  resetAriaLabel,
}: {
  attr: AttributeGroupedValues;
  locale: string;
  selectedAttributeValueIds: string[];
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onCommit: (newSelectedForThisAttr: string[]) => void;
  resetAriaLabel: string;
}) {
  const attrValueIds = attr.values.map((v) => v.id);
  const committedForThisAttr = attrValueIds.filter((id) => selectedAttributeValueIds.includes(id));
  const [pending, setPending] = useState<string[]>(committedForThisAttr);
  const attrName = localized(attr, locale);

  useEffect(() => {
    if (open) setPending(committedForThisAttr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const togglePending = (valueId: string) => {
    setPending((prev) => (prev.includes(valueId) ? prev.filter((id) => id !== valueId) : [...prev, valueId]));
  };

  return (
    <FilterPill
      label={committedForThisAttr.length > 0 ? `${attrName} (${committedForThisAttr.length})` : attrName}
      active={committedForThisAttr.length > 0}
      open={open}
      onOpen={onOpen}
      onClose={onClose}
      resetAriaLabel={resetAriaLabel}
      onReset={() => onCommit([])}
    >
      <div className="w-full">
        <div className="max-h-[340px] overflow-y-auto space-y-1.5 mb-3">
          {attr.values.map((v) => {
            const checked = pending.includes(v.id);
            return (
              <label
                key={v.id}
                className="flex items-center gap-3 px-2.5 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <span
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                    checked ? "bg-gray-900 border-gray-900" : "border-gray-300"
                  }`}
                >
                  {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </span>
                <span className="text-base text-gray-800">{localizedValue(v, locale)}</span>
                <input type="checkbox" checked={checked} onChange={() => togglePending(v.id)} className="hidden" />
              </label>
            );
          })}
        </div>
      </div>
    </FilterPill>
  );
}

interface FiltersDraft {
  attrs: string[];
  sellerType: string[];
  priceFrom: string;
  priceTo: string;
  currency?: "USD" | "UZS";
  type?: "SALE" | "PURCHASE";
  isUrgent: boolean;
  isFree: boolean;
  sorting?: ProductSorting;
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-500 mb-3">{title}</h3>
      {children}
    </section>
  );
}

function FiltersDrawer({
  open,
  onClose,
  category,
  locale,
  onOpenCategoryPicker,
  selectedRegion,
  onOpenRegionPicker,
  attributes,
  selectedAttributeValueIds,
  selectedSellerTypes,
  priceFromParam,
  priceToParam,
  currencyParam,
  typeParam,
  isUrgentParam,
  isFreeParam,
  sortingParam,
  totalCount,
  updateParams,
}: {
  open: boolean;
  onClose: () => void;
  category: Category | null;
  locale: string;
  onOpenCategoryPicker: () => void;
  selectedRegion: Region | null;
  onOpenRegionPicker: () => void;
  attributes: AttributeGroupedValues[];
  selectedAttributeValueIds: string[];
  selectedSellerTypes: string[];
  priceFromParam: string | null;
  priceToParam: string | null;
  currencyParam?: "USD" | "UZS";
  typeParam?: "SALE" | "PURCHASE";
  isUrgentParam: boolean;
  isFreeParam: boolean;
  sortingParam?: ProductSorting;
  totalCount: number;
  updateParams: (patch: Record<string, string | undefined>) => void;
}) {
  const t = useTranslations("search");

  const SORT_LABELS: Record<string, string> = {
    "": t("sortRecommended"),
    NEW: t("sortNew"),
    CHEAP: t("sortCheap"),
    EXPENSIVE: t("sortExpensive"),
  };

  const SELLER_SEGMENTED: { value: string | null; label: string }[] = [
    { value: null, label: t("sellerAll") },
    { value: "PRIVATE", label: t("sellerPrivate") },
    { value: "SHOP", label: t("sellerShop") },
  ];

  const TYPE_SEGMENTED: { value: "SALE" | "PURCHASE" | null; label: string }[] = [
    { value: null, label: t("typeAll") },
    { value: "SALE", label: t("typeSale") },
    { value: "PURCHASE", label: t("typePurchase") },
  ];

  const [draft, setDraft] = useState<FiltersDraft>({
    attrs: selectedAttributeValueIds,
    sellerType: selectedSellerTypes,
    priceFrom: priceFromParam ?? "",
    priceTo: priceToParam ?? "",
    currency: currencyParam,
    type: typeParam,
    isUrgent: isUrgentParam,
    isFree: isFreeParam,
    sorting: sortingParam,
  });

  useEffect(() => {
    if (!open) return;
    setDraft({
      attrs: selectedAttributeValueIds,
      sellerType: selectedSellerTypes,
      priceFrom: priceFromParam ?? "",
      priceTo: priceToParam ?? "",
      currency: currencyParam,
      type: typeParam,
      isUrgent: isUrgentParam,
      isFree: isFreeParam,
      sorting: sortingParam,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const toggleAttrValue = (valueId: string) => {
    setDraft((d) => ({
      ...d,
      attrs: d.attrs.includes(valueId) ? d.attrs.filter((id) => id !== valueId) : [...d.attrs, valueId],
    }));
  };

  const setSellerSegment = (value: string | null) => {
    setDraft((d) => {
      if (value === null) return { ...d, sellerType: [] };
      const has = d.sellerType.includes(value);
      return { ...d, sellerType: has ? d.sellerType.filter((v) => v !== value) : [...d.sellerType, value] };
    });
  };

  const resetDraft = () => {
    setDraft({
      attrs: [],
      sellerType: [],
      priceFrom: "",
      priceTo: "",
      currency: undefined,
      type: undefined,
      isUrgent: false,
      isFree: false,
      sorting: undefined,
    });
  };

  const applyDraft = () => {
    updateParams({
      attrs: draft.attrs.length ? draft.attrs.join(",") : undefined,
      sellerType: draft.sellerType.length ? draft.sellerType.join(",") : undefined,
      priceFrom: draft.priceFrom || undefined,
      priceTo: draft.priceTo || undefined,
      currency: draft.currency,
      type: draft.type,
      isUrgent: draft.isUrgent ? "true" : undefined,
      isFree: draft.isFree ? "true" : undefined,
      sorting: draft.sorting || undefined,
    });
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-[10000] ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`absolute top-0 right-0 h-full w-full sm:w-[420px] bg-gray-100 flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-100 shrink-0">
          <button
            onClick={onClose}
            aria-label={t("close")}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer transition"
          >
            <ChevronLeft className="w-5 h-5 text-gray-800" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">{t("filters")}</h2>
          <button
            onClick={resetDraft}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 cursor-pointer transition px-2"
          >
            {t("reset")}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <DrawerSection title={t("category")}>
            <button
              onClick={onOpenCategoryPicker}
              className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-left cursor-pointer hover:bg-gray-100 transition"
            >
              <span className="text-base text-gray-800">
                {category ? localized(category, locale) : t("allCategories")}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </DrawerSection>

          <DrawerSection title={t("whereToSearch")}>
            <button
              onClick={onOpenRegionPicker}
              className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-left cursor-pointer hover:bg-gray-100 transition"
            >
              <span className="text-base text-gray-800">
                {selectedRegion ? localized(selectedRegion, locale) : t("allRegions")}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </DrawerSection>

          <DrawerSection title={t("typeFilterLabel")}>
            <div className="flex items-center gap-2 flex-wrap">
              {TYPE_SEGMENTED.map((opt) => {
                const active = opt.value === null ? !draft.type : draft.type === opt.value;
                return (
                  <button
                    key={opt.label}
                    onClick={() => setDraft((d) => ({ ...d, type: opt.value ?? undefined }))}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition cursor-pointer ${
                      active
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </DrawerSection>

          <DrawerSection title={t("seller")}>
            <div className="flex items-center gap-2 flex-wrap">
              {SELLER_SEGMENTED.map((opt) => {
                const active =
                  opt.value === null ? draft.sellerType.length === 0 : draft.sellerType.includes(opt.value);
                return (
                  <button
                    key={opt.label}
                    onClick={() => setSellerSegment(opt.value)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition cursor-pointer ${
                      active
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </DrawerSection>

          {attributes.map((attr) => (
            <DrawerSection key={attr.id} title={localized(attr, locale)}>
              <div className="max-h-[260px] overflow-y-auto space-y-1 -mx-1 px-1">
                {attr.values.map((v) => {
                  const checked = draft.attrs.includes(v.id);
                  return (
                    <label
                      key={v.id}
                      className="flex items-center gap-3 px-2.5 py-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <span
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                          checked ? "bg-gray-900 border-gray-900" : "border-gray-300"
                        }`}
                      >
                        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </span>
                      <span className="text-base text-gray-800">{localizedValue(v, locale)}</span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAttrValue(v.id)}
                        className="hidden"
                      />
                    </label>
                  );
                })}
              </div>
            </DrawerSection>
          ))}

          <DrawerSection title={t("price")}>
            <div className="space-y-1 mb-4">
              {[
                { value: undefined, label: t("currencyAny") },
                { value: "UZS" as const, label: t("currencyUZS") },
                { value: "USD" as const, label: t("currencyUSD") },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setDraft((d) => ({ ...d, currency: opt.value }))}
                  className="w-full flex items-center justify-between px-2.5 py-3 rounded-lg hover:bg-gray-50 cursor-pointer text-left"
                >
                  <span className="text-base text-gray-800">{opt.label}</span>
                  <RadioCheck active={draft.currency === opt.value} />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder={t("priceFrom")}
                value={draft.priceFrom}
                onChange={(e) => setDraft((d) => ({ ...d, priceFrom: e.target.value }))}
                className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-base outline-none"
              />
              <input
                type="number"
                placeholder={t("priceTo")}
                value={draft.priceTo}
                onChange={(e) => setDraft((d) => ({ ...d, priceTo: e.target.value }))}
                className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-base outline-none"
              />
            </div>
          </DrawerSection>

          <DrawerSection title={t("additional")}>
            <div className="space-y-1">
              {[
                { key: "isUrgent" as const, label: t("urgent") },
                { key: "isFree" as const, label: t("freeListingFilter") },
              ].map((opt) => {
                const checked = draft[opt.key];
                return (
                  <label
                    key={opt.key}
                    className="flex items-center gap-3 px-2.5 py-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <span
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                        checked ? "bg-gray-900 border-gray-900" : "border-gray-300"
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </span>
                    <span className="text-base text-gray-800">{opt.label}</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setDraft((d) => ({ ...d, [opt.key]: !d[opt.key] }))}
                      className="hidden"
                    />
                  </label>
                );
              })}
            </div>
          </DrawerSection>

          <DrawerSection title={t("sortBy")}>
            <div className="space-y-1">
              {(["", "NEW", "CHEAP", "EXPENSIVE"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setDraft((d) => ({ ...d, sorting: (s || undefined) as ProductSorting | undefined }))}
                  className="w-full flex items-center justify-between px-2.5 py-3 rounded-lg hover:bg-gray-50 cursor-pointer text-left"
                >
                  <span className="text-base text-gray-800">{SORT_LABELS[s]}</span>
                  <RadioCheck active={(draft.sorting ?? "") === s} />
                </button>
              ))}
            </div>
          </DrawerSection>
        </div>

        <div className="border-t border-gray-100 bg-white p-4 shrink-0 space-y-2">
          <button
            onClick={applyDraft}
            className="w-full bg-gray-900 hover:opacity-90 text-white font-medium py-3.5 rounded-xl cursor-pointer transition"
          >
            {t("showCount", { count: totalCount, word: announcementWord(totalCount, locale) })}
          </button>
          <button
            onClick={resetDraft}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3.5 rounded-xl cursor-pointer transition"
          >
            {t("reset")}
          </button>
        </div>
      </div>
    </div>
  );
}