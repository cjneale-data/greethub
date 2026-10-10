"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, ButtonLink, Chip, Progress, Segmented, Toggle } from "@/components/brand";
import { PRICING, computeTotals, enabledShippingMethods, isPrinted, type Address, type ShippingMethodId } from "@greethub/shared";
import { earliestDeliveryDate } from "@/lib/shop/address";
import { AddressFields, EMPTY_ADDRESS, quickErrors, type AddressDraft } from "./AddressFields";
import { SummaryRows } from "./CartSummary";
import { CartLineThumb, type CartData } from "./CartView";
import { Check, EmptyState, ErrorBox, SkeletonList } from "./ui";
import { api, useToast } from "./client";

type Saved = { id: string; label: string; address: Address; isDefault: boolean };
type Group = { key: string; title: string; ids: string[] };

export function CheckoutView() {
  const toast = useToast();
  const [cart, setCart] = useState<CartData | null>(null);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [loadErr, setLoadErr] = useState("");
  const [forms, setForms] = useState<Record<string, AddressDraft>>({});
  const [errs, setErrs] = useState<Record<string, Record<string, string>>>({});
  const [save, setSave] = useState<Record<string, boolean>>({});
  const [method, setMethod] = useState<ShippingMethodId>("standard");
  const [when, setWhen] = useState("As soon as possible");
  const [date, setDate] = useState("");
  const [dateErr, setDateErr] = useState("");
  const [approved, setApproved] = useState(false);
  const [approvedErr, setApprovedErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [formErr, setFormErr] = useState("");
  const earliest = earliestDeliveryDate();

  async function load() {
    const [c, a] = await Promise.all([api<CartData>(`/api/cart?method=${method}`), api<{ addresses: Saved[] }>("/api/account/addresses")]);
    if (!c.ok) return setLoadErr(c.data.error ?? "Something broke on our side. It's not you. Try again in a minute.");
    setCart(c.data);
    if (a.ok) setSaved(a.data.addresses);
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groups: Group[] = useMemo(() => {
    const g: Group[] = [];
    for (const it of cart?.items ?? []) {
      if (!isPrinted(it)) continue;
      const key = it.mailTo === "buyer" ? "buyer" : it.id;
      const found = g.find((x) => x.key === key);
      if (found) found.ids.push(it.id);
      else g.push({ key, ids: [it.id], title: key === "buyer" ? "Where is it going? To you" : `Where is it going? To ${it.recipientName || "someone else"}` });
    }
    return g;
  }, [cart]);

  // Prefill the buyer address from the default saved address once.
  useEffect(() => {
    const def = saved.find((s) => s.isDefault) ?? saved[0];
    if (def && groups.some((g) => g.key === "buyer")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForms((f) => (f.buyer ? f : { ...f, buyer: { ...EMPTY_ADDRESS, ...def.address } }));
    }
  }, [saved, groups]);

  if (loadErr) return <ErrorBox message={loadErr} onRetry={load} />;
  if (!cart) return <SkeletonList rows={3} h={140} />;
  if (cart.items.length === 0) return <EmptyState message="Nothing here yet. Start with a card or a book." actions={[{ label: "Start a card", href: "/create/card" }, { label: "Make a picture book", href: "/create/book" }]} />;

  const totals = computeTotals(cart.items, method);
  const digitalOnly = groups.length === 0;

  async function pay() {
    setFormErr("");
    const nextErrs: Record<string, Record<string, string>> = {};
    for (const g of groups) {
      const e = quickErrors(forms[g.key] ?? EMPTY_ADDRESS);
      if (Object.keys(e).length) nextErrs[g.key] = e;
    }
    setErrs(nextErrs);
    let ok = Object.keys(nextErrs).length === 0;
    if (when === "By a date" && (!date || date < earliest)) {
      setDateErr(date ? `Earliest we can do is ${earliest}.` : "Pick a date.");
      ok = false;
    } else setDateErr("");
    if (!approved) {
      setApprovedErr("Tick the box to approve the proof.");
      ok = false;
    } else setApprovedErr("");
    if (!ok) return;
    const shipments: Record<string, AddressDraft> = {};
    for (const g of groups) for (const id of g.ids) shipments[id] = forms[g.key];
    const saveAddresses = groups.filter((g) => save[g.key]).map((g) => ({ label: forms[g.key]?.name || "Address", address: forms[g.key] }));
    setBusy(true);
    const r = await api<{ url?: string; earliest?: string }>("/api/checkout", {
      method: "POST",
      json: { shippingMethod: method, deliveryDate: when === "By a date" ? date : undefined, shipments, saveAddresses, proofApproved: true },
    });
    if (r.ok && r.data.url) {
      window.location.href = r.data.url;
      return;
    }
    setBusy(false);
    if (r.data.fieldErrors) {
      const mapped: Record<string, Record<string, string>> = {};
      for (const g of groups) {
        const first = g.ids.find((id) => r.data.fieldErrors?.[id]);
        if (first) mapped[g.key] = r.data.fieldErrors[first];
      }
      setErrs(mapped);
    }
    if (r.data.earliest) {
      setDateErr(`Earliest we can do is ${r.data.earliest}.`);
      setDate(r.data.earliest);
    }
    setFormErr(r.data.error ?? "We couldn't open payment. Nothing was charged.");
    if (r.status === 401) toast("Sign in to see this.");
  }

  return (
    <div className="gs-two">
      <div className="gs-stack gs-stack--lg">
        <Progress value={50} label="Step 1 of 2: Delivery" />
        {digitalOnly && <div className="gs-panel"><p style={{ margin: 0 }}>Digital only. No address needed. We&apos;ll send it to your email after payment.</p></div>}
        {groups.map((g) => {
          const matches = saved;
          return (
            <section key={g.key} className="gs-panel gs-addr-block" aria-label={g.title}>
              <h2 className="gs-h3" style={{ margin: 0 }}>{g.title}</h2>
              {matches.length > 0 && (
                <div className="gs-scroll-x" role="group" aria-label="Saved addresses">
                  {matches.map((s) => (
                    <Chip key={s.id} onClick={() => setForms((f) => ({ ...f, [g.key]: { ...EMPTY_ADDRESS, ...s.address } }))}>{s.label}</Chip>
                  ))}
                  <Chip onClick={() => setForms((f) => ({ ...f, [g.key]: { ...EMPTY_ADDRESS } }))}>+ New</Chip>
                </div>
              )}
              <AddressFields prefix={g.key} value={forms[g.key] ?? EMPTY_ADDRESS} onChange={(v) => { setForms((f) => ({ ...f, [g.key]: v })); setErrs((e) => ({ ...e, [g.key]: {} })); }} errors={errs[g.key]} />
              <Toggle checked={!!save[g.key]} onChange={(v) => setSave((s) => ({ ...s, [g.key]: v }))}>Save this address</Toggle>
            </section>
          );
        })}
        {!digitalOnly && (
          <>
            <fieldset className="gs-fieldset gs-stack gs-stack--sm">
              <legend>Shipping</legend>
              {enabledShippingMethods().map((m) => (
                <label key={m.id} className="gs-radio">
                  <input type="radio" name="ship" checked={method === m.id} onChange={() => { setMethod(m.id); void api<CartData>(`/api/cart?method=${m.id}`); }} />
                  <span>
                    <strong>{m.label}</strong>{m.extraCents > 0 ? ` (+$${(m.extraCents / 100).toFixed(2)})` : " (included)"}
                    <br /><span className="gs-muted gs-small">{m.blurb}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <div className="gs-stack gs-stack--sm">
              <h2 className="gs-h3" style={{ margin: 0 }}>When should it arrive?</h2>
              <div><Segmented options={["As soon as possible", "By a date"]} value={when} onChange={setWhen} /></div>
              {when === "By a date" && (
                <label className="gh-field" style={{ maxWidth: 240 }}>
                  <span className="gh-field__label">Arrive by</span>
                  <input className="gh-input" type="date" min={earliest} value={date} onChange={(e) => setDate(e.target.value)} aria-invalid={!!dateErr} />
                  {dateErr && (
                    <span className="gh-field__hint gh-field__hint--error">
                      {dateErr} {date !== earliest && <button type="button" className="gs-link" onClick={() => { setDate(earliest); setDateErr(""); }}>Use {earliest}</button>}
                    </span>
                  )}
                </label>
              )}
              <p className="gs-small gs-muted" style={{ margin: 0 }}>We show a real estimate once the print shop confirms it. Earliest arrive-by date: {earliest}. We ship to {PRICING.shipCountries.join(", ")} to start.</p>
            </div>
          </>
        )}
        <div className="gs-panel gs-panel--cream">
          <Check checked={approved} onChange={(v) => { setApproved(v); if (v) setApprovedErr(""); }} error={approvedErr}>
            I have reviewed and approve this proof. I understand it&apos;s made just for me and the <Link className="gs-link" href="/refunds" target="_blank">Refund &amp; Reprint Policy</Link> applies. The art is AI-illustrated.
          </Check>
        </div>
      </div>
      <aside className="gs-panel gs-stack gs-sticky" aria-label="Order summary">
        <h2 className="gs-h3" style={{ margin: 0 }}>Order summary</h2>
        {cart.items.map((it) => (
          <div key={it.id} className="gs-row" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
            <CartLineThumb item={it} />
            <div className="gs-small"><strong>{it.title}</strong>{it.quantity > 1 ? ` x${it.quantity}` : ""}<br /><span className="gs-muted">{it.description}</span></div>
          </div>
        ))}
        <SummaryRows totals={totals} methodLabel={PRICING.shippingMethods[method].label + " shipping"} />
        {formErr && <ErrorBox message={formErr} />}
        <Button size="lg" disabled={busy} onClick={pay}>{busy ? "Opening payment" : "Continue to payment"}</Button>
        <ButtonLink variant="ghost" href="/cart" style={{ color: "var(--gh-cocoa)" }}>Back to cart</ButtonLink>
      </aside>
    </div>
  );
}
