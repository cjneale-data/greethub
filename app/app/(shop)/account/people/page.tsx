import { Suspense } from "react";
import { PeoplePage } from "@/components/shop/Account";

export default function Page() {
  return (
    <Suspense>
      <PeoplePage />
    </Suspense>
  );
}
