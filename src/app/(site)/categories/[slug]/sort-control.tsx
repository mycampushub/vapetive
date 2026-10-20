"use client";

import { useMemo, useState } from "react";
import { ItemGrid } from "@/components/shared/item-grid";
import { Select } from "@/components/forms/fields";
import type { CatalogItem } from "@/types";

type SortValue = "featured" | "name-asc" | "name-desc";

/**
 * CategorySortControl — small client island that sorts an in-memory
 * copy of the server-provided category items and renders ItemGrid.
 */
export function CategorySortControl({ items }: { items: CatalogItem[] }) {
  const [sort, setSort] = useState<SortValue>("featured");

  const sorted = useMemo(() => {
    const list = [...items];
    switch (sort) {
      case "name-asc":
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return list.sort((a, b) => b.name.localeCompare(a.name));
      default:
        return list.sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false));
    }
  }, [items, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-[0.8rem] text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"}
        </p>
        <label className="flex items-center gap-2.5 text-[0.8rem] text-muted-foreground">
          <span>Sort</span>
          <Select
            aria-label="Sort items in this category"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortValue)}
            className="h-9 w-44 text-[0.8rem]"
          >
            <option value="featured">Featured</option>
            <option value="name-asc">{"Name A\u2013Z"}</option>
            <option value="name-desc">{"Name Z\u2013A"}</option>
          </Select>
        </label>
      </div>
      <ItemGrid
        items={sorted}
        columns={3}
        emptyTitle="Nothing in this category yet"
        emptyBody="New records are added as their documentation completes. Explore the full range in the meantime."
      />
    </div>
  );
}
