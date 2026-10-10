import { hasEnv } from "../env";
import { stubStorage } from "./stubs";
import type { AuthAdapter, EmailAdapter, PaymentsAdapter, PrinterAdapter } from "./types";
import { fakeAuth } from "./fake/auth";
import { fakePayments } from "./fake/payments";
import { fakePrinter } from "./fake/printer";
import { fakeEmail } from "./fake/email";
import { stripePayments } from "./real/stripe";
import { luluPrinter } from "./real/lulu";
import { prodigiPrinter } from "./real/prodigi";
import { resendEmail } from "./real/resend";

export * from "./types";

type Adapters = {
  auth: AuthAdapter;
  payments: PaymentsAdapter;
  bookPrinter: PrinterAdapter;
  cardPrinter: PrinterAdapter;
  email: EmailAdapter;
  storage: typeof stubStorage;
  live: { supabase: boolean; stripe: boolean; lulu: boolean; prodigi: boolean; resend: boolean };
};

let cached: Adapters | null = null;

/**
 * Single place that decides fake vs real adapter. A real adapter turns on only when its credentials exist; otherwise
 * the local fake runs, so the whole site works with no keys. Auth stays fake until the Supabase adapter is written.
 */
export function getAdapters(): Adapters {
  if (cached) return cached;
  const e = process.env;
  const live = {
    supabase: false, // TODO: flip to hasEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY") once the Supabase auth adapter exists
    stripe: hasEnv("STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"),
    lulu: hasEnv("LULU_CLIENT_KEY", "LULU_CLIENT_SECRET"),
    prodigi: hasEnv("PRODIGI_API_KEY"),
    resend: hasEnv("RESEND_API_KEY"),
  };
  cached = {
    auth: fakeAuth,
    payments: live.stripe ? stripePayments(e.STRIPE_SECRET_KEY!, e.STRIPE_WEBHOOK_SECRET!) : fakePayments,
    bookPrinter: live.lulu
      ? luluPrinter({ clientKey: e.LULU_CLIENT_KEY!, clientSecret: e.LULU_CLIENT_SECRET!, apiBase: e.LULU_API_BASE || "https://api.sandbox.lulu.com", podPackageId: e.LULU_BOOK_POD_PACKAGE_ID })
      : fakePrinter("lulu"),
    cardPrinter: live.prodigi
      ? prodigiPrinter({ apiKey: e.PRODIGI_API_KEY!, apiBase: e.PRODIGI_API_BASE || "https://api.sandbox.prodigi.com/v4.0", cardSku: e.PRODIGI_CARD_SKU })
      : fakePrinter("prodigi"),
    email: live.resend ? resendEmail(e.RESEND_API_KEY!, e.EMAIL_FROM || "GreetHub <hello@example.com>") : fakeEmail,
    storage: stubStorage, // Supabase Storage lands with the photo upload work (creator engineers)
    live,
  };
  return cached;
}

/** For tests: swap adapters. */
export function setAdaptersForTest(a: Partial<Adapters> | null) {
  cached = a ? { ...getAdaptersBase(), ...a } : null;
}
function getAdaptersBase(): Adapters {
  cached = null;
  return getAdapters();
}
