import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "@/components/shop/AuthForm";

export const metadata: Metadata = { title: "Sign in | GreetHub" };

export default function Page() {
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  );
}
