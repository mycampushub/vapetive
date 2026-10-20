"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Film,
  FolderOpen,
  Hourglass,
  ImageOff,
  Images,
  LayoutGrid,
  List,
  UploadCloud,
} from "lucide-react";
import { mediaService } from "@/services/media";
import { DataTable, FilterBar, SearchField, type Column } from "@/components/shared/admin-primitives";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingIndicator } from "@/components/shared/loading-indicator";
import { PrototypeNotice } from "@/components/shared/prototype-notice";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField, TextInput } from "@/components/forms/fields";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { MediaAsset } from "@/types";
import { formatDate } from "@/lib/format";

/* ------------------------------ helpers --------------------------- */

type FolderFilter = "products" | "brand" | "legal";
type TypeFilter = MediaAsset["type"];

const FOLDER_OPTIONS: Array<{ value: FolderFilter | "all"; label: string }> = [
  { value: "all", label: "All folders" },
  { value: "products", label: "Products" },
  { value: "brand", label: "Brand" },
  { value: "legal", label: "Legal" },
];

const TYPE_OPTIONS: Array<{ value: TypeFilter | "all"; label: string }> = [
  { value: "all", label: "All types" },
  { value: "image", label: "Images" },
  { value: "video", label: "Video" },
  { value: "document", label: "Documents" },
];

function statusBadge(asset: MediaAsset) {
  if (asset.status === "processing") {
    return (
      <StatusBadge tone="warning" icon={Hourglass} className="animate-pulse">
        Processing
      </StatusBadge>
    );
  }
  if (asset.status === "failed") {
    return (
      <StatusBadge tone="error" icon={AlertTriangle}>
        Failed
      </StatusBadge>
    );
  }
  return (
    <StatusBadge tone="success" icon={CheckCircle2}>
      Ready
    </StatusBadge>
  );
}

function statusDot(asset: MediaAsset) {
  return (
    <span
      title={asset.status}
      className={cn(
        "size-2 rounded-full",
        asset.status === "ready" && "bg-success",
        asset.status === "processing" && "animate-pulse bg-warning",
        asset.status === "failed" && "bg-error"
      )}
      aria-hidden="true"
    />
  );
}

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

export function MediaLibraryView() {
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState<FolderFilter | "all">("all");
  const [type, setType] = useState<TypeFilter | "all">("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [assets, setAssets] = useState<MediaAsset[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [failedThumbs, setFailedThumbs] = useState<Set<string>>(() => new Set());
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [altDraft, setAltDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    let alive = true;
    mediaService
      .list({ query, folder, type })
      .then((d) => {
        if (alive) {
          setAssets(d);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load the media library.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [query, folder, type, reloadKey]);

  const onQueryChange = (next: string) => {
    setQuery(next);
    setLoading(true);
  };
  const onFolderChange = (next: FolderFilter | "all") => {
    setFolder(next);
    setLoading(true);
  };
  const onTypeChange = (next: TypeFilter | "all") => {
    setType(next);
    setLoading(true);
  };
  const retry = () => {
    setError(null);
    setLoading(true);
    setReloadKey((k) => k + 1);
  };
  const clearFilters = () => {
    setQuery("");
    setFolder("all");
    setType("all");
    setError(null);
    setLoading(true);
  };

  const openPreview = (asset: MediaAsset) => {
    setSelected(asset);
    setAltDraft(asset.alt ?? "");
  };

  const onUpload = async (file: File) => {
    setUploading(true);
    try {
      await mediaService.upload(file);
      toast({
        title: "Upload complete",
        description: `${file.name} is in the media library. Local development mode stores files on the server — object storage (R2) lands with the cloud deployment.`,
      });
    } catch {
      toast({ variant: "destructive", title: "Upload failed", description: "The media service returned an error. Try again." });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const saveAlt = () => {
    if (!selected) return;
    toast({
      title: "Alt text not saved yet",
      description: `Alt text for ${selected.name} stays in this view — metadata writes are not part of the media API yet.`,
    });
  };

  const columns: Column<MediaAsset>[] = [
      {
        key: "name",
        header: "Name",
        sortable: true,
        sortValue: (row) => row.name,
        cell: (row) => (
          <button
            type="button"
            onClick={() => openPreview(row)}
            className="text-left font-medium text-foreground underline-offset-4 transition-colors hover:text-violet-soft hover:underline"
          >
            {row.name}
          </button>
        ),
      },
      { key: "type", header: "Type", sortable: true, sortValue: (row) => row.type, cell: (row) => <span className="capitalize text-muted-foreground">{row.type}</span> },
      { key: "format", header: "Format", cell: (row) => <span className="text-muted-foreground">{row.format}</span> },
      { key: "size", header: "Size", cell: (row) => <span className="text-muted-foreground">{row.sizeLabel}</span> },
      { key: "dimensions", header: "Dimensions", cell: (row) => <span className="text-muted-foreground">{row.dimensions ?? "—"}</span> },
      { key: "folder", header: "Folder", sortable: true, sortValue: (row) => row.folder, cell: (row) => <span className="capitalize text-muted-foreground">{row.folder}</span> },
      { key: "uploadedAt", header: "Uploaded", sortable: true, sortValue: (row) => row.uploadedAt, cell: (row) => <span className="text-muted-foreground">{formatDate(row.uploadedAt)}</span> },
      { key: "status", header: "Status", cell: (row) => statusBadge(row) },
  ];

  const hasFilters = query.trim() !== "" || folder !== "all" || type !== "all";
  const firstLoad = loading && !assets;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header>
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-violet-soft">Media</p>
        <h1 className="mt-1 font-display text-h2 font-bold tracking-tight text-foreground">Media library</h1>
        <p className="mt-1.5 max-w-2xl text-[0.92rem] text-muted-foreground">
          Images, video and documents across the products, brand and legal folders.
        </p>
      </header>

      <PrototypeNotice>The library reads live records from the media database. Uploads are stored on the server in local development mode — object storage (R2) lands with the cloud deployment.</PrototypeNotice>

      {/* Upload dropzone */}
      <div className="rounded-2xl border border-dashed border-line-strong bg-white/[0.02] px-6 py-7 text-center">
        <UploadCloud className="mx-auto size-6 text-violet-soft" aria-hidden="true" />
        <p className="mt-2.5 font-display text-[0.98rem] font-semibold text-foreground">Upload to the library</p>
        <p className="mx-auto mt-1 max-w-md text-[0.8rem] leading-relaxed text-muted-foreground">
          Browse files to upload — the upload POSTs to the media API and stores the file with a unique name.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          aria-label="Choose a file to upload"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onUpload(file);
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50"
        >
          <UploadCloud className="size-4" aria-hidden="true" />
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <SearchField
            value={query}
            onChange={onQueryChange}
            label="Search media by name or alt text"
            placeholder="Search name or alt text…"
            className="w-full lg:w-80"
          />
          <div
            role="group"
            aria-label="Toggle grid or list view"
            className="inline-flex items-center gap-1 rounded-full border border-line p-1"
          >
            <button
              type="button"
              aria-pressed={view === "grid"}
              aria-label="Grid view"
              onClick={() => setView("grid")}
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-full transition-colors",
                view === "grid" ? "bg-violet-glow/15 text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-pressed={view === "list"}
              aria-label="List view"
              onClick={() => setView("list")}
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-full transition-colors",
                view === "list" ? "bg-violet-glow/15 text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <FilterBar options={FOLDER_OPTIONS} value={folder} onChange={onFolderChange} ariaLabel="Filter by folder" />
          <FilterBar options={TYPE_OPTIONS} value={type} onChange={onTypeChange} ariaLabel="Filter by media type" />
        </div>
      </div>

      {error ? (
        <ErrorState body={error} onRetry={retry} />
      ) : firstLoad ? (
        <TableSkeleton />
      ) : assets && assets.length === 0 ? (
        <EmptyState
          icon={Images}
          title="No assets match"
          body="Try a different search, folder or type filter — clear the filters to see every asset in the library."
          {...(hasFilters
            ? {
                actionLabel: "Clear filters",
                onAction: clearFilters,
              }
            : {})}
        />
      ) : assets ? (
        <div className="space-y-3">
          {loading && <LoadingIndicator label="Refreshing" size="sm" />}
          <div className={cn(loading && "pointer-events-none opacity-50 transition-opacity")}>
            {view === "grid" ? (
              <ul role="list" className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {assets.map((asset) => {
                  const thumbFailed = failedThumbs.has(asset.id);
                  return (
                    <li key={asset.id}>
                      <button
                        type="button"
                        onClick={() => openPreview(asset)}
                        aria-label={`Preview ${asset.name}`}
                        className="group w-full rounded-2xl border border-line bg-elevated/40 p-3 text-left transition-colors hover:border-violet-glow/40"
                      >
                        <div className="relative aspect-square overflow-hidden rounded-xl border border-line bg-white/[0.02]">
                          {asset.type === "image" && !thumbFailed ? (
                            <Image
                              src={asset.url}
                              alt={asset.alt ?? asset.name}
                              fill
                              sizes="(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 50vw"
                              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                              onError={() =>
                                setFailedThumbs((prev) => {
                                  const next = new Set(prev);
                                  next.add(asset.id);
                                  return next;
                                })
                              }
                            />
                          ) : (
                            <span className="flex h-full items-center justify-center text-muted-foreground">
                              {asset.type === "video" ? (
                                <Film className="size-8" aria-hidden="true" />
                              ) : asset.type === "document" ? (
                                <FileText className="size-8" aria-hidden="true" />
                              ) : (
                                <ImageOff className="size-8" aria-hidden="true" />
                              )}
                            </span>
                          )}
                          {asset.status === "processing" && (
                            <span className="absolute right-2 top-2">
                              <StatusBadge tone="warning" icon={Hourglass} className="animate-pulse">
                                Processing
                              </StatusBadge>
                            </span>
                          )}
                        </div>
                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <p className="truncate text-[0.84rem] font-medium text-foreground">{asset.name}</p>
                          {statusDot(asset)}
                        </div>
                        <p className="mt-0.5 truncate text-[0.74rem] text-muted-foreground">
                          {asset.dimensions ? `${asset.dimensions} · ` : ""}
                          {asset.format} · {asset.sizeLabel}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <DataTable
                columns={columns}
                rows={assets}
                initialSort={{ key: "uploadedAt", dir: "desc" }}
                caption="Media assets"
                mobileCard={(row) => (
                  <div className="rounded-2xl border border-line bg-elevated/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <button type="button" onClick={() => openPreview(row)} className="text-left font-medium text-foreground">
                        {row.name}
                      </button>
                      {statusBadge(row)}
                    </div>
                    <p className="mt-1.5 text-[0.78rem] capitalize text-muted-foreground">
                      {row.type} · {row.folder} folder · {row.format} · {row.sizeLabel}
                      {row.dimensions ? ` · ${row.dimensions}` : ""}
                    </p>
                    <p className="mt-0.5 text-[0.74rem] text-muted-foreground">Uploaded {formatDate(row.uploadedAt)}</p>
                  </div>
                )}
                emptyMessage="No assets match the current filters."
              />
            )}
            <p className="mt-1 text-[0.78rem] text-muted-foreground">
              Showing {assets.length} library {assets.length === 1 ? "asset" : "assets"}
              {hasFilters ? " (filtered)" : ""}.
            </p>
          </div>
        </div>
      ) : null}

      {/* Preview dialog */}
      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">Asset preview</DialogTitle>
                <DialogDescription>Metadata from the media record — alt-text edits are not saved yet.</DialogDescription>
              </DialogHeader>

              <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-line bg-white/[0.02]">
                {selected.type === "image" && !failedThumbs.has(selected.id) ? (
                  <Image
                    src={selected.url}
                    alt={selected.alt ?? selected.name}
                    fill
                    sizes="480px"
                    className="object-cover"
                    onError={() =>
                      setFailedThumbs((prev) => {
                        const next = new Set(prev);
                        next.add(selected.id);
                        return next;
                      })
                    }
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-muted-foreground">
                    {selected.type === "video" ? (
                      <Film className="size-10" aria-hidden="true" />
                    ) : selected.type === "document" ? (
                      <FileText className="size-10" aria-hidden="true" />
                    ) : (
                      <ImageOff className="size-10" aria-hidden="true" />
                    )}
                  </span>
                )}
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                {[
                  ["Name", selected.name],
                  ["Format", selected.format],
                  ["Size", selected.sizeLabel],
                  ["Dimensions", selected.dimensions ?? "—"],
                  ["Folder", selected.folder],
                  ["Uploaded", formatDate(selected.uploadedAt)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
                    <dd className="mt-0.5 truncate capitalize text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>

              <FormField label="Alt text" htmlFor="media-alt" hint="Describes the asset for screen readers (not saved yet).">
                <TextInput id="media-alt" value={altDraft} onChange={(e) => setAltDraft(e.target.value)} />
              </FormField>

              <div className="flex items-center justify-between gap-3">
                {statusBadge(selected)}
                <button
                  type="button"
                  onClick={saveAlt}
                  className="inline-flex min-h-10 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
                >
                  Save alt
                </button>
              </div>
              <p className="flex items-center gap-2 text-[0.76rem] text-muted-foreground">
                <FolderOpen className="size-3.5" aria-hidden="true" />
                Path <code className="font-mono">{selected.url}</code>
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
