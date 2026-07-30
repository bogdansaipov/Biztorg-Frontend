"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { addFavorite, removeFavorite } from "@/services/favorite.service";
import { useAuthModal } from "@/context/AuthModalContext";
import { useFavoritesStore } from "@/stores/favorites.store";
import { useToastStore } from "@/stores/toast.store";

interface FavoriteButtonProps {
  productId: string;
  // Used only as a fallback before the favorites store has hydrated (or
  // for a logged-out visitor) — once the store has real data, it wins.
  // This is what fixes hearts not showing red after a reload: the store
  // is populated from a client-side, properly-authenticated request
  // (FavoritesHydrator), regardless of how any given page's product list
  // was originally fetched.
  initialFavorited?: boolean;
  className?: string;
  onToggle?: (isFavorited: boolean) => void;
}

export default function FavoriteButton({
  productId,
  initialFavorited = false,
  className = "",
  onToggle,
}: FavoriteButtonProps) {
  const { open } = useAuthModal();
  const showToast = useToastStore((s) => s.show);

  const storeIds = useFavoritesStore((s) => s.ids);
  const storeAdd = useFavoritesStore((s) => s.add);
  const storeRemove = useFavoritesStore((s) => s.remove);

  const [loading, setLoading] = useState(false);

  // Store is the source of truth once hydrated; before that (or for a
  // logged-out visitor, where it never hydrates), fall back to whatever
  // this specific product said when it was fetched.
  const isFavorited = storeIds ? storeIds.has(productId) : initialFavorited;

  const isLoggedIn = () => {
    if (typeof window === "undefined") return false;
    return Boolean(localStorage.getItem("user"));
  };

  const handleClick = async (e: React.MouseEvent) => {
    // Every call site renders this inside a <Link> card — without
    // stopping propagation, tapping the heart would also navigate to the
    // product page underneath it.
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn()) {
      open();
      return;
    }

    if (loading) return;
    setLoading(true);

    const wasFavorited = isFavorited;
    // Optimistic update on the store — every FavoriteButton for this same
    // productId anywhere on screen updates in lockstep, not just this one
    // instance.
    if (wasFavorited) {
      storeRemove(productId);
    } else {
      storeAdd(productId);
    }

    try {
      if (wasFavorited) {
        await removeFavorite(productId);
      } else {
        await addFavorite(productId);
      }
      showToast({
        title: wasFavorited ? "Удалено из избранного" : "Добавлено в избранное",
        type: "success",
      });
      onToggle?.(!wasFavorited);
    } catch (err) {
      console.error("Failed to toggle favorite", err);
      // Roll back on failure.
      if (wasFavorited) {
        storeAdd(productId);
      } else {
        storeRemove(productId);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white transition disabled:cursor-not-allowed ${className}`}
      aria-label={isFavorited ? "Убрать из избранного" : "Добавить в избранное"}
    >
      <Heart
        className={`w-5 h-5 transition-colors ${isFavorited ? "text-red-500" : "text-gray-600"}`}
        fill={isFavorited ? "currentColor" : "none"}
      />
    </button>
  );
}