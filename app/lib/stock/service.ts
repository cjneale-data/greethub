import { CardWritingSchema, type CardWriting, type CartItem } from "@greethub/shared";
import { checkText } from "../intake/guardrails";
import { addItem } from "../shop/cartService";
import { writingOrderBlock } from "../writing/service";
import { getCard } from "./catalog";
import { STOCK_LIMITS } from "./config";
import { checkFit, fitMessage } from "./fit";
import { getOwnedStockCreation, newStockCreationId, saveStockCreation, updateStockCreation } from "./store";
import type { FitResult, StockCreation, StockCustomization, StockFormat, StockMailTo } from "./types";

/**
 * Ready Cards service. Server-side only. Flow: createStockCreation (card + words) -> updateStockCreation edits ->
 * addStockCardToCart (re-checks everything, then uses the normal cart; the creation id is the cart creationId).
 * Errors never echo customer text and nothing here logs it.
 */
export type StockResult<T> = { ok: true; value: T } | { ok: false; code: "no_card" | "no_creation" | "bad_text" | "doesnt_fit" | "bad_writing" | "plus_required" | "needs_attention"; message: string; fit?: FitResult };

const fail = (code: Extract<StockResult<never>, { ok: false }>["code"], message: string, fit?: FitResult): StockResult<never> => ({ ok: false, code, message, fit });

export const REJECT_MESSAGE = "We can't print this wording. Try different words.";

/** Free rules on the inside message and sign-off: sensitive content and the IP first pass (docs/legal/07). Sign-off is name-like. */
export function screenStockText(c: Pick<StockCustomization, "message" | "signOff">): { ok: boolean; message?: string } {
  const m = checkText(c.message, { field: "card_message" });
  if (!m.ok) return { ok: false, message: REJECT_MESSAGE };
  if (c.signOff) {
    if ([...c.signOff].length > STOCK_LIMITS.signOffMaxChars) return { ok: false, message: "Keep the sign-off short, like \"Love, Sam\"." };
    if (!checkText(c.signOff, { nameLike: true, field: "card_message" }).ok) return { ok: false, message: REJECT_MESSAGE };
  }
  return { ok: true };
}

type Checked = { message: string; signOff?: string; writing?: CardWriting; fit: FitResult };

function validate(c: StockCustomization): StockResult<Checked> {
  const fit = checkFit(c.message);
  if (!fit.fits) return fail("doesnt_fit", fitMessage(fit) ?? "That won't fit.", fit);
  const screened = screenStockText(c);
  if (!screened.ok) return fail("bad_text", screened.message ?? REJECT_MESSAGE, fit);
  let writing: CardWriting | undefined;
  if (c.writing) {
    const p = CardWritingSchema.safeParse(c.writing);
    if (!p.success) return fail("bad_writing", "Pick a handwriting style, or use typed words.", fit);
    writing = p.data;
  }
  return { ok: true, value: { message: c.message.trim(), signOff: c.signOff?.trim() || undefined, writing, fit } };
}

/** Start a card from a catalog card. Words default to the card's own line. */
export async function createStockCreation(userId: string, stockId: string, custom?: Partial<StockCustomization>): Promise<StockResult<StockCreation>> {
  const card = getCard(stockId);
  if (!card) return fail("no_card", "That card isn't available any more. Try one of these.");
  const checked = validate({ message: card.defaultMessage, ...custom });
  if (!checked.ok) return checked;
  const now = new Date().toISOString();
  const row = await saveStockCreation({
    id: newStockCreationId(),
    userId,
    stockId,
    message: checked.value.message,
    signOff: checked.value.signOff,
    writing: checked.value.writing,
    status: "draft",
    messageFitted: checked.value.fit.fits,
    screening: { ok: true, at: now },
    createdAt: now,
    updatedAt: now,
  });
  return { ok: true, value: row };
}

/** Change the words, sign-off or writing of an owned, not yet ordered card. Re-runs the fit and the safety screen. */
export async function editStockCreation(userId: string, id: string, patch: Partial<StockCustomization>): Promise<StockResult<StockCreation>> {
  const cur = await getOwnedStockCreation(userId, id);
  if (!cur || cur.status === "ordered") return fail("no_creation", "We couldn't find that card.");
  const checked = validate({ message: patch.message ?? cur.message, signOff: "signOff" in patch ? patch.signOff : cur.signOff, writing: "writing" in patch ? patch.writing : cur.writing });
  if (!checked.ok) return checked;
  const row = await updateStockCreation(userId, id, (c) => ({
    ...c,
    message: checked.value.message,
    signOff: checked.value.signOff,
    writing: checked.value.writing,
    status: "draft",
    messageFitted: checked.value.fit.fits,
    screening: { ok: true, at: new Date().toISOString() },
  }));
  return row ? { ok: true, value: row } : fail("no_creation", "We couldn't find that card.");
}

export type AddStockToCart = { creationId: string; format: StockFormat; mailTo?: StockMailTo; recipientName?: string; quantity?: number };

/**
 * Add an owned creation to the cart as a stock-source card line. Re-validates server-side (fit, screening, Plus gate via
 * writingOrderBlock), marks the creation ready, and returns the new cart. Price is worked out from the SKU at checkout, never here.
 * Card and creation are re-read, so a retired card or someone else's creation is refused.
 */
export async function addStockCardToCart(userId: string, input: AddStockToCart): Promise<StockResult<CartItem[]>> {
  const cur = await getOwnedStockCreation(userId, input.creationId);
  if (!cur || cur.status === "ordered") return fail("no_creation", "We couldn't find that card.");
  const card = getCard(cur.stockId);
  if (!card) return fail("no_card", "This card is retired. Pick another and keep your words.");
  const checked = validate({ message: cur.message, signOff: cur.signOff, writing: cur.writing });
  if (!checked.ok) return checked;
  const block = await writingOrderBlock(userId, checked.value.writing);
  if (block) return fail("plus_required", block);
  await updateStockCreation(userId, cur.id, (c) => ({ ...c, status: "ready", messageFitted: true, screening: { ok: true, at: new Date().toISOString() } }));
  const cart = await addItem(userId, {
    kind: "card",
    source: "stock",
    creationId: cur.id,
    title: card.title,
    format: input.format,
    mailTo: input.mailTo ?? "buyer",
    recipientName: input.recipientName,
    quantity: input.quantity ?? 1,
    thumbnail: card.frontArt.preview,
  });
  return { ok: true, value: cart };
}
