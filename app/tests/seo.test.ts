import { describe, expect, it } from "vitest";
import { INDEXABLE_PATHS, isIndexable, pageMetadata, siteUrl } from "@/lib/seo";

describe("seo helpers", () => {
  it("prefers NEXT_PUBLIC_SITE_URL, then the Vercel production host, and drops a trailing slash", () => {
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "https://greethub.example/" })).toBe("https://greethub.example");
    expect(siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "greethub.vercel.app" })).toBe("https://greethub.vercel.app");
    expect(siteUrl({})).toBe("http://localhost:3000");
  });

  it("only the production deployment is indexable", () => {
    expect(isIndexable({ VERCEL_ENV: "production" })).toBe(true);
    expect(isIndexable({ VERCEL_ENV: "preview" })).toBe(false);
    expect(isIndexable({})).toBe(false);
  });

  it("gives each page its own canonical and Open Graph url", () => {
    const m = pageMetadata({ title: "Pricing | GreetHub", description: "d", path: "/pricing" });
    expect(m.alternates?.canonical).toBe("/pricing");
    expect(m.openGraph).toMatchObject({ url: "/pricing", title: "Pricing | GreetHub" });
  });

  it("keeps private and transactional pages out of the sitemap", () => {
    const paths = INDEXABLE_PATHS.map((p) => p.path);
    for (const p of ["/cart", "/checkout", "/account", "/orders", "/login", "/signup", "/internal/reports"]) expect(paths).not.toContain(p);
  });
});
