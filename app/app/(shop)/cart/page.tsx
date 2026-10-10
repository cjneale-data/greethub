import { Suspense } from "react";
import type { Metadata } from "next";
import { CartView } from "@/components/shop/CartView";
import { SkeletonList } from "@/components/shop/ui";

export const metadata: Metadata = { title: "Your cart | GreetHub" };

export default function CartPage() {
  return (
    <div className="gs-page">
      <h1 className="gs-h1">Your cart</h1>
      <Suspense fallback={<SkeletonList rows={2} />}>
        <CartView />
      </Suspense>
    </div>
  );
}
