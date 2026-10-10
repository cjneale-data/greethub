import { Suspense } from "react";
import type { Metadata } from "next";
import { Browse } from "@/components/shop/Browse";
import { SkeletonList } from "@/components/shop/ui";

export const metadata: Metadata = { title: "Browse cards and picture books | GreetHub" };

export default function BrowsePage() {
  return (
    <div className="gs-page">
      <Suspense fallback={<SkeletonList rows={2} h={220} />}>
        <Browse />
      </Suspense>
    </div>
  );
}
