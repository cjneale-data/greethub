/** Stripe subscription statuses we act on (https://docs.stripe.com/api/subscriptions/object#subscription_object-status). */
export type MembershipStatus = "trialing" | "active" | "past_due" | "canceled" | "incomplete" | "incomplete_expired" | "unpaid" | "paused";

/** One document per member (id = user id). No record means the free tier. */
export type MembershipRecord = {
  /** Owner, also the document id: lets a lookup by Stripe id find the member. */
  userId: string;
  tier: string;
  interval: "month" | "year";
  status: MembershipStatus;
  /** ISO. Paid perks run to here; after a cancel they stop here. */
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  /** Monthly quotas used, reset when `period` changes (YYYY-MM, UTC). */
  usage: { period: string; counts: Record<string, number> };
  /** Last 20 changes, newest last: what support and the data export show. */
  history: { at: string; event: string; tier: string; status: MembershipStatus }[];
  updatedAt: string;
};
