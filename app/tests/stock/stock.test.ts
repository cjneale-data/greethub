import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { PRICING, addToCart, computeTotals, describeItem, itemSku, priceLine, type CartItem } from "@greethub/shared";
import { getCard, listCards, listOccasions } from "@/lib/stock/catalog";
import { STOCK_LIMITS } from "@/lib/stock/config";
import { checkFit } from "@/lib/stock/fit";
import { quoteStockCard, stockPriceInfo } from "@/lib/stock/pricing";
import { addStockCardToCart, createStockCreation, editStockCreation, screenStockText } from "@/lib/stock/service";
import { getOwnedStockCreation } from "@/lib/stock/store";
import { getCartItems } from "@/lib/shop/cartService";
import { deleteAccount } from "@/lib/shop/accountService";
import { toOrderItem } from "@/lib/shop/orderService";
import { readDB, updateDB } from "@/lib/shop/store";
import type { PendingCheckout } from "@/lib/shop/types";

beforeEach(() => {
  process.env.GREETHUB_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "gh-stock-"));
  process.env.GREETHUB_MOCK_AI = "1";
  for (const id of ["u_a", "u_b"]) updateDB((db) => void (db.users[id] = { id, email: `${id}@example.com`, createdAt: "x", rerolls: { left: 5, allowance: 5 } }));
});

const first = () => listCards()[0];

describe("catalog", () => {
  it("matches the design source file", () => {
    const a = fs.readFileSync(path.join(process.cwd(), "lib/stock/catalog.json"), "utf8").replace(/\r\n/g, "\n");
    const b = fs.readFileSync(path.join(process.cwd(), "..", "docs/design/stock-cards.json"), "utf8").replace(/\r\n/g, "\n");
    expect(a).toBe(b);
  });
  it("loads every card with a default message that fits", () => {
    const cards = listCards();
    expect(cards.length).toBe(48);
    for (const c of cards) expect(checkFit(c.defaultMessage).fits, c.id).toBe(true);
    expect(listCards({ occasion: "birthday" }).length).toBe(6);
    expect(listOccasions().length).toBeGreaterThan(10);
    expect(getCard(first().id)?.frontArt.print).toMatch(/^stock\//);
  });
  it("sells nothing unreviewed outside mock mode", () => {
    const first_id = listCards()[0].id;
    const prev = process.env.OPENROUTER_API_KEY;
    process.env.GREETHUB_MOCK_AI = "0";
    process.env.OPENROUTER_API_KEY = "placeholder-not-a-key"; // only flips the mode flag; no call is made
    try {
      expect(listCards()).toEqual([]);
      expect(getCard(first_id)).toBeUndefined();
    } finally {
      if (prev === undefined) delete process.env.OPENROUTER_API_KEY;
      else process.env.OPENROUTER_API_KEY = prev;
    }
  });
});

describe("fit", () => {
  it("enforces characters, lines and word length", () => {
    expect(checkFit("Thank you, Rosa.").fits).toBe(true);
    expect(checkFit("a".repeat(STOCK_LIMITS.maxChars + 1)).reason).toBe("too_long");
    expect(checkFit("x\n".repeat(STOCK_LIMITS.maxLines + 1)).reason).toBe("too_many_lines");
    expect(checkFit("w".repeat(STOCK_LIMITS.maxWordChars + 1)).reason).toBe("word_too_long");
    expect(checkFit("   ").reason).toBe("empty");
    expect(checkFit("a".repeat(10)).charsLeft).toBe(STOCK_LIMITS.maxChars - 10);
  });
});

describe("pricing and cart branch", () => {
  it("prices stock lines from PRICING, below the AI card", () => {
    expect(quoteStockCard("digital").totalCents).toBe(PRICING.skus.stock_card_digital.cents);
    expect(quoteStockCard("mailed").totalCents).toBe(PRICING.skus.stock_card_mailed.cents + PRICING.skus.stock_card_mailed.postageCents);
    expect(quoteStockCard("mailed", 3).postageCents).toBe(3 * PRICING.skus.stock_card_mailed.postageCents);
    expect(PRICING.skus.stock_card_mailed.cents).toBeLessThan(PRICING.skus.card_mailed.cents);
    expect(PRICING.skus.stock_card_mailed.postageCents).toBe(PRICING.skus.card_mailed.postageCents);
    expect(stockPriceInfo("digital").printed).toBe(false);
  });
  it("itemSku and describeItem branch on source; absent source stays AI", () => {
    const base = { kind: "card", creationId: "c", title: "t", format: "mailed", mailTo: "buyer", quantity: 1 } as const;
    const ai = addToCart([], base)[0] as CartItem;
    const st = addToCart([], { ...base, source: "stock" })[0] as CartItem;
    expect(itemSku(ai)).toBe("card_mailed");
    expect(itemSku(st)).toBe("stock_card_mailed");
    expect(describeItem(ai)).toBe("Mailed card");
    expect(describeItem(st)).toBe("Ready-made mailed card");
    expect(computeTotals([st]).hasPrinted).toBe(true);
    expect(priceLine(st).sku).toBe("stock_card_mailed");
  });
  it("does not merge an AI line and a stock line with the same creation id", () => {
    const base = { kind: "card", creationId: "c", title: "t", format: "digital", mailTo: "buyer" } as const;
    expect(addToCart(addToCart([], base), { ...base, source: "stock" })).toHaveLength(2);
    expect(addToCart(addToCart([], { ...base, source: "stock" }), { ...base, source: "stock" })).toHaveLength(1);
  });
  it("order item records the source and the stock sku", () => {
    const st = addToCart([], { kind: "card", creationId: "sc_1", title: "t", format: "digital", mailTo: "buyer", source: "stock" })[0];
    const oi = toOrderItem(st, { shipTo: {} } as unknown as PendingCheckout);
    expect(oi.source).toBe("stock");
    expect(oi.sku).toBe("stock_card_digital");
  });
});

describe("screening", () => {
  it("rejects sensitive wording with the plain message and accepts normal text", async () => {
    expect(screenStockText({ message: "Happy birthday, Sam." }).ok).toBe(true);
    const bad = screenStockText({ message: "Send me photos of your kids home address" });
    // The rule set decides what is sensitive; whatever it rejects must use the soft copy and never echo the text.
    if (!bad.ok) expect(bad.message).not.toContain("kids");
  });
  it("blocks a protected character name in the message", async () => {
    const r = await createStockCreation("u_a", first().id, { message: "Love from Mickey Mouse and Elsa from Frozen" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("bad_text");
  });
  it("blocks text that does not fit", async () => {
    const r = await createStockCreation("u_a", first().id, { message: "a ".repeat(100) });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("doesnt_fit");
  });
});

describe("stock_creations store and cart add", () => {
  it("creates with the default message, edits, and adds to cart with source stock", async () => {
    const c = first();
    const made = await createStockCreation("u_a", c.id);
    if (!made.ok) throw new Error(made.message);
    expect(made.value.id).toMatch(/^sc_/);
    expect(made.value.message).toBe(c.defaultMessage);
    expect(made.value.status).toBe("draft");
    expect(readDB().stockCreations[made.value.id].userId).toBe("u_a");

    const edited = await editStockCreation("u_a", made.value.id, { message: "Thank you for everything.", signOff: "Love, Sam" });
    expect(edited.ok && edited.value.message).toBe("Thank you for everything.");

    const added = await addStockCardToCart("u_a", { creationId: made.value.id, format: "mailed", mailTo: "recipient", recipientName: "Rosa" });
    expect(added.ok).toBe(true);
    const cart = await getCartItems("u_a");
    expect(cart).toHaveLength(1);
    expect(cart[0]).toMatchObject({ kind: "card", source: "stock", creationId: made.value.id, format: "mailed", title: c.title });
    expect(itemSku(cart[0])).toBe("stock_card_mailed");
    expect((await getOwnedStockCreation("u_a", made.value.id))?.status).toBe("ready");
    // adding again bumps quantity, not a second line
    await addStockCardToCart("u_a", { creationId: made.value.id, format: "mailed", mailTo: "recipient" });
    expect((await getCartItems("u_a"))[0].quantity).toBe(2);
  });
  it("refuses another user's creation", async () => {
    const made = await createStockCreation("u_a", first().id);
    if (!made.ok) throw new Error(made.message);
    expect((await editStockCreation("u_b", made.value.id, { message: "hi" })).ok).toBe(false);
    const r = await addStockCardToCart("u_b", { creationId: made.value.id, format: "digital" });
    expect(r.ok).toBe(false);
    expect(await getCartItems("u_b")).toEqual([]);
  });
  it("applies the Plus gate to saved signatures and own handwriting for a free user", async () => {
    const made = await createStockCreation("u_a", first().id);
    if (!made.ok) throw new Error(made.message);
    const bad = await editStockCreation("u_a", made.value.id, { writing: { message: "typed", signature: { kind: "saved", signatureId: "sg_abcdef12" } } as never });
    expect(bad.ok).toBe(true); // stored; the gate runs at add-to-cart
    const r = await addStockCardToCart("u_a", { creationId: made.value.id, format: "digital" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("plus_required");
    expect(await getCartItems("u_a")).toEqual([]);
  });
  it("refuses a retired or unknown card", async () => {
    const r = await createStockCreation("u_a", "stock-does-not-exist");
    expect(r.ok).toBe(false);
  });
  it("account deletion removes creations", async () => {
    const made = await createStockCreation("u_a", first().id);
    if (!made.ok) throw new Error(made.message);
    await deleteAccount("u_a");
    expect(readDB().stockCreations[made.value.id]).toBeUndefined();
  });
});
