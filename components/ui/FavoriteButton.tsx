"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { addFavorite, removeFavorite } from "@/services/favorite.service";
import { useAuthModal } from "@/context/AuthModalContext";
import { useAuthStore } from "@/stores/auth.store";
import { useFavoritesStore } from "@/stores/favorites.store";
import { useToastStore } from "@/stores/toast.store";

interface FavoriteButtonProps {
  productId: string;
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
  const t = useTranslations("favoriteButton");

  const storeIds = useFavoritesStore((s) => s.ids);
  const storeAdd = useFavoritesStore((s) => s.add);
  const storeRemove = useFavoritesStore((s) => s.remove);

  const user = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(false);

  const isFavorited = storeIds ? storeIds.has(productId) : initialFavorited;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      open();
      return;
    }

    if (loading) return;
    setLoading(true);

    const wasFavorited = isFavorited;
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
        title: wasFavorited ? t("removed") : t("added"),
        type: "success",
      });
      onToggle?.(!wasFavorited);
    } catch (err) {
      console.error("Failed to toggle favorite", err);
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
      aria-label={isFavorited ? t("removeAria") : t("addAria")}
    >
      <Heart
        className={`w-5 h-5 transition-colors ${isFavorited ? "text-red-500" : "text-gray-600"}`}
        fill={isFavorited ? "currentColor" : "none"}
      />
    </button>
  );
}