"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { CircleUser, X } from "lucide-react";

export default function LogoutConfirmModal({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  const t = useTranslations("logoutConfirmModal");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !mounted) return null;

  const modal = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-2xl w-full max-w-[460px] p-10 sm:p-12 z-10 text-center">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
          aria-label={t("close")}
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-8">{t("title")}</h2>

        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
            <CircleUser className="w-13 h-13 text-gray-300" />
          </div>
        </div>

        <p className="text-gray-500 text-base mb-10">
          {t("line1")}
          <br />
          {t("line2")}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl font-medium bg-gray-100 hover:bg-gray-200 transition cursor-pointer text-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {t("cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl font-medium bg-primary hover:opacity-90 transition cursor-pointer text-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? t("loggingOut") : t("confirm")}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}