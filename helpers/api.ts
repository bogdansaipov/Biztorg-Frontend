import axios from "axios";
import { useAuthStore } from "@/stores/auth.store";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

const SESSION_EXPIRED_FLAG = "biztorg:session-expired";

let isHandlingUnauthorized = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isHandlingUnauthorized) {
      isHandlingUnauthorized = true;

      useAuthStore.getState().logout();

      if (typeof window !== "undefined") {
        sessionStorage.setItem(SESSION_EXPIRED_FLAG, "1");

        const locale = window.location.pathname.split("/")[1] === "uz" ? "uz" : "ru";
        window.location.href = `/${locale}`;
      }

      setTimeout(() => {
        isHandlingUnauthorized = false;
      }, 0);
    }

    return Promise.reject(error);
  },
);

export const SESSION_EXPIRED_STORAGE_KEY = SESSION_EXPIRED_FLAG;