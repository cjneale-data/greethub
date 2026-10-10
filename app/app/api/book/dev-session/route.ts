import { NextResponse } from "next/server";
import { devSigninAllowed } from "@/lib/book/config";
import { DEV_COOKIE } from "@/lib/book/session";
import { noStore } from "../_lib/handler";

/** Local stand-in for sign-in while the auth adapter is the guest stub. Disabled in production. */
export async function POST() {
  if (!devSigninAllowed()) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const res = NextResponse.json({ ok: true }, { headers: noStore });
  res.cookies.set(DEV_COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true }, { headers: noStore });
  res.cookies.delete(DEV_COOKIE);
  return res;
}
