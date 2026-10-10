import type { ReactNode } from "react";
import { AccountFrame } from "@/components/shop/Account";

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <AccountFrame>{children}</AccountFrame>;
}
