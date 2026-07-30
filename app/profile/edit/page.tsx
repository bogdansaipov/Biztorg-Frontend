"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, X } from "lucide-react";
import { getUserPublicProfile, updateMyProfile } from "@/services/user.service";
import { useAuthStore } from "@/stores/auth.store";

// Formats raw digits into "+998 90 935 45 83" — groups are 3-2-3-2-2 after
// the country code (998), matching how Uzbek mobile numbers are normally
// displayed. Only used to render the locked phone field, since the
// backend doesn't accept phone edits here.
function formatUzPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("998")) digits = digits.slice(3);
  digits = digits.slice(0, 9);

  const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean);

  return `+998${parts.length ? " " + parts.join(" ") : ""}`;
}

export default function EditProfilePage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Same localStorage read as MyListingsTab/ShopProfilePage — the auth
  // store doesn't rehydrate on a fresh page load, so this is the only
  // reliable way to get the current user's id right after navigation.
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { id?: string };
        if (parsed.id) setUserId(parsed.id);
      } catch (err) {
        console.error("Failed to parse stored user", err);
      }
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    getUserPublicProfile(userId)
      .then((profile) => {
        setName(profile.name);
        setPhone(formatUzPhone(profile.phone ?? ""));
      })
      .catch((err) => {
        console.error("Failed to load profile for editing", err);
        setError("Не удалось загрузить профиль.");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSave = async () => {
    if (saving) return;

    setSaving(true);
    setError(null);
    try {
      // PATCH /users/me only accepts { name } — phone isn't editable here,
      // so it's never sent.
      const updated = await updateMyProfile({ name: name.trim() });

      // The API call alone doesn't update anything else reading the
      // user's name — localStorage["user"] and the zustand auth store
      // both need to be pushed the new value explicitly, or the sidebar
      // (and anywhere else showing the name) keeps showing the stale one
      // even though the save itself succeeded.
      try {
        const raw = localStorage.getItem("user");
        const existing = raw ? JSON.parse(raw) : {};
        localStorage.setItem("user", JSON.stringify({ ...existing, name: updated.name }));
      } catch (err) {
        console.error("Failed to update stored user after save", err);
      }

      useAuthStore.setState((state) => (state.user ? { user: { ...state.user, name: updated.name } } : state));

      router.back();
    } catch (err) {
      console.error("Failed to update profile", err);
      setError("Не удалось сохранить изменения.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* TOP BAR */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
        <button onClick={() => router.back()} className="cursor-pointer p-1 -ml-1" aria-label="Назад">
          <ArrowLeft className="w-6 h-6 text-gray-800" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Редактирование</h1>
      </div>

      <div className="max-w-[480px] mx-auto px-4 py-6">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-100 rounded-2xl" />
            <div className="h-16 bg-gray-100 rounded-2xl" />
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-2">Ваше имя</p>
            <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-4 py-3.5 mb-6">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введите имя"
                className="flex-1 min-w-0 outline-none text-base text-gray-900"
              />
              {name && (
                <button
                  onClick={() => setName("")}
                  className="cursor-pointer text-gray-400 hover:text-gray-600 shrink-0"
                  aria-label="Очистить"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Phone — display only. The API's PATCH /users/me only
                accepts a name change, so this field is locked rather than
                editable: no onChange, disabled input, muted styling, and
                a lock icon instead of the clear button the name field
                gets. */}
            <p className="text-sm text-gray-500 mb-2">Ваш телефон</p>
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
              {saving ? "Сохранение…" : "Сохранить"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}