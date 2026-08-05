"use client";

import { useEffect } from "react";
import { getMyFavorites } from "@/services/favorite.service";
import { useFavoritesStore } from "@/stores/favorites.store";
import { useAuthStore } from "@/stores/auth.store";

export default function FavoritesHydrator() {
  const setIds = useFavoritesStore((s) => s.setIds);

  // Depending on user (not just running once on mount) means this
  // re-fires the moment someone logs in mid-session — e.g. via the
  // LoginModal, which doesn't reload the page — instead of only ever
  // hydrating favorites on a fresh page load.
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) {
      // Logged out (or never logged in) — nothing to hydrate. Also
      // clears out whatever the previous user's favorites were, so a
      // second person on the same device/browser doesn't briefly see
      // someone else's hearts filled in before anything else updates.
      setIds(new Set());
      return;
    }

    getMyFavorites()
      .then((products) => setIds(products.map((p) => p.id)))
      .catch((err) => console.error("Failed to hydrate favorites", err));
  }, [user, setIds]);

  return null;
}