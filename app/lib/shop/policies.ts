/** Version tag of the Terms and Privacy Policy drafts in docs/legal/05-policies-draft.md. Bump when the wording changes (re-prompts consent). */
export const POLICY_VERSION = "2026-10-draft-1";

/** Systems that hold a copy of an account's data. Shown on the delete flow and used as the propagation checklist (docs/legal 06, req. 28). */
export const DELETION_VENDORS = [
  { name: "GreetHub database", how: "Removed when you confirm." },
  { name: "Private photo storage (Supabase)", how: "Photos purged with the account." },
  { name: "Email (Resend)", how: "Contact record removed; sent-mail logs expire on their own schedule." },
  { name: "Payments (Stripe)", how: "Kept for tax and accounting. We can't remove payment records." },
  { name: "Print shops (Lulu, Prodigi)", how: "Open orders still print and ship; names and addresses are cleared after delivery." },
] as const;
