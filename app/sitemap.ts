import { MetadataRoute } from "next";
import { fetchAllCategoriesServer, fetchRegionsServer } from "@/lib/server-api";
import { getProductsForSitemap, getRegionCategoryCombinations } from "@/services/product.service";
import { slugPathFor } from "@/lib/categorySlug";
import { DEFAULT_REGION_SLUG } from "@/lib/region";
import { MIN_PRODUCTS_TO_INDEX } from "@/lib/seo";
import { LEGAL_DOCS } from "./[locale]/content/legal";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://biztorg.uz";
const LOCALES = ["ru", "uz"] as const;

const PRODUCTS_PER_SHARD = 20000;

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

export async function generateSitemaps() {
  const { pagination } = await getProductsForSitemap(1, PRODUCTS_PER_SHARD);
  const productShardCount = Math.max(pagination.pages, 1);

  return Array.from({ length: productShardCount + 1 }, (_, i) => ({ id: i }));
}


export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const numericId = Number(id);

  if (numericId === 0) {
    return staticEntries();
  }

  const { items } = await getProductsForSitemap(numericId, PRODUCTS_PER_SHARD);

  return items.flatMap((item) => {
    const languages = Object.fromEntries(
      LOCALES.map((l) => [l, `${SITE_URL}/${l}/obyavlenie/${item.slug}`]),
    );

    return LOCALES.map((locale) => ({
      url: `${SITE_URL}/${locale}/obyavlenie/${item.slug}`,
      lastModified: item.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: { languages },
    }));
  });
}

async function staticEntries(): Promise<MetadataRoute.Sitemap> {
  const [categories, regions] = await Promise.all([fetchAllCategoriesServer(), fetchRegionsServer()]);

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

  return entries;
}