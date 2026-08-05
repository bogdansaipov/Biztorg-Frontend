"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Heart,
  Megaphone,
  MessageSquare,
  Building2,
  Languages,
  FileText,
  LogOut,
} from "lucide-react";

export default function ProfileHeaderDropdown({
  onClose,
  onOpenLanguage,
  onRequestLogout,
}: {
  onClose: () => void;
  onOpenLanguage: () => void;
  onRequestLogout: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const t = useTranslations("profileDropdown");

  const locale = pathname.split("/")[1] || "ru";

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const itemClass =
    "flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-[15px] text-gray-800";

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-100 rounded-2xl overflow-hidden z-50"
    >
      <div className="py-1">
        <Link href={`/${locale}/profile/favorites`} onClick={onClose} className={itemClass}>
          <Heart className="w-4.5 h-4.5 text-gray-500" />
          {t("favorites")}
        </Link>
        <Link href={`/${locale}/profile/listings`} onClick={onClose} className={itemClass}>
          <Megaphone className="w-4.5 h-4.5 text-gray-500" />
          {t("myListings")}
        </Link>
        <Link href={`/${locale}/profile/messages`} onClick={onClose} className={itemClass}>
          <MessageSquare className="w-4.5 h-4.5 text-gray-500" />
          {t("messages")}
        </Link>
      </div>

      <div className="border-t border-gray-100 py-1">
        <Link href={`/${locale}/profile/business`} onClick={onClose} className={itemClass}>
          <Building2 className="w-4.5 h-4.5 text-gray-500" />
          {t("forBusiness")}
        </Link>
        <button
          onClick={() => {
            onClose();
            onOpenLanguage();
          }}
          className={`${itemClass} w-full cursor-pointer text-left`}
        >
          <Languages className="w-4.5 h-4.5 text-gray-500" />
          {t("changeLanguage")}
        </button>
        <Link href={`/${locale}/legal`} onClick={onClose} className={itemClass}>
          <FileText className="w-4.5 h-4.5 text-gray-500" />
          {t("rules")}
        </Link>
      </div>

      <div className="border-t border-gray-100 py-1">
        <button
          onClick={() => {
            onClose();
            onRequestLogout();
          }}
          className={`${itemClass} w-full cursor-pointer text-left`}
        >
          <LogOut className="w-4.5 h-4.5 text-gray-500" />
          {t("logout")}
        </button>
      </div>
    </div>
  );
}