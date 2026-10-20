"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, ExternalLink, Plus } from "lucide-react";
import { brandsService } from "@/services/brands";
import { DataTable, FormSection, type Column } from "@/components/shared/admin-primitives";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PrototypeNotice } from "@/components/shared/prototype-notice";
import { FormField, Select, TextInput } from "@/components/forms/fields";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Brand } from "@/types";

/* ------------------------------ helpers --------------------------- */

const ACCENT_DOT: Record<Brand["accent"], string> = {
  violet: "bg-violet-glow",
  ice: "bg-ice",
  magenta: "bg-magenta-glow",
};

const ACCENT_OPTIONS: Array<{ value: Brand["accent"]; label: string }> = [
  { value: "violet", label: "Violet" },
  { value: "ice", label: "Ice" },
  { value: "magenta", label: "Magenta" },
];

function TableSkeleton() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-2xl border border-line">
      <div className="h-11 border-b border-line bg-white/[0.02]" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border-b border-line/60 px-4 py-4 last:border-0">
          <div className="h-4 w-full max-w-sm animate-pulse rounded bg-white/[0.05]" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------- view ----------------------------- */

export function BrandsView() {
  const [brands, setBrands] = useState<Brand[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newAccent, setNewAccent] = useState<Brand["accent"]>("violet");
  const { toast } = useToast();

  useEffect(() => {
    let alive = true;
    Promise.all([brandsService.brands(), brandsService.itemCounts()])
      .then(([b, c]) => {
        if (alive) {
          setBrands(b.map((row) => ({ ...row })));
          setCounts(c);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load brands.");
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

  const patchRow = (id: string, p: Partial<Brand>) =>
    setBrands((prev) => (prev ? prev.map((b) => (b.id === id ? { ...b, ...p } : b)) : prev));

  const addBrand = () => {
    const name = newName.trim();
    const slug = newSlug.trim();
    if (!name || !slug) {
      toast({ variant: "destructive", title: "Name and slug are required", description: "Fill both fields before adding the brand." });
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      toast({ variant: "destructive", title: "Invalid slug", description: "Use lowercase letters, numbers and hyphens only." });
      return;
    }
    setBrands((prev) => [
      ...(prev ?? []),
      {
        id: `brand-new-${Date.now()}`,
        slug,
        name,
        tagline: "Added in this view — not saved yet.",
        blurb: "Brand added from the console.",
        description: "Added in this view — not saved to the brand directory yet.",
        origin: "—",
        established: "—",
        featured: false,
        accent: newAccent,
      },
    ]);
    setCounts((prev) => ({ ...(prev ?? {}), [slug]: 0 }));
    setNewName("");
    setNewSlug("");
    setNewAccent("violet");
    toast({ title: "Not saved yet", description: `${name} was added to this view only — brand writes are not wired into the console yet.` });
  };

  const columns: Column<Brand>[] = [
    {
      key: "name",
      header: "Brand",
      sortable: true,
      sortValue: (row) => row.name,
      cell: (row) => (
        <span className="block">
          <span className="block font-medium text-foreground">{row.name}</span>
          <span className="mt-0.5 block max-w-xs truncate text-[0.76rem] text-muted-foreground">{row.tagline}</span>
        </span>
      ),
    },
    {
      key: "slug",
      header: "Slug",
      sortable: true,
      sortValue: (row) => row.slug,
      cell: (row) => <code className="font-mono text-[0.78rem] text-muted-foreground">{row.slug}</code>,
    },
    {
      key: "origin",
      header: "Origin",
      sortable: true,
      sortValue: (row) => row.origin,
      cell: (row) => (
        <span className="text-muted-foreground">
          {row.origin}
          <span className="block text-[0.74rem] text-muted-foreground/70">est. {row.established}</span>
        </span>
      ),
    },
    {
      key: "products",
      header: "Products",
      sortable: true,
      sortValue: (row) => counts?.[row.slug] ?? 0,
      className: "text-center",
      cell: (row) => <span className="text-muted-foreground">{counts?.[row.slug] ?? 0}</span>,
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
            onChange={(e) => patchRow(row.id, { accent: e.target.value as Brand["accent"] })}
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
    {
      key: "public",
      header: "Public page",
      cell: (row) => (
        <Link
          href={`/brand/${row.slug}`}
          className="inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-violet-soft transition-colors hover:text-foreground"
        >
          View
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </Link>
      ),
    },
  ];

  const hasNew = Boolean(newName.trim() || newSlug.trim());

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <h1 className="font-display text-h2 font-bold tracking-tight text-foreground">Brands</h1>
        <p className="mt-1.5 max-w-2xl text-[0.92rem] text-muted-foreground">
          The brand directory — names, taglines, origins, product counts, featured flags and accent colors.
        </p>
      </header>

      <PrototypeNotice>The brand directory reads live from the database. Creating brands and toggling featured or accent from this console are not saved yet.</PrototypeNotice>

      {error ? (
        <ErrorState body={error} onRetry={retry} />
      ) : loading && !brands ? (
        <TableSkeleton />
      ) : brands && brands.length === 0 ? (
        <EmptyState icon={BadgeCheck} title="No brands" body="The brand directory is empty — add one below." />
      ) : brands ? (
        <DataTable
          columns={columns}
          rows={brands}
          initialSort={{ key: "name", dir: "asc" }}
          caption="Storefront brand directory"
          mobileCard={(row) => (
            <div className="rounded-2xl border border-line bg-elevated/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <span>
                  <span className="block font-display text-[0.98rem] font-semibold text-foreground">{row.name}</span>
                  <span className="mt-0.5 block text-[0.78rem] text-muted-foreground">{row.tagline}</span>
                </span>
                <span className={cn("mt-1.5 size-3 shrink-0 rounded-full", ACCENT_DOT[row.accent])} aria-hidden="true" />
              </div>
              <p className="mt-1 font-mono text-[0.76rem] text-muted-foreground">{row.slug}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-3">
                <span className="text-[0.8rem] text-muted-foreground">
                  {counts?.[row.slug] ?? 0} products · {row.origin} · est. {row.established}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Switch checked={Boolean(row.featured)} onCheckedChange={(v) => patchRow(row.id, { featured: v })} aria-label={`Feature ${row.name}`} />
                  <Link href={`/brand/${row.slug}`} aria-label={`Open the public page for ${row.name}`} className="text-violet-soft">
                    <ExternalLink className="size-4" aria-hidden="true" />
                  </Link>
                </span>
              </div>
            </div>
          )}
          emptyMessage="No brands match."
        />
      ) : null}

      <FormSection title="Add brand" description="Adds a row to this view — brand writes are not wired into the console yet.">
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_10.5rem_auto]">
          <FormField label="Name" htmlFor="new-brand-name">
            <TextInput id="new-brand-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Nasty Juice" className="h-10" />
          </FormField>
          <FormField label="Slug" htmlFor="new-brand-slug" hint="Lowercase letters, numbers, hyphens.">
            <TextInput id="new-brand-slug" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="nasty-juice" className="h-10 font-mono text-[0.84rem]" />
          </FormField>
          <FormField label="Accent" htmlFor="new-brand-accent">
            <Select id="new-brand-accent" value={newAccent} onChange={(e) => setNewAccent(e.target.value as Brand["accent"])} className="h-10">
              {ACCENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FormField>
          <button
            type="button"
            onClick={addBrand}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-medium transition-all",
              hasNew ? "bg-primary text-primary-foreground hover:brightness-110" : "border border-line text-muted-foreground hover:text-foreground"
            )}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add brand
          </button>
        </div>
      </FormSection>
    </div>
  );
}
