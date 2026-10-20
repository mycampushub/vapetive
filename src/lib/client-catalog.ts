/**
 * VAPETIVE — client catalog mirror.
 *
 * A lightweight, read-only mirror of the catalog used by client-side
 * estimators (cart line resolution, saved-item resolution). The SERVER
 * remains the source of truth: cart/order pricing and availability are
 * re-verified server-side at quote and order creation. The mirror only
 * keeps the UI instant.
 */

import type { CatalogItem } from "@/types";

let items: CatalogItem[] = [];
let loadPromise: Promise<void> | null = null;

async function loadPage(page: number): Promise<{ items: CatalogItem[]; hasMore: boolean }> {
  const response = await fetch(`/api/v1/catalog/products?page=${page}&pageSize=48`, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Catalog mirror load failed (${response.status})`);
  const body = (await response.json()) as { data: { items: CatalogItem[]; hasMore: boolean } };
  return { items: body.data.items, hasMore: body.data.hasMore };
}

/** Load (once) the full published catalog into the mirror. */
export async function ensureCatalog(): Promise<void> {
  if (items.length > 0) return;
  if (!loadPromise) {
    loadPromise = (async () => {
      const collected: CatalogItem[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore && page <= 10) {
        const result = await loadPage(page);
        collected.push(...result.items);
        hasMore = result.hasMore;
        page += 1;
      }
      items = collected;
    })().catch((error) => {
      loadPromise = null;
      throw error;
    });
  }
  await loadPromise;
}

export function isCatalogLoaded(): boolean {
  return items.length > 0;
}

export function findInCatalog(slug: string): CatalogItem | null {
  return items.find((item) => item.slug === slug) ?? null;
}

export function findByIdInCatalog(id: string): CatalogItem | null {
  return items.find((item) => item.id === id) ?? null;
}

/** Refresh the mirror after admin catalog edits (best-effort). */
export function refreshCatalog(): void {
  items = [];
  loadPromise = null;
  void ensureCatalog().catch(() => undefined);
}
