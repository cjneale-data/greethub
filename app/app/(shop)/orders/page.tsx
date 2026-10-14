import type { Metadata } from "next";
import { NO_PIN } from "@/lib/seo";
import { OrdersList } from "@/components/shop/Orders";
import { AccountFrame } from "@/components/shop/Account";

export const metadata: Metadata = { title: "Your orders | GreetHub", robots: { index: false, follow: false }, other: NO_PIN };

export default function OrdersPage() {
  return (
    <AccountFrame>
      <div className="gs-stack gs-stack--lg">
        <h1 className="gs-h2" style={{ margin: 0 }}>Orders</h1>
        <OrdersList />
      </div>
    </AccountFrame>
  );
}
