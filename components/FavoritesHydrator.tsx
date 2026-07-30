"use client";

import { useEffect } from "react";
import { getMyFavorites } from "@/services/favorite.service";
import { useFavoritesStore } from "@/stores/favorites.store";

export default function FavoritesHydrator() {
  const setIds = useFavoritesStore((s) => s.setIds);

  useEffect(() => {
    // No point calling this for a logged-out visitor — the endpoint needs
    // auth, and there's nothing to hydrate.
    const isLoggedIn = typeof window !== "undefined" && Boolean(localStorage.getItem("user"));
    if (!isLoggedIn) return;

    getMyFavorites()
      .then((products) => setIds(products.map((p) => p.id)))
      .catch((err) => console.error("Failed to hydrate favorites", err));
  }, [setIds]);

  return null;
}