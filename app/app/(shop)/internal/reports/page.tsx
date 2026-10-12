import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { adminAllowed, listReports } from "@/lib/safety/reports";

export const metadata: Metadata = { title: "Content reports (internal) | GreetHub", robots: { index: false, follow: false } };

/** Internal, admin-readable list of content reports. Same gating as /api/dev/outbox, or GREETHUB_ADMIN_TOKEN via header. */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <Reports />
    </Suspense>
  );
}

async function Reports() {
  if (!adminAllowed(await headers())) notFound();
  const reports = listReports();
  return (
    <div className="gs-page">
      <h1 className="gs-h2">Content reports</h1>
      <p className="gs-muted">Newest first. Target: first response within 48 hours. Internal use only; contains reporter contact details.</p>
      {reports.length === 0 && <p>No reports yet.</p>}
      <div className="gs-stack">
        {reports.map((r) => (
          <article key={r.id} className="gs-card" style={{ padding: 16 }} data-testid="report-row">
            <p style={{ margin: 0 }}>
              <strong>{r.kind}</strong> | {r.status} | {r.id} | {r.createdAt.slice(0, 16).replace("T", " ")}Z
               | due {r.dueAt.slice(0, 16).replace("T", " ")}Z
            </p>
            <p style={{ margin: "8px 0 0" }}>Where: {r.where}</p>
            <p style={{ margin: "4px 0 0" }}>Who is depicted: {r.depicted || "-"}</p>
            <p style={{ margin: "4px 0 0" }}>Contact: {r.contactEmail}</p>
            {r.kind === "copyright" && <p style={{ margin: "4px 0 0" }}>Good-faith statement ticked: {String(r.goodFaith)}; signature: {r.signature}</p>}
            <p style={{ margin: "8px 0 0", whiteSpace: "pre-wrap" }}>{r.what}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
