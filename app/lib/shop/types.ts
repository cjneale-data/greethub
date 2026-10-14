import type { WritingProfile } from "../writing/types";
import type { Address, CartItem, ShippingMethodId, Sku } from "@greethub/shared";
import type { OrderStatus, StatusEvent } from "./orderState";

export type UserRecord = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  /** Policy acceptance at signup (docs/legal 06, req. 1 and 51). */
  acceptance?: { termsVersion: string; privacyVersion: string; ageConfirmed: boolean; at: string };
  /** Re-roll allowance shown on the profile (the creator engineers own the real counter). */
  rerolls: { left: number; allowance: number };
};

export type SavedAddress = { id: string; label: string; address: Address; isDefault: boolean };

export type Draft = {
  id: string;
  kind: "card" | "book";
  title: string;
  updatedAt: string;
  /** Partial CreationBrief, owned by the creator. */
  brief?: unknown;
  thumbnail?: string;
};

export type Person = {
  id: string;
  name: string;
  relationship: string;
  ageBand: string;
  keepPhotos: boolean;
  usedIn: number;
  createdAt: string;
};

export type Fulfillment = {
  printer: "lulu" | "prodigi" | "gelato";
  externalId: string;
  state: string;
  submittedAt: string;
  trackingUrl?: string;
  trackingNumber?: string;
  carrier?: string;
};

export type OrderItem = {
  id: string;
  creationId: string;
  kind: "card" | "book";
  sku: Sku;
  title: string;
  description: string;
  recipientName?: string;
  quantity: number;
  productCents: number;
  postageCents: number;
  printed: boolean;
  /** Where a printed item goes. Removed when the account is deleted and the order is closed. */
  shipTo?: Address;
  status: OrderStatus;
  fulfillment?: Fulfillment;
  note?: string;
};

export type OrderTotals = {
  subtotalCents: number;
  postageCents: number;
  methodCents: number;
  taxCents: number;
  totalCents: number;
};

export type Order = {
  id: string;
  userId: string;
  email: string;
  firstName?: string;
  stripeSessionId: string;
  paymentIntentId?: string;
  createdAt: string;
  status: OrderStatus;
  history: StatusEvent[];
  items: OrderItem[];
  totals: OrderTotals;
  shippingMethod: ShippingMethodId;
  deliveryDate?: string;
  /** Proof approval and policy acceptance recorded at checkout (docs/legal 06, req. 32, 39, 51). */
  consent?: { policyVersion: string; proofApproved: boolean; at: string };
  /** Account deleted: names and addresses are removed once the order is closed. */
  accountDeleted?: boolean;
  scrubbed?: boolean;
};

export type PendingCheckout = {
  id: string;
  sessionId?: string;
  userId: string;
  email: string;
  firstName?: string;
  items: CartItem[];
  /** itemId -> address, for printed items. */
  shipTo: Record<string, Address>;
  saveAddresses: { label: string; address: Address }[];
  shippingMethod: ShippingMethodId;
  deliveryDate?: string;
  totals: OrderTotals;
  createdAt: string;
  consent?: { policyVersion: string; proofApproved: boolean; at: string };
  status: "open" | "completed" | "failed" | "cancelled";
  orderId?: string;
};

export type OutboxMessage = { id: string; to: string; subject: string; text: string; sentAt: string; tag?: string };

export type ContentReport = {
  id: string;
  createdAt: string;
  kind: "copyright" | "likeness" | "inappropriate" | "other";
  what: string;
  where: string;
  depicted: string;
  contactEmail: string;
  /** Copyright claims only: the reporter ticked the good-faith statement. */
  goodFaith: boolean;
  signature: string;
  status: "new" | "in_review" | "actioned" | "closed";
  /** 48-hour response target (ISO). */
  dueAt: string;
  /** Append-only record of status changes with the reviewer's short reason (docs/trust-safety). Older rows have none. */
  history?: { at: string; from: ContentReport["status"]; to: ContentReport["status"]; note: string }[];
};

export type DB = {
  users: Record<string, UserRecord>;
  carts: Record<string, CartItem[]>;
  addresses: Record<string, SavedAddress[]>;
  drafts: Record<string, Draft[]>;
  people: Record<string, Person[]>;
  writing: Record<string, WritingProfile>;
  checkouts: Record<string, PendingCheckout>;
  orders: Record<string, Order>;
  processedEvents: string[];
  magicTokens: Record<string, { email: string; next: string; expiresAt: number; used: boolean; accepted?: boolean }>;
  deleteTokens: Record<string, { userId: string; expiresAt: number }>;
  fakePrinterJobs: Record<string, { stage: number; printer: string }>;
  outbox: OutboxMessage[];
  reports: ContentReport[];
};
