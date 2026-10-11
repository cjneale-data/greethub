import { allow } from "@/lib/intake/rate-limit";
import { REPORT_RESPONSE_HOURS, ReportSchema, createReport } from "@/lib/safety/reports";
import { json } from "@/lib/shop/api";

/** Public report form. No account needed. */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allow(`report:${ip}`, 8, 10 * 60_000)) return json({ error: "Too many reports from this connection. Email report@greethub.example instead." }, 429);
  const parsed = ReportSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0] ?? "form"), i.message]));
    return json({ error: "Please check the highlighted answers.", fields }, 422);
  }
  if (parsed.data.website) return json({ ok: true, id: "rep_ok", hours: REPORT_RESPONSE_HOURS }); // honeypot: pretend success
  const r = await createReport(parsed.data);
  return json({ ok: true, id: r.id, hours: REPORT_RESPONSE_HOURS });
}
