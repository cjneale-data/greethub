import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

// A cookie jar standing in for next/headers, so the fake adapter can set its session cookie.
const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (name: string) => void jar.delete(name),
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
  }),
}));

import { fakeAuth } from "@/lib/adapters/fake/auth";
import { hashPassword, PasswordAuthError, verifyPassword } from "@/lib/adapters/password";
import { passwordReason } from "@/lib/adapters/real/supabaseAuth";
import { docs, setDocStoreForTest } from "@/lib/store";
import { deleteAccount } from "@/lib/shop/accountService";
import { ensureUser } from "@/lib/shop/accounts";
import { SESSION_COOKIE, userIdForEmail } from "@/lib/shop/session";

beforeEach(() => {
  process.env.GREETHUB_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "gh-password-"));
  setDocStoreForTest(null);
  jar.clear();
});

const reason = (p: Promise<unknown>) => p.then(() => "ok", (e) => (e instanceof PasswordAuthError ? e.reason : String(e)));

describe("password hashing", () => {
  it("verifies the right password and rejects others", async () => {
    const h = await hashPassword("correct horse");
    expect(h).not.toContain("correct horse");
    expect(await verifyPassword("correct horse", h)).toBe(true);
    expect(await verifyPassword("wrong horse", h)).toBe(false);
    expect(await verifyPassword("x", "garbage")).toBe(false);
  });
});

describe("local email + password auth", () => {
  it("signs up, signs in, and refuses a wrong password", async () => {
    const up = await fakeAuth.signUpWithPassword("Pat@Example.com", "hunter2hunter2", { accepted: true });
    expect(up).toEqual({ userId: userIdForEmail("pat@example.com"), email: "pat@example.com" });
    expect(jar.get(SESSION_COOKIE)).toBeTruthy();
    expect((await docs().get("users", up.userId))?.acceptance?.ageConfirmed).toBe(true);

    jar.clear();
    expect((await fakeAuth.signInWithPassword("pat@example.com", "hunter2hunter2")).userId).toBe(up.userId);
    expect((await fakeAuth.getSession()).isGuest).toBe(false);
    expect(await reason(fakeAuth.signInWithPassword("pat@example.com", "nope-nope"))).toBe("bad_credentials");
    expect(await reason(fakeAuth.signInWithPassword("nobody@example.com", "hunter2hunter2"))).toBe("bad_credentials");
  });

  it("will not set a password on an existing account", async () => {
    await fakeAuth.signUpWithPassword("pat@example.com", "hunter2hunter2");
    expect(await reason(fakeAuth.signUpWithPassword("pat@example.com", "another-one"))).toBe("exists");
    // Made with an email link: no password, and a sign-up must not claim it.
    await ensureUser("link@example.com", true);
    expect(await reason(fakeAuth.signUpWithPassword("link@example.com", "hunter2hunter2"))).toBe("exists");
  });

  it("deleting the account removes the password", async () => {
    const { userId } = await fakeAuth.signUpWithPassword("pat@example.com", "hunter2hunter2");
    await deleteAccount(userId);
    expect(await docs().get("credentials", userId)).toBeUndefined();
    expect(await reason(fakeAuth.signInWithPassword("pat@example.com", "hunter2hunter2"))).toBe("bad_credentials");
  });
});

describe("Supabase password errors", () => {
  it("maps Supabase Auth errors to reasons the form can explain", () => {
    expect(passwordReason({ code: "email_exists", status: 422 })).toBe("exists");
    expect(passwordReason({ status: 422, message: "A user with this email address has already been registered" })).toBe("exists");
    expect(passwordReason({ code: "invalid_credentials", status: 400 })).toBe("bad_credentials");
    expect(passwordReason({ code: "weak_password", status: 422 })).toBe("weak_password");
    expect(passwordReason({ code: "over_request_rate_limit", status: 429 })).toBe("rate_limited");
    expect(passwordReason({ status: 500, message: "Database error" })).toBe("unavailable");
  });
});
