import { afterEach, describe, expect, it, vi } from "vitest";
import nextConfig, { securityHeaders } from "../next.config";
import { allow, bucketCount } from "@/lib/intake/rate-limit";
import { isValidGuestId, newGuestId, sessionSecret, signSession, userIdForEmail, verifySession } from "@/lib/shop/session";

describe("guest id validation (SEC-01)", () => {
  it("accepts only ids we mint", () => {
    expect(isValidGuestId(newGuestId())).toBe(true);
    expect(isValidGuestId(userIdForEmail("victim@example.com"))).toBe(false);
    expect(isValidGuestId("g_anonymous")).toBe(false);
    expect(isValidGuestId("g_0123456789abcdef0")).toBe(false);
    expect(isValidGuestId(undefined)).toBe(false);
  });
});

describe("session secret in production (SEC-02)", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("refuses the public dev fallback or a short secret in production", () => {
    expect(() => sessionSecret({ NODE_ENV: "production" } as NodeJS.ProcessEnv)).toThrow();
    expect(() => sessionSecret({ NODE_ENV: "production", SESSION_SECRET: "short" } as NodeJS.ProcessEnv)).toThrow();
    expect(sessionSecret({ NODE_ENV: "production", SESSION_SECRET: "x".repeat(32) } as NodeJS.ProcessEnv)).toHaveLength(32);
    expect(sessionSecret({ NODE_ENV: "development" } as NodeJS.ProcessEnv)).toBeTruthy();
  });
  it("a cookie signed with the dev fallback is not accepted in production", () => {
    const forged = signSession("u_x", "a@b.co");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "");
    expect(verifySession(forged)).toBeNull();
    expect(() => signSession("u_x", "a@b.co")).toThrow();
  });
});

describe("in-memory limiter memory guard", () => {
  it("does not grow without bound under rotating keys", () => {
    for (let i = 0; i < 25_000; i++) allow(`flood:${i}`, 5, 60_000, 1_000);
    expect(bucketCount()).toBeLessThanOrEqual(10_000);
    expect(allow("k", 1, 60_000, 2_000)).toBe(true);
    expect(allow("k", 1, 60_000, 2_001)).toBe(false);
  });
});

describe("security headers (SEC-16)", () => {
  it("applies the baseline headers to every route", async () => {
    const rules = await nextConfig.headers!();
    expect(rules[0].source).toBe("/(.*)");
    const keys = rules[0].headers.map((h) => h.key);
    for (const k of ["Strict-Transport-Security", "X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy"]) expect(keys).toContain(k);
    expect(securityHeaders.find((h) => h.key === "Content-Security-Policy")?.value).toContain("frame-ancestors 'none'");
    expect(nextConfig.poweredByHeader).toBe(false);
  });
});
