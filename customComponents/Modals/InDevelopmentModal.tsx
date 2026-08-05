"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Construction, X } from "lucide-react";

export default function InDevelopmentModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("inDevModal");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !mounted) return null;

  const modal = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-2xl w-full max-w-[420px] p-10 sm:p-12 z-10 text-center">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
          aria-label={t("close")}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
            <Construction className="w-9 h-9 text-gray-400" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-3">{t("title")}</h2>

        <p className="text-gray-500 text-sm mb-8">
          {t("line1")}
          <br />
          {t("line2")}
        </p>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl font-medium bg-primary hover:opacity-90 transition cursor-pointer text-white"
        >
          {t("gotIt")}
        </button>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}