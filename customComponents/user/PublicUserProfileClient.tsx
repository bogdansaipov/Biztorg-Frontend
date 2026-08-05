"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { CircleUser, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Star, Megaphone, Users, ArrowLeft, DotsThreeVertical, ShareNetwork } from "@phosphor-icons/react";
import { getUserPublicProfile, getUserProducts } from "@/services/user.service";
import { followUser, unfollowUser } from "@/services/follow.service";
import { PublicUserProfile } from "@/types/responses/user-profile.response";
import { Product } from "@/types/Product";
import FavoriteProductCard from "@/customComponents/profile/FavoriteProductCard";
import FavoriteCardSkeleton from "@/customComponents/profile/FavoriteCardSkeleton";
import { useAuthStore } from "@/stores/auth.store";
import { formatJoinDate } from "@/lib/formatJoinDate";
import UserRatingsSection from "@/customComponents/profile/UserRatingsSection";

export default function PublicUserProfileClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const userId = params.id;

  const locale = pathname.split("/")[1] || "ru";
  const t = useTranslations("publicProfile");

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const currentUserId = useAuthStore((s) => s.user?.id);
  const isOwnProfile = !!currentUserId && currentUserId === userId;

  useEffect(() => {
    if (!userId) return;

    getUserPublicProfile(userId)
      .then(setProfile)
      .catch((err) => {
        console.error("Failed to load public profile", err);
        setError(t("loadError"));
      });

    getUserProducts(userId)
      .then(setProducts)
      .catch((err) => {
        console.error("Failed to load user's products", err);
        setProducts([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleFollowToggle = async () => {
    if (!profile || followLoading) return;

    setFollowLoading(true);
    const wasFollowing = profile.isFollowedByCurrentUser;

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

  const handleRateClick = () => {
    router.push(`/${locale}/user/${userId}/rate`);
  };

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">{error}</p>
      </div>
    );
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/${locale}/user/${userId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: profile?.name ?? t("profileFallbackTitle"),
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          console.error("Failed to share profile", err);
        }
      }
      return;
    }

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

  const joinDate = profile ? formatJoinDate(profile.createdAt, locale) : "";

  const productGrid =
    products === null ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <FavoriteCardSkeleton key={i} />
        ))}
      </div>
    ) : products.length === 0 ? (
      <p className="text-gray-400 text-sm py-10 text-center">
        {t("noProducts")}
      </p>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0.5">
        {products.map((p) => (
          <FavoriteProductCard key={p.id} product={p} locale={locale} />
        ))}
      </div>
    );

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* ═══════════════════════ MOBILE (< lg) ═══════════════════════ */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-white">
          <button className="cursor-pointer p-1 -ml-1" aria-label={t("back")}>
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
          <button className="cursor-pointer p-1 -mr-1" aria-label={t("more")}>
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
                  <p className="text-sm text-gray-500 mt-0.5">{t("memberSince", { date: joinDate })}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="border border-gray-200 rounded-xl p-3">
                  <Megaphone weight="fill" className="w-5 h-5 text-gray-400 mb-2" />
                  <p className="text-base font-bold text-gray-800 leading-tight">{profile.totalProducts}</p>
                  <p className="text-xs text-gray-500 leading-tight">{t("listingsLabel")}</p>
                </div>
                <div className="border border-gray-200 rounded-xl p-3">
                  <Users weight="fill" className="w-5 h-5 text-gray-400 mb-2" />
                  <p className="text-base font-bold text-gray-800 leading-tight">{profile.totalFollowers}</p>
                  <p className="text-xs text-gray-500 leading-tight">{t("followersLabel")}</p>
                </div>
                <div className="border border-gray-200 rounded-xl p-3">
                  <Star weight="fill" className="w-5 h-5 text-yellow-400 mb-2" />
                  <p className="text-base font-bold text-gray-800 leading-tight">
                    {profile.averageRating !== null ? profile.averageRating.toFixed(1) : "0.0"}
                  </p>
                  {!isOwnProfile && (
                    <button
                      onClick={handleRateClick}
                      className="flex items-center gap-0.5 text-xs text-primary cursor-pointer leading-tight"
                    >
                      {t("rate")}
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
                  {profile.isFollowedByCurrentUser ? t("unfollow") : t("follow")}
                </button>
                <button
                  onClick={handleShare}
                  className="w-12 h-12 shrink-0 rounded-xl bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center cursor-pointer"
                  aria-label={t("share")}
                >
                  <ShareNetwork weight="fill" className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </>
          )}
        </div>

        {shareCopied && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg z-50">
            {t("linkCopied")}
          </div>
        )}

        <div className="px-4 bg-white border-b border-gray-100">
          <span className="inline-block pb-3 border-b-2 border-gray-900 font-semibold text-[15px] text-gray-900">
            {t("activeTab", { count: profile ? profile.totalProducts : 0 })}
          </span>
        </div>

        <div className="px-2 pt-3 pb-4">{productGrid}</div>

        <div className="px-2 pb-6">
          <UserRatingsSection userId={userId} />
        </div>
      </div>

      {/* ═══════════════════════ DESKTOP (lg+) ═══════════════════════ */}
      <div className="hidden lg:block max-w-[1400px] mx-auto py-8 sm:py-10 px-4 sm:px-6">
        <div className="flex items-start gap-6">
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
                    <p className="text-sm text-gray-500 mt-1">{t("memberSince", { date: joinDate })}</p>
                  </div>

                  <div className="border-t border-gray-100 pt-4 mb-4 space-y-3">
                    <div className="flex items-center gap-2.5 text-gray-700">
                      <Megaphone weight="fill" className="w-5 h-5 text-gray-400 shrink-0" />
                      <span className="text-sm">{t("listingsCount", { count: profile.totalProducts })}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-gray-700">
                      <Users weight="fill" className="w-5 h-5 text-gray-400 shrink-0" />
                      <span className="text-sm">{t("followersCount", { count: profile.totalFollowers })}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-gray-700">
                        <Star weight="fill" className="w-5 h-5 text-yellow-400 shrink-0" />
                        <span className="text-sm">
                          {profile.averageRating !== null ? profile.averageRating.toFixed(1) : t("noReviews")}
                        </span>
                      </div>
                      {!isOwnProfile && (
                        <button
                          onClick={handleRateClick}
                          className="flex items-center gap-0.5 text-sm text-primary hover:opacity-80 transition cursor-pointer"
                        >
                          {t("rate")}
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
                    {profile.isFollowedByCurrentUser ? t("unfollow") : t("follow")}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">{t("listingsLabel")}</h2>
              {productGrid}
            </div>

            <UserRatingsSection userId={userId} />
          </div>
        </div>
      </div>
    </div>
  );
}