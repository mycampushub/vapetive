import type { Metadata } from "next";
import { adminOrderDetailBundle } from "@/server/repos/orders";
import { EmptyState } from "@/components/shared/empty-state";
import { OrderDetailView } from "./order-detail-view";

export const metadata: Metadata = {
  title: "Order detail",
};

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const ref = decodeURIComponent(reference);
  const bundle = await adminOrderDetailBundle(ref);

  if (!bundle) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <EmptyState
          title="Order not found"
          body={`No order matches the reference "${ref}". Order references look like VD-20250119-042817.`}
          actionLabel="Back to orders"
          actionHref="/admin/orders"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <OrderDetailView summary={bundle.summary} detail={bundle.detail} />
    </div>
  );
}
