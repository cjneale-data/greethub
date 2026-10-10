import { describe, expect, it } from "vitest";
import { PRICING, addToCart, computeTotals, enabledShippingMethods, formatMoney, priceLine, priceTokens, removeItem, setQuantity, type CartItem } from "@greethub/shared";

const card = { kind: "card", creationId: "c1", title: "Rosa card", format: "mailed", mailTo: "recipient", quantity: 1 } as const;
const book = { kind: "book", creationId: "b1", title: "Eye Story", pageCount: 24, mailTo: "buyer", digitalCopy: false, quantity: 1 } as const;
let n = 0;
const id = () => `id${++n}`;

describe("pricing config (CFO launch prices)", () => {
  it("matches finance/README.md", () => {
    expect(PRICING.skus.card_digital.cents).toBe(399);
    expect(PRICING.skus.card_mailed.cents).toBe(799);
    expect(PRICING.skus.card_mailed.postageCents).toBe(299);
    expect(PRICING.skus.book_24.cents).toBe(3900);
    expect(PRICING.skus.book_32.cents).toBe(4900);
    expect(PRICING.skus.book_24.postageCents).toBe(599);
    expect(PRICING.skus.book_digital.cents).toBe(1999);
  });
  it("formats money and fills copy tokens", () => {
    expect(formatMoney(799)).toBe("$7.99");
    expect(formatMoney(3900)).toBe("$39.00");
    expect(priceTokens().book_24).toBe("$39");
    expect(priceTokens().card_mailed).toBe("$7.99");
    expect(enabledShippingMethods().map((m) => m.id)).toContain("standard");
  });
});

describe("cart math", () => {
  it("prices a mailed card with postage", () => {
    let cart: CartItem[] = addToCart([], card, new Date(), id);
    expect(priceLine(cart[0])).toMatchObject({ productCents: 799, postageCents: 299, totalCents: 1098 });
    cart = setQuantity(cart, cart[0].id, 3);
    expect(priceLine(cart[0]).totalCents).toBe(3294);
  });
  it("digital cards have no postage and are not printed", () => {
    const cart = addToCart([], { ...card, format: "digital" }, new Date(), id);
    expect(computeTotals(cart)).toMatchObject({ subtotalCents: 399, postageCents: 0, hasPrinted: false, totalCents: 399 });
  });
  it("totals a card plus a book, with the digital copy add-on", () => {
    let cart = addToCart([], card, new Date(), id);
    cart = addToCart(cart, { ...book, digitalCopy: true }, new Date(), id);
    const t = computeTotals(cart);
    expect(t.subtotalCents).toBe(799 + 3900 + 1999);
    expect(t.postageCents).toBe(299 + 599);
    expect(t.totalCents).toBe(t.subtotalCents + t.postageCents);
  });
  it("express adds the surcharge once, only when something prints", () => {
    const cart = addToCart(addToCart([], card, new Date(), id), book, new Date(), id);
    expect(computeTotals(cart, "express").methodCents).toBe(PRICING.shippingMethods.express.extraCents);
    const digital = addToCart([], { ...card, format: "digital" }, new Date(), id);
    expect(computeTotals(digital, "express").methodCents).toBe(0);
  });
  it("merges identical lines, caps quantity, removes at zero", () => {
    let cart = addToCart([], card, new Date(), id);
    cart = addToCart(cart, card, new Date(), id);
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(2);
    cart = setQuantity(cart, cart[0].id, 99);
    expect(cart[0].quantity).toBe(10);
    expect(setQuantity(cart, cart[0].id, 0)).toHaveLength(0);
    expect(removeItem(cart, cart[0].id)).toHaveLength(0);
  });
  it("keeps different recipients or page counts as separate lines", () => {
    let cart = addToCart([], book, new Date(), id);
    cart = addToCart(cart, { ...book, pageCount: 32 }, new Date(), id);
    cart = addToCart(cart, { ...book, mailTo: "recipient" }, new Date(), id);
    expect(cart).toHaveLength(3);
  });
  it("rejects bad items", () => {
    expect(() => addToCart([], { kind: "card", creationId: "", title: "x", format: "mailed" } as never)).toThrow();
    expect(() => addToCart([], { ...book, pageCount: 20 } as never)).toThrow();
  });
});
