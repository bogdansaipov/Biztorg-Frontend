import { MetadataRoute } from "next";
import { fetchAllCategoriesServer, fetchRegionsServer } from "@/lib/server-api";
import { getProductsForSitemap, getRegionCategoryCombinations } from "@/services/product.service";
import { slugPathFor } from "@/lib/categorySlug";
import { DEFAULT_REGION_SLUG } from "@/lib/region";
import { MIN_PRODUCTS_TO_INDEX } from "@/lib/seo";
import { LEGAL_DOCS } from "./[locale]/content/legal";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://biztorg.uz";
const LOCALE = "ru"; // only supported locale right now — see app/[locale]/layout.tsx

// Matches the backend's own default/max for this endpoint (see
// SitemapProductsQueryDto) — a single sitemap.xml file has a hard 50,000
// URL ceiling per the sitemap protocol, and Next enforces that too, so
// this stays comfortably under it.
const PRODUCTS_PER_SHARD = 40000;

// generateSitemaps() splits this file into multiple served sitemaps,
// each identified by `id` and requested by Next as /sitemap/{id}.xml —
// with /sitemap.xml itself automatically becoming the index that lists
// all of them. id 0 is reserved for the static/structural content
// (home, region homepages, category pages, legal docs — small and fixed
// in size); every id after that is one batch of PRODUCTS_PER_SHARD
// product URLs, sized however many shards the current catalog actually
// needs.
export async function generateSitemaps() {
  const { pagination } = await getProductsForSitemap(1, PRODUCTS_PER_SHARD);
  const productShardCount = Math.max(pagination.pages, 1);

  return Array.from({ length: productShardCount + 1 }, (_, i) => ({ id: i }));
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  if (id === 0) {
    return staticEntries();
  }

  // Shard ids 1, 2, 3... map to backend pages 1, 2, 3... one-to-one —
  // id 0 is already claimed by the static shard above, so this offset is
  // exactly right, not off-by-one.
  const { items } = await getProductsForSitemap(id, PRODUCTS_PER_SHARD);

  return items.map((item) => ({
    url: `${SITE_URL}/${LOCALE}/obyavlenie/${item.slug}`,
    lastModified: item.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));
}

async function staticEntries(): Promise<MetadataRoute.Sitemap> {
  const [categories, regions] = await Promise.all([fetchAllCategoriesServer(), fetchRegionsServer()]);

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/${LOCALE}/${DEFAULT_REGION_SLUG}`,
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  // Every region's own homepage — a finite, manageable list (a couple
  // hundred rows at most), unlike the category×region cross product,
  // so no inventory-threshold gating needed here.
  for (const region of regions) {
    entries.push({
      url: `${SITE_URL}/${LOCALE}/${region.slug}`,
      changeFrequency: "daily",
      priority: 0.6,
    });
  }

  // Every category, under the "all regions" view — the safe baseline
  // that's always worth indexing regardless of how thin any one
  // region's inventory for it might be.
  for (const category of categories) {
    const path = slugPathFor(category, categories).join("/");
    entries.push({
      url: `${SITE_URL}/${LOCALE}/${DEFAULT_REGION_SLUG}/category/${path}`,
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  // Region-specific category pages — NOT the full category×region cross
  // product (that would be thousands of mostly-empty pages), only the
  // combinations the backend confirms actually have enough live
  // inventory (same MIN_PRODUCTS_TO_INDEX threshold CategorySlugPage.tsx
  // uses for its own per-request noindex decision, so a page that
  // qualifies here is guaranteed to actually be indexable if crawled).
  const combinations = await getRegionCategoryCombinations(MIN_PRODUCTS_TO_INDEX);
  for (const combo of combinations) {
    const category = categories.find((c) => c.id === combo.categoryId);
    const region = regions.find((r) => r.id === combo.regionId);
    if (!category || !region) continue; // stale id from a since-deleted category/region — skip rather than emit a broken URL

    const path = slugPathFor(category, categories).join("/");
    entries.push({
      url: `${SITE_URL}/${LOCALE}/${region.slug}/category/${path}`,
      changeFrequency: "weekly",
      priority: 0.5,
    });
  }

  for (const slug of Object.keys(LEGAL_DOCS)) {
    entries.push({
      url: `${SITE_URL}/${LOCALE}/legal/${slug}`,
      changeFrequency: "yearly",
      priority: 0.2,
    });
  }

  return entries;
}