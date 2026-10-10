import { NextResponse } from "next/server";
import { purgeExpiredPhotos } from "@/lib/book/privacy";
import { fail, getDeps, noStore } from "../../_lib/handler";

/** Daily 90-day photo purge. Cron calls it with x-cron-secret (GREETHUB_CRON_SECRET); open in local dev only. */
export async function POST(req: Request) {
  try {
    const secret = process.env.GREETHUB_CRON_SECRET;
    const ok = secret ? req.headers.get("x-cron-secret") === secret : process.env.NODE_ENV !== "production";
    if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: noStore });
    return NextResponse.json(await purgeExpiredPhotos(getDeps()), { headers: noStore });
  } catch (e) {
    return fail(e);
  }
}
