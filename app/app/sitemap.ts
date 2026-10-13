import type { MetadataRoute } from "next";
import { INDEXABLE_PATHS, siteUrl } from "@/lib/seo";

/** Public pages only. Legal pages join once their draft banners are gone; occasion pages join as they ship. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return INDEXABLE_PATHS.map(({ path, priority, changeFrequency }) => ({
    url: path === "/" ? base : `${base}${path}`,
    changeFrequency,
    priority,
  }));
}
