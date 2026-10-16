import { cookies } from "next/headers";
import { getAdapters } from "@/lib/adapters";
import { MAX_PASSWORD, MIN_PASSWORD, PasswordAuthError } from "@/lib/adapters/password";
import { allow } from "@/lib/intake/rate-limit";
import { json } from "@/lib/shop/api";
import { EMAIL_RE, GUEST_COOKIE, safeNext } from "@/lib/shop/session";

const MESSAGES = {
  exists: "There's already an account for that email. Sign in instead, or use the email link.",
  bad_credentials: "That email and password don't match. Check them and try again.",
  weak_password: `Pick a stronger password: at least ${MIN_PASSWORD} characters, not a common one.`,
  rate_limited: "Too many tries. Wait a few minutes and try again.",
  unavailable: "Something broke on our side. It's not you. Try again in a minute.",
} as const;

/** Email + password sign-in and sign-up. Starts the session and carries the guest's cart and drafts over, like the link callback. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string; password?: string; next?: string; accepted?: boolean; signup?: boolean };
  const email = (body.email ?? "").trim().toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  if (!EMAIL_RE.test(email)) return json({ error: "That email doesn't look right. Check for typos." }, 400);
  if (body.signup && !body.accepted) return json({ error: "Tick the box to confirm you are 18 or older and agree to the Terms and Privacy Policy." }, 400);
  if (body.signup && password.length < MIN_PASSWORD) return json({ error: `Use at least ${MIN_PASSWORD} characters for your password.`, code: "weak_password" }, 400);
  if (!password || password.length > MAX_PASSWORD) return json({ error: body.signup ? `Keep your password under ${MAX_PASSWORD + 1} characters.` : MESSAGES.bad_credentials }, 400);

  // Password guessing: per address and per IP. In memory until SEC-07; Supabase Auth also limits sign-ins on its side.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allow(`pw-ip:${ip}`, 20, 15 * 60_000) || !allow(`pw-email:${email}`, 10, 15 * 60_000)) return json({ error: MESSAGES.rate_limited, code: "rate_limited" }, 429);

  const { auth } = getAdapters();
  try {
    const user = body.signup ? await auth.signUpWithPassword(email, password, { accepted: true }) : await auth.signInWithPassword(email, password);
    const jar = await cookies();
    const guestId = jar.get(GUEST_COOKIE)?.value;
    if (guestId) {
      await auth.upgradeGuest(guestId, user.userId);
      jar.delete(GUEST_COOKIE);
    }
    return json({ signedIn: true, next: safeNext(body.next) });
  } catch (err) {
    const reason = err instanceof PasswordAuthError ? err.reason : "unavailable";
    if (reason === "unavailable") console.error("password sign-in failed", err);
    const status = reason === "rate_limited" ? 429 : reason === "unavailable" ? 500 : reason === "exists" ? 409 : reason === "bad_credentials" ? 401 : 400;
    return json({ error: MESSAGES[reason], code: reason }, status);
  }
}
