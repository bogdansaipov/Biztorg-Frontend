"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DEFAULT_REGION_SLUG, NON_REGION_ROOTS, getRegionCookie } from "@/lib/region";

// Used everywhere a component needs to build a link that should carry
// today's region — the header search bar, the mega menu, breadcrumbs on
// non-region pages like the product detail page, etc. On a region-scoped
// URL ("/ru/tashkent/cat/...") it reads the region straight out of the
// path; on a non-region page ("/ru/obyavlenie/...", "/ru/profile") it
// falls back to whatever the person picked last (the cookie), same as
// how birbir keeps showing your city in the header even while you're on
// a product page.
export function useLocaleRegion() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const locale = segments[0] || "ru";
  const second = segments[1];
  const pathRegion = second && !NON_REGION_ROOTS.includes(second) ? second : null;

  // The cookie is a client-only data source — document.cookie doesn't
  // exist during SSR — so reading it synchronously in the render body
  // would make the server's render (no cookie access, always falls back
  // to "all") disagree with the client's hydration render (real cookie
  // value already available), which is exactly what was throwing
  // "Hydration failed" here. Deferring the read into an effect means the
  // very first paint (server AND client) renders identically using the
  // SSR-safe default, and only a fast follow-up render — safely after
  // hydration has already reconciled — swaps in the actually-remembered
  // region.
  const [cookieRegion, setCookieRegion] = useState<string | null>(null);
  useEffect(() => {
    if (!pathRegion) {
      setCookieRegion(getRegionCookie() ?? null);
    }
  }, [pathRegion]);

  const region = pathRegion ?? cookieRegion ?? DEFAULT_REGION_SLUG;

  return { locale, region };
}