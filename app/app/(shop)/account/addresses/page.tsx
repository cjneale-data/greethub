import { Suspense } from "react";
import { AddressesPage } from "@/components/shop/Account";

export default function Page() {
  return (
    <Suspense>
      <AddressesPage />
    </Suspense>
  );
}
