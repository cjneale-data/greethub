import { connection } from "next/server";
import { adminAllowed, listReports, setReportStatus } from "@/lib/safety/reports";
import { json } from "@/lib/shop/api";

/** Internal: list content reports (dev gating or GREETHUB_ADMIN_TOKEN). */
export async function GET(req: Request) {
  await connection();
  if (!adminAllowed(req.headers)) return json({ error: "Not available." }, 404);
  return json({ reports: listReports() });
}

export async function PATCH(req: Request) {
  await connection();
  if (!adminAllowed(req.headers)) return json({ error: "Not available." }, 404);
  const b = (await req.json().catch(() => null)) as { id?: string; status?: "new" | "in_review" | "actioned" | "closed" } | null;
  if (!b?.id || !b.status || !["new", "in_review", "actioned", "closed"].includes(b.status)) return json({ error: "bad request" }, 400);
  return json({ ok: setReportStatus(b.id, b.status) });
}
