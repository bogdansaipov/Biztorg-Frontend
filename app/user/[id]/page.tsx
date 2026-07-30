"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CircleUser, ChevronRight } from "lucide-react";
import { Star, Megaphone, Users, ArrowLeft, DotsThreeVertical, ShareNetwork } from "@phosphor-icons/react";
import { getUserPublicProfile, getUserProducts } from "@/services/user.service";
import { followUser, unfollowUser } from "@/services/follow.service";
import { PublicUserProfile } from "@/types/responses/user-profile.response";
import { Product } from "@/types/Product";
import FavoriteProductCard from "@/customComponents/profile/FavoriteProductCard";
import FavoriteCardSkeleton from "@/customComponents/profile/FavoriteCardSkeleton";
import UserRatingsSection from "@/customComponents/profile/UserRatingsSection";

export default function PublicUserProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = params.id;

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  // Current user's own id — needed to hide "Оценить" on your own profile
  // (rating yourself doesn't make sense, same reasoning as hiding
  // "Подписаться" on your own shop). Read from localStorage, same
  // pattern used elsewhere: the auth store doesn't rehydrate on a fresh
  // page load.
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { id?: string };
        if (parsed.id) setCurrentUserId(parsed.id);
      } catch (err) {
        console.error("Failed to parse stored user", err);
      }
    }
  }, []);

  const isOwnProfile = !!currentUserId && currentUserId === userId;

  useEffect(() => {
    if (!userId) return;

    getUserPublicProfile(userId)
      .then(setProfile)
      .catch((err) => {
        console.error("Failed to load public profile", err);
        setError("Не удалось загрузить профиль.");
      });

    getUserProducts(userId)
      .then(setProducts)
      .catch((err) => {
        console.error("Failed to load user's products", err);
        setProducts([]);
      });
  }, [userId]);

  const handleFollowToggle = async () => {
    if (!profile || followLoading) return;

    setFollowLoading(true);
    const wasFollowing = profile.isFollowedByCurrentUser;

    // Optimistic update — flip the UI immediately, roll back if the
    // request actually fails. Feels instant either way, matching the
    // birbir reference's snappy follow button.
    setProfile({
      ...profile,
      isFollowedByCurrentUser: !wasFollowing,
      totalFollowers: profile.totalFollowers + (wasFollowing ? -1 : 1),
    });

    try {
      if (wasFollowing) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
    } catch (err) {
      console.error("Failed to toggle follow", err);
      // Roll back on failure.
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              isFollowedByCurrentUser: wasFollowing,
              totalFollowers: prev.totalFollowers + (wasFollowing ? 1 : -1),
            }
          : prev,
      );
    } finally {
      setFollowLoading(false);
    }
  };

  // Обе кнопки "Оценить" (мобильная и десктопная) ведут на страницу
  // выбора объявления для оценки — /user/{id}/rate. Оттуда, выбрав
  // конкретный товар, попадаешь уже на саму форму отзыва.
  const handleRateClick = () => {
    router.push(`/user/${userId}/rate`);
  };

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">{error}</p>
      </div>
    );
  }

  // Ссылка строится от текущего домена (window.location.origin), а не
  // захардкожена — так на проде это будет реальный домен сайта, а не
  // dev-адрес вроде 26.192.246.1:5001.
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/user/${userId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: profile?.name ?? "Профиль на BizTorg",
          url: shareUrl,
        });
      } catch (err) {
        // Пользователь просто закрыл шторку — это не ошибка, ничего не делаем.
        if ((err as Error)?.name !== "AbortError") {
          console.error("Failed to share profile", err);
        }
      }
      return;
    }

    // navigator.clipboard существует только в secure context (https или
    // localhost) — на обычном http (например, dev-сервер по IP) объект
    // будет undefined, поэтому сначала проверяем его наличие и, если его
    // нет, копируем через старый execCommand('copy') с временным textarea.
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy profile link", err);
      }
      return;
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy profile link (fallback)", err);
    }
  };

  const joinDate = profile
    ? new Date(profile.createdAt).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  // Shared between mobile and desktop — same grid/cards either way, just
  // the surrounding chrome (white card vs. edge-to-edge) differs per
  // breakpoint below.
  const productGrid =
    products === null ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <FavoriteCardSkeleton key={i} />
        ))}
      </div>
    ) : products.length === 0 ? (
      <p className="text-gray-400 text-sm py-10 text-center">
        У этого пользователя пока нет объявлений.
      </p>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0.5">
        {products.map((p) => (
          <FavoriteProductCard key={p.id} product={p} />
        ))}
      </div>
    );

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* ═══════════════════════ MOBILE (< lg) ═══════════════════════
          Matches the birbir mobile profile: back/menu bar, avatar row,
          3-up stat cards, follow+share row, tabs, then the grid running
          edge-to-edge (no white wrapping panel like desktop). */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-white">
          <button className="cursor-pointer p-1 -ml-1" aria-label="Назад">
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
          <button className="cursor-pointer p-1 -mr-1" aria-label="Ещё">
            <DotsThreeVertical className="w-6 h-6 text-gray-800" weight="bold" />
          </button>
        </div>

        <div className="px-4 pt-2 pb-5 bg-white">
          {!profile ? (
            <div className="animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gray-200 shrink-0" />
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-gray-200 rounded" />
                  <div className="h-4 w-40 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="h-20 rounded-xl bg-gray-100" />
                <div className="h-20 rounded-xl bg-gray-100" />
                <div className="h-20 rounded-xl bg-gray-100" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <CircleUser className="w-8 h-8 text-gray-300" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">{profile.name}</h1>
                  <p className="text-sm text-gray-500 mt-0.5">На BizTorg с {joinDate}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="border border-gray-200 rounded-xl p-3">
                  <Megaphone weight="fill" className="w-5 h-5 text-gray-400 mb-2" />
                  <p className="text-base font-bold text-gray-800 leading-tight">{profile.totalProducts}</p>
                  <p className="text-xs text-gray-500 leading-tight">Объявлений</p>
                </div>
                <div className="border border-gray-200 rounded-xl p-3">
                  <Users weight="fill" className="w-5 h-5 text-gray-400 mb-2" />
                  <p className="text-base font-bold text-gray-800 leading-tight">{profile.totalFollowers}</p>
                  <p className="text-xs text-gray-500 leading-tight">Подписчиков</p>
                </div>
                <div className="border border-gray-200 rounded-xl p-3">
                  <Star weight="fill" className="w-5 h-5 text-yellow-400 mb-2" />
                  <p className="text-base font-bold text-gray-800 leading-tight">
                    {profile.averageRating !== null ? profile.averageRating.toFixed(1) : "0.0"}
                  </p>
                  {/* Скрыто, если это твой собственный профиль — оценивать
                      самого себя нет смысла, та же логика, что и с
                      "Подписаться" на своём магазине. */}
                  {!isOwnProfile && (
                    <button
                      onClick={handleRateClick}
                      className="flex items-center gap-0.5 text-xs text-primary cursor-pointer leading-tight"
                    >
                      Оценить
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`flex-1 py-3.5 rounded-xl font-medium transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                    profile.isFollowedByCurrentUser
                      ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      : "bg-primary hover:opacity-90 text-white"
                  }`}
                >
                  {profile.isFollowedByCurrentUser ? "Отписаться" : "Подписаться"}
                </button>
                <button
                  onClick={handleShare}
                  className="w-12 h-12 shrink-0 rounded-xl bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center cursor-pointer"
                  aria-label="Поделиться"
                >
                  <ShareNetwork weight="fill" className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Тост — показывается только когда сработал fallback через
            clipboard (когда navigator.share недоступен). */}
        {shareCopied && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg z-50">
            Ссылка скопирована
          </div>
        )}

        {/* TABS — Активные only, no Архив (public profile only shows what's
            actually for sale). Kept as a static label rather than a real
            tab control since there's nothing to switch to. */}
        <div className="px-4 bg-white border-b border-gray-100">
          <span className="inline-block pb-3 border-b-2 border-gray-900 font-semibold text-[15px] text-gray-900">
            Активные {profile ? profile.totalProducts : ""}
          </span>
        </div>

        <div className="px-2 pt-3 pb-4">{productGrid}</div>

        {/* RATINGS — "Отзывы о пользователе", right below the product
            grid, matching the birbir reference layout. */}
        <div className="px-2 pb-6">
          <UserRatingsSection userId={userId} />
        </div>
      </div>

      {/* ═══════════════════════ DESKTOP (lg+) ═══════════════════════ */}
      <div className="hidden lg:block max-w-[1400px] mx-auto py-8 sm:py-10 px-4 sm:px-6">
        <div className="flex items-start gap-6">
          {/* SIDEBAR — avatar, name, join date, stats, follow button */}
          <div className="w-[340px] shrink-0 sticky top-10 space-y-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              {!profile ? (
                <div className="animate-pulse space-y-4">
                  <div className="w-20 h-20 rounded-full bg-gray-200 mx-auto" />
                  <div className="h-5 w-32 bg-gray-200 rounded mx-auto" />
                  <div className="h-4 w-40 bg-gray-100 rounded mx-auto" />
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center text-center mb-4">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <CircleUser className="w-11 h-11 text-gray-300" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-800">{profile.name}</h1>
                    <p className="text-sm text-gray-500 mt-1">На BizTorg с {joinDate}</p>
                  </div>

                  <div className="border-t border-gray-100 pt-4 mb-4 space-y-3">
                    <div className="flex items-center gap-2.5 text-gray-700">
                      <Megaphone weight="fill" className="w-5 h-5 text-gray-400 shrink-0" />
                      <span className="text-sm">{profile.totalProducts} объявлений</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-gray-700">
                      <Users weight="fill" className="w-5 h-5 text-gray-400 shrink-0" />
                      <span className="text-sm">{profile.totalFollowers} подписчиков</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-gray-700">
                        <Star weight="fill" className="w-5 h-5 text-yellow-400 shrink-0" />
                        <span className="text-sm">
                          {profile.averageRating !== null ? profile.averageRating.toFixed(1) : "Нет отзывов"}
                        </span>
                      </div>
                      {/* Скрыто на своём собственном профиле. */}
                      {!isOwnProfile && (
                        <button
                          onClick={handleRateClick}
                          className="flex items-center gap-0.5 text-sm text-primary hover:opacity-80 transition cursor-pointer"
                        >
                          Оценить
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`w-full py-3 rounded-xl font-medium transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                      profile.isFollowedByCurrentUser
                        ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        : "bg-primary hover:opacity-90 text-white"
                    }`}
                  >
                    {profile.isFollowedByCurrentUser ? "Отписаться" : "Подписаться"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* CONTENT — white panel with the product grid, then the ratings
              section right below it, in the same right-hand column. */}
          <div className="flex-1 min-w-0 space-y-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Объявления</h2>
              {productGrid}
            </div>

            <UserRatingsSection userId={userId} />
          </div>
        </div>
      </div>
    </div>
  );
}