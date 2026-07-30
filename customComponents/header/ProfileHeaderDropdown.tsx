"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Megaphone,
  MessageSquare,
  Building2,
  Languages,
  FileText,
  LogOut,
} from "lucide-react";
import { logoutUser } from "@/services/auth.service";

export default function ProfileHeaderDropdown({
  onClose,
  onOpenLanguage,
}: {
  onClose: () => void;
  onOpenLanguage: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // Click-outside-to-close, standard dropdown pattern.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const handleLogout = async () => {
    onClose();
    await logoutUser();
    router.push("/");
  };

  const itemClass =
    "flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-[15px] text-gray-800";

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-100 rounded-2xl overflow-hidden z-50"
    >
      <div className="py-1">
        <Link href="/profile/favorites" onClick={onClose} className={itemClass}>
          <Heart className="w-4.5 h-4.5 text-gray-500" />
          Избранное
        </Link>
        <Link href="/profile/listings" onClick={onClose} className={itemClass}>
          <Megaphone className="w-4.5 h-4.5 text-gray-500" />
          Мои объявления
        </Link>
        <Link href="/profile/messages" onClick={onClose} className={itemClass}>
          <MessageSquare className="w-4.5 h-4.5 text-gray-500" />
          Сообщения
        </Link>
      </div>

      <div className="border-t border-gray-100 py-1">
        <Link href="/profile/business" onClick={onClose} className={itemClass}>
          <Building2 className="w-4.5 h-4.5 text-gray-500" />
          BizTorg для бизнеса
        </Link>
        <button
          onClick={() => {
            onClose();
            onOpenLanguage();
          }}
          className={`${itemClass} w-full cursor-pointer text-left`}
        >
          <Languages className="w-4.5 h-4.5 text-gray-500" />
          Смена языка
        </button>
        <Link href="/legal" onClick={onClose} className={itemClass}>
          <FileText className="w-4.5 h-4.5 text-gray-500" />
          Правила площадки
        </Link>
      </div>

      <div className="border-t border-gray-100 py-1">
        <button onClick={handleLogout} className={`${itemClass} w-full cursor-pointer text-left`}>
          <LogOut className="w-4.5 h-4.5 text-gray-500" />
          Выйти
        </button>
      </div>
    </div>
  );
}