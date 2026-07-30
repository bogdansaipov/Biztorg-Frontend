import { create } from "zustand";

interface FavoritesState {
  // null = not hydrated yet (still loading, or nobody's logged in) —
  // FavoriteButton falls back to each product's own isFavorited in that
  // case. Once hydrated, this Set is the actual source of truth,
  // regardless of what any individual server-rendered list said.
  ids: Set<string> | null;
  setIds: (ids: string[]) => void;
  add: (id: string) => void;
  remove: (id: string) => void;
  reset: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set) => ({
  ids: null,
  setIds: (ids) => set({ ids: new Set(ids) }),
  add: (id) =>
    set((state) => {
      const next = new Set(state.ids ?? []);
      next.add(id);
      return { ids: next };
    }),
  remove: (id) =>
    set((state) => {
      const next = new Set(state.ids ?? []);
      next.delete(id);
      return { ids: next };
    }),
  // Called on logout — otherwise the previous user's favorites would
  // linger in memory and briefly show as favorited for whoever logs in
  // next on the same tab.
  reset: () => set({ ids: null }),
}));