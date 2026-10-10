import { hasEnv } from "../env";
import { stubAuth, stubPayments, stubPrinter, stubStorage } from "./stubs";

export * from "./types";

/** Single place that decides stub vs real adapter. Real implementations land with M5/M6 once credentials exist. */
export function getAdapters() {
  return {
    auth: stubAuth, // real when hasEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")
    payments: stubPayments, // real when hasEnv("STRIPE_SECRET_KEY")
    bookPrinter: stubPrinter("lulu"),
    cardPrinter: stubPrinter("prodigi"),
    storage: stubStorage,
    live: { supabase: hasEnv("NEXT_PUBLIC_SUPABASE_URL"), stripe: hasEnv("STRIPE_SECRET_KEY") },
  };
}
