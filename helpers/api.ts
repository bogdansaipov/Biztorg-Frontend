import axios from "axios";
import { useAuthStore } from "@/stores/auth.store";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// Global 401 handling — this is what actually solves the "expired token
// silently fails" problem. Since the auth cookie is httpOnly, the frontend
// has no way to check its expiry directly; the only signal we ever get is
// the backend rejecting a request with 401. Without this interceptor,
// every component would need its own "if 401 then log out" logic (or,
// realistically, none of them would bother, and the UI would just keep
// looking logged-in while every request quietly fails). Catching it once,
// globally, means an expired/invalid token behaves exactly like a real
// logout everywhere in the app automatically.
let isHandlingUnauthorized = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isHandlingUnauthorized) {
      isHandlingUnauthorized = true;

      // Clear local user state the same way a real logout does.
      useAuthStore.getState().logout();

      // Send them to the home page, same as a real logout would.
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }

      setTimeout(() => {
        isHandlingUnauthorized = false;
      }, 0);
    }

    return Promise.reject(error);
  },
);