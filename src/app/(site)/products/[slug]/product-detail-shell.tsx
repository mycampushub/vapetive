"use client";

import { useState, type ReactNode } from "react";
import { ItemGallery } from "@/components/shared/item-gallery";
import { ProductOrderActions } from "./product-order-actions";
import { initialVariantSelection, type VariantSelection } from "./variant-picker";
import type { CatalogItem } from "@/types";

/**
 * ProductDetailShell — client wrapper around the product page's two-column
 * grid. Owns the variant selection so the gallery (left column) and the
 * order actions (right column) stay in sync: picking a colour or origin
 * pill promotes that option's photo to the front of the gallery.
 *
 * The highlighted photo follows the option the visitor touched last:
 * choosing a colour/origin swaps the image, choosing a flavour keeps the
 * current photo (flavours never change how the product looks), and picking
 * a colour/origin without a photo restores the default catalog order.
 *
 * The server-rendered info column (brand chip, price, badges) is passed
 * through as `children` and re-renders without losing its server output.
 */
export function ProductDetailShell({ item, children }: { item: CatalogItem; children: ReactNode }) {
  const [selection, setSelection] = useState<VariantSelection>(() => initialVariantSelection(item.variants));
  /** Photo of the last-touched colour/origin with imagery; null = default order. */
  const [highlightImage, setHighlightImage] = useState<string | null>(null);

  const handleSelectionChange = (next: VariantSelection, changedType?: string) => {
    setSelection(next);
    if (changedType === "color" || changedType === "origin") {
      const variant = item.variants.find((v) => v.id === next[changedType]);
      setHighlightImage(variant?.imageUrl ?? null);
    }
    // Other groups (flavour/capacity/nicotine) never drive imagery, and
    // re-clicking a selected colour/origin re-applies its photo.
  };

  return (
    <div className="grid gap-10 pt-8 lg:grid-cols-2">
      {/* Gallery */}
      <div>
        <ItemGallery images={item.images} name={item.name} highlightImage={highlightImage ?? undefined} />
      </div>

      {/* Info column — server content first, ordering island beneath. */}
      <div className="flex flex-col gap-5">
        {children}
        <ProductOrderActions item={item} selection={selection} onSelectionChange={handleSelectionChange} />
      </div>
    </div>
  );
}
