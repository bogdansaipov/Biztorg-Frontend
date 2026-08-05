import { api } from "@/helpers/api";
import { useAuthStore } from "@/stores/auth.store";
import { useToastStore } from "@/stores/toast.store";

export async function sendPhoneCode(phone: string): Promise<void> {
  await api.post("/auth/phone/send-code", { phone });
}

export async function verifyPhoneCode(phone: string, code: string) {
  const res = await api.post("/auth/phone/verify", { phone, code });

  useAuthStore.getState().setAuth({ user: res.data.data.user });

  return res.data.data;
}

// toastMessage is passed in by the caller rather than hardcoded here,
// since this is a plain module (not a React component) and can't call
// useTranslations() itself — whichever component invokes logoutUser()
// already has a translated string available via its own t() call.
export async function logoutUser(toastMessage: string): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch (err) {
    console.error("Logout request failed", err);
  }

  useAuthStore.getState().logout();

  useToastStore.getState().show({
    title: toastMessage,
    type: "success",
  });
}