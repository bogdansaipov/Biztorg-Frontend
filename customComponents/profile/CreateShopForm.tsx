"use client";

import { useRef, useState } from "react";
import { ImageUp, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { createShop, updateShop, type BusinessType } from "@/services/shop.service";
import { ShopEditData } from "@/types/responses/shop.response";

const SECTION_CARD = "bg-white border border-gray-100 rounded-2xl p-6 sm:p-8";
const MEDIA_BASE = "https://169-58-13-208.nip.io/public";

interface Props {
  mode?: "create" | "edit";
  shopId?: string; // required when mode === "edit"
  initialData?: ShopEditData;
  onSuccess: () => void;
}

export default function CreateShopForm({ mode = "create", shopId, initialData, onSuccess }: Props) {
  const t = useTranslations("createShopForm");

  const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
    { value: "SELF_EMPLOYED", label: t("businessTypeSelfEmployed") },
    { value: "INDIVIDUAL", label: t("businessTypeIndividual") },
    { value: "LLC", label: t("businessTypeLLC") },
  ];

  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(
    initialData?.bannerUrl ? `${MEDIA_BASE}${initialData.bannerUrl}` : null,
  );

  const [shopName, setShopName] = useState(initialData?.shopName ?? "");
  const [phoneDigits, setPhoneDigits] = useState(
    (initialData?.phone ?? "").replace(/\D/g, "").replace(/^998/, "").slice(0, 9),
  );
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [businessType, setBusinessType] = useState<BusinessType>(
    (initialData?.businessType as BusinessType) ?? "SELF_EMPLOYED",
  );
  const [taxIdNumber, setTaxIdNumber] = useState(initialData?.taxIdNumber ?? "");

  const [contactName, setContactName] = useState(initialData?.contactName ?? "");
  const [address, setAddress] = useState(initialData?.address ?? "");

  const [telegramLink, setTelegramLink] = useState(initialData?.telegramLink ?? "");
  const [instagramLink, setInstagramLink] = useState(initialData?.instagramLink ?? "");
  const [facebookLink, setFacebookLink] = useState(initialData?.facebookLink ?? "");
  const [website, setWebsite] = useState(initialData?.website ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 9);
    const parts: string[] = [];
    if (cleaned.length > 0) parts.push(cleaned.slice(0, 2));
    if (cleaned.length > 2) parts.push(cleaned.slice(2, 5));
    if (cleaned.length > 5) parts.push(cleaned.slice(5, 7));
    if (cleaned.length > 7) parts.push(cleaned.slice(7, 9));
    return "+998 " + parts.join(" ");
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace("+998", "").trim();
    setPhoneDigits(value.replace(/\D/g, "").slice(0, 9));
  };

  const canSubmit = shopName.trim().length > 0 && phoneDigits.length === 9;

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);

    const reader = new FileReader();
    reader.onload = (ev) => setBannerPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError(null);

    const payload = {
      shopName: shopName.trim(),
      phone: `+998${phoneDigits}`,
      description: description.trim() || undefined,
      businessType,
      taxIdNumber: businessType !== "SELF_EMPLOYED" ? taxIdNumber.trim() || undefined : undefined,
      contactName: contactName.trim() || undefined,
      address: address.trim() || undefined,
      telegramLink: telegramLink.trim() || undefined,
      instagramLink: instagramLink.trim() || undefined,
      facebookLink: facebookLink.trim() || undefined,
      website: website.trim() || undefined,
      banner: bannerFile,
    };

    try {
      if (mode === "edit" && shopId) {
        await updateShop(shopId, payload);
      } else {
        await createShop(payload);
      }
      onSuccess();
    } catch (err) {
      console.error(`Failed to ${mode === "edit" ? "update" : "create"} shop`, err);
      setError(mode === "edit" ? t("saveError") : t("createError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* BANNER */}
      <section className={SECTION_CARD}>
        <h2 className="text-lg font-bold text-gray-800 mb-1">{t("bannerTitle")}</h2>
        <p className="text-sm text-gray-500 mb-4">
          {t("bannerSubtitle")}
        </p>

        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleBannerChange}
        />

        <div
          onClick={() => bannerInputRef.current?.click()}
          className="relative aspect-[3/1] rounded-2xl bg-gray-100 hover:bg-gray-200 transition cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-2 mb-4"
        >
          {bannerPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerPreview} alt={t("bannerAlt")} className="w-full h-full object-cover" />
          ) : (
            <>
              <ImageUp className="w-8 h-8 text-gray-400" />
              <span className="text-gray-500 text-sm">{t("bannerUploadPrompt")}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
            {bannerPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bannerPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <Store className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <span className="text-gray-400 text-[15px]">
            {shopName.trim() || t("shopNamePlaceholder")}
          </span>
        </div>

        <button
          onClick={() => bannerInputRef.current?.click()}
          className="w-full cursor-pointer bg-gray-100 hover:bg-gray-200 transition text-gray-700 font-medium py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <ImageUp className="w-4 h-4" />
          {t("uploadBanner")}
        </button>
      </section>

      {/* SHOP INFO */}
      <section className={SECTION_CARD}>
        <h2 className="text-lg font-bold text-gray-800 mb-4">{t("shopInfoTitle")}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1.5">
              {t("shopName")} <span className="text-red-500">*</span>
            </label>
            <input
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder={t("shopNameInputPlaceholder")}
              className="w-full bg-gray-100 rounded-xl px-4 py-3 text-[15px] outline-none placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1.5">
              {t("phone")} <span className="text-red-500">*</span>
            </label>
            <input
              value={formatPhone(phoneDigits)}
              onChange={handlePhoneChange}
              inputMode="numeric"
              placeholder="+998 90 123 45 67"
              className="w-full bg-gray-100 rounded-xl px-4 py-3 text-[15px] outline-none placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1.5">{t("description")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder={t("descriptionPlaceholder")}
              className="w-full resize-none bg-gray-100 rounded-xl px-4 py-3 text-[15px] outline-none placeholder:text-gray-400"
            />
          </div>
        </div>
      </section>

      {/* BUSINESS TYPE */}
      <section className={SECTION_CARD}>
        <h2 className="text-lg font-bold text-gray-800 mb-4">{t("businessTypeTitle")}</h2>

        <div className="space-y-2">
          {BUSINESS_TYPES.map((type) => {
            const active = businessType === type.value;
            return (
              <button
                key={type.value}
                onClick={() => setBusinessType(type.value)}
                className="w-full flex items-center gap-3 bg-gray-100 hover:bg-gray-200 transition rounded-xl px-4 py-3.5 cursor-pointer text-left"
              >
                <span
                  className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                    active ? "border-gray-900" : "border-gray-300"
                  }`}
                >
                  {active && <span className="w-2.5 h-2.5 rounded-full bg-gray-900" />}
                </span>
                <span className="text-[15px] text-gray-800">{type.label}</span>
              </button>
            );
          })}
        </div>

        {businessType !== "SELF_EMPLOYED" && (
          <div className="mt-4">
            <label className="block text-sm text-gray-700 mb-1.5">
              {t("taxId")}
            </label>
            <input
              value={taxIdNumber}
              onChange={(e) => setTaxIdNumber(e.target.value)}
              placeholder="000000000"
              className="w-full bg-gray-100 rounded-xl px-4 py-3 text-[15px] outline-none placeholder:text-gray-400"
            />
          </div>
        )}
      </section>

      {/* CONTACTS */}
      <section className={SECTION_CARD}>
        <h2 className="text-lg font-bold text-gray-800 mb-4">{t("contactsTitle")}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1.5">{t("contactName")}</label>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder={t("contactNamePlaceholder")}
              className="w-full bg-gray-100 rounded-xl px-4 py-3 text-[15px] outline-none placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1.5">{t("address")}</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("addressPlaceholder")}
              className="w-full bg-gray-100 rounded-xl px-4 py-3 text-[15px] outline-none placeholder:text-gray-400"
            />
          </div>
        </div>
      </section>

      {/* SOCIAL LINKS */}
      <section className={SECTION_CARD}>
        <h2 className="text-lg font-bold text-gray-800 mb-4">{t("socialLinksTitle")}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1.5">Telegram</label>
            <input
              value={telegramLink}
              onChange={(e) => setTelegramLink(e.target.value)}
              placeholder="https://t.me/..."
              className="w-full bg-gray-100 rounded-xl px-4 py-3 text-[15px] outline-none placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1.5">Instagram</label>
            <input
              value={instagramLink}
              onChange={(e) => setInstagramLink(e.target.value)}
              placeholder="https://instagram.com/..."
              className="w-full bg-gray-100 rounded-xl px-4 py-3 text-[15px] outline-none placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1.5">Facebook</label>
            <input
              value={facebookLink}
              onChange={(e) => setFacebookLink(e.target.value)}
              placeholder="https://facebook.com/..."
              className="w-full bg-gray-100 rounded-xl px-4 py-3 text-[15px] outline-none placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1.5">{t("website")}</label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
              className="w-full bg-gray-100 rounded-xl px-4 py-3 text-[15px] outline-none placeholder:text-gray-400"
            />
          </div>
        </div>
      </section>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        className={`w-full py-3.5 rounded-xl font-medium text-white transition ${
          canSubmit && !submitting
            ? "cursor-pointer bg-primary hover:opacity-90"
            : "cursor-not-allowed bg-gray-300"
        }`}
      >
        {submitting
          ? mode === "edit"
            ? t("saving")
            : t("submitting")
          : mode === "edit"
            ? t("save")
            : t("submit")}
      </button>
    </div>
  );
}