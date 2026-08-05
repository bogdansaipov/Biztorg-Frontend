import { AuthState } from "@/types/authState/authState";
import { create } from "zustand";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  hydrated: false,

  setAuth: ({ user }) => {
    localStorage.setItem("user", JSON.stringify(user));
    set({ user });
  },

  // Single place to patch the current user (e.g. after a name change) —
  // keeps localStorage and the store in lockstep so no other component
  // ever needs to touch localStorage["user"] by hand again.
  updateUser: (partial) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...partial };
    localStorage.setItem("user", JSON.stringify(updated));
    set({ user: updated });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null });
  },

  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("user");
      set({ user: raw ? JSON.parse(raw) : null, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
}));