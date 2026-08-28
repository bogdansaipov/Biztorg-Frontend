import axios from "axios";
import { useAuthStore } from "@/stores/auth.store";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

const SESSION_EXPIRED_FLAG = "biztorg:session-expired";
const ADMIN_HOST_PREFIX = "admin.";

let isHandlingUnauthorized = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isHandlingUnauthorized) {
      isHandlingUnauthorized = true;

      useAuthStore.getState().logout();

      if (typeof window !== "undefined") {
        // admin.biztorg.uz has no /ru or /uz — it's a single-language
        // internal tool, not part of the public site's locale routing.
        // A 401 there (session expired, or a non-admin somehow got a
        // token that later got rejected) just kicks straight back to the
        // public site instead of trying to build a locale path that
        // doesn't resolve to anything on this host.
        if (window.location.hostname.startsWith(ADMIN_HOST_PREFIX)) {
          window.location.href = process.env.NEXT_PUBLIC_SITE_URL ?? "https://biztorg.uz";
        } else {
          sessionStorage.setItem(SESSION_EXPIRED_FLAG, "1");

          const locale = window.location.pathname.split("/")[1] === "uz" ? "uz" : "ru";
          window.location.href = `/${locale}`;
        }
      }

      setTimeout(() => {
        isHandlingUnauthorized = false;
      }, 0);
    }

    return Promise.reject(error);
  },
);

export const SESSION_EXPIRED_STORAGE_KEY = SESSION_EXPIRED_FLAG;