"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PackageSearch, Search } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { PageContainer } from "@/components/layout/page-container";
import { CategoryCard } from "@/components/shared/category-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { CardGridSkeleton } from "@/components/shared/loading-indicator";
import { ItemGrid } from "@/components/shared/item-grid";
import { FilterBar, Pagination } from "@/components/shared/admin-primitives";
import { Select } from "@/components/forms/fields";
import { catalogService } from "@/services/catalog";
import { SORT_OPTIONS, type SortKey } from "@/lib/catalog-sort";
import { scrollIntoViewSmooth } from "@/lib/motion";
import type { Availability, CatalogCategory, CatalogItem, Paginated } from "@/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 9;

type SortValue = SortKey;
type AvailabilityFilter = Availability | "all";

const AVAILABILITY_OPTIONS: Array<{ value: AvailabilityFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "in_stock", label: "Available" },
  { value: "low_stock", label: "Low stock" },
  { value: "out_of_stock", label: "Out of stock" },
];

interface DiscoverState {
  key: string;
  status: "ready" | "error";
  data: Paginated<CatalogItem> | null;
}

export function DiscoverView() {
  const router = useRouter();

  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortValue>("featured");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [page, setPage] = useState(1);
  const [retryTick, setRetryTick] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [state, setState] = useState<DiscoverState>({ key: "", status: "ready", data: null });
  const [categories, setCategories] = useState<CatalogCategory[]>([]);

  const requestKey = `${category}|${sort}|${availability}|${page}|${retryTick}`;
  const isLoading = state.key !== requestKey;
  const categoryChips = [{ slug: "all", name: "All" }, ...categories.map((c) => ({ slug: c.slug, name: c.name }))];

  useEffect(() => {
    let cancelled = false;
    // Items + collections resolve together so the chips and grid stay
    // in sync; both come from the catalog service (no data imports).
    Promise.all([
      catalogService.items({
        categorySlug: category === "all" ? undefined : category,
        sort,
        availability,
        page,
        pageSize: PAGE_SIZE,
      }),
      catalogService.categories().catch(() => [] as CatalogCategory[]),
    ])
      .then(([data, cats]) => {
        if (cancelled) return;
        setCategories(cats);
        setState({ key: requestKey, status: "ready", data });
      })
      .catch(() => {
        if (!cancelled) setState({ key: requestKey, status: "error", data: null });
      });
    return () => {
      cancelled = true;
    };
  }, [category, sort, availability, page, retryTick, requestKey]);

  // Scroll back to the top of the results when the page changes.
  const resultsRef = useRef<HTMLElement | null>(null);
  const skipScroll = useRef(true);
  useEffect(() => {
    if (skipScroll.current) {
      skipScroll.current = false;
      return;
    }
    scrollIntoViewSmooth(resultsRef.current);
  }, [page]);
  const selectCategory = (slug: string) => {
    setCategory(slug);
    setPage(1);
  };

  const resetFilters = () => {
    setCategory("all");
    setSort("featured");
    setAvailability("all");
    setPage(1);
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  const data = state.data;

  return (
    <PageContainer>
      <PageHeading
        eyebrow="Vapetive"
        title="Discover the range"
        lead="Every product we stock — heat-not-burn tobacco sticks for IQOS ILUMA across every origin line. Filter by collection, sort and search the full range."
      />

      {/* Search entry — navigates to the dedicated search route */}
      <form role="search" onSubmit={onSearchSubmit} className="pb-8">
        <div className="relative flex max-w-xl items-center">
          <Search className="pointer-events-none absolute left-4 size-[1.05rem] text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search products, flavours, collections…"
            aria-label="Search the catalog"
            className="h-12 w-full rounded-full border border-line bg-foreground/[0.03] pl-11 pr-24 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-violet-glow/50 focus:outline-none"
          />
          <button
            type="submit"
            className="absolute right-1.5 inline-flex h-9 items-center rounded-full bg-primary px-5 text-[0.8rem] font-medium text-primary-foreground transition-all hover:brightness-110"
          >
            Search
          </button>
        </div>
      </form>

      {/* Category chips — horizontally scrollable on small screens */}
      <div
        role="group"
        aria-label="Filter by collection"
        className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
      >
        {categoryChips.map((chip) => {
          const active = category === chip.slug;
          return (
            <button
              key={chip.slug}
              type="button"
              aria-pressed={active}
              onClick={() => selectCategory(chip.slug)}
              className={cn(
                "min-h-11 shrink-0 whitespace-nowrap rounded-full border px-4 text-[0.8rem] font-medium transition-colors",
                active
                  ? "border-violet-glow/50 bg-violet-glow/15 text-foreground"
                  : "border-line text-muted-foreground hover:border-line-strong hover:text-foreground"
              )}
            >
              {chip.name}
            </button>
          );
        })}
      </div>

      {/* Sort + availability controls */}
      <div className="mb-10 mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="flex items-center gap-2.5 text-[0.8rem] text-muted-foreground">
          <span>Sort</span>
          <Select
            aria-label="Sort items"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortValue);
              setPage(1);
            }}
            className="h-11 w-44 text-[0.8rem]"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>
        <FilterBar
          options={AVAILABILITY_OPTIONS}
          value={availability}
          onChange={(next) => {
            setAvailability(next);
            setPage(1);
          }}
          ariaLabel="Filter by availability"
        />
      </div>

      {/* Collections intro — only on the unfiltered view */}
      {category === "all" && (
        <section aria-labelledby="collections-heading" className="pb-4">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 id="collections-heading" className="font-display text-h3 font-semibold text-foreground">
              Collections
            </h2>
            <Link
              href="/collections"
              className="shrink-0 text-[0.8rem] text-muted-foreground transition-colors hover:text-foreground"
            >
              All collections
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {categories.map((c, i) => (
              <CategoryCard key={c.id} category={c} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Results */}
      <section ref={resultsRef} aria-label="Catalog results" aria-busy={isLoading} className="scroll-mt-24 pt-10">
        <p aria-live="polite" className="mb-5 min-h-5 text-[0.8rem] text-muted-foreground">
          {isLoading
            ? "Updating results\u2026"
            : data
              ? `Showing ${data.items.length} of ${data.total} ${data.total === 1 ? "product" : "products"}`
              : ""}
        </p>

        {isLoading ? (
          <CardGridSkeleton count={8} />
        ) : state.status === "error" ? (
          <ErrorState onRetry={() => setRetryTick((t) => t + 1)} />
        ) : data && data.items.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="Nothing matches these filters"
            body="Try a different category, widen the availability filter, or clear everything and start again."
            actionLabel="Clear filters"
            onAction={resetFilters}
          />
        ) : data ? (
          <ItemGrid items={data.items} columns={3} />
        ) : null}

        {state.status === "ready" && data && data.total > PAGE_SIZE && (
          <div className="mt-12">
            <Pagination
              page={data.page}
              pageCount={Math.ceil(data.total / PAGE_SIZE)}
              onChange={setPage}
              ariaLabel="Catalog result pages"
            />
          </div>
        )}
      </section>

      <div className="pb-8" />
    </PageContainer>
  );
}
