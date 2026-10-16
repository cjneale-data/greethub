import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";
import type { AuthAdapter, Session } from "../types";
import { guestSession } from "../fake/auth";
import { docs } from "../../store";
import { ensureUser, mergeGuestInto } from "../../shop/accounts";
import { safeNext, userIdForEmail } from "../../shop/session";
import { supabaseServer } from "../../supabase/server";
import { supabaseAdmin } from "../../store/supabaseDocs";
import { PasswordAuthError, type PasswordReason } from "../password";

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
    if (error) throw new MagicLinkError(magicLinkReason(error), `Supabase magic link failed: ${error.message}`);
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

  async signUpWithPassword(email, password, opts) {
    const addr = email.trim().toLowerCase();
    // An account from local auth or an email link has no Supabase password; a sign-up must not take it over.
    if (await docs().get("users", userIdForEmail(addr))) throw new PasswordAuthError("exists");
    // Created confirmed through the admin API, so no confirmation email is needed (the built-in mailer is rate-limited).
    const { error } = await supabaseAdmin().auth.admin.createUser({ email: addr, password, email_confirm: true });
    if (error) throw new PasswordAuthError(passwordReason(error), `Supabase sign-up failed: ${error.message}`);
    const sb = await supabaseServer();
    const signIn = await sb.auth.signInWithPassword({ email: addr, password });
    if (signIn.error) throw new PasswordAuthError(passwordReason(signIn.error), `Supabase sign-in after sign-up failed: ${signIn.error.message}`);
    return { userId: await ensureUser(addr, opts?.accepted), email: addr };
  },

  async signInWithPassword(email, password) {
    const addr = email.trim().toLowerCase();
    const sb = await supabaseServer();
    const { data, error } = await sb.auth.signInWithPassword({ email: addr, password });
    if (error) throw new PasswordAuthError(passwordReason(error), `Supabase sign-in failed: ${error.message}`);
    const verified = (data.user?.email ?? addr).toLowerCase();
    return { userId: await ensureUser(verified), email: verified };
  },

  upgradeGuest: mergeGuestInto,

  async signOut() {
    const sb = await supabaseServer();
    await sb.auth.signOut();
  },
};

/** Why a sign-in email could not be sent, in terms the route can explain to the person. */
export type MagicLinkReason = "invalid_email" | "rate_limited" | "unavailable";

export class MagicLinkError extends Error {
  constructor(public reason: MagicLinkReason, message: string) {
    super(message);
  }
}

/** Supabase Auth reports a bad address as email_address_invalid (400) and its send quota as over_email_send_rate_limit (429). */
export function magicLinkReason(e: { code?: string; status?: number; message?: string }): MagicLinkReason {
  if (e.code === "email_address_invalid" || /email address .* is invalid/i.test(e.message ?? "")) return "invalid_email";
  if (e.status === 429 || e.code === "over_email_send_rate_limit" || e.code === "over_request_rate_limit" || /rate limit/i.test(e.message ?? "")) return "rate_limited";
  return "unavailable";
}

/** Supabase Auth error codes for password sign-up and sign-in. */
export function passwordReason(e: { code?: string; status?: number; message?: string }): PasswordReason {
  if (e.code === "email_exists" || e.code === "user_already_exists" || /already (been )?registered/i.test(e.message ?? "")) return "exists";
  if (e.code === "invalid_credentials" || e.code === "email_not_confirmed" || /invalid login credentials/i.test(e.message ?? "")) return "bad_credentials";
  if (e.code === "weak_password") return "weak_password";
  if (e.status === 429 || e.code === "over_request_rate_limit") return "rate_limited";
  return "unavailable";
}
