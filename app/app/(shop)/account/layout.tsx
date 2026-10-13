import type { ReactNode } from "react";
import type { Metadata } from "next";
import { NO_PIN } from "@/lib/seo";
import { AccountFrame } from "@/components/shop/Account";

export const metadata: Metadata = { robots: { index: false, follow: false }, other: NO_PIN };

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <AccountFrame>{children}</AccountFrame>;
}
