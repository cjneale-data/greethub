import type { Metadata } from "next";
import { NO_PIN } from "@/lib/seo";
import { OrdersList } from "@/components/shop/Orders";

export const metadata: Metadata = { title: "Your orders | GreetHub", robots: { index: false, follow: false }, other: NO_PIN };

export default function OrdersPage() {
  return (
    <div className="gs-page gs-page--narrow">
      <h1 className="gs-h1">Orders</h1>
      <OrdersList />
    </div>
  );
}
