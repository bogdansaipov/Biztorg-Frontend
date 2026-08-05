"use client";

import { useTranslations } from "next-intl";

interface Props {
  description: string;
  setDescription: (v: string) => void;
}

export default function ProductDescription({
  description,
  setDescription,
}: Props) {
  const t = useTranslations("createProduct");

  return (
    <section className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-9 mb-6">
      <h2 className="text-lg sm:text-2xl font-bold mb-4 text-gray-700">{t("descriptionHeading")}</h2>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={6}
        maxLength={800}
        placeholder={t("descriptionPlaceholder")}
        className="w-full resize-none border text-gray-800 text-lg placeholder-gray-400 rounded-xl px-4 py-3 outline-none"
      />

      <p className="text-sm text-right text-gray-500 mt-1">
        {description.length}/800
      </p>
    </section>
  );
}