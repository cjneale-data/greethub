import type { Metadata } from "next";
import { OrdersList } from "@/components/shop/Orders";

export const metadata: Metadata = { title: "Your orders | GreetHub" };

export default function OrdersPage() {
  return (
    <div className="gs-page gs-page--narrow">
      <h1 className="gs-h1">Orders</h1>
      <OrdersList />
    </div>
  );
}
