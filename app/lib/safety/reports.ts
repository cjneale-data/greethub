/**
 * Report and takedown (docs/legal/06 req 22, docs/legal/07 section 8). Server only.
 * Stores the report through the shop store (the Supabase tables replace it later), emails the reporter a confirmation
 * and the team a notice through the email adapter (fake locally, Resend when configured).
 * Target: first response within 48 hours. That is a target, not a legal safe harbour.
 */
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getAdapters } from "../adapters";
import { docs } from "../store";
import { newId } from "../shop/store";
import type { ContentReport } from "../shop/types";

export const REPORT_RESPONSE_HOURS = 48;
export const reportInbox = () => process.env.REPORT_INBOX_EMAIL || "report@greethub.example";

const text = (max: number) => z.string().trim().max(max);

export const ReportSchema = z
  .object({
    kind: z.enum(["copyright", "likeness", "inappropriate", "other"]),
    what: text(2000).min(10, "Tell us a bit more about what you are reporting."),
    where: text(500).min(3, "Tell us where to find it: an order number, a link or a page."),
    depicted: text(300).default(""),
    contactEmail: z.string().trim().email("That email doesn't look right.").max(200),
    goodFaith: z.boolean().default(false),
    signature: text(120).default(""),
    /** Honeypot: real people leave it empty. */
    website: text(200).optional(),
  })
  .superRefine((r, ctx) => {
    if (r.kind === "copyright") {
      if (!r.goodFaith) ctx.addIssue({ code: "custom", path: ["goodFaith"], message: "A copyright notice needs the good-faith statement ticked." });
      if (r.signature.length < 2) ctx.addIssue({ code: "custom", path: ["signature"], message: "Type your full name as a signature." });
    }
  });
export type ReportInput = z.infer<typeof ReportSchema>;

export async function createReport(input: ReportInput, now = new Date()): Promise<ContentReport> {
  const report: ContentReport = {
    id: newId("rep"),
    createdAt: now.toISOString(),
    kind: input.kind,
    what: input.what,
    where: input.where,
    depicted: input.depicted,
    contactEmail: input.contactEmail,
    goodFaith: input.goodFaith,
    signature: input.signature,
    status: "new",
    dueAt: new Date(now.getTime() + REPORT_RESPONSE_HOURS * 3_600_000).toISOString(),
  };
  await docs().insertIfAbsent("content_reports", report.id, report);
  const email = getAdapters().email;
  await email.send({
    to: report.contactEmail,
    subject: "We got your report",
    text: `Thanks. We received your report (reference ${report.id}).\n\nWe aim to reply within ${REPORT_RESPONSE_HOURS} hours. If it is urgent, for example a photo of you or your child that should not be here, reply to this email and say so.\n\nGreetHub`,
    tag: "report_confirmation",
  });
  await email.send({
    to: reportInbox(),
    subject: `[${report.kind}] content report ${report.id} (due ${report.dueAt.slice(0, 16)}Z)`,
    text: `Kind: ${report.kind}\nWhere: ${report.where}\nWho is depicted: ${report.depicted || "-"}\nContact: ${report.contactEmail}\nGood-faith statement ticked: ${report.goodFaith}\nSignature: ${report.signature || "-"}\n\n${report.what}`,
    tag: "report_notice",
  });
  return report;
}

export const listReports = async (): Promise<ContentReport[]> => (await docs().all("content_reports")).reverse();

/** Changes a report's status and appends an audit entry (time, from, to, the reviewer's reason). Never rewrites history. */
export async function setReportStatus(id: string, status: ContentReport["status"], note = "", now = new Date()): Promise<boolean> {
  const r = await docs().mutate("content_reports", id, (r) => {
    if (!r) return r;
    (r.history ??= []).push({ at: now.toISOString(), from: r.status, to: status, note: note.trim().slice(0, 500) });
    r.status = status;
    return r;
  });
  return !!r;
}

/** Open (new or in review) and past the response target. */
export const reportOverdue = (r: ContentReport, now = new Date()): boolean =>
  (r.status === "new" || r.status === "in_review") && Date.parse(r.dueAt) < now.getTime();

/** Admin gate: open in local dev; any production build (Vercel previews included, even with GREETHUB_ALLOW_FAKE=1)
 *  needs GREETHUB_ADMIN_TOKEN in the x-admin-token header. Reports hold reporters' emails and descriptions of children. */
export function adminAllowed(headers: Headers): boolean {
  const token = process.env.GREETHUB_ADMIN_TOKEN;
  const given = headers.get("x-admin-token");
  if (token && given) {
    const a = createHash("sha256").update(given).digest();
    const b = createHash("sha256").update(token).digest();
    if (timingSafeEqual(a, b)) return true;
  }
  return process.env.NODE_ENV !== "production";
}
