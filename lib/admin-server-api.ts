import { cookies } from "next/headers";

// NOTE: this file must only ever be imported from Server Components/route
// handlers (it uses next/headers). Not enforced with the `server-only`
// package since that's not in package.json yet — add it
// (`pnpm add server-only`) and import it here if you want a build-time
// guard against an accidental client import.

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://api.biztorg.uz/api/v1";

// Separate from lib/server-api.ts on purpose: that helper is built for
// public, cacheable data (categories/regions/listings) with a
// next:{revalidate} window. Admin data is per-user, sensitive, and changes
// on every action (approve/reject/etc.) — this forwards the request's auth
// cookie and is never cached.
export async function adminServerGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const usp = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") usp.set(key, String(value));
    });
  }
  const qs = usp.toString();

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${API_BASE}${path}${qs ? `?${qs}` : ""}`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Admin fetch failed: ${path} (${res.status})`);
  }

  const json = await res.json();
  return json.data as T;
}

export interface AdminMe {
  id: string;
  role: string;
}

// Reuses the existing public GET /users/me (PublicUserProfileResponseDto
// already includes role) rather than needing a dedicated admin endpoint.
export async function getAdminMe(): Promise<AdminMe | null> {
  try {
    return await adminServerGet<AdminMe>("/users/me");
  } catch {
    return null;
  }
}