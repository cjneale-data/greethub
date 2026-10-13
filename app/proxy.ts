import { NextResponse, type NextRequest } from "next/server";
import { hasEnv } from "./lib/env";
import { supabaseForCookies } from "./lib/supabase/server";

/**
 * Optimistic gate (Next 16 "proxy", formerly middleware): signed-out visitors are sent to sign-in for account, orders and checkout.
 * Real authorization happens in each API route via the auth adapter; this only checks that a session cookie exists.
 * With Supabase Auth on, it also refreshes the Supabase session cookies (server components can't write cookies).
 * Also hands every new visitor an anonymous guest id so a cart or draft has a home before sign-up (carried over on sign-in).
 */
const PROTECTED = ["/account", "/orders", "/checkout"];
const OPEN = ["/account/delete/confirm"];

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  let res = NextResponse.next();
  let signedIn = !!req.cookies.get("gh_session")?.value;
  if (hasEnv("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY")) {
    const sb = supabaseForCookies({
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) req.cookies.set(name, value);
        res = NextResponse.next({ request: req });
        for (const { name, value, options } of list) res.cookies.set(name, value, options);
      },
    });
    const { data } = await sb.auth.getClaims();
    signedIn = typeof data?.claims?.email === "string" && !!data.claims.email;
  }
  const gated = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/")) && !OPEN.some((p) => pathname.startsWith(p));
  if (gated && !signedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}&reason=signin`;
    return NextResponse.redirect(url);
  }
  if (!signedIn && !req.cookies.get("gh_guest")?.value) {
    res.cookies.set("gh_guest", "g_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === "production",
    });
  }
  return res;
}

export const config = {
  matcher: ["/((?!api|_next/|\\.well-known|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico|css|js|map|txt)$).*)"],
};
