"use client";

import { useTranslations } from "next-intl";

interface Props {
  title: string;
  setTitle: (v: string) => void;
}

export default function ProductTitle({ title, setTitle }: Props) {
  const t = useTranslations("createProduct");

  return (
    <section className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-9 mb-6">
      <h2 className="text-lg sm:text-2xl font-bold mb-4 text-gray-700">{t("titleHeading")}</h2>
      <p className="text-lg sm:text-lg font-medium mb-4 text-gray-500">
        {t("titleHint")}
      </p>

      <div className="relative w-full sm:w-2/3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={60}
          placeholder={t("titlePlaceholder")}
          className="w-full pr-10 border text-gray-800 text-lg placeholder-gray-400 rounded-xl px-4 py-3 outline-none"
        />

        {title.length > 0 && (
          <button
            type="button"
            onClick={() => setTitle("")}
            className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      <p className="text-sm w-full sm:w-2/3 text-right text-gray-500 mt-1">
        {title.length}/60
      </p>
    </section>
  );
}