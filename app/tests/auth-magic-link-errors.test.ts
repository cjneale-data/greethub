import { describe, expect, it } from "vitest";
import { magicLinkReason } from "@/lib/adapters/real/supabaseAuth";

describe("magic link failure reasons", () => {
  it("maps Supabase Auth errors to something the sign-up form can explain", () => {
    // Seen on production 2026-10-14: example.com addresses, then the built-in mailer's quota.
    expect(magicLinkReason({ code: "email_address_invalid", status: 400, message: 'Email address "a@example.com" is invalid' })).toBe("invalid_email");
    expect(magicLinkReason({ code: "over_email_send_rate_limit", status: 429, message: "email rate limit exceeded" })).toBe("rate_limited");
    expect(magicLinkReason({ status: 429, message: "Too many requests" })).toBe("rate_limited");
    expect(magicLinkReason({ status: 500, message: "Error sending magic link email" })).toBe("unavailable");
  });
});
