import type { Metadata } from "next";
import { Suspense } from "react";
import { MembershipPage } from "@/components/shop/Membership";

export const metadata: Metadata = { title: "Membership | GreetHub" };

export default function Page() {
  return (
    <Suspense>
      <MembershipPage />
    </Suspense>
  );
}
