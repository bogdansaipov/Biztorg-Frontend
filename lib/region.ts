export const DEFAULT_REGION_SLUG = "all";
export const REGION_COOKIE_NAME = "region";

// Route segments right after /{locale} that are NEVER region-scoped —
// these pages exist once per locale, not once per region (a product, a
// profile, a shop/user page, or a legal doc don't need "which city am I
// browsing" context).
export const NON_REGION_ROOTS = ["obyavlenie", "profile", "shop", "user", "legal"];

// Segments that live directly UNDER the region segment — used to detect
// "this URL is missing its region" (e.g. "/ru/category/..." or
// "/ru/search" with nothing in front of them means the region was
// omitted, so middleware knows to insert one).
export const REGION_SUB_ROUTES = ["category", "search"];

export function getRegionCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${REGION_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

// max-age of a year — same "remember my city" behavior birbir has (its
// header keeps showing your last picked region on return visits).
export function setRegionCookie(slug: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${REGION_COOKIE_NAME}=${encodeURIComponent(slug)}; path=/; max-age=${60 * 60 * 24 * 365}`;
}

// Whether a region should be filtered as an exact match (regionId — a
// real city/district) or as an ancestor match (parentRegionId — a
// whole oblast). Products in the database are always tagged with a
// specific city/district's regionId, NEVER with an oblast's own id
// directly — so filtering "Ташкентская область" by regionId alone
// would match zero products even though every product tagged "Ташкент"
// (a child of that oblast) obviously belongs to it. The backend's
// /products and /products/filter endpoints expose exactly this
// distinction as two separate query params for this reason.
export function resolveRegionFilterParams(
  region: { id: string } | null | undefined,
  allRegions: { id: string; parentId?: string | null }[],
): { regionId?: string; parentRegionId?: string } {
  if (!region) return {};
  const hasChildren = allRegions.some((r) => r.parentId === region.id);
  return hasChildren ? { parentRegionId: region.id } : { regionId: region.id };
}