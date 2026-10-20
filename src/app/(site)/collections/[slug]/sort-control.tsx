"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ItemGrid } from "@/components/shared/item-grid";
import { Select } from "@/components/forms/fields";
import { SORT_OPTION_LIST, sortCatalogItems, type SortKey } from "@/lib/catalog-sort";
import { scrollIntoViewSmooth } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { CatalogItem } from "@/types";

const PAGE_SIZE = 12;

/**
 * CategorySortControl — small client island that sorts an in-memory copy of
 * the server-provided collection items and renders the grid paginated
 * (12 per page) with a compact chip-style pager. Changing the sort resets
 * to page 1; changing the page scrolls back to the top of the grid
 * (instantly under prefers-reduced-motion).
 */
export function CategorySortControl({ items }: { items: CatalogItem[] }) {
  const [sort, setSort] = useState<SortKey>("featured");
  const [page, setPage] = useState(1);
  const gridAnchorRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(() => sortCatalogItems(items, sort), [items, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [sorted, currentPage]
  );
  const rangeStart = sorted.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, sorted.length);

  const onSortChange = (next: string) => {
    setSort(next as SortKey);
    setPage(1); // re-paginate from the top whenever the order changes
  };

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(next, 1), pageCount));
    // Let the new page render, then bring the top of the grid into view
    // (instantly under prefers-reduced-motion — shared helper).
    requestAnimationFrame(() => scrollIntoViewSmooth(gridAnchorRef.current));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-[0.8rem] text-muted-foreground">
          {sorted.length > 0
            ? `Showing ${rangeStart}\u2013${rangeEnd} of ${sorted.length} products`
            : "No products in this collection yet"}
        </p>
        <label className="flex items-center gap-2.5 text-[0.8rem] text-muted-foreground">
          <span>Sort</span>
          <Select
            aria-label="Sort items in this collection"
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="h-11 w-52 text-[0.8rem]"
          >
            {SORT_OPTION_LIST.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div ref={gridAnchorRef} className="scroll-mt-24">
        <ItemGrid
          items={pageItems}
          columns={3}
          emptyTitle="Nothing in this collection yet"
          emptyBody="New records are added as their documentation completes. Explore the full range in the meantime."
        />
      </div>

      {pageCount > 1 && (
        <nav aria-label="Collection pages" className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line text-muted-foreground transition-colors hover:border-violet-glow/50 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => goToPage(p)}
              aria-current={p === currentPage ? "page" : undefined}
              aria-label={`Page ${p}${p === currentPage ? ", current page" : ""}`}
              className={cn(
                "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border px-3 text-sm font-medium transition-colors",
                p === currentPage
                  ? "border-violet-glow/60 bg-violet-glow/15 text-foreground shadow-[0_0_12px_rgba(139,92,246,0.25)]"
                  : "border-line text-muted-foreground hover:border-violet-glow/50 hover:text-foreground"
              )}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === pageCount}
            aria-label="Next page"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line text-muted-foreground transition-colors hover:border-violet-glow/50 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}
