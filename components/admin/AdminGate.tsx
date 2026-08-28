"use client";

import { useEffect, useState } from "react";
import { api } from "@/helpers/api";

interface AdminMe {
  id: string;
  role: string;
}

// Why this has to run client-side, not as a Server Component reading
// cookies(): the auth cookie is set by api.biztorg.uz (a different host
// from admin.biztorg.uz), scoped host-only with sameSite: 'none' +
// secure: true. That combination lets the BROWSER attach it on
// cross-site requests it initiates — exactly what api.ts's axios calls
// do, direct to api.biztorg.uz. It does not mean the cookie is ever sent
// to admin.biztorg.uz itself; a cookie only rides along on requests
// targeting the domain that set it. A Server Component's cookies() only
// sees what the browser attached when requesting admin.biztorg.uz, which
// never includes an api.biztorg.uz cookie — so the check has to happen
// from the browser, same as AuthHydrator/FavoritesHydrator already do.
export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "authorized">("checking");

  useEffect(() => {
    let cancelled = false;

    api
      .get<{ data: AdminMe }>("/users/me")
      .then((res) => {
        if (cancelled) return;
        if (res.data.data.role === "ADMIN") {
          setStatus("authorized");
        } else {
          window.location.href = process.env.NEXT_PUBLIC_SITE_URL ?? "https://biztorg.uz";
        }
      })
      .catch(() => {
        if (!cancelled) {
          window.location.href = process.env.NEXT_PUBLIC_SITE_URL ?? "https://biztorg.uz";
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Загрузка…
      </div>
    );
  }

  return <>{children}</>;
}