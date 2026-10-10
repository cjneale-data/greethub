import { Suspense } from "react";
import { ProfilePage } from "@/components/shop/Account";

export default function Page() {
  return (
    <Suspense>
      <ProfilePage />
    </Suspense>
  );
}
