"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Lock, X } from "lucide-react";
import { getUserPublicProfile, updateMyProfile } from "@/services/user.service";
import { useAuthStore } from "@/stores/auth.store";

function formatUzPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("998")) digits = digits.slice(3);
  digits = digits.slice(0, 9);

  const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean);

  return `+998${parts.length ? " " + parts.join(" ") : ""}`;
}

export default function EditProfilePage() {
  const router = useRouter();
  const t = useTranslations("editProfile");

  const userId = useAuthStore((s) => s.user?.id);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    getUserPublicProfile(userId)
      .then((profile) => {
        setName(profile.name);
        setPhone(formatUzPhone(profile.phone ?? ""));
      })
      .catch((err) => {
        console.error("Failed to load profile for editing", err);
        setError(t("loadError"));
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleSave = async () => {
    if (saving) return;

    setSaving(true);
    setError(null);
    try {
      const updated = await updateMyProfile({ name: name.trim() });
      updateUser({ name: updated.name });
      router.back();
    } catch (err) {
      console.error("Failed to update profile", err);
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
        <button onClick={() => router.back()} className="cursor-pointer p-1 -ml-1" aria-label={t("back")}>
          <ArrowLeft className="w-6 h-6 text-gray-800" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{t("title")}</h1>
      </div>

      <div className="max-w-[480px] mx-auto px-4 py-6">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-100 rounded-2xl" />
            <div className="h-16 bg-gray-100 rounded-2xl" />
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-2">{t("yourName")}</p>
            <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-4 py-3.5 mb-6">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                className="flex-1 min-w-0 outline-none text-base text-gray-900"
              />
              {name && (
                <button
                  onClick={() => setName("")}
                  className="cursor-pointer text-gray-400 hover:text-gray-600 shrink-0"
                  aria-label={t("clear")}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <p className="text-sm text-gray-500 mb-2">{t("yourPhone")}</p>
            <div className="flex items-center bg-gray-100 border border-gray-200 rounded-2xl px-4 py-3.5 mb-6 cursor-not-allowed">
              <input
                value={phone}
                disabled
                readOnly
                className="flex-1 min-w-0 outline-none text-base text-gray-500 bg-transparent cursor-not-allowed"
              />
              <Lock className="w-4.5 h-4.5 text-gray-400 shrink-0" />
            </div>

            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="w-full py-3.5 rounded-xl font-medium text-white bg-primary hover:opacity-90 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? t("saving") : t("save")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}