import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfilePage } from "@/components/shop/Account";

export const metadata: Metadata = { title: "Your account | GreetHub" };

export default function Page() {
  return (
    <Suspense>
      <ProfilePage />
    </Suspense>
  );
}
