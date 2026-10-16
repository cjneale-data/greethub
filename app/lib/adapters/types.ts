import type { Address } from "@greethub/shared";

export type Session = { userId: string; email?: string; isGuest: boolean };

export interface AuthAdapter {
  readonly name: "supabase" | "fake";
  /** Current session from the request cookies, or the anonymous guest session. */
  getSession(): Promise<Session>;
  /** Sends a sign-in link. The fake provider also returns the link so local dev needs no inbox. */
  sendMagicLink(email: string, redirectTo: string, opts?: { accepted?: boolean }): Promise<{ devLink?: string }>;
  /**
   * Finishes sign-in on /api/auth/callback from its query string (a local token, or Supabase's code / token_hash) and
   * starts the session. Returns null if the link is expired, used or unknown.
   */
  verifyCallback(params: URLSearchParams): Promise<{ userId: string; email: string; next: string; accepted?: boolean } | null>;
  signInWithGoogle(redirectTo: string, opts?: { accepted?: boolean }): Promise<{ url: string }>;
  /** Email + password sign-up: creates the account with no confirmation email and starts the session. Throws PasswordAuthError. */
  signUpWithPassword(email: string, password: string, opts?: { accepted?: boolean }): Promise<{ userId: string; email: string }>;
  /** Email + password sign-in; starts the session. Throws PasswordAuthError. */
  signInWithPassword(email: string, password: string): Promise<{ userId: string; email: string }>;
  /** Carries the guest draft and cart over to the account after sign-up. */
  upgradeGuest(guestUserId: string, newUserId: string): Promise<void>;
  signOut(): Promise<void>;
}

/** One line on the Stripe-hosted page. Postage and shipping surcharges are lines too (creationId empty). */
export type CheckoutLine = { sku: string; description: string; unitAmountCents: number; quantity: number; creationId?: string;
  /** Stripe product tax code (txcd_...). When set, the line is sent tax-exclusive with that code. */ taxCode?: string };

export type CheckoutSessionInput = {
  /** Our pending checkout id; echoed back in metadata and as client_reference_id. */
  checkoutId: string;
  userId: string;
  email: string;
  lines: CheckoutLine[];
  shipTo?: Address;
  successUrl: string;
  cancelUrl: string;
};

/** What the rest of the app needs from a payment webhook, independent of the provider's wire format. */
export type PaymentEvent = {
  id: string;
  type: string;
  sessionId?: string;
  checkoutId?: string;
  /** "paid" | "unpaid" | "no_payment_required" for Stripe. */
  paymentStatus?: string;
  amountTotalCents?: number;
  /** Tax the provider added on its own (Stripe automatic tax). Our cart totals do not include it. */
  amountTaxCents?: number;
  paymentIntentId?: string;
  email?: string;
};

export interface PaymentsAdapter {
  readonly name: "stripe" | "fake";
  createCheckoutSession(input: CheckoutSessionInput): Promise<{ id: string; url: string }>;
  /** Verify the signature and parse a webhook. Throws if the signature is bad. Order creation runs on checkout.session.completed. */
  parseWebhook(rawBody: string, signature: string | null): Promise<PaymentEvent>;
}

export type PrintJob = {
  orderId: string;
  /** Unique per line within the order; sent as the printer's external reference so retries do not double-print. */
  lineId: string;
  sku: string;
  title: string;
  email: string;
  pdfUrls: { interior?: string; cover?: string; single?: string };
  shipTo: Address;
  quantity: number;
  /** Shipping level requested at checkout. */
  expedited?: boolean;
};

export type PrinterStatus = { state: string; trackingUrl?: string; trackingNumber?: string; carrier?: string };

export interface PrinterAdapter {
  readonly name: "lulu" | "prodigi" | "gelato";
  readonly fake: boolean;
  validateFiles(job: PrintJob): Promise<{ ok: boolean; problems: string[] }>;
  submit(job: PrintJob): Promise<{ externalId: string }>;
  status(externalId: string): Promise<PrinterStatus>;
}

export type EmailMessage = { to: string; subject: string; text: string; html?: string; tag?: string };
export interface EmailAdapter {
  readonly name: "resend" | "fake";
  send(msg: EmailMessage): Promise<{ id: string }>;
}

export interface StorageAdapter {
  putPrivate(path: string, data: Uint8Array, contentType: string): Promise<void>;
  signedUrl(path: string, ttlSeconds: number): Promise<string>;
  remove(path: string): Promise<void>;
}
