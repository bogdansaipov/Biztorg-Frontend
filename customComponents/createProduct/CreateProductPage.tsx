"use client";

import { useEffect, useState } from "react";
import ImageUploader from "./ImageUploader";
import ProductTitle from "./ProductTitle";
import ProductDescription from "./ProductDescription";
import { Category } from "@/types/category";
import { api } from "@/helpers/api";
import { getCategories } from "@/services/category.service";
import CategoryModal from "./CategoryModal";
import { AttributeGroupedValues } from "@/types/attribute/attribute";
import AttributeField from "./AttributeField";
import { Currency } from "@/enums/CurrencyEnum";
import PriceSection from "./PriceSection";
import MapPicker from "./MapPicker";
import { Region } from "@/types/region/region";
import RegionModal from "./RegionModal";
import ProfileContactsSection from "./ProfileContactsSection";
import SidebarChecklist from "./SidebarChecklist";
import { cn } from "@/lib/utils";

export default function CreateProductPage() {
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const [categoryPath, setCategoryPath] = useState<Category[]>([]);
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

const [regionPath, setRegionPath] = useState<Region[]>([]);
const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

const [contactName, setContactName] = useState("");
const [contactPhone, setContactPhone] = useState("+998 ");
const [enableTelegram, setEnableTeleram] = useState(true);


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



//   useEffect(() => {
//     const res = getCategories();

//     setCategories()
//   })

  useEffect(() => {
  api.get("/categories").then((res) => {
    setCategories(res.data.data);
  });
}, []);

const getChildren = (parentId: string | null) =>
  categories.filter((c) => c.parentId === parentId);

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
  if (!canSubmit) return;

  const formData = new FormData();

  // ---------- IMAGES ----------
  uploadedFiles.forEach((file, index) => {
    formData.append("images", file);
  });

  // ---------- BASIC ----------
  formData.append("categoryId", selectedCategory!.id);
  formData.append("regionId", selectedRegion!.id);
  formData.append("name", title);
  formData.append("description", description);

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

  // ===========================
  // 🔴 DEBUG LOGGING START
  // ===========================
  console.group("📦 CREATE PRODUCT FORM DATA");

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(
        `${key}: [File]`,
        {
          name: value.name,
          size: value.size,
          type: value.type,
        }
      );
    } else {
      console.log(`${key}:`, value);
    }
  }

  console.groupEnd();
  // ===========================
  // 🔴 DEBUG LOGGING END
  // ===========================

  await api.post("/products", formData);
};

  return (
    <div className="max-w-7xl mx-auto py-10 px-6">
      {/* PAGE TITLE */}
      <h1 className="text-5xl font-bold text-gray-700 mb-6">
        Создать объявление
      </h1>

      {/* MAIN LAYOUT */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT CONTENT */}
        <div className="flex-1 space-y-6">
          <ImageUploader
            previewImages={previewImages}
            setPreviewImages={setPreviewImages}
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
          />

          {/* Next components will go here */}
          {/* TitleSection */}
          {/* DescriptionSection */}
          <ProductTitle title={title} setTitle={setTitle} />
<ProductDescription
  description={description}
  setDescription={setDescription}
/>

          {/* CategorySection */}

          <section className="bg-gray-50 rounded-xl p-9 mb-6">
  <h2 className="text-2xl font-bold mb-4 text-gray-700">Категория</h2>

  {!selectedCategory ? (
    <button
      onClick={() => setCategoryOpen(true)}
      className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 w-2/3 text-left font-medium text-lg"
    >
      Выбрать категорию
    </button>
  ) : (
    <>
      <div className="w-2/3 bg-white border border-gray-200 rounded-xl px-4 py-3">
        <div className="text-lg font-semibold">{selectedCategory.name}</div>
        <div className="text-sm text-gray-500 mt-1">
          {categoryPath.map(c => c.name).join(" • ")}
        </div>
      </div>

      <button
        onClick={() => setCategoryOpen(true)}
        className="bg-gray-100 border border-gray-200 rounded-xl mt-3 px-4 py-3 w-2/3 text-left font-medium text-lg"
      >
        Выбрать другое
      </button>
    </>
  )}
</section>


          {/* AttributesSection */}

          {attributes.length > 0 && (
  <section className="bg-gray-50 rounded-xl p-9 mb-6">
    <h2 className="text-2xl font-bold mb-4 text-gray-700">
      Характеристики
    </h2>

    <div className="grid w-2/3 grid-cols-1 sm:grid-cols-2 gap-4">
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


          {/* PriceSection */}

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


          {/* MapSection */}

          <section className="bg-gray-50 rounded-xl p-9 mb-6">
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


          {/* RegionSection */}

          <section className="bg-gray-50 rounded-xl p-9 mb-6">
  <h2 className="text-2xl font-bold mb-4 text-gray-700">Регион</h2>

  {!selectedRegion ? (
    <button
      onClick={() => setRegionOpen(true)}
      className="
        bg-gray-100 border border-gray-200
        rounded-xl px-4 py-3
        w-2/3 text-left font-medium text-lg
      "
    >
      Выбрать регион
    </button>
  ) : (
    <>
      <div className="w-2/3 bg-white border border-gray-200 rounded-xl px-4 py-3">
        <div className="text-lg font-semibold">
          {selectedRegion.name}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {regionPath.map((r) => r.name).join(" • ")}
        </div>
      </div>

      <button
        onClick={() => setRegionOpen(true)}
        className="
          bg-gray-100 border border-gray-200
          rounded-xl mt-3 px-4 py-3
          w-2/3 text-left font-medium text-lg
        "
      >
        Выбрать другое
      </button>
    </>
  )}
</section>


          {/* PhoneVisibility */}

          <ProfileContactsSection
  contactName={contactName}
  setContactName={setContactName}
  contactPhone={contactPhone}
  setContactPhone={setContactPhone}
  enableTelegram={enableTelegram}
  setEnableTelegram={setEnableTeleram}
/>


        </div>

        {/* RIGHT SIDEBAR (later) */}
        <div className="w-full lg:w-72">
  <SidebarChecklist items={checklistItems} />
</div>
      </div>

      <div className="w-full flex justify-center mt-10 mb-10">
  <button
    onClick={handleSubmit}
    disabled={!canSubmit}
    className={cn(
      "w-full max-w-lg h-12 rounded-2xl text-base font-semibold",
      "flex items-center justify-center transition",
      canSubmit
        ? "bg-primary text-white hover:opacity-90"
        : "bg-gray-300 text-gray-500 cursor-not-allowed"
    )}
  >
    Опубликовать
  </button>
</div>

      <CategoryModal
  open={categoryOpen}
  categories={categories}
  path={categoryPath}
  setPath={setCategoryPath}
  onSelect={(cat) => {
    setSelectedCategory(cat);
  }}
  onClose={() => setCategoryOpen(false)}
/>

<RegionModal
  open={regionOpen}
  regions={regions}
  path={regionPath}
  setPath={setRegionPath}
  onSelect={(region) => {
    setSelectedRegion(region);
  }}
  onClose={() => setRegionOpen(false)}
/>


    </div>
  );
}