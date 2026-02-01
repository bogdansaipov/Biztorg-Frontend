"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { formatUzPhone } from "@/helpers/phone";
import { cn } from "@/lib/utils";

interface User {
  name?: string | null;
  phone?: string | null;
}

export default function ProfileContactsSection({
  contactName,
  setContactName,
  contactPhone,
  setContactPhone,
  enableTelegram,
  setEnableTelegram,
}: {
  contactName: string;
  setContactName: (v: string) => void;
  contactPhone: string;
  setContactPhone: (v: string) => void;
  enableTelegram: boolean;
  setEnableTelegram: (v: boolean) => void;
}) {
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return;

    const user: User = JSON.parse(raw);

    if (user.name) {
      setContactName(user.name);
    }

   if (user.phone && contactPhone.length <= 5) {
  setContactPhone(formatUzPhone(user.phone));
}


  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");

    if (!digits.startsWith("998")) return;

    setContactPhone(formatUzPhone(digits));
  };

  return (
    <section className="bg-gray-50 rounded-xl p-9 mb-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-700">
        Данные профиля и контакты для связи
      </h2>

      <input
        value={contactName}
        onChange={(e) => setContactName(e.target.value)}
        placeholder="Имя"
        className="
          w-2/3 mb-4
          bg-gray-100 rounded-xl
          px-4 py-3 text-lg
          outline-none
        "
      />

      <input
        value={contactPhone}
        onChange={handlePhoneChange}
        className="
          w-2/3 mb-6
          bg-gray-100 rounded-xl
          px-4 py-3 text-lg
          outline-none
        "
      />

      <div className="bg-gray-100 rounded-xl p-4 mb-4">
        <div className="font-medium text-gray-800">
          Чат в BizTorg
        </div>
        <div className="text-sm text-gray-500">
          Включено по умолчанию
        </div>
      </div>

      <div
        onClick={() => setEnableTelegram(!enableTelegram)}
        className={cn(
          "flex items-center justify-between",
          "bg-gray-100 rounded-xl p-4 cursor-pointer",
          "hover:bg-gray-200 transition"
        )}
      >
        <div>
          <div className="font-medium text-gray-800">
            Чат в Telegram
          </div>
          <div className="text-sm text-gray-500">
            по номеру {contactPhone.replace(/\s/g, "")}
          </div>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={enableTelegram}
            onCheckedChange={setEnableTelegram}
            className="scale-140"
          />
        </div>
      </div>
    </section>
  );
}
