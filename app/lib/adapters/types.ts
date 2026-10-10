import type { Address } from "@greethub/shared";

export type Session = { userId: string; email?: string; isGuest: boolean };

export interface AuthAdapter {
  /** Current session from the request cookies, or a new anonymous guest session. */
  getSession(): Promise<Session>;
  sendMagicLink(email: string, redirectTo: string): Promise<void>;
  signInWithGoogle(redirectTo: string): Promise<{ url: string }>;
  /** Carries the guest draft over to the account after sign-up. */
  upgradeGuest(guestUserId: string, newUserId: string): Promise<void>;
}

export type CheckoutLine = { sku: string; description: string; unitAmountCents: number; quantity: number; creationId: string };
export interface PaymentsAdapter {
  createCheckoutSession(input: { userId: string; lines: CheckoutLine[]; shipTo?: Address; successUrl: string; cancelUrl: string }): Promise<{ id: string; url: string }>;
  /** Verify and parse a webhook; order creation runs on checkout.session.completed. */
  parseWebhook(rawBody: string, signature: string): Promise<{ type: string; sessionId?: string }>;
}

export type PrintJob = { orderId: string; sku: string; pdfUrls: { interior?: string; cover?: string; single?: string }; shipTo: Address; quantity: number };
export interface PrinterAdapter {
  readonly name: "lulu" | "prodigi" | "gelato";
  validateFiles(job: PrintJob): Promise<{ ok: boolean; problems: string[] }>;
  submit(job: PrintJob): Promise<{ externalId: string }>;
  status(externalId: string): Promise<{ state: string; trackingUrl?: string }>;
}

export interface StorageAdapter {
  putPrivate(path: string, data: Uint8Array, contentType: string): Promise<void>;
  signedUrl(path: string, ttlSeconds: number): Promise<string>;
  remove(path: string): Promise<void>;
}
