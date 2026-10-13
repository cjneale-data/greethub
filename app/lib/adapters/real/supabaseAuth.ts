import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";
import type { AuthAdapter, Session } from "../types";
import { guestSession } from "../fake/auth";
import { docs } from "../../store";
import { ensureUser, mergeGuestInto } from "../../shop/accounts";
import { safeNext, userIdForEmail } from "../../shop/session";
import { supabaseServer } from "../../supabase/server";

const site = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
/** Set while a Google sign-up that ticked the terms box is away at Google. */
const ACCEPT_COOKIE = "gh_accept";
const OTP_TYPES: EmailOtpType[] = ["email", "magiclink", "signup"];

const callbackUrl = (next: string) => `${site()}/api/auth/callback?next=${encodeURIComponent(safeNext(next))}`;
/** Terms acceptance waiting for the emailed link, kept server-side (the link may be opened in another browser). */
const acceptKey = (email: string) => `accept_${userIdForEmail(email).slice(2)}`;

/**
 * Supabase Auth: magic links and Google, session in Supabase's own cookies (refreshed by proxy.ts). The app's user id is
 * derived from the verified email, so accounts carry over from local auth. Guests keep the gh_guest cookie.
 */
export const supabaseAuth: AuthAdapter = {
  name: "supabase",

  async getSession(): Promise<Session> {
    const sb = await supabaseServer();
    // getClaims verifies the access token (locally with asymmetric signing keys, else against the Auth server).
    const { data } = await sb.auth.getClaims();
    const email = typeof data?.claims?.email === "string" ? data.claims.email.toLowerCase() : "";
    if (email) return { userId: userIdForEmail(email), email, isGuest: false };
    return guestSession();
  },

  async sendMagicLink(email, redirectTo, opts) {
    const addr = email.trim().toLowerCase();
    if (opts?.accepted) {
      await docs().mutate("magic_tokens", acceptKey(addr), () => ({ email: addr, next: safeNext(redirectTo), expiresAt: Date.now() + 60 * 60 * 1000, used: false, accepted: true }));
    }
    const sb = await supabaseServer();
    const { error } = await sb.auth.signInWithOtp({ email: addr, options: { emailRedirectTo: callbackUrl(redirectTo), shouldCreateUser: true } });
    if (error) throw new Error(`Supabase magic link failed: ${error.message}`);
    return {};
  },

  async verifyCallback(params) {
    const sb = await supabaseServer();
    const code = params.get("code");
    const tokenHash = params.get("token_hash");
    const type = params.get("type") as EmailOtpType | null;
    let email: string | undefined;
    if (code) {
      // PKCE: the browser that asked for the link (or went to Google) holds the verifier cookie.
      const { data, error } = await sb.auth.exchangeCodeForSession(code);
      if (error) return null;
      email = data.user?.email;
    } else if (tokenHash && type && OTP_TYPES.includes(type)) {
      // token_hash links (custom email template) work in any browser.
      const { data, error } = await sb.auth.verifyOtp({ token_hash: tokenHash, type });
      if (error) return null;
      email = data.user?.email;
    }
    if (!email) return null;
    email = email.toLowerCase();

    const jar = await cookies();
    let accepted = jar.get(ACCEPT_COOKIE)?.value === "1";
    jar.delete(ACCEPT_COOKIE);
    await docs().mutate("magic_tokens", acceptKey(email), (rec) => {
      if (rec && !rec.used && rec.expiresAt >= Date.now()) accepted = true;
      return undefined;
    });
    const userId = await ensureUser(email, accepted);
    return { userId, email, next: safeNext(params.get("next")), accepted };
  },

  async signInWithGoogle(redirectTo, opts) {
    const sb = await supabaseServer();
    const { data, error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callbackUrl(redirectTo), skipBrowserRedirect: true } });
    if (error || !data.url) throw new Error(`Supabase Google sign-in failed: ${error?.message ?? "no url"}`);
    if (opts?.accepted) {
      const jar = await cookies();
      jar.set(ACCEPT_COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 15 * 60, secure: process.env.NODE_ENV === "production" });
    }
    return { url: data.url };
  },

  upgradeGuest: mergeGuestInto,

  async signOut() {
    const sb = await supabaseServer();
    await sb.auth.signOut();
  },
};
