import { MetadataRoute } from "next";
import { fetchAllCategoriesServer, fetchRegionsServer } from "@/lib/server-api";
import { getProductsForSitemap, getRegionCategoryCombinations } from "@/services/product.service";
import { slugPathFor } from "@/lib/categorySlug";
import { DEFAULT_REGION_SLUG } from "@/lib/region";
import { MIN_PRODUCTS_TO_INDEX } from "@/lib/seo";
import { LEGAL_DOCS } from "./[locale]/content/legal";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://biztorg.uz";
const LOCALES = ["ru", "uz"] as const;

// Google's sitemap spec caps a single file at 50,000 URLs. We're nowhere
// near that yet (single digits of products), so — unlike the previous
// generateSitemaps()-based sharded version — this single-file sitemap is
// intentionally NOT split into multiple id-based files. That sharding
// mechanism hit a Next.js 16 bug where the dynamic route's `id` param
// arrives as an internal Next.js request-context object instead of the
// number it's typed as, breaking every shard unconditionally regardless of
// Turbopack/webpack. Once product count approaches five figures, re-introduce
// sharding (check Next.js changelogs first -- this may be fixed upstream by
// then).
function localizedEntry(
  pathSuffix: string,
  opts: { changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number },
): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    LOCALES.map((l) => [l, `${SITE_URL}/${l}${pathSuffix}`]),
  );

  return LOCALES.map((locale) => ({
    url: `${SITE_URL}/${locale}${pathSuffix}`,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, regions, { items: products }] = await Promise.all([
    fetchAllCategoriesServer(),
    fetchRegionsServer(),
    getProductsForSitemap(1, 20000),
  ]);

  let entries: MetadataRoute.Sitemap = [
    ...localizedEntry(`/${DEFAULT_REGION_SLUG}`, { changeFrequency: "daily", priority: 1 }),
  ];

  for (const region of regions) {
    entries = entries.concat(
      localizedEntry(`/${region.slug}`, { changeFrequency: "daily", priority: 0.6 }),
    );
  }

  for (const category of categories) {
    const path = slugPathFor(category, categories).join("/");
    entries = entries.concat(
      localizedEntry(`/${DEFAULT_REGION_SLUG}/category/${path}`, { changeFrequency: "daily", priority: 0.8 }),
    );
  }

  const combinations = await getRegionCategoryCombinations(MIN_PRODUCTS_TO_INDEX);
  for (const combo of combinations) {
    const category = categories.find((c) => c.id === combo.categoryId);
    const region = regions.find((r) => r.id === combo.regionId);
    if (!category || !region) continue;

    const path = slugPathFor(category, categories).join("/");
    entries = entries.concat(
      localizedEntry(`/${region.slug}/category/${path}`, { changeFrequency: "weekly", priority: 0.5 }),
    );
  }

  for (const slug of Object.keys(LEGAL_DOCS)) {
    entries = entries.concat(
      localizedEntry(`/legal/${slug}`, { changeFrequency: "yearly", priority: 0.2 }),
    );
  }

  for (const item of products) {
    const languages = Object.fromEntries(
      LOCALES.map((l) => [l, `${SITE_URL}/${l}/obyavlenie/${item.slug}`]),
    );
    entries = entries.concat(
      LOCALES.map((locale) => ({
        url: `${SITE_URL}/${locale}/obyavlenie/${item.slug}`,
        lastModified: item.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
        alternates: { languages },
      })),
    );
  }

  return entries;
}