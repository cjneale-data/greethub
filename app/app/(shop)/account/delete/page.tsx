import { Suspense } from "react";
import { DeletePage } from "@/components/shop/Account";

export default function Page() {
  return (
    <Suspense>
      <DeletePage />
    </Suspense>
  );
}
