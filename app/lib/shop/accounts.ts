import { docs } from "../store";
import { adoptGuestStockCreations } from "../stock/store";
import { POLICY_VERSION } from "./policies";
import { isValidGuestId, userIdForEmail } from "./session";

/**
 * Account bookkeeping shared by every auth provider. The app's user id comes from the email (userIdForEmail), not from
 * the provider, so switching from local auth to Supabase Auth keeps the same accounts, orders and carts.
 */
export async function ensureUser(email: string, accepted?: boolean): Promise<string> {
  const id = userIdForEmail(email);
  const now = new Date().toISOString();
  await docs().mutate("users", id, (u) => {
    const user = u ?? { id, email: email.toLowerCase(), createdAt: now, rerolls: { left: 5, allowance: 5 } };
    if (accepted && !user.acceptance) user.acceptance = { termsVersion: POLICY_VERSION, privacyVersion: POLICY_VERSION, ageConfirmed: true, at: now };
    return user;
  });
  return id;
}

/** Carries the guest's cart, drafts and people over to the account after sign-in. */
export async function mergeGuestInto(guestId: string, userId: string): Promise<void> {
  if (!isValidGuestId(guestId) || guestId === userId) return;
  const store = docs();
  await adoptGuestStockCreations(guestId, userId);
  // Cart: guest lines move to the account, merging identical lines by creation.
  const guestCart = await store.get("carts", guestId);
  if (guestCart?.length) {
    await store.mutate("carts", userId, (cur) => {
      const userCart = cur ?? [];
      const known = new Set(userCart.map((i) => `${i.kind}:${i.creationId}:${i.mailTo}`));
      return [...userCart, ...guestCart.filter((i) => !known.has(`${i.kind}:${i.creationId}:${i.mailTo}`))];
    });
  }
  // Drafts and people carry over as they are.
  for (const c of ["drafts", "people"] as const) {
    const guest = await store.get(c, guestId);
    if (guest?.length) {
      await store.mutate(c, userId, (cur) => {
        const have = new Set((cur ?? []).map((x) => x.id));
        return [...(cur ?? []), ...guest.filter((x) => !have.has(x.id))] as typeof guest;
      });
    }
  }
  await Promise.all((["carts", "drafts", "people"] as const).map((c) => store.remove(c, guestId)));
}
