import { Suspense } from "react";
import { DraftsPage } from "@/components/shop/Account";

export default function Page() {
  return (
    <Suspense>
      <DraftsPage />
    </Suspense>
  );
}
