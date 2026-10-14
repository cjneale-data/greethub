import type { Metadata } from "next";
import { Suspense } from "react";
import { DraftsPage } from "@/components/shop/Account";

export const metadata: Metadata = { title: "Your drafts | GreetHub" };

export default function Page() {
  return (
    <Suspense>
      <DraftsPage />
    </Suspense>
  );
}
