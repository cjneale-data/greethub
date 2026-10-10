import { z } from "zod";
import { PRICING, blockedItems, computeTotals, describeItem, isPrinted, priceLine, type Address, type CartItem, type ShippingMethodId } from "@greethub/shared";
import { getAdapters, type CheckoutLine } from "../adapters";
import { earliestDeliveryDate, validateAddress, type AddressErrors } from "./address";
import { getCartItems } from "./cartService";
import { POLICY_VERSION } from "./policies";
import { newId, readDB, updateDB } from "./store";
import type { PendingCheckout } from "./types";

export const CheckoutInputSchema = z.object({
  shippingMethod: z.enum(["standard", "express"]).default("standard"),
  deliveryDate: z.iso.date().optional(),
  /** Cart item id -> address. Required for every printed item. */
  shipments: z.record(z.string(), z.unknown()).default({}),
  proofApproved: z.literal(true, { error: "Tick the box to approve the proof." }),
  saveAddresses: z.array(z.object({ label: z.string().trim().min(1).max(40), address: z.unknown() })).max(5).default([]),
});
export type CheckoutInput = z.input<typeof CheckoutInputSchema>;

export type CheckoutFailure = { ok: false; status: number; error: string; fieldErrors?: Record<string, AddressErrors>; earliest?: string };

/** Lines sent to the payment page. Built from the server's cart, never from client prices. */
export function buildCheckoutLines(items: CartItem[], method: ShippingMethodId): CheckoutLine[] {
  const lines: CheckoutLine[] = [];
  for (const it of items) {
    const p = priceLine(it);
    lines.push({ sku: p.sku, description: `${it.title} (${describeItem(it)})`, unitAmountCents: p.unitCents + p.addonCents, quantity: it.quantity, creationId: it.creationId });
    if (p.postageUnitCents > 0) lines.push({ sku: "postage", description: `Postage for ${it.title}`, unitAmountCents: p.postageUnitCents, quantity: it.quantity });
  }
  const t = computeTotals(items, method);
  if (t.methodCents > 0) lines.push({ sku: `shipping_${method}`, description: `${PRICING.shippingMethods[method].label} shipping`, unitAmountCents: t.methodCents, quantity: 1 });
  return lines;
}

export async function startCheckout(user: { userId: string; email: string }, raw: unknown, origin: string): Promise<{ ok: true; url: string; checkoutId: string } | CheckoutFailure> {
  const parsed = CheckoutInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, status: 400, error: parsed.error.issues[0]?.message ?? "Something's missing from the form." };
  const input = parsed.data;
  const items = getCartItems(user.userId);
  if (items.length === 0) return { ok: false, status: 400, error: "Nothing here yet. Start with a card or a book." };
  if (blockedItems(items).length > 0) return { ok: false, status: 409, error: "Something needs a look before it can print. Open your cart." };

  const method = input.shippingMethod as ShippingMethodId;
  if (!PRICING.shippingMethods[method]?.enabled) return { ok: false, status: 400, error: "That shipping method isn't available." };

  const fieldErrors: Record<string, AddressErrors> = {};
  const shipTo: Record<string, Address> = {};
  for (const it of items) {
    if (!isPrinted(it)) continue;
    const v = validateAddress(input.shipments[it.id]);
    if (v.ok) shipTo[it.id] = v.address;
    else fieldErrors[it.id] = v.errors;
  }
  if (Object.keys(fieldErrors).length > 0) return { ok: false, status: 422, error: "Check the highlighted fields.", fieldErrors };

  const earliest = earliestDeliveryDate();
  if (input.deliveryDate && input.deliveryDate < earliest) return { ok: false, status: 422, error: `Earliest we can do is ${earliest}.`, earliest };

  const saveAddresses: PendingCheckout["saveAddresses"] = [];
  for (const s of input.saveAddresses) {
    const v = validateAddress(s.address);
    if (v.ok) saveAddresses.push({ label: s.label, address: v.address });
  }

  const totals = computeTotals(items, method);
  const db = readDB();
  const user_ = db.users[user.userId];
  const id = newId("co");
  const pending: PendingCheckout = {
    id,
    userId: user.userId,
    email: user.email,
    firstName: user_?.firstName,
    items,
    shipTo,
    saveAddresses,
    shippingMethod: method,
    deliveryDate: input.deliveryDate,
    totals: { subtotalCents: totals.subtotalCents, postageCents: totals.postageCents, methodCents: totals.methodCents, taxCents: totals.taxCents, totalCents: totals.totalCents },
    createdAt: new Date().toISOString(),
    consent: { policyVersion: POLICY_VERSION, proofApproved: true, at: new Date().toISOString() },
    status: "open",
  };

  try {
    const session = await getAdapters().payments.createCheckoutSession({
      checkoutId: id,
      userId: user.userId,
      email: user.email,
      lines: buildCheckoutLines(items, method),
      successUrl: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/cart?cancelled=1`,
    });
    pending.sessionId = session.id;
    updateDB((d) => {
      d.checkouts[id] = pending;
    });
    return { ok: true, url: session.url, checkoutId: id };
  } catch (err) {
    console.error("could not open payment", err);
    return { ok: false, status: 502, error: "We couldn't open payment. Nothing was charged." };
  }
}

export function findCheckoutBySession(sessionId: string): PendingCheckout | undefined {
  return Object.values(readDB().checkouts).find((c) => c.sessionId === sessionId);
}
