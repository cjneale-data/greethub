import type { Metadata } from "next";
import { Suspense } from "react";
import { AddressesPage } from "@/components/shop/Account";

export const metadata: Metadata = { title: "Your addresses | GreetHub" };

export default function Page() {
  return (
    <Suspense>
      <AddressesPage />
    </Suspense>
  );
}
