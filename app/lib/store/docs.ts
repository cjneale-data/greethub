import type { CartItem } from "@greethub/shared";
import type { WritingProfile } from "../writing/types";
import type { MembershipRecord } from "../membership/types";
import type { ContentReport, Draft, Order, OutboxMessage, PendingCheckout, Person, SavedAddress, UserRecord } from "../shop/types";

/**
 * Keyed document store: the persistence seam for shop records. Each collection is a table in Supabase
 * (supabase/migrations) and a map in the local JSON file. (Book projects and jobs keep their own per-file store in
 * lib/book/store until the hosted job queue exists: the detached render worker reads them from disk.) Writes go through `mutate`, which is atomic per id:
 * the local store runs it under a lock, Supabase retries on a version conflict. So `fn` may run more than once and must
 * be free of side effects other than building the next document.
 */
export type Docs = {
  users: UserRecord;
  carts: CartItem[];
  addresses: SavedAddress[];
  drafts: Draft[];
  people: Person[];
  writing: WritingProfile;
  memberships: MembershipRecord;
  checkouts: PendingCheckout;
  orders: Order;
  processed_events: { at: string };
  magic_tokens: { email: string; next: string; expiresAt: number; used: boolean; accepted?: boolean };
  delete_tokens: { userId: string; expiresAt: number };
  fake_printer_jobs: { stage: number; printer: string };
  outbox: OutboxMessage;
  content_reports: ContentReport;
};
export type Collection = keyof Docs;

/** How each collection is indexed: the owning user, and secondary lookups (`refs`). */
export const INDEX: { [C in Collection]: (doc: Docs[C], id: string) => { owner?: string; refs?: string[] } } = {
  users: (_d, id) => ({ owner: id }),
  carts: (_d, id) => ({ owner: id }),
  addresses: (_d, id) => ({ owner: id }),
  drafts: (_d, id) => ({ owner: id }),
  people: (_d, id) => ({ owner: id }),
  writing: (_d, id) => ({ owner: id }),
  // refs: the Stripe customer and subscription ids, so webhooks find the member.
  memberships: (d, id) => ({ owner: id, refs: [d.stripeCustomerId ?? "", d.stripeSubscriptionId ?? ""].filter(Boolean) }),
  checkouts: (d) => ({ owner: d.userId, refs: d.sessionId ? [d.sessionId] : [] }),
  orders: (d) => ({ owner: d.userId, refs: [d.stripeSessionId, ...d.items.map((i) => i.fulfillment?.externalId ?? "")].filter(Boolean) }),
  processed_events: () => ({}),
  magic_tokens: (d) => ({ owner: d.email }),
  delete_tokens: (d) => ({ owner: d.userId }),
  fake_printer_jobs: () => ({}),
  outbox: () => ({}),
  content_reports: () => ({}),
};

export interface DocStore {
  readonly name: "file" | "supabase";
  get<C extends Collection>(c: C, id: string): Promise<Docs[C] | undefined>;
  /** Rows owned by a user, or carrying a ref. Unordered. */
  find<C extends Collection>(c: C, q: { owner: string } | { ref: string }): Promise<Docs[C][]>;
  /** Every row. Admin views and audits only. */
  all<C extends Collection>(c: C): Promise<Docs[C][]>;
  /** Atomic read-modify-write of one row. Return the next document, or undefined to delete it. Returns what was written. */
  mutate<C extends Collection>(c: C, id: string, fn: (cur: Docs[C] | undefined) => Docs[C] | undefined): Promise<Docs[C] | undefined>;
  /** Writes only if the id is free. True when this call created it (idempotency claims). */
  insertIfAbsent<C extends Collection>(c: C, id: string, doc: Docs[C]): Promise<boolean>;
  remove(c: Collection, id: string): Promise<void>;
  /** Deletes every row a user (or email, for magic-link tokens) owns. */
  removeByOwner(c: Collection, owner: string): Promise<void>;
}
