import { api } from "@/helpers/api";
import { useAuthStore } from "@/stores/auth.store";

export async function logoutUser(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch (err) {
    console.error("Logout request failed", err);
  }

  useAuthStore.getState().logout();
}