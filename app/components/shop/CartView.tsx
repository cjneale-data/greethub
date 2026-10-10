"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Button, ButtonLink, Segmented, TemplateCard } from "@/components/brand";
import { formatMoney, type CartItem, type CartTotals } from "@greethub/shared";
import { SummaryRows } from "./CartSummary";
import { EmptyState, ErrorBox, Modal, SkeletonList } from "./ui";
import { api, setCartCount, useSession, useToast, type ApiResult } from "./client";

export type CartLine = CartItem & { description: string; unitCents: number; lineCents: number; postageCents: number };
export type CartData = { items: CartLine[]; totals: CartTotals; isGuest?: boolean; removed?: CartItem };

export function CartLineThumb({ item }: { item: Pick<CartItem, "title" | "kind" | "thumbnail"> }) {
  return (
    <div className="gs-line__thumb">
      <TemplateCard title={item.title} tone={item.kind === "book" ? "marigold" : "blush"} tilt={0} image={item.thumbnail} placeholderLabel={item.kind} />
    </div>
  );
}

export function CartView() {
  const router = useRouter();
  const sp = useSearchParams();
  const toast = useToast();
  const session = useSession();
  const [cart, setCart] = useState<CartData | null>(null);
  const [error, setError] = useState("");
  const [gate, setGate] = useState(false);
  const shownCancel = useRef(false);

  const load = useCallback(async () => {
    const r = await api<CartData>("/api/cart");
    if (!r.ok) return setError(r.data.error ?? "Something broke on our side. It's not you. Try again in a minute.");
    setError("");
    setCart(r.data);
    setCartCount(r.data.totals.itemCount);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  useEffect(() => {
    if (sp.get("cancelled") && !shownCancel.current) {
      shownCancel.current = true;
      toast("No charge. Your cart is waiting.");
    }
  }, [sp, toast]);

  async function apply(p: Promise<ApiResult<CartData>>) {
    const res = await p;
    if (!res.ok) {
      toast(res.data.error ?? "We lost you for a second. Trying again.");
      return undefined;
    }
    setCart(res.data);
    setCartCount(res.data.totals.itemCount);
    return res.data;
  }
  const qty = (id: string, quantity: number) => apply(api<CartData>("/api/cart", { method: "PATCH", json: { id, quantity } }));
  const mailTo = (id: string, v: "buyer" | "recipient") => apply(api<CartData>("/api/cart", { method: "PATCH", json: { id, mailTo: v } }));
  async function remove(id: string) {
    const data = await apply(api<CartData>(`/api/cart?id=${encodeURIComponent(id)}`, { method: "DELETE" }));
    const removed = data?.removed;
    if (removed) toast("Removed.", { action: "Undo", onAction: () => void apply(api<CartData>("/api/cart", { method: "POST", json: { restore: removed } })) });
  }
  async function addDemo() {
    await api("/api/cart", { method: "POST", json: { kind: "card", creationId: "demo-card-rosa", title: "Rosa's card", recipientName: "Rosa", format: "mailed", mailTo: "recipient" } });
    await api("/api/cart", { method: "POST", json: { kind: "book", creationId: "demo-book-eye", title: "The Eye Story", pageCount: 24, mailTo: "buyer" } });
    await load();
  }

  if (error && !cart) return <ErrorBox message={error} onRetry={load} />;
  if (!cart) return <SkeletonList rows={2} />;

  const blocked = cart.items.some((i) => i.needsAttention);
  if (cart.items.length === 0) {
    return (
      <div className="gs-stack">
        <EmptyState message="Nothing here yet. Start with a card or a book." actions={[{ label: "Start a card", href: "/create/card" }, { label: "Make a picture book", href: "/create/book" }]} />
        {session.fake.payments && (
          <p className="gs-small gs-muted" style={{ textAlign: "center" }}>
            Local mode: <button className="gs-link" data-testid="add-demo" onClick={addDemo}>add demo items</button>
          </p>
        )}
      </div>
    );
  }

  const checkout = () => (session.signedIn ? router.push("/checkout") : setGate(true));

  return (
    <div className="gs-two">
      <div className="gs-stack" role="list" aria-label="Cart items">
        {cart.items.map((it) => (
          <div key={it.id} role="listitem" className="gs-panel gs-line">
            <CartLineThumb item={it} />
            <div className="gs-stack gs-stack--sm">
              <h2 className="gs-h3" style={{ margin: 0 }}>{it.title}</h2>
              <div className="gs-muted gs-small">{it.description}{it.recipientName ? `, for ${it.recipientName}` : ""}</div>
              {it.needsAttention && <div><Badge tone="draft">This one needs a look</Badge> <span className="gs-small gs-muted">{it.needsAttention}</span></div>}
              {(it.kind === "book" || it.format === "mailed") && (
                <div><Segmented options={["To me", "To someone else"]} value={it.mailTo === "buyer" ? "To me" : "To someone else"} onChange={(v) => void mailTo(it.id, v === "To me" ? "buyer" : "recipient")} /></div>
              )}
              <div className="gs-row">
                <div className="gs-qty" role="group" aria-label={`Quantity for ${it.title}`}>
                  <button type="button" aria-label="Fewer" onClick={() => void qty(it.id, it.quantity - 1)}>&minus;</button>
                  <output aria-live="polite">{it.quantity}</output>
                  <button type="button" aria-label="More" disabled={it.quantity >= 10} onClick={() => void qty(it.id, it.quantity + 1)}>+</button>
                </div>
                <button type="button" className="gs-link" onClick={() => void remove(it.id)} aria-label={`Remove ${it.title}`}>Remove</button>
              </div>
            </div>
            <div className="gs-line__price">
              {formatMoney(it.lineCents)}
              {it.postageCents > 0 && <div className="gs-small gs-muted" style={{ fontWeight: 500 }}>+ {formatMoney(it.postageCents)} postage</div>}
            </div>
          </div>
        ))}
      </div>
      <aside className="gs-panel gs-stack gs-sticky" aria-label="Order summary">
        <h2 className="gs-h3" style={{ margin: 0 }}>Order summary</h2>
        <SummaryRows totals={cart.totals} />
        {blocked && <ErrorBox message="Something needs a look before it can print. Fix it to check out." />}
        <Button size="lg" disabled={blocked} onClick={checkout}>Checkout</Button>
        <ButtonLink variant="ghost" href="/browse" style={{ color: "var(--gh-cocoa)" }}>Keep making things</ButtonLink>
        <p className="gs-small gs-muted" style={{ margin: 0 }}>The art is AI-illustrated. <Link className="gs-link" href="/refunds">Refund &amp; Reprint Policy</Link></p>
      </aside>
      {gate && (
        <Modal
          title="Make a free account"
          onClose={() => setGate(false)}
          actions={
            <>
              <Button variant="ghost" onClick={() => setGate(false)}>Not now</Button>
              <ButtonLink href="/signup?next=%2Fcheckout">Make a free account</ButtonLink>
            </>
          }
        >
          <p>Make a free account to check out and track your order. Your cart comes with you.</p>
        </Modal>
      )}
    </div>
  );
}
