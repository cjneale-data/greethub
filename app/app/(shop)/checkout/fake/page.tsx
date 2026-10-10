import { Suspense } from "react";
import { FakePayment } from "@/components/shop/CheckoutPages";

export default function Page() {
  return (
    <Suspense>
      <FakePayment />
    </Suspense>
  );
}
