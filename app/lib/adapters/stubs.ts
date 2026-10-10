import type { StorageAdapter } from "./types";

const todo = (what: string): never => {
  throw new Error(`TODO adapter not wired: ${what}. See docs/cto/setup-needed.md`);
};

/** Auth, payments, printers and email now have fake and real adapters (see ./index.ts). Only photo storage is still a stub. */
export const stubStorage: StorageAdapter = {
  async putPrivate() { return todo("Supabase Storage"); },
  async signedUrl() { return todo("Supabase Storage"); },
  async remove() { return todo("Supabase Storage"); },
};
