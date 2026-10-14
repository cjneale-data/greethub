import type { NextConfig } from "next";

/**
 * SEC-16 baseline headers on every route. No full CSP yet: it needs a report-only week first (docs/security/04).
 * frame-ancestors/X-Frame-Options: nothing embeds GreetHub pages (Stripe is a redirect). Permissions-Policy only
 * blocks script access to camera/mic/location; the photo picker (<input type=file>) is unaffected.
 */
export const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Print (resolveCardWriting) reads the handwriting TTFs from disk; public/ is served by the CDN, not bundled, so the
  // server functions need them traced in explicitly.
  outputFileTracingIncludes: { "/api/**": ["./public/fonts/handwriting/*.ttf"] },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
