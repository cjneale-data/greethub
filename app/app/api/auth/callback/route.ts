import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdapters } from "@/lib/adapters";
import { originOf } from "@/lib/shop/api";
import { GUEST_COOKIE } from "@/lib/shop/session";

/** Magic-link and Google landing. Verifies the link, starts the session and carries the guest's cart and drafts over. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = originOf(req);
  const { auth } = getAdapters();
  const user = await auth.verifyCallback(url.searchParams);
  if (!user) return NextResponse.redirect(new URL("/login?error=expired", origin));
  const jar = await cookies();
  const guestId = jar.get(GUEST_COOKIE)?.value;
  if (guestId) {
    await auth.upgradeGuest(guestId, user.userId);
    jar.delete(GUEST_COOKIE);
  }
  const dest = new URL(user.next, origin);
  dest.searchParams.set("signedin", "1");
  return NextResponse.redirect(dest);
}
