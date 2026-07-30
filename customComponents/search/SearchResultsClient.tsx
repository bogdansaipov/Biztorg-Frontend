"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronRight, ChevronLeft, Check, X, SlidersHorizontal } from "lucide-react";
import { NavigationArrowIcon } from "@phosphor-icons/react";
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
import { regionInPrepositional } from "@/lib/ruDeclension";
import FavoriteButton from "@/components/ui/FavoriteButton";
import CircularLoader from "@/components/ui/CircularLoader";
import CategorySelectMenu from "@/customComponents/createProduct/CategorySelectMenu";
import RegionSelectMenu from "@/customComponents/createProduct/RegionSelectMenu";

const MEDIA_BASE = "https://169-58-13-208.nip.io/public";
const PAGE_LIMIT = 20;
// How long the dropdown stays open after the mouse leaves before it
// actually closes — enough to cross the small gap between the pill and
// its panel without the panel slamming shut mid-move.
const HOVER_CLOSE_DELAY = 200;

const SORT_LABELS: Record<string, string> = {
  "": "Рекомендуемые",
  NEW: "Сначала новые",
  CHEAP: "Сначала дешевле",
  EXPENSIVE: "Сначала дороже",
};

// Correct Russian plural form for a count — "1 объявление", "2
// объявления", "5 объявлений", and back around correctly at 21, 22, 25,
// 101, 111, etc. (the "teens" 11–14 are always the "many" bucket
// regardless of their last digit, which is the part a naive n % 10
// switch gets wrong).
function pluralizeRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return few;
  return many;
}

const announcementWord = (n: number) => pluralizeRu(n, "объявление", "объявления", "объявлений");

// Shared pill sizing/coloring — smaller on mobile, full size from lg: up.
const PILL_BASE =
  "flex items-center gap-1.5 px-3 py-2 text-xs lg:px-4 lg:py-2.5 lg:text-sm rounded-xl font-medium border transition cursor-pointer whitespace-nowrap select-none";
const pillTone = (active: boolean) =>
  active
    ? "bg-gray-800 text-white border-gray-800"
    : "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200";

// Radio-style indicator used in single-select dropdown lists (sorting,
// currency, and the segmented seller-type control in the filters
// drawer) — a filled black circle with a white checkmark when selected,
// an empty gray circle otherwise. Always rendered (not conditionally) so
// every row keeps the same layout whether or not it's the active one.
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

// Small white/translucent circle-X shown on an active pill instead of the
// chevron — clicking it clears that specific filter immediately, without
// opening the dropdown (stopPropagation keeps the outer pill's own
// open/close click from also firing).
function PillResetButton({ onReset }: { onReset: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onReset();
      }}
      aria-label="Сбросить фильтр"
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
  children,
}: {
  label: string;
  active: boolean;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  // When provided and the pill is active, a white X replaces the chevron
  // — clicking it clears the filter directly instead of opening the panel.
  onReset?: () => void;
  children: React.ReactNode;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Portal target — document.body isn't available during SSR, so the
  // panel only actually renders once mounted client-side.
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
          <PillResetButton onReset={onReset} />
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

  const query = searchParams.get("query") ?? undefined;
  const regionId = searchParams.get("regionId") ?? undefined;
  const priceFromParam = searchParams.get("priceFrom");
  const priceToParam = searchParams.get("priceTo");
  const currencyParam = (searchParams.get("currency") as "USD" | "UZS" | null) ?? undefined;
  const sortingParam = (searchParams.get("sorting") as ProductSorting | null) ?? undefined;
  const isUrgentParam = searchParams.get("isUrgent") === "true";
  const isFreeParam = searchParams.get("isFree") === "true";
  const attrsParam = searchParams.get("attrs");
  const selectedAttributeValueIds = attrsParam ? attrsParam.split(",").filter(Boolean) : [];
  const sellerTypeParam = searchParams.get("sellerType");
  const selectedSellerTypes = sellerTypeParam ? sellerTypeParam.split(",").filter(Boolean) : [];

  const updateParams = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, value);
    });
    const qs = next.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  };

  // ═══════════════════ Filters drawer ═══════════════════
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
    router.push(`/${path}${qs ? `?${qs}` : ""}`);
  };

  const selectedRegion = (regions ?? []).find((r) => r.id === regionId) ?? null;

  const categoryPath = category ? getAncestorChain(category, categories) : [];
  const parentCategory = categoryPath.length > 1 ? categoryPath[categoryPath.length - 2] : null;
  const siblingCategories = category
    ? categories.filter((c) => c.parentId === (parentCategory?.id ?? null) && c.id !== category.id)
    : [];

  // ═══════════════════ Products ═══════════════════
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
        limit: PAGE_LIMIT,
        query,
        categoryId: category?.id,
        regionId,
        priceFrom: priceFromParam ? Number(priceFromParam) : undefined,
        priceTo: priceToParam ? Number(priceToParam) : undefined,
        currency: currencyParam,
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

  // ═══════════════════ UI state ═══════════════════
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
    isUrgentParam ||
    isFreeParam ||
    !!sortingParam;

  const pageTitle = category
    ? `${category.name} в ${selectedRegion ? regionInPrepositional(selectedRegion.name) : "Узбекистане"}`
    : query
      ? `Результаты по запросу «${query}»`
      : "Все объявления";

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-6">
        {/* BREADCRUMB */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-4 overflow-x-auto whitespace-nowrap hide-scrollbar">
          <Link href="/" className="hover:text-black transition shrink-0">
            Главная
          </Link>
          {categoryPath.map((c) => (
            <span key={c.id} className="flex items-center gap-1.5 shrink-0">
              <ChevronRight className="w-3.5 h-3.5" />
              <button onClick={() => updateCategory(c)} className="hover:text-black transition cursor-pointer">
                {c.name}
              </button>
            </span>
          ))}
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{pageTitle}</h1>

        {pagination.total > 0 && (
          <p className="text-sm text-gray-500 mb-4">
            {pagination.total} {announcementWord(pagination.total)}
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
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* FILTER BAR */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto hide-scrollbar flex-nowrap pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
          <button
            onClick={() => setFiltersDrawerOpen(true)}
            className={`${PILL_BASE} shrink-0 ${pillTone(anyAdvancedFilterActive)}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Фильтры
          </button>

          <button onClick={() => setCategoryPickerOpen(true)} className={`${PILL_BASE} shrink-0 ${pillTone(!!category)}`}>
            {category ? category.name : "Категория"}
            <ChevronDown className="w-4 h-4" />
          </button>

          {attributes.map((attr) => (
            <AttributeFilterPill
              key={attr.id}
              attr={attr}
              selectedAttributeValueIds={selectedAttributeValueIds}
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
            onCommit={(next) => {
              updateParams({ sellerType: next.length ? next.join(",") : undefined });
              closePillFn("sellerType");
            }}
          />

          <FilterPill
            label="Цена"
            active={!!(priceFromParam || priceToParam)}
            open={openPill === "price"}
            onOpen={() => openPillFn("price")}
            onClose={() => closePillFn("price")}
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
                  placeholder="От"
                  value={priceFromInput}
                  onChange={(e) => setPriceFromInput(e.target.value)}
                  className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-base outline-none"
                />
                <input
                  type="number"
                  placeholder="До"
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
                  Сбросить
                </button>
                <button
                  onClick={() => {
                    updateParams({ priceFrom: priceFromInput || undefined, priceTo: priceToInput || undefined });
                    closePillFn("price");
                  }}
                  className="flex-1 bg-primary text-white text-sm font-medium py-2.5 rounded-xl cursor-pointer hover:opacity-90 transition"
                >
                  Готово
                </button>
              </div>
            </div>
          </FilterPill>

          <FilterPill
            label={currencyParam ? (currencyParam === "USD" ? "В у.е." : "В сумах") : "Валюта"}
            active={!!currencyParam}
            open={openPill === "currency"}
            onOpen={() => openPillFn("currency")}
            onClose={() => closePillFn("currency")}
            onReset={() => {
              updateParams({ currency: undefined });
              closePillFn("currency");
            }}
          >
            <div className="w-full space-y-1">
              {[
                { value: undefined, label: "Не важно" },
                { value: "UZS" as const, label: "В сумах" },
                { value: "USD" as const, label: "В у.е." },
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
            Срочно. Торг
          </button>
          <button
            onClick={() => updateParams({ isFree: isFreeParam ? undefined : "true" })}
            className={`${PILL_BASE} shrink-0 ${pillTone(isFreeParam)}`}
          >
            Отдам даром
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          {/* Quick location switcher — same role as birbir's "▾ Город"
              control in this spot: shows where we're currently searching
              and opens the same region picker as the "Все регионы" pill
              up in the filter bar, just handier to reach right above the
              results themselves. */}
<button
  onClick={() => setRegionPickerOpen(true)}
  className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base font-medium text-gray-700 hover:text-gray-900 cursor-pointer transition"
>
  <NavigationArrowIcon size={16} weight="fill" className="-scale-x-100 sm:w-5 sm:h-5" />
  {selectedRegion ? selectedRegion.name : "Все регионы"}
</button>
          <FilterPill
            label={SORT_LABELS[sortingParam ?? ""]}
            active={!!sortingParam}
            open={openPill === "sorting"}
            onOpen={() => openPillFn("sorting")}
            onClose={() => closePillFn("sorting")}
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

        {/* PRODUCT GRID */}
        {products.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-16">
            По вашему запросу ничего не найдено. Попробуйте изменить фильтры.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 lg:gap-3">
              {products.map((product) => {
                const mainImage =
                  product.images.find((i: ProductImage) => i.isMain)?.imageUrl ?? "/images/default.png";

                return (
                  <Link key={product.id} href={`/obyavlenie/${product.slug}`} className="group">
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
                        {product.isUrgent && (
                          <span className="absolute top-2 left-2 bg-gray-900/80 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                            Срочно. Торг
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-[18px] font-bold leading-[22px] text-[#292929] line-clamp-1 mb-1.5">
                        {product.price
                          ? `${Number(product.price).toLocaleString("ru-RU")} ${
                              product.currency === Currency.USD ? "у.e" : "сум"
                            }`
                          : "Бесплатно"}
                      </p>

                      <p className="text-[16px] leading-[19px] font-normal text-[#292929] line-clamp-2 min-h-[38px] mb-[5px]">
                        {product.name}
                      </p>

                      <p className="text-[14px] font-medium leading-[17px] text-[#858585] mb-1">
                        {product.region?.name}
                      </p>
                      <p className="text-[14px] font-medium leading-[17px] text-[#858585]">
                        {new Date(product.createdAt).toLocaleDateString("ru-RU")}
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
                      <span>Загрузка</span>
                      <CircularLoader size={18} />
                    </>
                  ) : (
                    "Показать ещё"
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
          onSelect={(region) => updateParams({ regionId: region.id })}
          onClose={() => setRegionPickerOpen(false)}
        />
      )}

      <FiltersDrawer
        open={filtersDrawerOpen && !categoryPickerOpen && !regionPickerOpen}
        onClose={() => setFiltersDrawerOpen(false)}
        category={category}
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
        isUrgentParam={isUrgentParam}
        isFreeParam={isFreeParam}
        sortingParam={sortingParam}
        totalCount={pagination.total}
        updateParams={updateParams}
      />
    </div>
  );
}

const SELLER_TYPE_OPTIONS = [
  { value: "PRIVATE", label: "Частный" },
  { value: "SHOP", label: "Магазин / бизнес" },
];

function SellerTypeFilterPill({
  selected,
  open,
  onOpen,
  onClose,
  onCommit,
}: {
  selected: string[];
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onCommit: (next: string[]) => void;
}) {
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
      label="Продавец"
      active={selected.length > 0 && selected.length < SELLER_TYPE_OPTIONS.length}
      open={open}
      onOpen={onOpen}
      onClose={onClose}
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
              Сбросить
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
            Готово
          </button>
        </div>
      </div>
    </FilterPill>
  );
}

function AttributeFilterPill({
  attr,
  selectedAttributeValueIds,
  open,
  onOpen,
  onClose,
  onCommit,
}: {
  attr: AttributeGroupedValues;
  selectedAttributeValueIds: string[];
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onCommit: (newSelectedForThisAttr: string[]) => void;
}) {
  const attrValueIds = attr.values.map((v) => v.id);
  const committedForThisAttr = attrValueIds.filter((id) => selectedAttributeValueIds.includes(id));
  const [pending, setPending] = useState<string[]>(committedForThisAttr);

  useEffect(() => {
    if (open) setPending(committedForThisAttr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const togglePending = (valueId: string) => {
    setPending((prev) => (prev.includes(valueId) ? prev.filter((id) => id !== valueId) : [...prev, valueId]));
  };

  return (
    <FilterPill
      label={committedForThisAttr.length > 0 ? `${attr.name} (${committedForThisAttr.length})` : attr.name}
      active={committedForThisAttr.length > 0}
      open={open}
      onOpen={onOpen}
      onClose={onClose}
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
                <span className="text-base text-gray-800">{v.value}</span>
                <input type="checkbox" checked={checked} onChange={() => togglePending(v.id)} className="hidden" />
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
              Сбросить
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
            Готово
          </button>
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
  isUrgent: boolean;
  isFree: boolean;
  sorting?: ProductSorting;
}

const SELLER_SEGMENTED: { value: string | null; label: string }[] = [
  { value: null, label: "Все" },
  { value: "PRIVATE", label: "Частный" },
  { value: "SHOP", label: "Магазин / бизнес" },
];

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
  onOpenCategoryPicker,
  selectedRegion,
  onOpenRegionPicker,
  attributes,
  selectedAttributeValueIds,
  selectedSellerTypes,
  priceFromParam,
  priceToParam,
  currencyParam,
  isUrgentParam,
  isFreeParam,
  sortingParam,
  totalCount,
  updateParams,
}: {
  open: boolean;
  onClose: () => void;
  category: Category | null;
  onOpenCategoryPicker: () => void;
  selectedRegion: Region | null;
  onOpenRegionPicker: () => void;
  attributes: AttributeGroupedValues[];
  selectedAttributeValueIds: string[];
  selectedSellerTypes: string[];
  priceFromParam: string | null;
  priceToParam: string | null;
  currencyParam?: "USD" | "UZS";
  isUrgentParam: boolean;
  isFreeParam: boolean;
  sortingParam?: ProductSorting;
  totalCount: number;
  updateParams: (patch: Record<string, string | undefined>) => void;
}) {
  const [draft, setDraft] = useState<FiltersDraft>({
    attrs: selectedAttributeValueIds,
    sellerType: selectedSellerTypes,
    priceFrom: priceFromParam ?? "",
    priceTo: priceToParam ?? "",
    currency: currencyParam,
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
            aria-label="Закрыть"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer transition"
          >
            <ChevronLeft className="w-5 h-5 text-gray-800" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">Фильтры</h2>
          <button
            onClick={resetDraft}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 cursor-pointer transition px-2"
          >
            Сбросить
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <DrawerSection title="Категория">
            <button
              onClick={onOpenCategoryPicker}
              className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-left cursor-pointer hover:bg-gray-100 transition"
            >
              <span className="text-base text-gray-800">{category ? category.name : "Все категории"}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </DrawerSection>

          <DrawerSection title="Где искать">
            <button
              onClick={onOpenRegionPicker}
              className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-left cursor-pointer hover:bg-gray-100 transition"
            >
              <span className="text-base text-gray-800">{selectedRegion ? selectedRegion.name : "Все регионы"}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </DrawerSection>

          <DrawerSection title="Продавец">
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
            <DrawerSection key={attr.id} title={attr.name}>
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
                      <span className="text-base text-gray-800">{v.value}</span>
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

          <DrawerSection title="Цена">
            <div className="space-y-1 mb-4">
              {[
                { value: undefined, label: "Не важно" },
                { value: "UZS" as const, label: "В сумах" },
                { value: "USD" as const, label: "В у.е." },
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
                placeholder="От"
                value={draft.priceFrom}
                onChange={(e) => setDraft((d) => ({ ...d, priceFrom: e.target.value }))}
                className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-base outline-none"
              />
              <input
                type="number"
                placeholder="До"
                value={draft.priceTo}
                onChange={(e) => setDraft((d) => ({ ...d, priceTo: e.target.value }))}
                className="w-1/2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-base outline-none"
              />
            </div>
          </DrawerSection>

          <DrawerSection title="Дополнительно">
            <div className="space-y-1">
              {[
                { key: "isUrgent" as const, label: "Срочно. Торг" },
                { key: "isFree" as const, label: "Отдам даром" },
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

          <DrawerSection title="Сортировать">
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
            Показать {totalCount} {announcementWord(totalCount)}
          </button>
          <button
            onClick={resetDraft}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3.5 rounded-xl cursor-pointer transition"
          >
            Сбросить
          </button>
        </div>
      </div>
    </div>
  );
}