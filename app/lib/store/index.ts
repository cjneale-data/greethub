import { hasEnv } from "../env";
import { fileDocStore } from "../shop/store";
import type { DocStore } from "./docs";
import { supabaseDocStore } from "./supabaseDocs";

export * from "./docs";

/** Supabase holds the data once its URL and service-role key are set; otherwise the local JSON file does. */
export const supabaseConfigured = () => hasEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY");

let cached: DocStore | null = null;

export function docs(): DocStore {
  cached ??= supabaseConfigured() ? supabaseDocStore() : fileDocStore;
  return cached;
}

/** For tests: swap the store (null goes back to the env-based choice). */
export function setDocStoreForTest(store: DocStore | null) {
  cached = store;
}
