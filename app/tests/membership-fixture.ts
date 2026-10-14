import { docs } from "@/lib/store";
import type { MembershipRecord } from "@/lib/membership/types";

/** Makes `userId` an active member of `tier` for the next 30 days (no Stripe involved). */
export async function makeMember(userId: string, tier = "plus", over: Partial<MembershipRecord> = {}) {
  const rec: MembershipRecord = {
    userId,
    tier,
    interval: "month",
    status: "active",
    currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    cancelAtPeriodEnd: false,
    usage: { period: "", counts: {} },
    history: [],
    updatedAt: new Date().toISOString(),
    ...over,
  };
  await docs().mutate("memberships", userId, () => rec);
  return rec;
}
