import { createHmac, createHash, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "gh_session";
export const GUEST_COOKIE = "gh_guest";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * SEC-02 (part): the dev fallback secret is public in source, so production refuses to sign or accept sessions without a
 * real SESSION_SECRET of 32+ characters. Fails closed: sign-in errors, existing cookies read as signed-out.
 */
export function sessionSecret(env: NodeJS.ProcessEnv = process.env): string {
  const s = env.SESSION_SECRET;
  if (env.NODE_ENV === "production" && (!s || s.length < 32)) throw new Error("SESSION_SECRET (32+ chars) is required in production. See docs/LAUNCH-CHECKLIST.md");
  return s || "greethub-local-dev-session-secret";
}
const secret = () => sessionSecret();

type Payload = { uid: string; email: string; exp: number };

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64url");
const mac = (body: string) => createHmac("sha256", secret()).update(body).digest("base64url");

/** Signed cookie for the local fake auth provider: base64url(json).hmac */
export function signSession(uid: string, email: string, now = Date.now()): string {
  const body = b64(JSON.stringify({ uid, email, exp: now + SESSION_MAX_AGE * 1000 } satisfies Payload));
  return `${body}.${mac(body)}`;
}

export function verifySession(value: string | undefined | null, now = Date.now()): { uid: string; email: string } | null {
  if (!value) return null;
  const [body, sig] = value.split(".");
  if (!body || !sig) return null;
  let expected: Buffer;
  try {
    expected = Buffer.from(mac(body));
  } catch {
    return null;
  }
  const got = Buffer.from(sig);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Payload;
    if (!p.uid || !p.email || p.exp < now) return null;
    return { uid: p.uid, email: p.email };
  } catch {
    return null;
  }
}

/** A user id that is stable per email, so signing in again finds the same account. */
export function userIdForEmail(email: string): string {
  return "u_" + createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 14);
}

export const isGuestId = (id: string) => id.startsWith("g_");
/** SEC-01: only ids we mint are accepted from the gh_guest cookie, so a cookie set to a user id ("u_...") can't act as that user. */
export const isValidGuestId = (id: string | null | undefined): id is string => !!id && /^g_[0-9a-f]{16}$/.test(id);
export const newGuestId = () => "g_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Only same-site relative paths may be used as a post-login redirect. */
export function safeNext(next: string | null | undefined, fallback = "/account"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
