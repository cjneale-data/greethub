import { Suspense } from "react";
import { OrderDetail } from "@/components/shop/Orders";
import { SkeletonList } from "@/components/shop/ui";

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetail id={id} />;
}

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="gs-page">
      <Suspense fallback={<SkeletonList rows={2} h={160} />}>
        <Detail params={params} />
      </Suspense>
    </div>
  );
}
