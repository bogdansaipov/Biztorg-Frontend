"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { localized } from "@/lib/localized";

const SECTION_CARD = "bg-white border border-gray-100 rounded-2xl p-6 sm:p-9 mb-6";
const SECTION_HEADING = "text-lg sm:text-2xl font-bold mb-4 text-gray-700";

type ProductType = "SALE" | "PURCHASE";

function TypePill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-5 py-3 rounded-xl text-base font-medium border transition cursor-pointer",
        active
          ? "bg-gray-900 text-white border-gray-900"
          : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200",
      )}
    >
      {label}
    </button>
  );
}

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
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "ru";
  const t = useTranslations("createProduct");

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

  const [type, setType] = useState<ProductType>("SALE");

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

  const categoryPath = getAncestorPath(selectedCategory, categories);
  const regionPath = getAncestorPath(selectedRegion, regions);


  const checklistItems = [
    { label: t("checklistPhotos"), done: previewImages.length > 0 },
    { label: t("checklistTitle"), done: title.trim().length > 0 },
    { label: t("checklistDescription"), done: description.trim().length > 0 },
    { label: t("checklistCategory"), done: !!selectedCategory },
    {
      label: t("checklistAttributes"),
      done:
        attributes.length === 0 ||
        Object.keys(selectedAttributes).length === attributes.length,
    },
    {
      label: t("checklistPrice"),
      done: isFree || price !== null,
    },
    {
      label: t("checklistLocation"),
      done: latitude !== null && longitude !== null,
    },
    {
      label: t("checklistRegion"),
      done: !!selectedRegion,
    },
    {
      label: t("checklistContacts"),
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

  useEffect(() => {
    api.get("/categories").then((res) => {
      setCategories(res.data.data);
    });
  }, []);

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

      uploadedFiles.forEach((file) => {
        formData.append("images", file);
      });

      formData.append("categoryId", selectedCategory!.id);
      formData.append("regionId", selectedRegion!.id);
      formData.append("name", title);
      formData.append("description", description);

      if (postAsShopId) {
        formData.append("shopId", postAsShopId);
      }

      if (!isFree && price !== null) {
        formData.append("price", String(price));
        formData.append("currency", currency === Currency.USD ? "USD" : "UZS");
      }

      formData.append("type", type);

      if (latitude !== null && longitude !== null) {
        formData.append("latitude", latitude.toString());
        formData.append("longitude", longitude.toString());
      }

      formData.append("isUrgent", String(isUrgent));
      formData.append("contactName", contactName);
      formData.append("contactPhone", contactPhone.replace(/\s/g, ""));
      formData.append("enableTelegram", String(enableTelegram));

      Object.values(selectedAttributes).forEach((v, i) => {
        formData.append(`attributeValueIds[${i}]`, v);
      });

      await api.post("/products", formData);

      showToast({ title: t("productCreatedSuccess"), type: "success" });
      router.push(`/${locale}`);
    } catch (err) {
      console.error("Failed to create product", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="max-w-[1400px] mx-auto py-10 px-6">
    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-700 mb-6">
  {t("pageTitle")}
</h1>

        <div className="flex flex-col lg:flex-row gap-6">
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
              <h2 className={SECTION_HEADING}>{t("categoryHeading")}</h2>

              {!selectedCategory ? (
               <button
  onClick={() => setCategoryOpen(true)}
  className="cursor-pointer bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200 rounded-2xl px-6 py-4 sm:py-5 w-full sm:w-2/3 text-left font-medium text-base sm:text-lg"
>
  {t("chooseCategory")}
</button>
              ) : (
                <>
                  <div className="w-full sm:w-2/3 bg-white border border-gray-200 rounded-2xl px-6 py-5">
                    <div className="text-lg font-semibold">{localized(selectedCategory, locale)}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {categoryPath.map((c) => localized(c, locale)).join(" • ")}
                    </div>
                  </div>

                  <button
                    onClick={() => setCategoryOpen(true)}
                    className="cursor-pointer bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200 rounded-2xl mt-3 px-6 py-5 w-full sm:w-2/3 text-left font-medium text-lg"
                  >
                    {t("chooseAnother")}
                  </button>
                </>
              )}
            </section>

            {/* ATTRIBUTES */}
            {attributes.length > 0 && (
              <section className={SECTION_CARD}>
                <h2 className={SECTION_HEADING}>{t("attributesHeading")}</h2>

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

            <section className={SECTION_CARD}>
              <h2 className={SECTION_HEADING}>{t("typeHeading")}</h2>

              <div className="flex items-center gap-3">
                <TypePill label={t("typeSale")} active={type === "SALE"} onClick={() => setType("SALE")} />
                <TypePill label={t("typePurchase")} active={type === "PURCHASE"} onClick={() => setType("PURCHASE")} />
              </div>
            </section>

            {/* LOCATION */}
            <section className={SECTION_CARD}>
              <h2 className={SECTION_HEADING}>{t("locationHeading")}</h2>

              <MapPicker
                latitude={latitude}
                longitude={longitude}
                onChange={handleLocationChange}
              />

              {latitude && longitude && (
                <p className="text-sm text-gray-500 mt-3">
                  {t("selectedCoords", { lat: latitude.toFixed(5), lng: longitude.toFixed(5) })}
                </p>
              )}
            </section>

            {/* REGION */}
            <section className={SECTION_CARD}>
              <h2 className={SECTION_HEADING}>{t("regionHeading")}</h2>

              {!selectedRegion ? (
               <button
  onClick={() => setRegionOpen(true)}
  className="cursor-pointer bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200 rounded-2xl px-6 py-4 sm:py-5 w-full sm:w-2/3 text-left font-medium text-base sm:text-lg"
>
  {t("chooseRegion")}
</button>
              ) : (
                <>
                  <div className="w-full sm:w-2/3 bg-white border border-gray-200 rounded-2xl px-6 py-5">
                    <div className="text-lg font-semibold">{localized(selectedRegion, locale)}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {regionPath.map((r) => localized(r, locale)).join(" • ")}
                    </div>
                  </div>

                  <button
                    onClick={() => setRegionOpen(true)}
                    className="cursor-pointer bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200 rounded-2xl mt-3 px-6 py-5 w-full sm:w-2/3 text-left font-medium text-lg"
                  >
                    {t("chooseAnother")}
                  </button>
                </>
              )}
            </section>

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

           <button
  onClick={handleSubmit}
  disabled={!canSubmit || isSubmitting}
  className={cn(
    "w-full h-14 rounded-xl text-base sm:text-lg font-medium",
    "flex items-center justify-center gap-2 transition",
    canSubmit && !isSubmitting
      ? "cursor-pointer bg-primary text-white hover:opacity-90"
      : "cursor-not-allowed bg-gray-300 text-gray-500",
  )}
>
  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
  {isSubmitting ? t("publishing") : t("publish")}
</button>
          </div>

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