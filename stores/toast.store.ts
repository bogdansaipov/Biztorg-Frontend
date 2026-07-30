import { create } from "zustand";

export type ToastType = "success" | "warning" | "error";

interface ToastPayload {
  title: string;
  description?: string;
  type?: ToastType;
}

interface ActiveToast {
  title: string;
  description?: string;
  type: ToastType;
  key: number;
}

interface ToastState {
  toast: ActiveToast | null;
  show: (payload: ToastPayload) => void;
}

let clearTimer: ReturnType<typeof setTimeout> | null = null;
let counter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  show: ({ title, description, type = "success" }) => {
    if (clearTimer) clearTimeout(clearTimer);
    // `key` bumps on every call (even identical back-to-back messages) so
    // the component can force its entrance animation to replay instead of
    // silently no-op'ing on an unchanged title/description.
    counter += 1;
    set({ toast: { title, description, type, key: counter } });
    clearTimer = setTimeout(() => set({ toast: null }), 2500);
  },
}));