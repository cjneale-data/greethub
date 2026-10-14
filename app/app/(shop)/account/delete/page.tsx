import type { Metadata } from "next";
import { Suspense } from "react";
import { DeletePage } from "@/components/shop/Account";

export const metadata: Metadata = { title: "Delete your account | GreetHub" };

export default function Page() {
  return (
    <Suspense>
      <DeletePage />
    </Suspense>
  );
}
