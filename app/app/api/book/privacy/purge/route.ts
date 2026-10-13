import { NextResponse } from "next/server";
import { auditPhotoRetention, cronAuthorized, purgeExpiredPhotos } from "@/lib/book/privacy";
import { fail, getDeps, noStore } from "../../_lib/handler";

/**
 * Daily 90-day photo purge (legal req 25). Vercel Cron calls GET with `Authorization: Bearer $CRON_SECRET`;
 * POST with `x-cron-secret` still works for other schedulers. Open in local dev only. Reading the request
 * headers keeps this GET dynamic under Cache Components.
 */
async function purge(req: Request) {
  try {
    if (!cronAuthorized(req.headers)) return NextResponse.json({ error: "forbidden" }, { status: 403, headers: noStore });
    const d = getDeps();
    const result = await purgeExpiredPhotos(d);
    // Verify right after the purge (docs/privacy-ops/02): counts only, never ids or names in the response or log.
    const v = await auditPhotoRetention(d);
    const verify = { overdue: v.overdue.length, keptByBoxC: v.keptByBoxC.reduce((n, x) => n + x.photos, 0), orphanFiles: v.orphanFiles.length };
    if (verify.overdue || verify.orphanFiles) console.error("photo purge verification failed", verify);
    return NextResponse.json({ ...result, verify }, { headers: noStore });
  } catch (e) {
    return fail(e);
  }
}

export const GET = purge;
export const POST = purge;
