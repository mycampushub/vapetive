import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentIdentity } from "@/server/auth-context";
import { hasPermission } from "@/server/rbac";
import { adminOrderDetailBundle } from "@/server/repos/orders";
import { EmptyState } from "@/components/shared/empty-state";
import { OrderDetailView } from "./order-detail-view";

export const metadata: Metadata = {
  title: "Order detail",
};

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ reference: string }> }) {
  // Per-page permission gate (QA audit): order records require orders.read.
  const identity = await getCurrentIdentity();
  if (!identity || !hasPermission(identity.roles, "orders.read")) redirect("/admin");

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
