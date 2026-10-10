import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stripe webhook signature scheme (https://docs.stripe.com/webhooks#verify-manually):
 *   Stripe-Signature: t=<unix seconds>,v1=<hex hmac>[,v1=<hex hmac>...]
 *   v1 = HMAC-SHA256(secret, `${t}.${rawBody}`)
 * Events older than the tolerance (default 300s) are rejected to stop replays.
 */
export class StripeSignatureError extends Error {}

export function signStripePayload(payload: string, secret: string, timestamp: number = Math.floor(Date.now() / 1000)): string {
  const v1 = createHmac("sha256", secret).update(`${timestamp}.${payload}`, "utf8").digest("hex");
  return `t=${timestamp},v1=${v1}`;
}

export function verifyStripeSignature(rawBody: string, header: string | null | undefined, secret: string, toleranceSeconds = 300, nowSeconds: number = Math.floor(Date.now() / 1000)): void {
  if (!header) throw new StripeSignatureError("Missing Stripe-Signature header");
  if (!secret) throw new StripeSignatureError("No webhook secret configured");
  let t = 0;
  const sigs: string[] = [];
  for (const part of header.split(",")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k === "t") t = Number(v);
    else if (k === "v1") sigs.push(v);
  }
  if (!t || !Number.isFinite(t) || sigs.length === 0) throw new StripeSignatureError("Malformed Stripe-Signature header");
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`, "utf8").digest();
  const ok = sigs.some((s) => {
    if (!/^[0-9a-f]+$/i.test(s) || s.length !== expected.length * 2) return false;
    return timingSafeEqual(Buffer.from(s, "hex"), expected);
  });
  if (!ok) throw new StripeSignatureError("Signature does not match");
  if (Math.abs(nowSeconds - t) > toleranceSeconds) throw new StripeSignatureError("Timestamp outside tolerance");
}
