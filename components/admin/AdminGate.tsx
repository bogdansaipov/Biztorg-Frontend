"use client";

import { useEffect, useState } from "react";
import { api } from "@/helpers/api";
import { Skeleton } from "@/components/ui/skeleton";

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
      <div className="flex min-h-screen">
        <div className="hidden md:flex w-64 shrink-0 flex-col gap-3 border-r p-4">
          <Skeleton className="h-6 w-32" />
          <div className="flex flex-col gap-2 mt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-6 p-6 lg:p-8">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 @xl:grid-cols-2 @5xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}