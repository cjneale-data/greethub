import type { Address } from "@greethub/shared";

/**
 * Recipients and address lists for batch cards (holiday photo cards, save the dates, invitations).
 * See docs/shop/batch-orders.md and docs/products/photo-cards-and-events-plan.md section 4.4.
 *
 * These are other people's names and addresses. Keep the fields minimal, never log them, never send them to
 * analytics, and delete them with the owner's account (docs/legal/06-product-requirements.md).
 */

export type RecipientSource = "manual" | "csv" | "vcard" | "google";

/** Result of a postal check (CTO architecture section 2). "unchecked" until a validator has run. */
export type RecipientValidationStatus = "unchecked" | "valid" | "corrected" | "undeliverable";
export type AddressCheck = { status: RecipientValidationStatus; at: string; provider: string };

export type Recipient = {
  id: string;
  /** The line printed first on the envelope: "The Riveras", "Ana and Luis Rivera". Same as address.name. */
  householdName: string;
  /** The individual people in the household, as full names. Used for RSVPs and guest counts, never printed by default. */
  names: string[];
  /** Validated postal address. `address.name` always equals `householdName`. */
  address: Address;
  /** Optional, for digital save the dates and RSVP reminders. */
  email?: string;
  /** Postal check result. Absent means never checked. */
  validation?: AddressCheck;
  /** The person's own labels ("family", "work"). Lowercase, deduped, at most 10. */
  tags: string[];
  source: RecipientSource;
  createdAt: string;
  updatedAt: string;
};

export type RecipientList = {
  id: string;
  /** Owner. Same name as orders and checkouts use, so the store's owner index reads it. */
  userId: string;
  /** "Holiday 2026", "Wedding guests". */
  name: string;
  recipients: Recipient[];
  createdAt: string;
  updatedAt: string;
};

/** What a person typed, or one imported row, before validation. Every field is raw text. */
export type RecipientDraft = {
  householdName?: string;
  names?: string[];
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  email?: string;
  tags?: string[];
};

/** Phone numbers are deliberately absent: a mailed card doesn't need one (data minimization). */
export type RecipientField = "householdName" | "names" | "line1" | "line2" | "city" | "region" | "postalCode" | "country" | "email" | "tags";
export type RecipientErrors = Partial<Record<RecipientField, string>>;

/**
 * "mail": a card goes in the post to this address (mail-for-me, or printed on an envelope). PO boxes are fine.
 * "ship": a parcel goes to this address (ship-to-me box). Same rules as the shop's ship-to address: no PO boxes.
 */
export type AddressPurpose = "mail" | "ship";

export type PreviewStatus = "ok" | "error" | "duplicate" | "skipped";

export type PreviewRow = {
  /** CSV: the spreadsheet row number (header is row 1). vCard: the contact's position in the file, from 1. */
  row: number;
  status: PreviewStatus;
  /** The cleaned input, so the UI can show it and let the person fix it in place. */
  draft: RecipientDraft;
  /** Set when status is "ok" or "duplicate". */
  recipient?: Recipient;
  errors: RecipientErrors;
  /** Things we changed or guessed that the person should check ("We added a leading zero to the ZIP"). */
  warnings: string[];
  /** For duplicates: the earlier row in this file, or the recipient already on the list. */
  duplicateOf?: { row: number } | { recipientId: string };
  /** For skipped rows: why. */
  reason?: string;
};

export type ImportPreview = {
  source: "csv" | "vcard";
  rows: PreviewRow[];
  counts: { total: number; ok: number; error: number; duplicate: number; skipped: number };
  /** CSV only: which column fed each field, and the columns we ignored. */
  columns?: { mapped: Record<string, string>; ignored: string[] };
  /** Set when the whole file can't be used (no address columns, too big). Rows are empty then. */
  fatal?: string;
};

/**
 * What an order keeps: the households and addresses as they were at checkout (CTO principle 3, "freeze at
 * checkout"). Later edits to the list never change a paid order. Scrubbed when the order closes plus the reprint window.
 */
export type RecipientSnapshot = {
  listId: string;
  takenAt: string;
  recipients: Pick<Recipient, "id" | "householdName" | "address">[];
};

export type Clock = { now?: Date; newId?: () => string };
