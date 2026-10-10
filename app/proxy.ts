import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic gate (Next 16 "proxy", formerly middleware): signed-out visitors are sent to sign-in for account, orders and checkout.
 * Real authorization happens in each API route via the auth adapter; this only checks that a session cookie exists.
 * Also hands every new visitor an anonymous guest id so a cart or draft has a home before sign-up (carried over on sign-in).
 */
const PROTECTED = ["/account", "/orders", "/checkout"];
const OPEN = ["/account/delete/confirm"];

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const signedIn = !!req.cookies.get("gh_session")?.value;
  const gated = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/")) && !OPEN.some((p) => pathname.startsWith(p));
  if (gated && !signedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}&reason=signin`;
    return NextResponse.redirect(url);
  }
  const res = NextResponse.next();
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
  matcher: ["/((?!api|_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico|css|js|map|txt)$).*)"],
};
