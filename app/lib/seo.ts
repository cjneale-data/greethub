import type { Metadata } from "next";

/**
 * Search and sharing basics (Growth). Only the production deployment may be indexed: previews, local dev and
 * any self-hosted copy without VERCEL_ENV=production get noindex and a robots.txt that blocks everything.
 */
export function siteUrl(env: Record<string, string | undefined> = process.env): string {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

export const isIndexable = (env: Record<string, string | undefined> = process.env) => env.VERCEL_ENV === "production";

export const SITE_NAME = "GreetHub";

/** Public pages we want in search, with sitemap hints. Private, transactional and draft-legal pages stay out. */
export const INDEXABLE_PATHS: { path: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/create/card", priority: 0.9, changeFrequency: "monthly" },
  { path: "/create/book", priority: 0.9, changeFrequency: "monthly" },
  { path: "/browse", priority: 0.8, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.7, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
];

/** Per-page title, description, canonical and Open Graph text. The OG image comes from app/opengraph-image.tsx. */
// A page that sets its own openGraph replaces the root one, which drops the inherited file-based image; name it here.
const SHARE_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: "GreetHub: cards and picture books that sound like you" };

export function pageMetadata({ title, description, path, noPin = false }: { title: string; description: string; path: string; noPin?: boolean }): Metadata {
  return {
    ...(noPin ? { other: NO_PIN } : {}),
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: SITE_NAME, type: "website", locale: "en_US", images: [SHARE_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [SHARE_IMAGE] },
  };
}

/** For sign-in, account and checkout pages: never in search results. */
export const NO_INDEX: Metadata["robots"] = { index: false, follow: false };

/**
 * Pages that can show a customer's photos, previews or proofs (children's likenesses) must not be pinnable (Social).
 * Pinterest honours <meta name="pinterest" content="nopin"> for the Save button and browser extension. Pins should
 * point at marketing and occasion pages instead.
 */
export const NO_PIN = { pinterest: "nopin" } as const;
