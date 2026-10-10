import type { AuthAdapter, PaymentsAdapter, PrinterAdapter, StorageAdapter } from "./types";

const todo = (what: string): never => {
  throw new Error(`TODO adapter not wired: ${what}. See docs/cto/setup-needed.md`);
};

/** TODO(M5/M6): replace with Supabase auth (@supabase/ssr), Stripe Checkout, Lulu/Prodigi and Supabase Storage. */
export const stubAuth: AuthAdapter = {
  async getSession() { return { userId: "guest-local", isGuest: true }; },
  async sendMagicLink() { return todo("Supabase magic link"); },
  async signInWithGoogle() { return todo("Supabase Google OAuth"); },
  async upgradeGuest() { return todo("Supabase guest upgrade"); },
};

export const stubPayments: PaymentsAdapter = {
  async createCheckoutSession() { return todo("Stripe Checkout"); },
  async parseWebhook() { return todo("Stripe webhook"); },
};

export const stubPrinter = (name: PrinterAdapter["name"]): PrinterAdapter => ({
  name,
  async validateFiles() { return todo(`${name} file validation`); },
  async submit() { return todo(`${name} order submit`); },
  async status() { return todo(`${name} status`); },
});

export const stubStorage: StorageAdapter = {
  async putPrivate() { return todo("Supabase Storage"); },
  async signedUrl() { return todo("Supabase Storage"); },
  async remove() { return todo("Supabase Storage"); },
};
