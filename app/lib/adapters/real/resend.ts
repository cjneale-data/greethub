import type { EmailAdapter } from "../types";

/** Resend: POST https://api.resend.com/emails (https://resend.com/docs/api-reference/emails/send-email). Inactive without RESEND_API_KEY. */
export function resendEmail(apiKey: string, from: string, fetchImpl: typeof fetch = fetch): EmailAdapter {
  return {
    name: "resend",
    async send(msg) {
      const res = await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [msg.to],
          subject: msg.subject,
          text: msg.text,
          ...(msg.html ? { html: msg.html } : {}),
          ...(msg.tag ? { tags: [{ name: "kind", value: msg.tag.replace(/[^A-Za-z0-9_-]/g, "_") }] } : {}),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      if (!res.ok || !body.id) throw new Error(`Resend error ${res.status}: ${body.message ?? "no id returned"}`);
      return { id: body.id };
    },
  };
}
