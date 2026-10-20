"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { adminService } from "@/services/admin";
import type { OrderStatus, OrderSummary } from "@/types";
import { DataTable, FilterBar, type Column } from "@/components/shared/admin-primitives";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PrototypeNotice } from "@/components/shared/prototype-notice";
import { formatDateTime } from "@/lib/format";
import Link from "next/link";

type OrderRow = OrderSummary & { id: string };

const STATUS_OPTIONS: Array<{ value: OrderStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "placed", label: "Placed" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5" aria-hidden="true">
      <div className="skeleton-sheen h-11 rounded-xl border border-line bg-white/[0.02]" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-sheen h-14 rounded-xl border border-line bg-white/[0.02]" />
      ))}
    </div>
  );
}

export function OrdersView() {
  const [state, setState] = useState<"loading" | "error" | "ready">("loading");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    adminService
      .orders()
      .then((list) => {
        if (alive) {
          setOrders(list.map((o) => ({ ...o, id: o.reference })));
          setState("ready");
        }
      })
      .catch(() => {
        if (alive) setState("error");
      });
    return () => {
      alive = false;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState("loading");
    setAttempt((a) => a + 1);
  }, []);

  const filtered = useMemo(
    () => (status === "all" ? orders : orders.filter((o) => o.status === status)),
    [orders, status]
  );

  const columns = useMemo<Column<OrderRow>[]>(
    () => [
      {
        key: "reference",
        header: "Reference",
        sortable: true,
        sortValue: (o) => o.reference,
        cell: (o) => (
          <Link
            href={`/admin/orders/${o.reference}`}
            className="font-mono text-[0.82rem] font-medium text-foreground underline-offset-4 hover:text-violet-soft hover:underline"
          >
            {o.reference}
          </Link>
        ),
      },
      {
        key: "placedAt",
        header: "Placed",
        sortable: true,
        sortValue: (o) => o.placedAt,
        cell: (o) => <span className="text-muted-foreground">{formatDateTime(o.placedAt)}</span>,
      },
      {
        key: "items",
        header: "Items",
        cell: (o) => (
          <div>
            <span className="font-medium text-foreground">{o.itemCount}</span>
            <span className="ml-2 hidden text-[0.78rem] text-muted-foreground lg:inline">
              {o.itemsPreview.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
            </span>
          </div>
        ),
      },
      { key: "status", header: "Status", sortable: true, sortValue: (o) => o.status, cell: (o) => <OrderStatusBadge status={o.status} /> },
      // Total sorts numerically on the parsed AED amount, not lexicographically on the label.
      { key: "totalLabel", header: "Total", sortable: true, sortValue: (o) => Number(o.totalLabel.replace(/[^0-9.]/g, "")), cell: (o) => <span className="font-medium text-foreground">{o.totalLabel}</span> },
    ],
    []
  );

  const mobileCard = useCallback(
    (o: OrderRow) => (
      <div className="rounded-2xl border border-line bg-elevated/40 p-4">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/admin/orders/${o.reference}`}
            className="font-mono text-[0.85rem] font-medium text-foreground underline-offset-4 hover:text-violet-soft hover:underline"
          >
            {o.reference}
          </Link>
          <OrderStatusBadge status={o.status} />
        </div>
        <p className="mt-1.5 text-[0.78rem] text-muted-foreground">Placed {formatDateTime(o.placedAt)}</p>
        <p className="mt-1.5 text-[0.82rem] text-foreground">{o.itemsPreview.map((i) => `${i.quantity}× ${i.name}`).join(", ")}</p>
        <div className="mt-2.5 flex items-center justify-between text-[0.8rem]">
          <span className="text-muted-foreground">{o.itemCount} item{o.itemCount === 1 ? "" : "s"}</span>
          <span className="font-medium text-foreground">{o.totalLabel}</span>
        </div>
      </div>
    ),
    []
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="space-y-2">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-violet-soft">People</p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Orders</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Orders placed on the storefront — references, items, status and totals. Status transitions are audited.
        </p>
      </header>

      <PrototypeNotice>Live order records — new orders arrive at checkout and appear here in real time.</PrototypeNotice>

      <FilterBar options={STATUS_OPTIONS} value={status} onChange={setStatus} ariaLabel="Filter orders by status" />

      {state === "loading" && <TableSkeleton />}
      {state === "error" && (
        <ErrorState
          title="Orders unavailable"
          body="The order service could not be reached. Try again to reload the records."
          onRetry={retry}
        />
      )}
      {state === "ready" && filtered.length === 0 && (
        <EmptyState
          icon={ShoppingBag}
          title="No orders match"
          body="No orders match the selected status. Choose All to see every order."
        />
      )}
      {state === "ready" && filtered.length > 0 && (
        <DataTable
          columns={columns}
          rows={filtered}
          initialSort={{ key: "placedAt", dir: "desc" }}
          caption="Order records with reference, placement date, items, status and total"
          mobileCard={mobileCard}
        />
      )}
    </div>
  );
}
