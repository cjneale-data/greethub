import { getAdapters, type Session } from "../adapters";
import { devSigninAllowed } from "./config";

export const DEV_COOKIE = "gh_dev_session";
export const DEV_USER_ID = "dev-user-local";

/**
 * The signed-in adult behind a request. Real auth comes from the auth adapter; while that is still the guest stub,
 * a dev cookie (set by /api/book/dev-session, never in production) stands in for sign-in so the flow is testable.
 */
export async function resolveSession(cookieHeader: string | null | undefined): Promise<Session> {
  const real = await getAdapters().auth.getSession();
  if (!real.isGuest) return real;
  if (devSigninAllowed() && parseCookies(cookieHeader)[DEV_COOKIE] === "1") {
    return { userId: DEV_USER_ID, email: "dev@greethub.local", isGuest: false };
  }
  return real;
}

export function parseCookies(header: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? "").split(/;\s*/)) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i)] = decodeURIComponent(part.slice(i + 1));
  }
  return out;
}
