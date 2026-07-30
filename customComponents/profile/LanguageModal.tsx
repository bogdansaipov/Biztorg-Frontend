"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check } from "lucide-react";

const MODAL_Z_INDEX = 2147483647;

export default function LanguageModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{ zIndex: MODAL_Z_INDEX }}
    >
      <div className="absolute inset-0 bg-black/40 cursor-pointer" onClick={onClose} />

      <div className="relative bg-white rounded-2xl w-full max-w-[560px] p-8 z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Выберите язык</h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-gray-600 transition"
            aria-label="Закрыть"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-3 mb-8">
          {/* Russian — the only supported language right now, selected by
              default and not actually changeable (there's nothing else to
              switch to yet). */}
          <div className="flex items-center justify-between bg-gray-100 rounded-xl px-4.5 py-4.5">
            <span className="text-lg text-gray-800">Русский</span>
            <span className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </span>
          </div>

          {/* Uzbek — not supported yet. Visually disabled and non-
              clickable, labeled clearly rather than just hidden, so it's
              obvious it's coming rather than looking broken/missing. */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4.5 py-4.5 cursor-not-allowed opacity-60">
            <span className="text-lg text-gray-400">O'zbekcha</span>
            <span className="text-sm font-medium text-gray-400 bg-gray-200 px-3 py-1.5 rounded-full shrink-0">
              В разработке
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full cursor-pointer bg-primary hover:opacity-90 transition text-white font-normal text-lg py-3 rounded-xl"
        >
          Выбрать
        </button>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}