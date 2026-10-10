"use client";
import { formatMoney, type CartTotals } from "@greethub/shared";

export function SummaryRows({ totals, methodLabel }: { totals: CartTotals; methodLabel?: string }) {
  return (
    <div className="gs-sum">
      <div className="gs-sum__row"><span>Subtotal</span><span>{formatMoney(totals.subtotalCents)}</span></div>
      <div className="gs-sum__row"><span>Postage</span><span>{totals.postageCents ? formatMoney(totals.postageCents) : "None"}</span></div>
      {totals.methodCents > 0 && <div className="gs-sum__row"><span>{methodLabel ?? "Faster shipping"}</span><span>{formatMoney(totals.methodCents)}</span></div>}
      <div className="gs-sum__row"><span>Tax</span><span className="gs-muted">{totals.taxCents ? formatMoney(totals.taxCents) : "Worked out at payment"}</span></div>
      <div className="gs-sum__row gs-sum__row--total"><span>Total</span><span>{formatMoney(totals.totalCents)}</span></div>
    </div>
  );
}
