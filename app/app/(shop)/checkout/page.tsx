import { Suspense } from "react";
import type { Metadata } from "next";
import { CheckoutView } from "@/components/shop/CheckoutView";

export const metadata: Metadata = { title: "Checkout | GreetHub" };

export default function CheckoutPage() {
  return (
    <div className="gs-page">
      <h1 className="gs-h1">Checkout</h1>
      <Suspense>
        <CheckoutView />
      </Suspense>
    </div>
  );
}
