import type { Metadata } from "next";
import { Suspense } from "react";
import { FakeMembershipCheckout } from "@/components/shop/Membership";

export const metadata: Metadata = { title: "Test checkout | GreetHub" };

export default function Page() {
  return (
    <Suspense>
      <FakeMembershipCheckout />
    </Suspense>
  );
}
