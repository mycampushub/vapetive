"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ImageIcon, Images, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { mediaService } from "@/services/media";
import { cn } from "@/lib/utils";
import type { MediaAsset } from "@/types";

/**
 * MediaPicker — dialog over the media library (images only).
 * Selecting an asset hands { mediaAssetId, url, alt } to the caller so
 * product images always reference a real media_assets row (FK is RESTRICT).
 * External URLs are intentionally out of scope — every product image must
 * resolve to an uploaded library asset.
 */
export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  title = "Pick from library",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (asset: { mediaAssetId: string; url: string; alt: string | null }) => void;
  title?: string;
}) {
  const [assets, setAssets] = useState<MediaAsset[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [failedThumbs, setFailedThumbs] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!open) return;
    let alive = true;
    mediaService
      .list({ type: "image" })
      .then((items) => {
        if (alive) {
          setAssets(items);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : "Could not load the media library.");
      });
    return () => {
      alive = false;
    };
  }, [open]);

  // Loading is derived — the fetch runs each time the dialog opens.
  const loading = open && assets === null && error === null;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return assets ?? [];
    return (assets ?? []).filter(
      (a) => a.name.toLowerCase().includes(term) || (a.alt ?? "").toLowerCase().includes(term)
    );
  }, [assets, search]);

  const pick = (asset: MediaAsset) => {
    onSelect({ mediaAssetId: asset.id, url: asset.url, alt: asset.alt ?? null });
    onOpenChange(false);
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
          <DialogDescription>
            Images from the uploaded media library. External URLs are not supported here — upload files in the
            media library first so every product image resolves to a stored asset.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by file name or alt text…"
            aria-label="Search the media library"
            className="h-10 w-full rounded-xl border border-line bg-foreground/[0.03] pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-violet-glow/50 focus:outline-none"
          />
        </div>

        <div className="max-h-80 min-h-40 overflow-y-auto rounded-xl border border-line bg-foreground/[0.01] p-3 [scrollbar-color:rgba(127,127,127,0.45)_transparent] [scrollbar-width:thin]">
          {loading ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4" aria-hidden="true">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-xl bg-foreground/[0.05]" />
              ))}
            </div>
          ) : error ? (
            <p role="alert" className="px-2 py-8 text-center text-sm text-error">
              {error}
            </p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-2 py-10 text-center">
              <Images className="size-6 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                {assets && assets.length === 0
                  ? "The media library has no images yet — upload some from the Media page."
                  : "No images match that search."}
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {filtered.map((asset) => {
                const broken = failedThumbs.has(asset.id);
                return (
                  <li key={asset.id}>
                    <button
                      type="button"
                      onClick={() => pick(asset)}
                      title={asset.name}
                      className="group w-full rounded-xl border border-line bg-foreground/[0.02] p-1.5 text-left transition-colors hover:border-violet-glow/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-glow/50"
                    >
                      <span className="relative block aspect-square overflow-hidden rounded-lg bg-black/30">
                        {broken ? (
                          <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <ImageIcon className="size-5" aria-hidden="true" />
                          </span>
                        ) : (
                          <Image
                            src={asset.url}
                            alt={asset.alt ?? asset.name}
                            fill
                            unoptimized
                            sizes="140px"
                            className="object-cover transition-transform group-hover:scale-[1.03]"
                            onError={() =>
                              setFailedThumbs((prev) => {
                                const next = new Set(prev);
                                next.add(asset.id);
                                return next;
                              })
                            }
                          />
                        )}
                      </span>
                      <span className="mt-1.5 block truncate px-0.5 text-[0.7rem] text-muted-foreground" aria-hidden="true">
                        {asset.name}
                      </span>
                      <span className="sr-only">Select {asset.alt ?? asset.name} from the media library</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className={cn("text-[0.74rem] text-muted-foreground")} aria-live="polite">
          {assets ? `${assets.length} image${assets.length === 1 ? "" : "s"} in the library` : "Loading library…"}
        </p>
      </DialogContent>
    </Dialog>
  );
}
