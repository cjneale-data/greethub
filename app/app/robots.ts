import type { MetadataRoute } from "next";
import { isIndexable, siteUrl } from "@/lib/seo";

/** Production: crawl public pages, skip APIs and private pages. Every other deployment: block all crawling. */
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/internal/", "/account", "/checkout", "/cart", "/orders"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
