import { NextResponse } from "next/server";
import { devSigninAllowed, isMockMode } from "@/lib/book/config";
import { REROLL_ALLOWANCE, SHEET_FREE_REDOS } from "@/lib/book/constants";
import { resolveSession } from "@/lib/book/session";
import { noStore } from "../_lib/handler";

/** Who is asking, and which mode the book flow is in. Safe for guests. */
export async function GET(req: Request) {
  const s = await resolveSession(req.headers.get("cookie"));
  return NextResponse.json(
    { signedIn: !s.isGuest, email: s.email ?? null, mock: isMockMode(), devSignin: devSigninAllowed(), rerollAllowance: REROLL_ALLOWANCE, sheetFreeRedos: SHEET_FREE_REDOS },
    { headers: noStore },
  );
}
