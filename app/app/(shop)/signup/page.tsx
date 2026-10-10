import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/shop/AuthForm";

export const metadata: Metadata = { title: "Make a free account | GreetHub" };

export default function Page() {
  return (
    <Suspense>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
