"use client";

import { Loader2, ShoppingBag } from "lucide-react";
import { AvailabilityBadge } from "@/components/shared/status-badge";
import type { Availability } from "@/types";
import { formatAED, cn } from "@/lib/utils";

/**
 * MobileSummary — fixed product order bar for < md screens only (from md up
 * the info column already renders the full order actions inline, so the bar
 * would just overlay the footer). Sits above the mobile bottom navigation:
 * nav height (3.5rem + safe-area) mirrored in the bottom offset. Rendered
 * from ProductOrderActions so it always agrees with the selected variant.
 */
export function MobileSummary({
  name,
  availability,
  price,
  onAdd,
  canAdd,
  adding = false,
}: {
  name: string;
  availability: Availability;
  price: number;
  onAdd: () => void;
  canAdd: boolean;
  adding?: boolean;
}) {
  return (
    <div
      className="glass-strong fixed inset-x-0 bottom-[calc(3.5rem_+_max(env(safe-area-inset-bottom,0px),0.25rem))] z-40 flex items-center justify-between gap-3 border-t px-4 py-3 md:hidden"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate text-sm font-medium text-foreground">{name}</span>
        <span className="flex items-center gap-2.5">
          <span className="font-display text-[0.95rem] font-semibold text-foreground">{formatAED(price)}</span>
          <AvailabilityBadge availability={availability} />
        </span>
      </div>
      <button
        type="button"
        onClick={onAdd}
        disabled={!canAdd || adding}
        aria-label={`Add ${name} to cart`}
        className={cn(
          "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-primary px-5 text-[0.82rem] font-semibold text-primary-foreground transition-all hover:brightness-110",
          (!canAdd || adding) && "cursor-not-allowed opacity-50"
        )}
      >
        {adding ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <ShoppingBag className="size-4" aria-hidden="true" />
        )}
        Add to cart
      </button>
    </div>
  );
}
