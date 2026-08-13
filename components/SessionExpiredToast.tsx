"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useToastStore } from "@/stores/toast.store";
import { SESSION_EXPIRED_STORAGE_KEY } from "@/helpers/api";

export default function SessionExpiredToast() {
  const t = useTranslations("session");
  const showToast = useToastStore((s) => s.show);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_EXPIRED_STORAGE_KEY)) {
      sessionStorage.removeItem(SESSION_EXPIRED_STORAGE_KEY);
      showToast({ title: t("expired"), type: "error" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}