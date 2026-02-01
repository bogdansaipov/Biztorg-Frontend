"use client";

import { createContext, useContext, useState } from "react";
import LoginModal from "@/customComponents/Modals/LoginModal";

const AuthModalContext = createContext<{
  open: () => void;
  close: () => void;
} | null>(null);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <AuthModalContext.Provider
      value={{
        open: () => setOpen(true),
        close: () => setOpen(false),
      }}
    >
      {children}

      <LoginModal open={open} onClose={() => setOpen(false)} />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used inside AuthModalProvider");
  return ctx;
}
