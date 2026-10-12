import { toolError, type ToolError } from "@greethub/shared";
import { fastScreen } from "../safety/fastpass";
import type { IpField } from "../safety/types";

/**
 * Text safety for assistant-supplied free text (docs/integrations/04 and AGT-014). The assistant's model is not under our control,
 * so its text can carry links, scam requests or injected instructions. This is the cheap rules layer only (no model call);
 * the live classifier hooks in later via the same IpSafetyService used by the web creator.
 * TODO (gh-ip-safety, AGT-014): move agentPrintedTextRules next to the IP rules in lib/safety, add the 100-string adversarial corpus.
 */
const URL_RE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|co|ly|xyz|app|me|us)\b)/i;
const EMAIL_RE = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
const PHONE_RE = /(\+?\d[\d\s().-]{8,}\d)/;
const MONEY_REQUEST_RE = /\b(pay|send|wire|venmo|zelle|cash ?app|paypal|bitcoin|crypto|gift ?card|western union)\b.{0,40}(\$|usd|dollars?|\d{2,})/i;
const QR_RE = /\b(qr ?code|scan (this|the))\b/i;
const INJECTION_RE = /(ignore (all |any )?(previous|prior) instructions|disregard (the )?(above|previous)|you are now|system prompt|as an ai assistant, (send|pay|list))/i;

export function agentPrintedTextRules(text: string): { ok: true } | { ok: false; reason: "link" | "contact" | "money_request" | "qr" | "injection" } {
  if (INJECTION_RE.test(text)) return { ok: false, reason: "injection" };
  if (URL_RE.test(text)) return { ok: false, reason: "link" };
  if (EMAIL_RE.test(text) || PHONE_RE.test(text)) return { ok: false, reason: "contact" };
  if (MONEY_REQUEST_RE.test(text)) return { ok: false, reason: "money_request" };
  if (QR_RE.test(text)) return { ok: false, reason: "qr" };
  return { ok: true };
}

export type TextField = { field: IpField; text: string; printed?: boolean };
export type ScreenOutcome = { ok: true } | { ok: false; error: ToolError; injection: boolean };

export async function screenAgentText(fields: TextField[], knownNames: string[] = []): Promise<ScreenOutcome> {
  for (const f of fields) {
    if (!f.text.trim()) continue;
    const rules = agentPrintedTextRules(f.text);
    if (!rules.ok) {
      const injection = rules.reason === "injection" || rules.reason === "money_request";
      return { ok: false, injection, error: toolError("content_blocked", "That text can't go on a card. Cards can't carry links, contact details, payment requests or instructions.") };
    }
    const ip = fastScreen({ text: f.text, field: f.field, knownNames });
    if (ip.verdict === "blocked") return { ok: false, injection: false, error: toolError("content_blocked", ip.userNote || "That idea can't be drawn as written. Try describing the feeling instead.") };
  }
  return { ok: true };
}

/** Pull the free-text fields out of validated tool arguments. Everything else is structured and enum-checked by Zod. */
export function textFieldsOf(args: Record<string, unknown>): TextField[] {
  const out: TextField[] = [];
  const msg = args.message as { text?: string; memory?: string } | undefined;
  if (msg?.text) out.push({ field: "card_message", text: msg.text, printed: true });
  if (msg?.memory) out.push({ field: "card_idea", text: msg.memory });
  for (const k of ["occasionOther", "reason", "note"] as const) if (typeof args[k] === "string") out.push({ field: "brief_field", text: args[k] as string });
  const r = args.recipient as { name?: string; relationship?: string } | undefined;
  if (r?.name) out.push({ field: "brief_field", text: `${r.name} ${r.relationship ?? ""}` });
  if (typeof args.name === "string") out.push({ field: "brief_field", text: `${args.name} ${(args.relationship as string) ?? ""}` });
  return out;
}
