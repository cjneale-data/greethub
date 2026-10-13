import { cookies } from "next/headers";
import type { AuthAdapter, Session } from "../types";
import { docs } from "../../store";
import { ensureUser, mergeGuestInto } from "../../shop/accounts";
import { GUEST_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE, isValidGuestId, safeNext, signSession, verifySession } from "../../shop/session";
import { fakeAllowed } from "../../shop/policies";
import { sendTemplate } from "../../shop/mail";

const site = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/** The anonymous guest behind a request (both auth providers share the gh_guest cookie). */
export async function guestSession(): Promise<Session> {
  const guest = (await cookies()).get(GUEST_COOKIE)?.value;
  return { userId: isValidGuestId(guest) ? guest : "g_anonymous", isGuest: true };
}

/** Local auth with no Supabase: signed cookie session, magic links stored in the local DB and written to the email outbox. */
export const fakeAuth: AuthAdapter = {
  name: "fake",

  async getSession(): Promise<Session> {
    const jar = await cookies();
    const s = verifySession(jar.get(SESSION_COOKIE)?.value);
    if (s) return { userId: s.uid, email: s.email, isGuest: false };
    return guestSession();
  },

  async sendMagicLink(email, redirectTo, opts) {
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
    await docs().insertIfAbsent("magic_tokens", token, { email: email.toLowerCase(), next: safeNext(redirectTo), expiresAt: Date.now() + 15 * 60 * 1000, used: false, accepted: !!opts?.accepted });
    const link = `${site()}/api/auth/callback?token=${token}`;
    await sendTemplate("magicLink", { to: email, link });
    return { devLink: `/api/auth/callback?token=${token}` };
  },

  async verifyCallback(params) {
    const token = params.get("token");
    if (!token) return null;
    let t: { email: string; next: string; accepted?: boolean } | null = null;
    await docs().mutate("magic_tokens", token, (rec) => {
      t = rec && !rec.used && rec.expiresAt >= Date.now() ? { email: rec.email, next: rec.next, accepted: rec.accepted } : null;
      return rec && (t ? { ...rec, used: true } : rec);
    });
    const ok = t as { email: string; next: string; accepted?: boolean } | null;
    if (!ok) return null;
    const userId = await ensureUser(ok.email, ok.accepted);
    const jar = await cookies();
    jar.set(SESSION_COOKIE, signSession(userId, ok.email), { httpOnly: true, sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE, secure: process.env.NODE_ENV === "production" });
    return { userId, email: ok.email, next: ok.next, accepted: ok.accepted };
  },

  async signInWithGoogle(redirectTo, opts) {
    // Fake Google: signs in a shared demo account without leaving the site. Never in production (SEC-03).
    if (!fakeAllowed()) throw new Error("Google sign-in is not configured");
    const token = crypto.randomUUID().replace(/-/g, "");
    await docs().insertIfAbsent("magic_tokens", token, { email: "sam.demo@gmail.test", next: safeNext(redirectTo), expiresAt: Date.now() + 5 * 60 * 1000, used: false, accepted: !!opts?.accepted });
    return { url: `/api/auth/callback?token=${token}&provider=google` };
  },

  upgradeGuest: mergeGuestInto,

  async signOut() {
    const jar = await cookies();
    jar.delete(SESSION_COOKIE);
  },
};
