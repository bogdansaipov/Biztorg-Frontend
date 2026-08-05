import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://biztorg.uz";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api",
          "/*/profile", // private account area, behind auth anyway — no reason to let it be crawled
          "/*/obyavlenie/create", // the posting form, not a real content page
          "/*/search", // duplicate of category content — already noindex per-page too, this just saves crawl budget outright
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}