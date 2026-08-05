// A region-specific category page (or region×category combo considered
// for the sitemap) needs at least this many live products before it's
// treated as worth indexing — used by both CategorySlugPage.tsx's
// per-request noindex check and sitemap.ts's decision about which
// region-specific category pages to list at all. Kept in one place so
// the two can never quietly drift apart from each other.
export const MIN_PRODUCTS_TO_INDEX = 3;