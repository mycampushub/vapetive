"use client";

import { useEffect, useState } from "react";
import { Plus, Tags } from "lucide-react";
import { catalogService } from "@/services/catalog";
import { DataTable, FormSection, type Column } from "@/components/shared/admin-primitives";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PrototypeNotice } from "@/components/shared/prototype-notice";
import { FormField, Select, TextInput } from "@/components/forms/fields";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { CatalogCategory } from "@/types";

/* ------------------------------ helpers --------------------------- */

const ACCENT_DOT: Record<CatalogCategory["accent"], string> = {
  violet: "bg-violet-glow",
  ice: "bg-ice",
  magenta: "bg-magenta-glow",
};

const ACCENT_OPTIONS: Array<{ value: CatalogCategory["accent"]; label: string }> = [
  { value: "violet", label: "Violet" },
  { value: "ice", label: "Ice" },
  { value: "magenta", label: "Magenta" },
];

function TableSkeleton() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-2xl border border-line">
      <div className="h-11 border-b border-line bg-white/[0.02]" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="border-b border-line/60 px-4 py-4 last:border-0">
          <div className="h-4 w-full max-w-sm animate-pulse rounded bg-white/[0.05]" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------- view ----------------------------- */

export function CategoriesView() {
  const [categories, setCategories] = useState<CatalogCategory[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newAccent, setNewAccent] = useState<CatalogCategory["accent"]>("violet");
  const { toast } = useToast();

  useEffect(() => {
    let alive = true;
    catalogService
      .categories()
      .then((d) => {
        if (alive) {
          setCategories(d.map((c) => ({ ...c })));
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load categories.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const retry = () => {
    setError(null);
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  const patchRow = (id: string, p: Partial<CatalogCategory>) =>
    setCategories((prev) => (prev ? prev.map((c) => (c.id === id ? { ...c, ...p } : c)) : prev));

  const addCategory = () => {
    const name = newName.trim();
    const slug = newSlug.trim();
    if (!name || !slug) {
      toast({ variant: "destructive", title: "Name and slug are required", description: "Fill both fields before adding the category." });
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      toast({ variant: "destructive", title: "Invalid slug", description: "Use lowercase letters, numbers and hyphens only." });
      return;
    }
    setCategories((prev) => [
      ...(prev ?? []),
      { id: `cat-new-${Date.now()}`, slug, name, description: "Added in this view — not saved to the catalog yet.", itemCount: 0, featured: false, accent: newAccent },
    ]);
    setNewName("");
    setNewSlug("");
    setNewAccent("violet");
    toast({ title: "Not saved yet", description: `${name} was added to this view only — category writes are not wired into the console yet.` });
  };

  const columns: Column<CatalogCategory>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      sortValue: (row) => row.name,
      cell: (row) => <span className="font-medium text-foreground">{row.name}</span>,
    },
    {
      key: "slug",
      header: "Slug",
      sortable: true,
      sortValue: (row) => row.slug,
      cell: (row) => <code className="font-mono text-[0.78rem] text-muted-foreground">{row.slug}</code>,
    },
    {
      key: "itemCount",
      header: "Products",
      sortable: true,
      sortValue: (row) => row.itemCount,
      className: "text-center",
      cell: (row) => <span className="text-muted-foreground">{row.itemCount}</span>,
    },
    {
      key: "featured",
      header: "Featured",
      cell: (row) => (
        <span className="inline-flex items-center gap-2">
          <Switch checked={Boolean(row.featured)} onCheckedChange={(v) => patchRow(row.id, { featured: v })} aria-label={`Feature ${row.name}`} />
          <span className="text-[0.76rem] text-muted-foreground">{row.featured ? "Featured" : "Standard"}</span>
        </span>
      ),
    },
    {
      key: "accent",
      header: "Accent",
      cell: (row) => (
        <span className="inline-flex items-center gap-2">
          <span className={cn("size-3 shrink-0 rounded-full", ACCENT_DOT[row.accent])} aria-hidden="true" />
          <Select
            aria-label={`Accent for ${row.name}`}
            value={row.accent}
            onChange={(e) => patchRow(row.id, { accent: e.target.value as CatalogCategory["accent"] })}
            className="h-9 w-32 text-[0.82rem]"
          >
            {ACCENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </span>
      ),
    },
  ];

  const hasNew = Boolean(newName.trim() || newSlug.trim());

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <h1 className="font-display text-h2 font-bold tracking-tight text-foreground">Categories</h1>
        <p className="mt-1.5 max-w-2xl text-[0.92rem] text-muted-foreground">
          Category taxonomy — names, slugs, product counts, featured flags and accent colors.
        </p>
      </header>

      <PrototypeNotice>The category list reads live from the catalog database. Creating categories and toggling featured or accent from this console are not saved yet.</PrototypeNotice>

      {error ? (
        <ErrorState body={error} onRetry={retry} />
      ) : loading && !categories ? (
        <TableSkeleton />
      ) : categories && categories.length === 0 ? (
        <EmptyState icon={Tags} title="No categories" body="No categories in the catalog yet." />
      ) : categories ? (
        <DataTable
          columns={columns}
          rows={categories}
          initialSort={{ key: "name", dir: "asc" }}
          caption="Catalog categories"
          mobileCard={(row) => (
            <div className="rounded-2xl border border-line bg-elevated/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="font-display text-[0.98rem] font-semibold text-foreground">{row.name}</span>
                <span className={cn("mt-1.5 size-3 shrink-0 rounded-full", ACCENT_DOT[row.accent])} aria-hidden="true" />
              </div>
              <p className="mt-1 font-mono text-[0.76rem] text-muted-foreground">{row.slug}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-3">
                <span className="text-[0.8rem] text-muted-foreground">{row.itemCount} products</span>
                <span className="inline-flex items-center gap-2">
                  <Switch checked={Boolean(row.featured)} onCheckedChange={(v) => patchRow(row.id, { featured: v })} aria-label={`Feature ${row.name}`} />
                  <Select
                    aria-label={`Accent for ${row.name}`}
                    value={row.accent}
                    onChange={(e) => patchRow(row.id, { accent: e.target.value as CatalogCategory["accent"] })}
                    className="h-9 w-28 text-[0.8rem]"
                  >
                    {ACCENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </span>
              </div>
            </div>
          )}
          emptyMessage="No categories match."
        />
      ) : null}

      <FormSection title="Add category" description="Adds a row to this view — category writes are not wired into the console yet.">
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_10.5rem_auto]">
          <FormField label="Name" htmlFor="new-cat-name">
            <TextInput id="new-cat-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Batteries" className="h-10" />
          </FormField>
          <FormField label="Slug" htmlFor="new-cat-slug" hint="Lowercase letters, numbers, hyphens.">
            <TextInput id="new-cat-slug" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="batteries" className="h-10 font-mono text-[0.84rem]" />
          </FormField>
          <FormField label="Accent" htmlFor="new-cat-accent">
            <Select id="new-cat-accent" value={newAccent} onChange={(e) => setNewAccent(e.target.value as CatalogCategory["accent"])} className="h-10">
              {ACCENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FormField>
          <button
            type="button"
            onClick={addCategory}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-medium transition-all",
              hasNew ? "bg-primary text-primary-foreground hover:brightness-110" : "border border-line text-muted-foreground hover:text-foreground"
            )}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add category
          </button>
        </div>
      </FormSection>
    </div>
  );
}
