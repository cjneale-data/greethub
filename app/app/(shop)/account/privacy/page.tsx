import type { Metadata } from "next";
import { PrivacyDataPage } from "@/components/shop/Account";

export const metadata: Metadata = { title: "Privacy & data | GreetHub" };

export default function Page() {
  return <PrivacyDataPage />;
}
