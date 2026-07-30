"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Megaphone, MessageSquare, Building2, ChevronRight } from "lucide-react";

const QUICK_LINKS = [
  { href: "/profile/favorites", label: "Избранное", desc: "Сохранённые объявления и подписки", icon: Heart },
  { href: "/profile/listings", label: "Мои объявления", desc: "Управляйте своими товарами", icon: Megaphone },
  { href: "/profile/messages", label: "Сообщения", desc: "Переписка с покупателями и продавцами", icon: MessageSquare },
  { href: "/profile/business", label: "BizTorg для бизнеса", desc: "Магазины и инструменты продавца", icon: Building2 },
];

export default function ProfilePage() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.name) setName(parsed.name);
    } catch (err) {
      console.error("Failed to parse stored user", err);
    }
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        {name ? `С возвращением, ${name}!` : "С возвращением!"}
      </h1>
      <p className="text-gray-500 mb-8">Выберите раздел, чтобы продолжить.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {QUICK_LINKS.map(({ href, label, desc, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-start gap-4 p-5 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition group"
          >
            <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-gray-100 shrink-0">
              <Icon className="w-5 h-5 text-gray-600" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 font-semibold text-gray-800">
                {label}
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition" />
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}