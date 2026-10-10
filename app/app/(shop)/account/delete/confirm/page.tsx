import { Suspense } from "react";
import { DeleteConfirm } from "@/components/shop/Account";

export default function Page() {
  return (
    <Suspense>
      <DeleteConfirm />
    </Suspense>
  );
}
