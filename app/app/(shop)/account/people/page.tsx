import type { Metadata } from "next";
import { Suspense } from "react";
import { PeoplePage } from "@/components/shop/Account";

export const metadata: Metadata = { title: "People | GreetHub" };

export default function Page() {
  return (
    <Suspense>
      <PeoplePage />
    </Suspense>
  );
}
