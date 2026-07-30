"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import ImageUploader from "./ImageUploader";
import ProductTitle from "./ProductTitle";
import ProductDescription from "./ProductDescription";
import { Category } from "@/types/category";
import { api } from "@/helpers/api";
import CategorySelectMenu from "./CategorySelectMenu";
import { AttributeGroupedValues } from "@/types/attribute/attribute";
import AttributeField from "./AttributeField";
import { Currency } from "@/enums/CurrencyEnum";
import PriceSection from "./PriceSection";
import MapPicker from "./MapPicker";
import { Region } from "@/types/region/region";
import RegionSelectMenu from "./RegionSelectMenu";
import ProfileContactsSection from "./ProfileContactsSection";
import SidebarChecklist from "./SidebarChecklist";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/stores/toast.store";

// Shared card style for every section on this page — white rounded card on
// the page's light gray background, matching the birbir reference (each
// step of the form is its own distinct card, not just a flat stack of
// headings). Kept as one constant so every section stays visually
// consistent and any future spacing tweak only needs to happen once.
const SECTION_CARD = "bg-white border border-gray-100 rounded-2xl p-6 sm:p-9 mb-6";

// Walks a flat list up through parentId to build the full ancestor chain
// for the breadcrumb display (e.g. "Электроника • Телефоны и связь •
// Мобильные телефоны", or for regions "Ташкентская область • Чиланзарский
// район"). CategorySelectMenu/RegionSelectMenu only report back the single
// leaf the person picked, not its ancestors, so this is computed here from
// the already-fetched flat lists rather than tracked as separate state
// that could fall out of sync.
function getAncestorPath<T extends { id: string; parentId?: string | null }>(
  item: T | null,
  all: T[],
): T[] {
  if (!item) return [];
  const path: T[] = [];
  let current: T | undefined = item;
  while (current) {
    path.unshift(current);
    const parentId = current.parentId;
    current = parentId ? all.find((c) => c.id === parentId) : undefined;
  }
  return path;
}

export default function CreateProductPage() {
  const router = useRouter();
  const showToast = useToastStore((s) => s.show);

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [rootCategories, setRootCategories] = useState<Category[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [attributes, setAttributes] = useState<AttributeGroupedValues[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
    >({});
  const [isFree, setIsFree] = useState(false);
  const [price, SetPrice] = useState<number | null>(null);
  const [currency, SetCurrency]  = useState<Currency.USD | Currency.UZS>(Currency.UZS);
  const [isUrgent, setIsUrgent] = useState(false);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [regions, setRegions] = useState<Region[]>([]);
  const [regionOpen, setRegionOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("+998 ");
  const [postAsShopId, setPostAsShopId] = useState<string | null>(null);
  const [enableTelegram, setEnableTeleram] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived, not stored — see getAncestorPath's comment above.
  const categoryPath = getAncestorPath(selectedCategory, categories);
  const regionPath = getAncestorPath(selectedRegion, regions);


  const checklistItems = [
    { label: "Фотографии", done: previewImages.length > 0 },
    { label: "Название", done: title.trim().length > 0 },
    { label: "Описание", done: description.trim().length > 0 },
    { label: "Категория", done: !!selectedCategory },
    {
      label: "Характеристики",
      done:
        attributes.length === 0 ||
        Object.keys(selectedAttributes).length === attributes.length,
    },
    {
      label: "Цена",
      done: isFree || price !== null,
    },
    {
      label: "Локация",
      done: latitude !== null && longitude !== null,
    },
    {
      label: "Регион",
      done: !!selectedRegion,
    },
    {
      label: "Контакты",
      done: contactName.trim().length > 0 && contactPhone.length > 0,
    },
  ];



  const handleLocationChange = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  useEffect(() => {
    api.get("/regions").then((res) => {
      setRegions(res.data.data);
    });
  }, []);

  // Full flat category list — used for children lookups (attributes fetch
  // below) and for walking the breadcrumb's ancestor chain.
  useEffect(() => {
    api.get("/categories").then((res) => {
      setCategories(res.data.data);
    });
  }, []);

  // Root categories come from their own dedicated endpoint rather than
  // being derived by filtering the flat list — the flat /categories
  // response isn't guaranteed to be in any particular order, which is what
  // was making the top-level category order look wrong. /categories/root
  // returns them already ordered by createdAt on the backend.
  useEffect(() => {
    api.get("/categories/root").then((res) => {
      setRootCategories(res.data.data);
    });
  }, []);

  useEffect(() => {
    if (!selectedCategory) return;

    api
      .get(`/categories/${selectedCategory.id}/attributes`)
      .then((res) => {
        setAttributes(res.data.data);
        setSelectedAttributes({});
      });
  }, [selectedCategory]);

  const canSubmit = checklistItems.every((i) => i.done);

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // ---------- IMAGES ----------
      uploadedFiles.forEach((file) => {
        formData.append("images", file);
      });

      // ---------- BASIC ----------
      formData.append("categoryId", selectedCategory!.id);
      formData.append("regionId", selectedRegion!.id);
      formData.append("name", title);
      formData.append("description", description);

      // ---------- POST AS SHOP (optional) ----------
      // TODO: confirm the actual field name your /products endpoint
      // expects for "post this listing under a shop instead of the
      // personal account" — using `shopId` as a reasonable guess pending
      // confirmation against the real API. Omitted entirely when posting
      // as the personal account (postAsShopId === null), matching how
      // categoryId/regionId etc. are only sent when actually set.
      if (postAsShopId) {
        formData.append("shopId", postAsShopId);
      }

      // ---------- PRICE ----------
      if (!isFree && price !== null) {
        formData.append("price", String(price));
        formData.append("currency", currency === Currency.USD ? "USD" : "UZS");
      }

      // ---------- LOCATION ----------
      if (latitude !== null && longitude !== null) {
        formData.append("latitude", latitude.toString());
        formData.append("longitude", longitude.toString());
      }

      // ---------- CONTACT ----------
      formData.append("isUrgent", String(isUrgent));
      formData.append("contactName", contactName);
      formData.append("contactPhone", contactPhone.replace(/\s/g, ""));
      formData.append("enableTelegram", String(enableTelegram));

      // ---------- ATTRIBUTES ----------
      Object.values(selectedAttributes).forEach((v, i) => {
        formData.append(`attributeValueIds[${i}]`, v);
      });

      await api.post("/products", formData);

      showToast({ title: "Объявление создано успешно", type: "success" });
      router.push("/");
    } catch (err) {
      console.error("Failed to create product", err);
      setIsSubmitting(false);
    }
    // No `finally` resetting isSubmitting on success — we're navigating
    // away immediately, so leaving the button in its loading state until
    // the redirect actually happens avoids a flash of "click me again"
    // right before the page changes.
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="max-w-[1400px] mx-auto py-10 px-6">
        {/* PAGE TITLE */}
        <h1 className="text-3xl sm:text-5xl font-bold text-gray-700 mb-6">
          Создать объявление
        </h1>

        {/* MAIN LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT CONTENT */}
          <div className="flex-1 space-y-6 min-w-0">
            <ImageUploader
              previewImages={previewImages}
              setPreviewImages={setPreviewImages}
              uploadedFiles={uploadedFiles}
              setUploadedFiles={setUploadedFiles}
            />

            <ProductTitle title={title} setTitle={setTitle} />
            <ProductDescription
              description={description}
              setDescription={setDescription}
            />

            {/* CATEGORY */}
            <section className={SECTION_CARD}>
              <h2 className="text-2xl font-bold mb-4 text-gray-700">Категория</h2>

              {!selectedCategory ? (
                <button
                  onClick={() => setCategoryOpen(true)}
                  className="cursor-pointer bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200 rounded-2xl px-6 py-5 w-full sm:w-2/3 text-left font-medium text-lg"
                >
                  Выбрать категорию
                </button>
              ) : (
                <>
                  <div className="w-full sm:w-2/3 bg-white border border-gray-200 rounded-2xl px-6 py-5">
                    <div className="text-lg font-semibold">{selectedCategory.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {categoryPath.map((c) => c.name).join(" • ")}
                    </div>
                  </div>

                  <button
                    onClick={() => setCategoryOpen(true)}
                    className="cursor-pointer bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200 rounded-2xl mt-3 px-6 py-5 w-full sm:w-2/3 text-left font-medium text-lg"
                  >
                    Выбрать другое
                  </button>
                </>
              )}
            </section>

            {/* ATTRIBUTES */}
            {attributes.length > 0 && (
              <section className={SECTION_CARD}>
                <h2 className="text-2xl font-bold mb-4 text-gray-700">
                  Характеристики
                </h2>

                <div className="grid w-full sm:w-2/3 grid-cols-1 sm:grid-cols-2 gap-4">
                  {attributes.map((attr) => (
                    <AttributeField
                      key={attr.id}
                      attribute={attr}
                      value={selectedAttributes[attr.id]}
                      onChange={(valueId: string) =>
                        setSelectedAttributes((prev) => ({
                          ...prev,
                          [attr.id]: valueId,
                        }))
                      }
                    />
                  ))}
                </div>
              </section>
            )}

            {/* PRICE */}
            <PriceSection
              isFree={isFree}
              setIsFree={setIsFree}
              price={price}
              setPrice={SetPrice}
              currency={currency}
              setCurrency={SetCurrency}
              isUrgent={isUrgent}
              setIsUrgent={setIsUrgent}
            />

            {/* LOCATION */}
            <section className={SECTION_CARD}>
              <h2 className="text-2xl font-bold mb-4 text-gray-700">
                Локация объявления
              </h2>

              <MapPicker
                latitude={latitude}
                longitude={longitude}
                onChange={handleLocationChange}
              />

              {latitude && longitude && (
                <p className="text-sm text-gray-500 mt-3">
                  Выбрано: {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </p>
              )}
            </section>

            {/* REGION */}
            <section className={SECTION_CARD}>
              <h2 className="text-2xl font-bold mb-4 text-gray-700">Регион</h2>

              {!selectedRegion ? (
                <button
                  onClick={() => setRegionOpen(true)}
                  className="cursor-pointer bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200 rounded-2xl px-6 py-5 w-full sm:w-2/3 text-left font-medium text-lg"
                >
                  Выбрать регион
                </button>
              ) : (
                <>
                  <div className="w-full sm:w-2/3 bg-white border border-gray-200 rounded-2xl px-6 py-5">
                    <div className="text-lg font-semibold">{selectedRegion.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {regionPath.map((r) => r.name).join(" • ")}
                    </div>
                  </div>

                  <button
                    onClick={() => setRegionOpen(true)}
                    className="cursor-pointer bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200 rounded-2xl mt-3 px-6 py-5 w-full sm:w-2/3 text-left font-medium text-lg"
                  >
                    Выбрать другое
                  </button>
                </>
              )}
            </section>

            {/* CONTACTS */}
            <ProfileContactsSection
              contactName={contactName}
              setContactName={setContactName}
              contactPhone={contactPhone}
              setContactPhone={setContactPhone}
              enableTelegram={enableTelegram}
              setEnableTelegram={setEnableTeleram}
              postAsShopId={postAsShopId}
              setPostAsShopId={setPostAsShopId}
            />

            {/* SUBMIT — full width of the column, matching every section
                card above it, rather than a narrow centered pill spanning
                the whole page. */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className={cn(
                "w-full h-14 rounded-xl text-lg font-medium",
                "flex items-center justify-center gap-2 transition",
                canSubmit && !isSubmitting
                  ? "cursor-pointer bg-primary text-white hover:opacity-90"
                  : "cursor-not-allowed bg-gray-300 text-gray-500",
              )}
            >
              {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
              {isSubmitting ? "Публикация…" : "Опубликовать"}
            </button>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="w-full lg:w-72">
            <SidebarChecklist items={checklistItems} />
          </div>
        </div>

        {categoryOpen && (
          <CategorySelectMenu
            rootCategories={rootCategories}
            onSelect={(cat) => setSelectedCategory(cat)}
            onClose={() => setCategoryOpen(false)}
          />
        )}

        {regionOpen && (
          <RegionSelectMenu
            regions={regions}
            onSelect={(region) => setSelectedRegion(region)}
            onClose={() => setRegionOpen(false)}
          />
        )}
      </div>
    </div>
  );
}