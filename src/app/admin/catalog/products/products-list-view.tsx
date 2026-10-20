"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Package, Plus } from "lucide-react";
import { catalogService } from "@/services/catalog";
import { DataTable, FilterBar, SearchField, type Column } from "@/components/shared/admin-primitives";
import { AvailabilityBadge, StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PrototypeNotice } from "@/components/shared/prototype-notice";
import { useToast } from "@/hooks/use-toast";
import type { Availability, CatalogCategory, CatalogItem } from "@/types";

/* ------------------------------ helpers --------------------------- */

/** Header CTA — product creation is not wired yet (no POST endpoint); the toast keeps expectations honest. */
function AddProductButton() {
  const { toast } = useToast();
  return (
    <button
      type="button"
      onClick={() =>
        toast({
          title: "Creation not available yet",
          description: "New products are provisioned through the catalog import — existing products are fully editable in this console.",
        })
      }
      className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
    >
      <Plus className="size-4" aria-hidden="true" />
      Add product
    </button>
  );
}


type AvailabilityFilter = Extract<Availability, "in_stock" | "low_stock" | "out_of_stock" | "unavailable">;

const AVAILABILITY_OPTIONS: Array<{ value: AvailabilityFilter | "all"; label: string }> = [
  { value: "all", label: "Any availability" },
  { value: "in_stock", label: "In stock" },
  { value: "low_stock", label: "Low stock" },
  { value: "out_of_stock", label: "Out of stock" },
  { value: "unavailable", label: "Unavailable" },
];

function TableSkeleton() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-2xl border border-line">
      <div className="h-11 border-b border-line bg-white/[0.02]" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border-b border-line/60 px-4 py-4 last:border-0">
          <div className="h-4 w-full max-w-md animate-pulse rounded bg-white/[0.05]" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------- view ----------------------------- */

export function ProductsListView() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | "all">("all");
  const [availability, setAvailability] = useState<AvailabilityFilter | "all">("all");
  const [items, setItems] = useState<CatalogItem[] | null>(null);
  const [categories, setCategories] = useState<CatalogCategory[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    catalogService
      .categories()
      .then((d) => {
        if (alive) setCategories(d);
      })
      .catch(() => {
        /* category chips fall back to raw slugs if this fails */
      });
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    let alive = true;
    catalogService
      .items({ query, categorySlug: category === "all" ? undefined : category, availability, pageSize: 48 })
      .then((d) => {
        if (alive) {
          setItems(d.items);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load products.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [query, category, availability, reloadKey]);

  const onQueryChange = (next: string) => {
    setQuery(next);
    setLoading(true);
  };
  const onCategoryChange = (next: string | "all") => {
    setCategory(next);
    setLoading(true);
  };
  const onAvailabilityChange = (next: AvailabilityFilter | "all") => {
    setAvailability(next);
    setLoading(true);
  };
  const retry = () => {
    setError(null);
    setLoading(true);
    setReloadKey((k) => k + 1);
  };
  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    setAvailability("all");
    setError(null);
    setLoading(true);
  };

  const categoryLabel = (slug: string) => categories?.find((c) => c.slug === slug)?.name ?? slug;

  const columns: Column<CatalogItem>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      sortValue: (row) => row.name,
      cell: (row) => (
        <Link
          href={`/admin/catalog/products/${row.id}`}
          className="font-medium text-foreground transition-colors hover:text-violet-soft"
        >
          {row.name}
        </Link>
      ),
    },
    {
      key: "sku",
      header: "SKU",
      sortable: true,
      sortValue: (row) => row.sku,
      cell: (row) => <code className="font-mono text-[0.78rem] text-muted-foreground">{row.sku}</code>,
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      sortValue: (row) => row.categorySlug,
      cell: (row) => <span className="text-muted-foreground">{categoryLabel(row.categorySlug)}</span>,
    },
    {
      key: "variants",
      header: "Variants",
      sortable: true,
      sortValue: (row) => row.variants.length,
      className: "text-center",
      cell: (row) => <span className="text-muted-foreground">{row.variants.length}</span>,
    },
    {
      key: "availability",
      header: "Availability",
      cell: (row) => <AvailabilityBadge availability={row.availability} />,
    },
    {
      key: "status",
      header: "Status",
      cell: () => (
        <StatusBadge tone="success" icon={CheckCircle2}>
          Published
        </StatusBadge>
      ),
    },
  ];

  const mobileCard = (row: CatalogItem) => (
    <div className="rounded-2xl border border-line bg-elevated/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/admin/catalog/products/${row.id}`} className="font-display text-[0.98rem] font-semibold text-foreground">
          {row.name}
        </Link>
        <AvailabilityBadge availability={row.availability} />
      </div>
      <p className="mt-1 font-mono text-[0.76rem] text-muted-foreground">{row.sku}</p>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-line/60 pt-3 text-[0.8rem] text-muted-foreground">
        <span>
          {categoryLabel(row.categorySlug)} · {row.variants.length} {row.variants.length === 1 ? "variant" : "variants"}
        </span>
        <StatusBadge tone="success" icon={CheckCircle2}>
          Published
        </StatusBadge>
      </div>
    </div>
  );

  const hasFilters = query.trim() !== "" || category !== "all" || availability !== "all";
  const categoryOptions: Array<{ value: string | "all"; label: string }> = [
    { value: "all", label: "All categories" },
    ...(categories ?? []).map((c) => ({ value: c.slug, label: c.name })),
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-violet-soft">Catalog</p>
          <h1 className="mt-1 font-display text-h2 font-bold tracking-tight text-foreground">Products</h1>
          <p className="mt-1.5 max-w-2xl text-[0.92rem] text-muted-foreground">
            Every catalog record with variants, availability and conformity data.
          </p>
        </div>
        <AddProductButton />
      </header>

      <PrototypeNotice>
        Live catalog records from the products database — open a product to edit pricing, copy, stock and publish state.
      </PrototypeNotice>

      <div className="space-y-3">
        <SearchField
          value={query}
          onChange={onQueryChange}
          label="Search products by name, brand or tagline"
          placeholder="Search name, brand or tagline…"
          className="w-full lg:w-80"
        />
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <FilterBar
            options={categoryOptions}
            value={category}
            onChange={onCategoryChange}
            ariaLabel="Filter products by category"
          />
          <FilterBar
            options={AVAILABILITY_OPTIONS}
            value={availability}
            onChange={onAvailabilityChange}
            ariaLabel="Filter products by availability"
          />
        </div>
      </div>

      {error ? (
        <ErrorState body={error} onRetry={retry} />
      ) : loading && !items ? (
        <TableSkeleton />
      ) : items && items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products match"
          body="Try a different search, category or availability filter."
          {...(hasFilters ? { actionLabel: "Clear filters", onAction: clearFilters } : {})}
        />
      ) : items ? (
        <>
          <DataTable
            columns={columns}
            rows={items}
            initialSort={{ key: "name", dir: "asc" }}
            caption="Catalog products"
            mobileCard={mobileCard}
            emptyMessage="No products match the current filters."
          />
          <p className="text-[0.78rem] text-muted-foreground">
            Showing {items.length} catalog records{hasFilters ? " (filtered)" : ""}.
          </p>
        </>
      ) : null}
    </div>
  );
}
