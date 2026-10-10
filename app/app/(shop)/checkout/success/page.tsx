import { Suspense } from "react";
import { CheckoutSuccess } from "@/components/shop/CheckoutPages";

export default function Page() {
  return (
    <Suspense>
      <CheckoutSuccess />
    </Suspense>
  );
}
