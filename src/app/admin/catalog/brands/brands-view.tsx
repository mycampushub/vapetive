"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, ExternalLink, Plus, Trash2 } from "lucide-react";
import { adminService } from "@/services/admin";
import { brandsService } from "@/services/brands";
import { DataTable, FormSection, type Column } from "@/components/shared/admin-primitives";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FormField, Select, TextInput } from "@/components/forms/fields";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Brand } from "@/types";

/* ------------------------------ helpers --------------------------- */

type BrandRow = Brand & { productCount: number };

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
  const [brands, setBrands] = useState<BrandRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [newName, setNewName] = useState("");
  const [newTagline, setNewTagline] = useState("");
  const [newAccent, setNewAccent] = useState<Brand["accent"]>("violet");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BrandRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let alive = true;
    Promise.all([brandsService.brands(), brandsService.itemCounts()])
      .then(([b, counts]) => {
        if (alive) {
          setBrands(b.map((row) => ({ ...row, productCount: counts[row.slug] ?? 0 })));
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

  const patchRow = (id: string, p: Partial<BrandRow>) =>
    setBrands((prev) => (prev ? prev.map((b) => (b.id === id ? { ...b, ...p } : b)) : prev));

  /** Optimistic toggle — reverts and toasts when the API rejects it. */
  const onToggleFeatured = async (row: BrandRow, next: boolean) => {
    patchRow(row.id, { featured: next });
    try {
      await adminService.updateBrand(row.id, { featured: next });
    } catch (error) {
      patchRow(row.id, { featured: row.featured });
      toast({
        variant: "destructive",
        title: "Could not update the brand",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const onChangeAccent = async (row: BrandRow, accent: Brand["accent"]) => {
    const previous = row.accent;
    patchRow(row.id, { accent });
    try {
      await adminService.updateBrand(row.id, { accent });
    } catch (error) {
      patchRow(row.id, { accent: previous });
      toast({
        variant: "destructive",
        title: "Could not update the brand",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const addBrand = async () => {
    const name = newName.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      const created = await adminService.createBrand({
        name,
        ...(newTagline.trim() ? { tagline: newTagline.trim() } : {}),
        accent: newAccent,
      });
      toast({ title: "Brand created", description: `${name} is live at /brand/${created.slug}.` });
      setNewName("");
      setNewTagline("");
      setNewAccent("violet");
      setReloadKey((k) => k + 1);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not create the brand",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await adminService.deleteBrand(deleteTarget.id);
      toast({ title: "Brand deleted", description: `${deleteTarget.name} was removed from the directory.` });
      setDeleteTarget(null);
      setReloadKey((k) => k + 1);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const deleteButton = (row: BrandRow) => (
    <button
      type="button"
      onClick={() => setDeleteTarget(row)}
      aria-label={`Delete ${row.name}`}
      className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-error/10 hover:text-error"
    >
      <Trash2 className="size-4" aria-hidden="true" />
    </button>
  );

  const columns: Column<BrandRow>[] = [
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
          {row.origin || "—"}
          {row.established ? <span className="block text-[0.74rem] text-muted-foreground/70">est. {row.established}</span> : null}
        </span>
      ),
    },
    {
      key: "products",
      header: "Products",
      sortable: true,
      sortValue: (row) => row.productCount,
      className: "text-center",
      cell: (row) => <span className="text-muted-foreground">{row.productCount}</span>,
    },
    {
      key: "featured",
      header: "Featured",
      cell: (row) => (
        <span className="inline-flex items-center gap-2">
          <Switch checked={Boolean(row.featured)} onCheckedChange={(v) => void onToggleFeatured(row, v)} aria-label={`Feature ${row.name}`} />
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
            onChange={(e) => void onChangeAccent(row, e.target.value as Brand["accent"])}
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
      key: "actions",
      header: "",
      className: "w-20 text-right",
      cell: (row) => (
        <span className="inline-flex items-center justify-end gap-1">
          <Link
            href={`/brand/${row.slug}`}
            aria-label={`Open the public page for ${row.name}`}
            className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-violet-soft"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
          </Link>
          {deleteButton(row)}
        </span>
      ),
    },
  ];

  const hasNew = Boolean(newName.trim());

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <h1 className="font-display text-h2 font-bold tracking-tight text-foreground">Brands</h1>
        <p className="mt-1.5 max-w-2xl text-[0.92rem] text-muted-foreground">
          The brand directory — names, taglines, product counts, featured flags and accent colors. Changes save immediately.
        </p>
      </header>

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
                <span className="text-[0.8rem] text-muted-foreground">{row.productCount} products</span>
                <span className="inline-flex items-center gap-2">
                  <Switch checked={Boolean(row.featured)} onCheckedChange={(v) => void onToggleFeatured(row, v)} aria-label={`Feature ${row.name}`} />
                  <Link href={`/brand/${row.slug}`} aria-label={`Open the public page for ${row.name}`} className="text-violet-soft">
                    <ExternalLink className="size-4" aria-hidden="true" />
                  </Link>
                  {deleteButton(row)}
                </span>
              </div>
            </div>
          )}
          emptyMessage="No brands match."
        />
      ) : null}

      <FormSection title="Add brand" description="Creates a real brand with an auto-generated, unique slug.">
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_10.5rem_auto]">
          <FormField label="Name" htmlFor="new-brand-name" required>
            <TextInput id="new-brand-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Nasty Juice" maxLength={80} className="h-10" />
          </FormField>
          <FormField label="Tagline" htmlFor="new-brand-tagline">
            <TextInput id="new-brand-tagline" value={newTagline} onChange={(e) => setNewTagline(e.target.value)} placeholder="Short LED-chip line" maxLength={200} className="h-10" />
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
            onClick={() => void addBrand()}
            disabled={!hasNew || creating}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-medium transition-all disabled:opacity-50",
              hasNew ? "bg-primary text-primary-foreground hover:brightness-110" : "border border-line text-muted-foreground hover:text-foreground"
            )}
          >
            <Plus className="size-4" aria-hidden="true" />
            {creating ? "Adding…" : "Add brand"}
          </button>
        </div>
      </FormSection>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Brands with products attached cannot be deleted — move those products to another brand first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              className="bg-error text-white hover:bg-error/90"
            >
              {deleting ? "Deleting…" : "Delete brand"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
