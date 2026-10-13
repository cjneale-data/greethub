import { Suspense } from "react";
import type { Metadata } from "next";
import { NO_PIN } from "@/lib/seo";
import { CheckoutView } from "@/components/shop/CheckoutView";

export const metadata: Metadata = { title: "Checkout | GreetHub", robots: { index: false, follow: false }, other: NO_PIN };

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
