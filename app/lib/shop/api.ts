import { cookies } from "next/headers";
import { getAdapters, type Session } from "../adapters";
import { GUEST_COOKIE, SESSION_MAX_AGE, newGuestId } from "./session";
import { getUser } from "./accountService";

export const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export const NOT_SIGNED_IN = { error: "Sign in to see this.", code: "not_signed_in" } as const;

/** Session for a route handler. Guests without a cookie get one here, so their cart has a home. */
export async function actor(): Promise<Session> {
  const s = await getAdapters().auth.getSession();
  if (s.isGuest && s.userId === "g_anonymous") {
    const id = newGuestId();
    const jar = await cookies();
    jar.set(GUEST_COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE, secure: process.env.NODE_ENV === "production" });
    return { userId: id, isGuest: true };
  }
  return s;
}

/** Signed-in user or null. Use for everything that is locked for guests. */
export async function signedIn(): Promise<{ userId: string; email: string; firstName?: string } | null> {
  const s = await getAdapters().auth.getSession();
  if (s.isGuest || !s.email) return null;
  return { userId: s.userId, email: s.email, firstName: getUser(s.userId)?.firstName };
}

export function originOf(req: Request): string {
  const h = req.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") || host?.startsWith("127.") ? "http" : "https");
  return host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

/** Fake payments, printer stepping and the dev outbox are for local and explicitly enabled previews only. Real money never flows through them. */
export const fakeAllowed = () => process.env.NODE_ENV !== "production" || process.env.GREETHUB_ALLOW_FAKE === "1";
