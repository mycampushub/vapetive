"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Zap } from "lucide-react";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { cartService } from "@/services/cart";
import { VariantPicker, initialVariantSelection, primaryVariantId, type VariantSelection } from "./variant-picker";
import type { CatalogItem } from "@/types";
import { formatAED, cn } from "@/lib/utils";

/**
 * ProductOrderActions — the ordering island for the product page.
 * Owns the variant selection (passed down to the controlled
 * VariantPicker) and the Add to cart / Buy now actions.
 * Uses the in-memory cart store; blocked products or
 * variants disable ordering with an explanatory label.
 */
export function ProductOrderActions({ item }: { item: CatalogItem }) {
  const router = useRouter();
  const { toast } = useToast();
  const [selection, setSelection] = useState<VariantSelection>(() => initialVariantSelection(item.variants));

  const selectedVariant = useMemo(() => {
    const id = primaryVariantId(selection);
    return id ? (item.variants.find((variant) => variant.id === id) ?? null) : null;
  }, [selection, item.variants]);

  const productBlocked = item.availability === "out_of_stock" || item.availability === "unavailable";
  const variantBlocked = selectedVariant ? !selectedVariant.available : false;
  const canOrder = !productBlocked && !variantBlocked;
  const displayName = selectedVariant ? `${item.name} — ${selectedVariant.label}` : item.name;

  const addToCart = () => {
    if (!canOrder) return;
    cartService.addItem(item.slug, selectedVariant?.id ?? null, 1);
    toast({
      title: "Added to cart",
      description: `${displayName} · ${formatAED(item.price)}`,
      action: <ToastAction altText="View cart" onClick={() => router.push("/cart")}>View cart</ToastAction>,
    });
  };

  const buyNow = () => {
    if (!canOrder) return;
    cartService.addItem(item.slug, selectedVariant?.id ?? null, 1);
    router.push("/checkout");
  };

  return (
    <>
      <VariantPicker variants={item.variants} value={selection} onChange={setSelection} />

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={addToCart}
            disabled={!canOrder}
            className={cn(
              "neon-glow-btn hover:neon-glow-btn-hover inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold uppercase tracking-[0.08em] text-primary-foreground transition-transform hover:-translate-y-0.5",
              !canOrder && "pointer-events-none opacity-50"
            )}
          >
            <ShoppingBag className="size-4" aria-hidden="true" />
            {productBlocked ? "Currently unavailable" : "Add to cart"}
          </button>
          <button
            type="button"
            onClick={buyNow}
            disabled={!canOrder}
            className={cn(
              "inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-line-strong px-6 text-sm font-semibold text-foreground transition-colors hover:border-violet-glow/50 hover:bg-foreground/[0.04]",
              !canOrder && "pointer-events-none opacity-50"
            )}
          >
            <Zap className="size-4 text-violet-soft" aria-hidden="true" />
            Buy now
          </button>
        </div>
        <p className="text-center text-[0.72rem] leading-relaxed text-muted-foreground sm:text-left">
          Free standard delivery at AED 200 or more · 18+ ID-verified delivery · Cash &amp; card on delivery
        </p>
      </div>
    </>
  );
}
