"use client";

import { Check, TriangleAlert, X } from "lucide-react";
import { useToastStore, type ToastType } from "@/stores/toast.store";

const ICONS: Record<ToastType, typeof Check> = {
  success: Check,
  warning: TriangleAlert,
  error: X,
};

const ICON_BG: Record<ToastType, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-400",
  error: "bg-red-500",
};

export default function Toast() {
  const toast = useToastStore((s) => s.toast);

  if (!toast) return null;

  const Icon = ICONS[toast.type];

  return (
    // Horizontal centering is plain flexbox now (fixed inset-x-0 + flex
    // justify-center), not transform: translateX(-50%) — a transform-based
    // approach was momentarily visible flush-left before centering,
    // because the entrance animation below ALSO writes to `transform`
    // (for the vertical slide), and the two would race for a frame.
    // Flexbox has nothing to race with; the card is horizontally centered
    // unconditionally, and the animation only ever touches translateY.
    <div key={toast.key} className="fixed bottom-24 lg:bottom-6 inset-x-0 z-[10000] flex justify-center px-4">
      <div className="w-full max-w-[420px] flex items-center gap-3 bg-[#1c1f26] text-white rounded-xl shadow-2xl px-4 py-3.5 animate-toast-in">
        <span
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${ICON_BG[toast.type]}`}
        >
          <Icon className="w-4 h-4 text-white" strokeWidth={3} />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">{toast.title}</p>
          {toast.description && (
            <p className="text-gray-400 text-xs mt-0.5 leading-snug">{toast.description}</p>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes toast-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-toast-in {
          animation: toast-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}