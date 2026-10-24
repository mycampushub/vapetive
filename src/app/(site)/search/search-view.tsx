"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PackageSearch, Search, X } from "lucide-react";
import { PageHeading } from "@/components/layout/page-heading";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingIndicator } from "@/components/shared/loading-indicator";
import { ItemGrid } from "@/components/shared/item-grid";
import { catalogService } from "@/services/catalog";
import type { CatalogCategory, CatalogItem, Paginated } from "@/types";

interface Suggestion {
  slug: string;
  name: string;
  category: string;
}

type ResultsState =
  | { key: string; status: "ready"; data: Paginated<CatalogItem> }
  | { key: string; status: "error" }
  | null;

export function SearchView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = (searchParams.get("q") ?? "").trim();

  const [input, setInput] = useState(initialQ);
  const [committedQ, setCommittedQ] = useState(initialQ);
  const [suggestions, setSuggestions] = useState<{ q: string; items: Suggestion[] } | null>(null);
  const [results, setResults] = useState<ResultsState>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const typedQ = input.trim();
  const resultsKey = `${committedQ}:${retryTick}`;
  const hasQuery = typedQ !== "" || committedQ !== "";
  const searching = hasQuery && (committedQ === "" || results?.key !== resultsKey);

  const categoryName = (slug: string) =>
    categories.find((c) => c.slug === slug)?.name ?? slug.replace(/-/g, " ");

  // Popular-collection chips + suggestion labels resolve through the
  // catalog service (no direct @/data imports in client views).
  useEffect(() => {
    let cancelled = false;
    catalogService
      .categories()
      .then((cats) => {
        if (!cancelled) setCategories(cats);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Sync the input into the URL (q param) on a short debounce.
  useEffect(() => {
    const timer = setTimeout(() => {
      const q = input.trim();
      setCommittedQ(q);
      router.replace(q ? `/search?q=${encodeURIComponent(q)}` : "/search", { scroll: false });
    }, 250);
    return () => clearTimeout(timer);
  }, [input, router]);

  // Live suggestions while typing — slightly faster than the results commit.
  useEffect(() => {
    const q = input.trim();
    if (!q) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      catalogService
        .suggest(q)
        .then((items) => {
          if (!cancelled) setSuggestions({ q, items });
        })
        .catch(() => {
          if (!cancelled) setSuggestions({ q, items: [] });
        });
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [input]);

  // Full results once submitted or debounced.
  useEffect(() => {
    if (!committedQ) return;
    let cancelled = false;
    catalogService
      .items({ query: committedQ, pageSize: 12 })
      .then((data) => {
        if (!cancelled) setResults({ key: `${committedQ}:${retryTick}`, status: "ready", data });
      })
      .catch(() => {
        if (!cancelled) setResults({ key: `${committedQ}:${retryTick}`, status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [committedQ, retryTick]);

  const clearAll = () => {
    setInput("");
    setCommittedQ("");
    setSuggestions(null);
    setResults(null);
    router.replace("/search", { scroll: false });
    inputRef.current?.focus();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCommittedQ(typedQ);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") clearAll();
  };

  const suggestionsVisible =
    typedQ !== "" && typedQ !== committedQ && suggestions?.q === typedQ && suggestions.items.length > 0;

  return (
    <div className="pb-20">
      <PageHeading
        eyebrow="Catalog"
        title="Search"
        lead="Find heat-not-burn sticks and accessories across the full VAPETIVE range. Suggestions appear as you type; results settle just after."
      />

      <div className="relative max-w-2xl">
        <form role="search" onSubmit={onSubmit} className="relative">
          <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search devices, liquids, accessories…"
            aria-label="Search the catalog"
            autoFocus
            className="h-14 w-full rounded-full border border-line bg-foreground/[0.03] pl-14 pr-14 text-lg text-foreground placeholder:text-muted-foreground/60 focus:border-violet-glow/60 focus:outline-none"
          />
          {input !== "" && (
            <button
              type="button"
              onClick={clearAll}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground before:absolute before:-inset-2 before:rounded-full before:content-['']"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </form>

        {suggestionsVisible && (
          <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-line bg-[color:var(--bg-2)] shadow-xl shadow-black/40">
            <p className="px-4 pb-1 pt-3 text-label font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Suggestions
            </p>
            <ul className="p-2 pt-1">
              {suggestions.items.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/products/${s.slug}`}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-foreground/[0.05]"
                  >
                    <span className="min-w-0 truncate">{s.name}</span>
                    <span className="shrink-0 text-meta uppercase tracking-[0.12em] text-muted-foreground">
                      {categoryName(s.category)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {!hasQuery ? (
        <div className="mt-10 flex flex-col items-center gap-5 rounded-3xl border border-dashed border-line-strong bg-foreground/[0.02] px-6 py-14 text-center">
          <h2 className="font-display text-lg font-semibold text-foreground">Search the VAPETIVE catalog</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Look up any device, liquid or accessory. Results update as you type, and every result links to the full
            product listing.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-meta uppercase tracking-[0.14em] text-muted-foreground">Popular collections</span>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/collections/${c.slug}`}
                className="inline-flex min-h-9 items-center rounded-full border border-line px-3.5 text-[0.8rem] text-muted-foreground transition-colors hover:border-violet-glow/50 hover:text-foreground"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="pt-10">
          <p aria-live="polite" className="mb-6 min-h-5 text-[0.8rem] text-muted-foreground">
            {searching
              ? "Searching the catalog…"
              : results?.status === "ready"
                ? `${results.data.total} ${results.data.total === 1 ? "result" : "results"} for “${committedQ}”`
                : ""}
          </p>

          {searching ? (
            <LoadingIndicator label="Searching the catalog" className="py-16" />
          ) : results?.status === "error" ? (
            <ErrorState onRetry={() => setRetryTick((t) => t + 1)} />
          ) : results?.status === "ready" && results.data.items.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title={`No matches for “${committedQ}”`}
              body="Check the spelling or try a broader term — product names, brands and collections are all searchable."
              actionLabel="Clear search"
              onAction={clearAll}
            />
          ) : results?.status === "ready" ? (
            <ItemGrid items={results.data.items} columns={4} />
          ) : null}
        </div>
      )}
    </div>
  );
}
