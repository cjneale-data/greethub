import { cookies } from "next/headers";
import type { AuthAdapter, Session } from "../types";
import { updateDB } from "../../shop/store";
import { GUEST_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE, safeNext, signSession, userIdForEmail, verifySession } from "../../shop/session";
import { POLICY_VERSION } from "../../shop/policies";
import { sendTemplate } from "../../shop/mail";

const site = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function ensureUser(email: string, accepted?: boolean) {
  const id = userIdForEmail(email);
  updateDB((db) => {
    if (!db.users[id]) {
      db.users[id] = { id, email: email.toLowerCase(), createdAt: new Date().toISOString(), rerolls: { left: 5, allowance: 5 } };
    }
    if (accepted && !db.users[id].acceptance) {
      db.users[id].acceptance = { termsVersion: POLICY_VERSION, privacyVersion: POLICY_VERSION, ageConfirmed: true, at: new Date().toISOString() };
    }
  });
  return id;
}

/** Local auth with no Supabase: signed cookie session, magic links stored in the local DB and written to the email outbox. */
export const fakeAuth: AuthAdapter = {
  name: "fake",

  async getSession(): Promise<Session> {
    const jar = await cookies();
    const s = verifySession(jar.get(SESSION_COOKIE)?.value);
    if (s) return { userId: s.uid, email: s.email, isGuest: false };
    return { userId: jar.get(GUEST_COOKIE)?.value || "g_anonymous", isGuest: true };
  },

  async sendMagicLink(email, redirectTo, opts) {
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
    updateDB((db) => {
      db.magicTokens[token] = { email: email.toLowerCase(), next: safeNext(redirectTo), expiresAt: Date.now() + 15 * 60 * 1000, used: false, accepted: !!opts?.accepted };
    });
    const link = `${site()}/api/auth/callback?token=${token}`;
    await sendTemplate("magicLink", { to: email, link });
    return { devLink: `/api/auth/callback?token=${token}` };
  },

  async verifyMagicLink(token) {
    const t = updateDB((db) => {
      const rec = db.magicTokens[token];
      if (!rec || rec.used || rec.expiresAt < Date.now()) return null;
      rec.used = true;
      return { email: rec.email, next: rec.next, accepted: rec.accepted };
    });
    if (!t) return null;
    return { userId: ensureUser(t.email, t.accepted), email: t.email, next: t.next, accepted: t.accepted };
  },

  async signInWithGoogle(redirectTo, opts) {
    // Fake Google: signs in a demo Google account without leaving the site.
    const token = crypto.randomUUID().replace(/-/g, "");
    updateDB((db) => {
      db.magicTokens[token] = { email: "sam.demo@gmail.test", next: safeNext(redirectTo), expiresAt: Date.now() + 5 * 60 * 1000, used: false, accepted: !!opts?.accepted };
    });
    return { url: `/api/auth/callback?token=${token}&provider=google` };
  },

  async upgradeGuest(guestId, userId) {
    if (!guestId || guestId === userId) return;
    updateDB((db) => {
      // Cart: guest lines move to the account, merging identical lines by creation.
      const guestCart = db.carts[guestId] ?? [];
      const userCart = db.carts[userId] ?? [];
      const known = new Set(userCart.map((i) => `${i.kind}:${i.creationId}:${i.mailTo}`));
      db.carts[userId] = [...userCart, ...guestCart.filter((i) => !known.has(`${i.kind}:${i.creationId}:${i.mailTo}`))];
      delete db.carts[guestId];
      // Drafts and people carry over as they are.
      db.drafts[userId] = [...(db.drafts[userId] ?? []), ...(db.drafts[guestId] ?? [])];
      delete db.drafts[guestId];
      db.people[userId] = [...(db.people[userId] ?? []), ...(db.people[guestId] ?? [])];
      delete db.people[guestId];
    });
  },

  async startSession({ userId, email }) {
    const jar = await cookies();
    jar.set(SESSION_COOKIE, signSession(userId, email), { httpOnly: true, sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE, secure: process.env.NODE_ENV === "production" });
  },

  async signOut() {
    const jar = await cookies();
    jar.delete(SESSION_COOKIE);
  },
};
