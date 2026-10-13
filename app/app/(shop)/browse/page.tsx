import { Suspense } from "react";
import { Browse } from "@/components/shop/Browse";
import { SkeletonList } from "@/components/shop/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Browse cards and picture books | GreetHub",
  description: "Starter ideas for birthday, new baby, thank-you, get-well, wedding and holiday cards, plus picture books. Pick one and make it yours.",
  path: "/browse",
});

export default function BrowsePage() {
  return (
    <div className="gs-page">
      <Suspense fallback={<SkeletonList rows={2} h={220} />}>
        <Browse />
      </Suspense>
    </div>
  );
}
