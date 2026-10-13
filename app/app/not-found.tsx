import type { Metadata } from "next";
import { ShopShell } from "@/components/shop/ShopShell";
import { EmptyState, PageTitle } from "@/components/shop/ui";

export const metadata: Metadata = { title: "Page not found | GreetHub" };

/** Branded 404 (CX-32): same header and footer as the shop, a way home and a way to get help. */
export default function NotFound() {
  return (
    <ShopShell>
      <div className="gs-page gs-page--narrow">
        <PageTitle title="We can't find that page." lede="The link may be old, or the address may have a typo." />
        <EmptyState
          message="Here are a few places to pick up from."
          actions={[
            { label: "Go to the home page", href: "/", variant: "dark" },
            { label: "Track an order", href: "/orders" },
            { label: "Read the FAQ", href: "/faq" },
          ]}
        />
      </div>
    </ShopShell>
  );
}
