import { describe, expect, it } from "vitest";
import { NO_PIN, pageMetadata } from "@/lib/seo";
import { isValidCode, pinterestSaveUrl, trackedLink } from "@/lib/social";

const env = { NEXT_PUBLIC_SITE_URL: "https://greethub.example" };

describe("social links", () => {
  it("tags organic social links with source, medium and campaign", () => {
    const u = new URL(trackedLink("/create/card", { channel: "pinterest", campaign: "xmas-2026", content: "pin-07" }, env));
    expect(u.origin + u.pathname).toBe("https://greethub.example/create/card");
    expect(Object.fromEntries(u.searchParams)).toEqual({
      utm_source: "pinterest",
      utm_medium: "social",
      utm_campaign: "xmas-2026",
      utm_content: "pin-07",
    });
  });

  it("creator links carry the partner code as ref and source", () => {
    const u = new URL(trackedLink("/", { channel: "creator", campaign: "seed-2026q4", ref: "cozy-shelf" }, env));
    expect(u.searchParams.get("ref")).toBe("cozy-shelf");
    expect(u.searchParams.get("utm_source")).toBe("cozy-shelf");
    expect(u.searchParams.get("utm_medium")).toBe("affiliate");
  });

  it("refuses codes that are not plain slugs", () => {
    expect(isValidCode("ok-code1")).toBe(true);
    expect(isValidCode("Has Space")).toBe(false);
    expect(isValidCode("a")).toBe(false);
    expect(() => trackedLink("/", { channel: "creator", campaign: "x y" }, env)).toThrow();
    expect(() => trackedLink("https://evil.example", { channel: "email", campaign: "abc" }, env)).toThrow();
  });

  it("builds a Pinterest save URL without loading their script", () => {
    const u = new URL(pinterestSaveUrl("https://greethub.example/browse", "https://greethub.example/opengraph-image", "Cards"));
    expect(u.hostname).toBe("www.pinterest.com");
    expect(u.searchParams.get("media")).toBe("https://greethub.example/opengraph-image");
  });

  it("private and creator pages are marked nopin", () => {
    expect(NO_PIN).toEqual({ pinterest: "nopin" });
    expect(pageMetadata({ title: "t", description: "d", path: "/create/book", noPin: true }).other).toEqual(NO_PIN);
    expect(pageMetadata({ title: "t", description: "d", path: "/pricing" }).other).toBeUndefined();
  });
});
